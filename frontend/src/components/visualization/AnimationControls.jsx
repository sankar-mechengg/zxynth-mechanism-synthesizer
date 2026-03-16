import { Play, Pause, SkipBack, Gauge, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import useVisualizationStore from '../../stores/useVisualizationStore';
import { formatAngle } from '../../utils/formatUtils';

/**
 * Animation control bar with playback, speed, scrubber, and display toggles.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function AnimationControls({ className = '' }) {
  const viz = useVisualizationStore();

  const DISPLAY_TOGGLES = [
    { key: 'showLinks', label: 'Links', active: viz.showLinks, toggle: viz.toggleLinks },
    { key: 'showJoints', label: 'Joints', active: viz.showJoints, toggle: viz.toggleJoints },
    { key: 'showLabels', label: 'Labels', active: viz.showLabels, toggle: viz.toggleLabels },
    { key: 'showCouplerCurve', label: 'Coupler', active: viz.showCouplerCurve, toggle: viz.toggleCouplerCurve },
    { key: 'showDesiredPath', label: 'Desired', active: viz.showDesiredPath, toggle: viz.toggleDesiredPath },
    { key: 'showErrorShading', label: 'Error', active: viz.showErrorShading, toggle: viz.toggleErrorShading },
    { key: 'showGround', label: 'Ground', active: viz.showGround, toggle: viz.toggleGround },
  ];

  const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

  return (
    <div className={clsx(
      'flex flex-col gap-2 p-3 rounded-lg',
      'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
      className
    )}>
      {/* Top row: play controls + angle display */}
      <div className="flex items-center gap-2">
        {/* Reset */}
        <button
          onClick={viz.resetAnimation}
          className="btn-ghost p-1.5 rounded-md"
          title="Reset to start"
        >
          <SkipBack size={14} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={viz.togglePlay}
          className={clsx(
            'p-2 rounded-md transition-all',
            viz.isPlaying
              ? 'bg-blueprint-500/20 text-blueprint-400'
              : 'bg-emerald-500/20 text-emerald-400'
          )}
          title={viz.isPlaying ? 'Pause' : 'Play'}
        >
          {viz.isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Angle scrubber */}
        <div className="flex-1 mx-2">
          <input
            type="range"
            min={viz.startAngle}
            max={viz.endAngle}
            step={viz.angleStep}
            value={viz.currentAngle}
            onChange={(e) => {
              viz.pause();
              viz.setCurrentAngle(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 rounded-full appearance-none bg-[var(--color-bg-input)] cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blueprint-400
              [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(49,112,227,0.4)]"
          />
        </div>

        {/* Current angle display */}
        <div className="min-w-[70px] text-right">
          <span className="mono text-sm font-semibold text-blueprint-400">
            {formatAngle(viz.currentAngle, 1)}
          </span>
        </div>
      </div>

      {/* Bottom row: speed + display toggles */}
      <div className="flex items-center justify-between">
        {/* Speed selector */}
        <div className="flex items-center gap-1">
          <Gauge size={12} className="text-[var(--color-text-muted)]" />
          <div className="flex gap-0.5">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => viz.setSpeed(s)}
                className={clsx(
                  'px-1.5 py-0.5 rounded text-2xs mono transition-colors',
                  Math.abs(viz.speed - s) < 0.01
                    ? 'bg-blueprint-500/20 text-blueprint-400 font-bold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Display toggles */}
        <div className="flex items-center gap-0.5">
          {DISPLAY_TOGGLES.map(({ key, label, active, toggle }) => (
            <button
              key={key}
              onClick={toggle}
              className={clsx(
                'px-1.5 py-0.5 rounded text-2xs transition-colors',
                active
                  ? 'bg-[var(--color-bg-input)] text-[var(--color-text-secondary)]'
                  : 'text-[var(--color-text-muted)] opacity-40'
              )}
              title={`${active ? 'Hide' : 'Show'} ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
