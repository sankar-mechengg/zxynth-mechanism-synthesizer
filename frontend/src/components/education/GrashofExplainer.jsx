import useSynthesisStore from '../../stores/useSynthesisStore';
import { formatNum } from '../../utils/formatUtils';
import clsx from 'clsx';

/**
 * Grashof condition explainer with visual bar chart of link lengths.
 */
export default function GrashofExplainer() {
  const { mechanism } = useSynthesisStore();

  // Extract link lengths if available
  const links = mechanism
    ? [mechanism.a1, mechanism.a2, mechanism.a3, mechanism.a4].filter((l) => l != null)
    : [40, 20, 35, 30]; // Example values

  const sorted = [...links].sort((a, b) => a - b);
  const s = sorted[0]; // Shortest
  const l = sorted[sorted.length - 1]; // Longest
  const p = sorted.length > 2 ? sorted[1] : 0;
  const q = sorted.length > 3 ? sorted[2] : 0;

  const leftSide = s + l;
  const rightSide = p + q;
  const isGrashof = leftSide <= rightSide;
  const margin = rightSide - leftSide;

  const maxLen = Math.max(...links, 1);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-emerald-400">Grashof Condition</h3>

      <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
        The <strong>Grashof condition</strong> determines whether any link in a 4-bar
        mechanism can make a full 360° revolution relative to the ground. This is
        essential for continuous rotary motor input.
      </p>

      {/* Condition formula */}
      <div className="card p-3 text-center">
        <p className="mono text-sm text-[var(--color-text-secondary)]">
          s + l ≤ p + q
        </p>
        <p className="text-2xs text-[var(--color-text-muted)] mt-1">
          shortest + longest ≤ sum of remaining two
        </p>
      </div>

      {/* Visual bar chart of link lengths */}
      <div className="card p-3">
        <p className="label mb-2">Link Lengths</p>
        <svg viewBox="0 0 280 100" className="w-full" style={{ maxHeight: 100 }}>
          {['a₁', 'a₂', 'a₃', 'a₄'].map((label, i) => {
            if (i >= links.length) return null;
            const barWidth = (links[i] / maxLen) * 200;
            const y = i * 22 + 5;
            const isShortest = links[i] === s;
            const isLongest = links[i] === l;
            const color = isShortest ? '#34d399' : isLongest ? '#f472b6' : '#60a5fa';

            return (
              <g key={i}>
                <text x="0" y={y + 13} fontSize="10" fill="var(--color-text-muted)"
                  fontFamily="JetBrains Mono, monospace">{label}</text>
                <rect x="30" y={y + 2} width={barWidth} height="14" rx="3"
                  fill={color} opacity="0.6" />
                <text x={35 + barWidth} y={y + 13} fontSize="9" fill="var(--color-text-secondary)"
                  fontFamily="JetBrains Mono, monospace">
                  {formatNum(links[i], 1)}
                  {isShortest && ' (s)'}
                  {isLongest && ' (l)'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Calculation */}
      <div className="card p-3">
        <p className="label mb-2">Check</p>
        <div className="bg-[var(--color-bg-primary)] rounded-md p-2 border border-[var(--color-border-subtle)] mono text-xs space-y-1">
          <p className="text-[var(--color-text-muted)]">
            s + l = {formatNum(s, 1)} + {formatNum(l, 1)} = <strong>{formatNum(leftSide, 1)}</strong>
          </p>
          <p className="text-[var(--color-text-muted)]">
            p + q = {formatNum(p, 1)} + {formatNum(q, 1)} = <strong>{formatNum(rightSide, 1)}</strong>
          </p>
          <p className={clsx('font-bold text-sm', isGrashof ? 'text-emerald-400' : 'text-red-400')}>
            {formatNum(leftSide, 1)} {isGrashof ? '≤' : '>'} {formatNum(rightSide, 1)}
            {' → '}
            {isGrashof ? 'Grashof ✓' : 'Non-Grashof ✗'}
          </p>
          {margin !== 0 && (
            <p className="text-[var(--color-text-muted)]">
              Margin: {formatNum(Math.abs(margin), 2)}
            </p>
          )}
        </div>
      </div>

      {/* Classification table */}
      <div>
        <p className="label mb-1.5">Grashof Classification</p>
        <div className="space-y-1 text-2xs text-[var(--color-text-muted)]">
          {[
            { type: 'Crank-Rocker', cond: 'Ground is adjacent to shortest link', desc: 'Input crank rotates fully; output oscillates' },
            { type: 'Double-Crank', cond: 'Ground is the shortest link', desc: 'Both input and output rotate fully (drag link)' },
            { type: 'Double-Rocker', cond: 'Ground is opposite the shortest link', desc: 'Neither pivoted link rotates fully' },
            { type: 'Change-Point', cond: 's+l = p+q exactly', desc: 'Can lock or switch modes — usually avoided' },
          ].map(({ type, cond, desc }) => (
            <div key={type} className="pl-2 border-l-2 border-[var(--color-border-subtle)] py-1">
              <p className="text-[var(--color-text-secondary)] font-medium">{type}</p>
              <p>{cond}. {desc}.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
