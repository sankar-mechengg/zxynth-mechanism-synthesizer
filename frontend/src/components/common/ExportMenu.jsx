import { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Film,
  Ruler,
  Image,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

const EXPORT_OPTIONS = [
  {
    id: 'json',
    label: 'JSON',
    description: 'Mechanism parameters',
    icon: FileJson,
  },
  {
    id: 'csv',
    label: 'CSV',
    description: 'Tabular parameters',
    icon: FileSpreadsheet,
  },
  {
    id: 'pdf_full',
    label: 'PDF (Full Report)',
    description: 'Educational with all steps',
    icon: FileText,
  },
  {
    id: 'pdf_concise',
    label: 'PDF (Concise)',
    description: 'Summary with key results',
    icon: FileText,
  },
  {
    id: 'gif',
    label: 'GIF Animation',
    description: 'Animated mechanism',
    icon: Film,
  },
  {
    id: 'dxf',
    label: 'DXF (CAD)',
    description: 'Mechanism + curves for CAD',
    icon: Ruler,
  },
  {
    id: 'svg',
    label: 'SVG',
    description: 'Layered vector export',
    icon: Image,
  },
];

/**
 * Export dropdown menu with all output formats.
 *
 * @param {object} props
 * @param {function} props.onExport - Called with export format id
 * @param {boolean} [props.disabled] - Disable all exports
 * @param {string[]} [props.disabledFormats] - Specific formats to disable
 * @param {string} [props.className] - Additional classes
 */
export default function ExportMenu({
  onExport,
  disabled = false,
  disabledFormats = [],
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

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

  return (
    <div ref={ref} className={clsx('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'btn-secondary gap-1.5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Download size={14} />
        <span>Export</span>
        <ChevronDown
          size={12}
          className={clsx(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-lg overflow-hidden animate-fade-in z-50">
          <div className="px-3 py-2 border-b border-[var(--color-border-subtle)]">
            <p className="text-2xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Export Format
            </p>
          </div>

          {EXPORT_OPTIONS.map(({ id, label, description, icon: Icon }) => {
            const isDisabled = disabledFormats.includes(id);
            return (
              <button
                key={id}
                onClick={() => {
                  if (!isDisabled) {
                    onExport(id);
                    setIsOpen(false);
                  }
                }}
                disabled={isDisabled}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[var(--color-bg-input)]'
                )}
              >
                <Icon size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-2xs text-[var(--color-text-muted)] truncate">
                    {description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
