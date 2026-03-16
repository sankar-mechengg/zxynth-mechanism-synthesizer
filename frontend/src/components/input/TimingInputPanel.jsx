import { Plus, Trash2 } from 'lucide-react';
import ParameterInput from '../common/ParameterInput';
import clsx from 'clsx';

/**
 * Timing input panel for prescribed-timing path generation.
 * User maps specific crank angles to specific path point indices.
 *
 * @param {object} props
 * @param {boolean} props.enabled - Whether prescribed timing is active
 * @param {function} props.onToggle - Toggle prescribed timing on/off
 * @param {Array<{pointIndex: number, crankAngle: number}>} props.timingMap
 * @param {function} props.onTimingMapChange - Called with updated timing map
 * @param {number} props.totalPoints - Total number of path points
 * @param {Array<number>} props.crankRange - [startDeg, endDeg]
 * @param {function} props.onCrankRangeChange
 * @param {string} [props.className]
 */
export default function TimingInputPanel({
  enabled,
  onToggle,
  timingMap = [],
  onTimingMapChange,
  totalPoints = 0,
  crankRange = [0, 360],
  onCrankRangeChange,
  className = '',
}) {
  const addMapping = () => {
    const lastAngle = timingMap.length > 0 ? timingMap[timingMap.length - 1].crankAngle : 0;
    const lastIdx = timingMap.length > 0 ? timingMap[timingMap.length - 1].pointIndex : 0;
    onTimingMapChange([
      ...timingMap,
      {
        pointIndex: Math.min(lastIdx + Math.floor(totalPoints / 6), totalPoints - 1),
        crankAngle: Math.min(lastAngle + 60, crankRange[1]),
      },
    ]);
  };

  const updateMapping = (index, field, value) => {
    const updated = [...timingMap];
    updated[index] = { ...updated[index], [field]: value };
    onTimingMapChange(updated);
  };

  const removeMapping = (index) => {
    onTimingMapChange(timingMap.filter((_, i) => i !== index));
  };

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-[var(--color-text-secondary)]">Prescribed Timing</span>
          <p className="text-2xs text-[var(--color-text-muted)]">
            Specify which crank angle corresponds to which path point
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={clsx(
            'relative w-10 h-5 rounded-full transition-colors duration-200',
            enabled ? 'bg-blueprint-500' : 'bg-[var(--color-bg-input)]'
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Crank range */}
          <div className="grid grid-cols-2 gap-2">
            <ParameterInput
              label="Crank Start"
              value={crankRange[0]}
              onChange={(v) => onCrankRangeChange([v, crankRange[1]])}
              min={0}
              max={360}
              step={5}
              unit="°"
            />
            <ParameterInput
              label="Crank End"
              value={crankRange[1]}
              onChange={(v) => onCrankRangeChange([crankRange[0], v])}
              min={0}
              max={720}
              step={5}
              unit="°"
            />
          </div>

          {/* Timing map table */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label">Timing Mappings</label>
              <button
                onClick={addMapping}
                className="btn-ghost text-2xs gap-1 text-blueprint-400"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {timingMap.length === 0 ? (
              <p className="text-2xs text-[var(--color-text-muted)] italic py-2">
                No timing constraints. Add mappings to prescribe when the coupler reaches specific path points.
              </p>
            ) : (
              <div className="space-y-1.5">
                {/* Header */}
                <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-2xs text-[var(--color-text-muted)] uppercase tracking-wider px-1">
                  <span>Point Index</span>
                  <span>Crank Angle</span>
                  <span />
                </div>

                {timingMap.map((mapping, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                    <input
                      type="number"
                      value={mapping.pointIndex}
                      onChange={(e) => updateMapping(i, 'pointIndex', parseInt(e.target.value) || 0)}
                      min={0}
                      max={totalPoints - 1}
                      className="input-field text-xs mono py-1"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={mapping.crankAngle}
                        onChange={(e) => updateMapping(i, 'crankAngle', parseFloat(e.target.value) || 0)}
                        min={crankRange[0]}
                        max={crankRange[1]}
                        step={5}
                        className="input-field text-xs mono py-1 pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-[var(--color-text-muted)]">°</span>
                    </div>
                    <button
                      onClick={() => removeMapping(i)}
                      className="p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {totalPoints > 0 && (
              <p className="text-2xs text-[var(--color-text-muted)] mt-1">
                Point indices: 0 to {totalPoints - 1} ({totalPoints} total)
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
