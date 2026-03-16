import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import useVisualizationStore from '../../stores/useVisualizationStore';
import useSynthesisStore from '../../stores/useSynthesisStore';
import useCanvasInteraction from '../../hooks/useCanvasInteraction';
import LinkRenderer from './LinkRenderer';
import JointRenderer from './JointRenderer';
import CouplerCurveOverlay from './CouplerCurveOverlay';
import DesiredPathOverlay from './DesiredPathOverlay';
import ErrorShading from './ErrorShading';
import AnimationControls from './AnimationControls';

/**
 * Main mechanism visualization and animation component.
 * Renders the synthesized mechanism at the current crank angle,
 * with coupler curve trace, desired path overlay, and error shading.
 *
 * @param {object} props
 * @param {Array<{x:number,y:number}>} [props.desiredPath] - Target path points (world coords)
 * @param {string} [props.className]
 */
export default function MechanismViewer({ desiredPath = [], className = '' }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  const viz = useVisualizationStore();
  const { mechanism, couplerCurve } = useSynthesisStore();

  const {
    offset, scale, handleWheel, handlePanStart, handlePanMove, handlePanEnd,
    fitToBounds,
  } = useCanvasInteraction({ minZoom: 0.1, maxZoom: 15 });

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDimensions({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-fit on first render if we have data
  useEffect(() => {
    if (!mechanism) return;
    const allPoints = [];
    if (desiredPath.length > 0) allPoints.push(...desiredPath);
    if (couplerCurve) allPoints.push(...couplerCurve.map((p) => ({ x: p[0] || p.x, y: p[1] || p.y })));
    if (mechanism.pivotA) allPoints.push({ x: mechanism.pivotA[0], y: mechanism.pivotA[1] });
    if (mechanism.pivotD) allPoints.push({ x: mechanism.pivotD[0], y: mechanism.pivotD[1] });

    if (allPoints.length >= 2) {
      const xs = allPoints.map((p) => p.x);
      const ys = allPoints.map((p) => p.y);
      const pad = 50;
      fitToBounds(
        [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad],
        dimensions.width,
        dimensions.height - 80 // Leave room for controls
      );
    }
  }, [mechanism]); // Only on mechanism change

  // Compute link/joint positions for current crank angle
  const positions = useMemo(() => {
    if (!mechanism) return null;
    return computePositions(mechanism, viz.currentAngle);
  }, [mechanism, viz.currentAngle]);

  // Convert world coords to screen coords
  const toScreen = useCallback((wx, wy) => ({
    x: wx * scale + offset.x,
    y: wy * scale + offset.y,
  }), [offset, scale]);

  // Screen-space coupler curve
  const screenCouplerCurve = useMemo(() => {
    if (!couplerCurve) return [];
    return couplerCurve.map((p) => {
      const pt = Array.isArray(p) ? { x: p[0], y: p[1] } : p;
      return toScreen(pt.x, pt.y);
    });
  }, [couplerCurve, toScreen]);

  // Screen-space desired path
  const screenDesiredPath = useMemo(() => {
    return desiredPath.map((p) => toScreen(p.x, p.y));
  }, [desiredPath, toScreen]);

  // Current animation index in coupler curve
  const animIndex = useMemo(() => {
    if (!couplerCurve || couplerCurve.length === 0) return -1;
    const range = viz.endAngle - viz.startAngle;
    if (range <= 0) return 0;
    const frac = (viz.currentAngle - viz.startAngle) / range;
    return Math.round(frac * (couplerCurve.length - 1));
  }, [viz.currentAngle, viz.startAngle, viz.endAngle, couplerCurve]);

  if (!mechanism) {
    return (
      <div ref={containerRef} className={clsx('flex items-center justify-center h-full', className)}>
        <p className="text-sm text-[var(--color-text-muted)]">No mechanism to display</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={clsx('flex flex-col h-full', className)}>
      {/* SVG canvas */}
      <div className="flex-1 min-h-0 relative">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height - 80}
          className="bg-[var(--color-bg-primary)] rounded-t-lg"
          onWheel={handleWheel}
          onMouseDown={(e) => { if (e.button === 1) handlePanStart(e); }}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          {/* Grid background */}
          <defs>
            <pattern id="mech-grid" width="20" height="20" patternUnits="userSpaceOnUse"
              patternTransform={`translate(${offset.x % 20} ${offset.y % 20})`}>
              <line x1="20" y1="0" x2="20" y2="20" stroke="var(--grid-minor)" strokeWidth="0.5" />
              <line x1="0" y1="20" x2="20" y2="20" stroke="var(--grid-minor)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mech-grid)" />

          {/* Error shading (behind everything) */}
          <ErrorShading
            desiredPath={screenDesiredPath}
            actualCurve={screenCouplerCurve}
            visible={viz.showErrorShading}
          />

          {/* Desired path overlay */}
          <DesiredPathOverlay
            path={screenDesiredPath}
            visible={viz.showDesiredPath}
          />

          {/* Coupler curve */}
          <CouplerCurveOverlay
            curve={screenCouplerCurve}
            currentIndex={viz.isPlaying ? animIndex : -1}
            visible={viz.showCouplerCurve}
          />

          {/* Mechanism links and joints */}
          {positions && (
            <MechanismLinksAndJoints
              positions={positions}
              showLinks={viz.showLinks}
              showJoints={viz.showJoints}
              showLabels={viz.showLabels}
              showGround={viz.showGround}
            />
          )}

          {/* Coupler point marker (current position) */}
          {positions?.couplerPoint && (
            <circle
              cx={toScreen(positions.couplerPoint.x, positions.couplerPoint.y).x}
              cy={toScreen(positions.couplerPoint.x, positions.couplerPoint.y).y}
              r={6}
              fill="#34d399"
              stroke="var(--color-bg-primary)"
              strokeWidth={2.5}
            />
          )}
        </svg>

        {/* Zoom indicator */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[var(--color-bg-elevated)]/80 border border-[var(--color-border-subtle)] text-2xs mono text-[var(--color-text-muted)]">
          {(scale * 100).toFixed(0)}%
        </div>
      </div>

      {/* Animation controls */}
      <AnimationControls />
    </div>
  );
}

/**
 * Renders all links and joints from computed positions.
 */
function MechanismLinksAndJoints({ positions, showLinks, showJoints, showLabels, showGround }) {
  if (!positions) return null;

  return (
    <g>
      {/* Links */}
      {showLinks && positions.links.map((link, i) => (
        <LinkRenderer
          key={`link-${i}`}
          start={link.start}
          end={link.end}
          linkIndex={i + 1}
          isGround={link.isGround}
          isCoupler={link.isCoupler}
          showLabel={showLabels}
        />
      ))}

      {/* Joints */}
      {showJoints && positions.joints.map((joint, i) => (
        <JointRenderer
          key={`joint-${i}`}
          position={joint.position}
          jointIndex={i + 1}
          type={joint.type}
          isFixed={joint.isFixed}
          showLabel={showLabels}
        />
      ))}
    </g>
  );
}

/**
 * Compute link and joint positions for a 4-bar mechanism at a given crank angle.
 * This is a simplified forward-kinematics implementation for visualization.
 * The full computation happens on the backend; this is for real-time animation.
 */
function computePositions(mech, crankAngleDeg) {
  const { a1, a2, a3, a4, pivotA, pivotD, p: cpDist, alpha: cpAlpha } = mech;

  if (a1 == null || a2 == null || a3 == null || a4 == null || !pivotA || !pivotD) {
    return null;
  }

  const theta2 = (crankAngleDeg * Math.PI) / 180;
  const ax = pivotA[0], ay = pivotA[1];
  const dx = pivotD[0], dy = pivotD[1];

  // Joint B = end of crank
  const bx = ax + a2 * Math.cos(theta2);
  const by = ay + a2 * Math.sin(theta2);

  // Solve for joint C using circle-circle intersection
  const bdx = dx - bx, bdy = dy - by;
  const dist = Math.sqrt(bdx * bdx + bdy * bdy);

  if (dist > a3 + a4 || dist < Math.abs(a3 - a4) || dist === 0) {
    return null; // Cannot assemble
  }

  const cosAlpha = (a3 * a3 + dist * dist - a4 * a4) / (2 * a3 * dist);
  const clampedCos = Math.max(-1, Math.min(1, cosAlpha));
  const alphaAngle = Math.acos(clampedCos);
  const baseAngle = Math.atan2(bdy, bdx);

  // Take the "cross" assembly (subtract alpha for standard configuration)
  const cx = bx + a3 * Math.cos(baseAngle - alphaAngle);
  const cy = by + a3 * Math.sin(baseAngle - alphaAngle);

  // Coupler point
  let couplerPoint = null;
  if (cpDist != null) {
    const theta3 = Math.atan2(cy - by, cx - bx);
    const cpAngleRad = cpAlpha != null ? (cpAlpha * Math.PI) / 180 : 0;
    couplerPoint = {
      x: bx + cpDist * Math.cos(theta3 + cpAngleRad),
      y: by + cpDist * Math.sin(theta3 + cpAngleRad),
    };
  }

  // Build screen-space positions
  // Note: positions here are in world coords; the parent component handles toScreen
  return {
    joints: [
      { position: { x: ax, y: ay }, type: 'revolute', isFixed: true },      // J1: ground-crank
      { position: { x: bx, y: by }, type: 'revolute', isFixed: false },      // J2: crank-coupler
      { position: { x: cx, y: cy }, type: 'revolute', isFixed: false },      // J3: coupler-rocker
      { position: { x: dx, y: dy }, type: 'revolute', isFixed: true },       // J4: rocker-ground
    ],
    links: [
      { start: { x: ax, y: ay }, end: { x: dx, y: dy }, isGround: true, isCoupler: false },   // L1: ground
      { start: { x: ax, y: ay }, end: { x: bx, y: by }, isGround: false, isCoupler: false },   // L2: crank
      { start: { x: bx, y: by }, end: { x: cx, y: cy }, isGround: false, isCoupler: true },    // L3: coupler
      { start: { x: dx, y: dy }, end: { x: cx, y: cy }, isGround: false, isCoupler: false },   // L4: rocker
    ],
    couplerPoint,
  };
}
