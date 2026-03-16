import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

/**
 * Custom styled dropdown select.
 *
 * @param {object} props
 * @param {string} props.label - Dropdown label
 * @param {string} props.value - Currently selected option id
 * @param {function} props.onChange - Called with selected option id
 * @param {Array<{id: string, label: string, description?: string}>} props.options - Available options
 * @param {string} [props.placeholder] - Placeholder when nothing selected
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.className] - Additional classes
 */
export default function SelectDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => o.id === value);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen]);

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && <label className="label">{label}</label>}

      <div ref={ref} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'input-field w-full flex items-center justify-between gap-2 text-left',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-[var(--color-accent)] shadow-[0_0_0_2px_var(--color-accent-glow)]'
          )}
        >
          <span className={selected ? '' : 'text-[var(--color-text-muted)]'}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={14}
            className={clsx(
              'text-[var(--color-text-muted)] transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-lg overflow-hidden animate-fade-in">
            {options.map((option) => {
              const isSelected = option.id === value;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2 flex items-start gap-2 transition-colors',
                    isSelected
                      ? 'bg-blueprint-500/10 text-blueprint-400'
                      : 'hover:bg-[var(--color-bg-input)] text-[var(--color-text-primary)]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-2xs text-[var(--color-text-muted)] mt-0.5 truncate">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-blueprint-400 mt-0.5 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
