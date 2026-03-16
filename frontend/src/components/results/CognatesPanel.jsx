import { Copy, Eye } from 'lucide-react';
import clsx from 'clsx';
import { formatNum, formatAngle } from '../../utils/formatUtils';

/**
 * Roberts-Chebyshev cognates display panel.
 * Shows up to 3 equivalent 4-bar mechanisms that trace the identical coupler curve.
 *
 * @param {object} props
 * @param {Array|null} props.cognates - Array of cognate mechanism objects
 * @param {number} [props.activeCognate=0] - Currently selected cognate index
 * @param {function} [props.onSelectCognate] - Called with cognate index
 * @param {string} [props.className]
 */
export default function CognatesPanel({
  cognates,
  activeCognate = 0,
  onSelectCognate,
  className = '',
}) {
  if (!cognates || cognates.length === 0) {
    return (
      <div className={clsx('card p-4', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Copy size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold">Roberts-Chebyshev Cognates</h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">
          Cognates are computed only for 4-bar linkages. The Roberts-Chebyshev theorem states that
          for any 4-bar coupler curve, there exist exactly two other 4-bar linkages that trace the
          identical curve. Run a 4-bar synthesis to see cognates.
        </p>
      </div>
    );
  }

  const COLORS = ['#60a5fa', '#34d399', '#f472b6'];
  const LABELS = ['Original', 'Cognate 2', 'Cognate 3'];

  return (
    <div className={clsx('card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Copy size={16} className="text-purple-400" />
        <h3 className="text-sm font-semibold">Roberts-Chebyshev Cognates</h3>
        <span className="ml-auto text-2xs text-[var(--color-text-muted)]">
          {cognates.length} mechanism{cognates.length !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-2xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
        These {cognates.length} four-bar linkages all trace the identical coupler curve.
        They differ in link lengths and pivot locations but produce the same path.
      </p>

      {/* Cognate cards */}
      <div className="space-y-2">
        {cognates.map((cog, i) => {
          const isActive = i === activeCognate;
          const color = COLORS[i % COLORS.length];
          const label = LABELS[i] || `Cognate ${i + 1}`;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectCognate?.(i)}
              className={clsx(
                'w-full text-left rounded-lg p-3 border transition-all duration-150',
                isActive
                  ? 'border-purple-400/50 bg-purple-500/5'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-input)]/50'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {/* Color indicator */}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className={clsx(
                  'text-xs font-semibold',
                  isActive ? 'text-purple-400' : ''
                )}>
                  {label}
                </span>
                {isActive && (
                  <Eye size={12} className="ml-auto text-purple-400" />
                )}
              </div>

              {/* Mini params */}
              <div className="grid grid-cols-4 gap-1 text-2xs">
                {['a1', 'a2', 'a3', 'a4'].map((key, j) => (
                  <div key={key} className="text-center">
                    <span className="text-[var(--color-text-muted)]">a{j + 1}</span>
                    <br />
                    <span className="mono font-medium">
                      {cog[key] != null ? formatNum(cog[key], 1) : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupler point */}
              {cog.p != null && (
                <div className="mt-1.5 text-2xs text-[var(--color-text-muted)]">
                  p={formatNum(cog.p, 1)} · α={cog.alpha != null ? formatAngle(cog.alpha, 1) : '—'}
                </div>
              )}

              {/* Pivot locations */}
              {cog.pivotA && cog.pivotD && (
                <div className="mt-1 text-2xs mono text-[var(--color-text-muted)]">
                  A=({formatNum(cog.pivotA[0], 1)},{formatNum(cog.pivotA[1], 1)})
                  {' · '}
                  D=({formatNum(cog.pivotD[0], 1)},{formatNum(cog.pivotD[1], 1)})
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Educational note */}
      <div className="mt-3 p-2 rounded-md bg-purple-500/5 border border-purple-500/10">
        <p className="text-2xs text-purple-300/70 leading-relaxed">
          <strong>Roberts-Chebyshev Theorem:</strong> For any 4-bar linkage, there exist exactly
          two cognate linkages that generate the same coupler curve. This is derived by
          constructing parallelogram linkages on each side of the original mechanism.
          Cognates are useful when the original mechanism has unfavorable pivot locations
          or link proportions — a cognate may fit the physical constraints better.
        </p>
      </div>
    </div>
  );
}
