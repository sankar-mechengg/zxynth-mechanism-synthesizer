import ParameterInput from '../common/ParameterInput';
import Tooltip from '../common/Tooltip';
import { Info } from 'lucide-react';
import clsx from 'clsx';

/**
 * Synthesis constraint configuration panel.
 *
 * @param {object} props
 * @param {number} props.tolerance - Error tolerance in %
 * @param {function} props.onToleranceChange
 * @param {number} props.minTransmissionAngle - Min transmission angle in degrees
 * @param {function} props.onMinTransmissionAngleChange
 * @param {boolean} props.grashofRequired
 * @param {function} props.onGrashofRequiredChange
 * @param {{x:number,y:number}|null} [props.groundPivot1]
 * @param {function} [props.onGroundPivot1Change]
 * @param {{x:number,y:number}|null} [props.groundPivot2]
 * @param {function} [props.onGroundPivot2Change]
 * @param {boolean} [props.showGroundPivots=true]
 * @param {string} [props.className]
 */
export default function ConstraintPanel({
  tolerance,
  onToleranceChange,
  minTransmissionAngle,
  onMinTransmissionAngleChange,
  grashofRequired,
  onGrashofRequiredChange,
  groundPivot1 = null,
  onGroundPivot1Change,
  groundPivot2 = null,
  onGroundPivot2Change,
  showGroundPivots = true,
  className = '',
}) {
  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      <label className="label">Constraints</label>

      {/* Tolerance */}
      <ParameterInput
        label="Error Tolerance"
        value={tolerance}
        onChange={onToleranceChange}
        min={0.1}
        max={50}
        step={0.5}
        unit="%"
        tooltip="Maximum acceptable deviation between desired and actual curve, as percentage of curve extent"
      />

      {/* Transmission Angle */}
      <ParameterInput
        label="Min Transmission Angle"
        value={minTransmissionAngle}
        onChange={onMinTransmissionAngleChange}
        min={0}
        max={90}
        step={5}
        unit="°"
        tooltip="Minimum allowed angle between coupler and output link. Below 30°–40° the mechanism becomes impractical due to poor force transmission."
      />

      {/* Grashof Toggle */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-[var(--color-text-secondary)]">Grashof Condition</span>
          <Tooltip
            content="s + l ≤ p + q — ensures the shortest link can make full 360° rotation. Required for continuous crank input."
            maxWidth={280}
          >
            <Info size={12} className="text-[var(--color-text-muted)] cursor-help" />
          </Tooltip>
        </div>
        <button
          type="button"
          onClick={() => onGrashofRequiredChange(!grashofRequired)}
          className={clsx(
            'relative w-10 h-5 rounded-full transition-colors duration-200',
            grashofRequired ? 'bg-emerald-500' : 'bg-[var(--color-bg-input)]'
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
              grashofRequired ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Ground Pivot Constraints */}
      {showGroundPivots && (
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Ground Pivots (optional)
            </span>
            {(groundPivot1 || groundPivot2) && (
              <button
                onClick={() => {
                  onGroundPivot1Change?.(null);
                  onGroundPivot2Change?.(null);
                }}
                className="text-2xs text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Pivot 1 */}
          <div className="flex items-center gap-2">
            <span className="text-2xs text-[var(--color-text-muted)] w-14">Pivot A:</span>
            {groundPivot1 ? (
              <span className="text-xs mono text-[var(--color-text-secondary)]">
                ({groundPivot1.x.toFixed(1)}, {groundPivot1.y.toFixed(1)})
              </span>
            ) : (
              <span className="text-2xs text-[var(--color-text-muted)] italic">Free (auto)</span>
            )}
          </div>

          {/* Pivot 2 */}
          <div className="flex items-center gap-2">
            <span className="text-2xs text-[var(--color-text-muted)] w-14">Pivot D:</span>
            {groundPivot2 ? (
              <span className="text-xs mono text-[var(--color-text-secondary)]">
                ({groundPivot2.x.toFixed(1)}, {groundPivot2.y.toFixed(1)})
              </span>
            ) : (
              <span className="text-2xs text-[var(--color-text-muted)] italic">Free (auto)</span>
            )}
          </div>

          <p className="text-2xs text-[var(--color-text-muted)] italic">
            Click on the canvas to set ground pivot locations, or leave free for optimizer to determine.
          </p>
        </div>
      )}
    </div>
  );
}
