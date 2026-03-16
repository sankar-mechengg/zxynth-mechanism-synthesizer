import { useState } from 'react';
import { Info } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from './Tooltip';

/**
 * Labeled numeric input with validation, optional unit suffix, and tooltip.
 *
 * @param {object} props
 * @param {string} props.label - Input label
 * @param {number} props.value - Current value
 * @param {function} props.onChange - Called with new numeric value
 * @param {number} [props.min] - Minimum allowed value
 * @param {number} [props.max] - Maximum allowed value
 * @param {number} [props.step] - Step increment
 * @param {string} [props.unit] - Unit suffix (e.g., '°', 'mm', '%')
 * @param {string} [props.tooltip] - Educational tooltip text
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.disabled] - Disabled state
 * @param {boolean} [props.compact] - Compact layout (label inline)
 * @param {string} [props.className] - Additional classes
 */
export default function ParameterInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  tooltip,
  placeholder,
  disabled = false,
  compact = false,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    const raw = e.target.value;

    // Allow empty input while typing
    if (raw === '' || raw === '-') {
      onChange(raw);
      setLocalError(null);
      return;
    }

    const num = parseFloat(raw);
    if (isNaN(num)) return;

    // Validate bounds
    if (min !== undefined && num < min) {
      setLocalError(`Min: ${min}`);
    } else if (max !== undefined && num > max) {
      setLocalError(`Max: ${max}`);
    } else {
      setLocalError(null);
    }

    onChange(num);
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Clamp on blur
    if (typeof value === 'number') {
      let clamped = value;
      if (min !== undefined && value < min) clamped = min;
      if (max !== undefined && value > max) clamped = max;
      if (clamped !== value) {
        onChange(clamped);
        setLocalError(null);
      }
    }
  };

  return (
    <div
      className={clsx(
        compact ? 'flex items-center gap-2' : 'flex flex-col gap-1',
        className
      )}
    >
      {/* Label row */}
      <div className={clsx('flex items-center gap-1', compact && 'min-w-[120px]')}>
        <label className="label">{label}</label>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info size={12} className="text-[var(--color-text-muted)] cursor-help" />
          </Tooltip>
        )}
      </div>

      {/* Input with unit */}
      <div className="relative flex-1">
        <input
          type="number"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'input-field w-full mono text-sm',
            unit && 'pr-10',
            localError && 'border-red-500/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-[var(--color-text-muted)] pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      {/* Validation error */}
      {localError && (
        <p className="text-2xs text-red-400 mt-0.5">{localError}</p>
      )}
    </div>
  );
}
