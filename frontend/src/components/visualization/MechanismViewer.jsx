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
  const { mechanism, couplerCurve, activeInversion, inversions } = useSynthesisStore();

  // Derive display mechanism and coupler curve from active inversion
  const displayMechanism = useMemo(() => {
    if (activeInversion === 0 || !inversions[activeInversion]?.mechanism) return mechanism;
    const inv = inversions[activeInversion].mechanism;
    // Inherit p/alpha from original if inversion doesn't have them (for coupler point)
    return {
      ...inv,
      p: inv.p ?? mechanism?.p,
      alpha: inv.alpha ?? mechanism?.alpha,
    };
  }, [mechanism, activeInversion, inversions]);

  const displayCouplerCurve = useMemo(() => {
    if (activeInversion === 0 || !inversions[activeInversion]?.couplerCurve) return couplerCurve;
    return inversions[activeInversion].couplerCurve;
  }, [couplerCurve, activeInversion, inversions]);

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

  // Auto-fit on first render if we have data (re-fit when switching inversions)
  useEffect(() => {
    if (!displayMechanism) return;
    const allPoints = [];
    if (desiredPath.length > 0) allPoints.push(...desiredPath);
    if (displayCouplerCurve) allPoints.push(...displayCouplerCurve.map((p) => ({ x: p[0] || p.x, y: p[1] || p.y })));
    if (displayMechanism.pivotA) allPoints.push({ x: displayMechanism.pivotA[0], y: displayMechanism.pivotA[1] });
    if (displayMechanism.pivotD) allPoints.push({ x: displayMechanism.pivotD[0], y: displayMechanism.pivotD[1] });

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
  }, [displayMechanism, displayCouplerCurve]); // Re-fit when switching inversions

  // Compute link/joint positions for current crank angle (try both branches, fallback to nearest valid angle)
  const positions = useMemo(() => {
    if (!displayMechanism) return null;
    return computePositionsWithFallback(displayMechanism, viz.currentAngle);
  }, [displayMechanism, viz.currentAngle]);

  // Convert world coords to screen coords
  const toScreen = useCallback((wx, wy) => ({
    x: wx * scale + offset.x,
    y: wy * scale + offset.y,
  }), [offset, scale]);

  // Screen-space coupler curve
  const screenCouplerCurve = useMemo(() => {
    if (!displayCouplerCurve) return [];
    return displayCouplerCurve.map((p) => {
      const pt = Array.isArray(p) ? { x: p[0], y: p[1] } : p;
      return toScreen(pt.x, pt.y);
    });
  }, [displayCouplerCurve, toScreen]);

  // Screen-space desired path
  const screenDesiredPath = useMemo(() => {
    return desiredPath.map((p) => toScreen(p.x, p.y));
  }, [desiredPath, toScreen]);

  // Current animation index in coupler curve
  const animIndex = useMemo(() => {
    if (!displayCouplerCurve || displayCouplerCurve.length === 0) return -1;
    const range = viz.endAngle - viz.startAngle;
    if (range <= 0) return 0;
    const frac = (viz.currentAngle - viz.startAngle) / range;
    return Math.round(frac * (displayCouplerCurve.length - 1));
  }, [viz.currentAngle, viz.startAngle, viz.endAngle, displayCouplerCurve]);

  if (!displayMechanism) {
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

          {/* Mechanism links and joints (world coords → apply transform) */}
          {positions && (
            <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
              <MechanismLinksAndJoints
                positions={positions}
                showLinks={viz.showLinks}
                showJoints={viz.showJoints}
                showLabels={viz.showLabels}
                showGround={viz.showGround}
              />
            </g>
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
 * Compute positions for a given crank angle and assembly branch.
 * branch: 0 = open, 1 = crossed (baseAngle - alpha vs baseAngle + alpha)
 */
function computePositionsAtAngle(mech, crankAngleDeg, branch = 0) {
  const { a1, a2, a3, a4, pivotA, pivotD, p: cpDist, alpha: cpAlpha } = mech;

  if (a1 == null || a2 == null || a3 == null || a4 == null || !pivotA || !pivotD) {
    return null;
  }

  const theta2 = (crankAngleDeg * Math.PI) / 180;
  const ax = pivotA[0], ay = pivotA[1];
  const dx = pivotD[0], dy = pivotD[1];

  const bx = ax + a2 * Math.cos(theta2);
  const by = ay + a2 * Math.sin(theta2);

  const bdx = dx - bx, bdy = dy - by;
  const dist = Math.sqrt(bdx * bdx + bdy * bdy);

  if (dist > a3 + a4 || dist < Math.abs(a3 - a4) || dist === 0) {
    return null;
  }

  const cosAlpha = (a3 * a3 + dist * dist - a4 * a4) / (2 * a3 * dist);
  const clampedCos = Math.max(-1, Math.min(1, cosAlpha));
  const alphaAngle = Math.acos(clampedCos);
  const baseAngle = Math.atan2(bdy, bdx);

  const sign = branch === 0 ? -1 : 1;
  const cx = bx + a3 * Math.cos(baseAngle + sign * alphaAngle);
  const cy = by + a3 * Math.sin(baseAngle + sign * alphaAngle);

  let couplerPoint = null;
  if (cpDist != null) {
    const theta3 = Math.atan2(cy - by, cx - bx);
    const cpAngleRad = cpAlpha != null ? (cpAlpha * Math.PI) / 180 : 0;
    couplerPoint = {
      x: bx + cpDist * Math.cos(theta3 + cpAngleRad),
      y: by + cpDist * Math.sin(theta3 + cpAngleRad),
    };
  }

  return {
    joints: [
      { position: { x: ax, y: ay }, type: 'revolute', isFixed: true },
      { position: { x: bx, y: by }, type: 'revolute', isFixed: false },
      { position: { x: cx, y: cy }, type: 'revolute', isFixed: false },
      { position: { x: dx, y: dy }, type: 'revolute', isFixed: true },
    ],
    links: [
      { start: { x: ax, y: ay }, end: { x: dx, y: dy }, isGround: true, isCoupler: false },
      { start: { x: ax, y: ay }, end: { x: bx, y: by }, isGround: false, isCoupler: false },
      { start: { x: bx, y: by }, end: { x: cx, y: cy }, isGround: false, isCoupler: true },
      { start: { x: dx, y: dy }, end: { x: cx, y: cy }, isGround: false, isCoupler: false },
    ],
    couplerPoint,
  };
}

/**
 * Find nearest valid crank angle within ±180° by sampling.
 * Returns the angle in degrees, or null if no valid angle found.
 */
function findNearestValidAngle(mech, targetAngleDeg) {
  const step = 2;
  for (let delta = 0; delta <= 180; delta += step) {
    const angle1 = (targetAngleDeg + delta + 360) % 360;
    const angle2 = (targetAngleDeg - delta + 360) % 360;
    if (computePositionsAtAngle(mech, angle1, 0)) return angle1;
    if (computePositionsAtAngle(mech, angle1, 1)) return angle1;
    if (delta > 0 && angle2 !== angle1) {
      if (computePositionsAtAngle(mech, angle2, 0)) return angle2;
      if (computePositionsAtAngle(mech, angle2, 1)) return angle2;
    }
  }
  return null;
}

/**
 * Compute positions with fallback: try both branches, then nearest valid angle.
 * Ensures mechanism is always visible when possible.
 */
function computePositionsWithFallback(mech, crankAngleDeg) {
  let result = computePositionsAtAngle(mech, crankAngleDeg, 0);
  if (result) return result;
  result = computePositionsAtAngle(mech, crankAngleDeg, 1);
  if (result) return result;

  const nearestAngle = findNearestValidAngle(mech, crankAngleDeg);
  if (nearestAngle != null) {
    result = computePositionsAtAngle(mech, nearestAngle, 0);
    if (result) return result;
    return computePositionsAtAngle(mech, nearestAngle, 1);
  }
  return null;
}
