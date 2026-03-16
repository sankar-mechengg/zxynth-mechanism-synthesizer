import { Ruler } from 'lucide-react';
import clsx from 'clsx';
import { formatNum, formatAngle, formatMechanismType } from '../../utils/formatUtils';

/**
 * Mechanism parameters display table.
 * Shows all link lengths, pivot locations, coupler point, and ground angle.
 *
 * @param {object} props
 * @param {object} props.mechanism - Mechanism parameters from backend
 * @param {string} [props.mechanismType] - Type id for display label
 * @param {string} [props.className]
 */
export default function MechanismParams({ mechanism, mechanismType, className = '' }) {
  if (!mechanism) return null;

  const sections = buildSections(mechanism, mechanismType);

  return (
    <div className={clsx('card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Ruler size={16} className="text-blueprint-400" />
        <h3 className="text-sm font-semibold">Mechanism Parameters</h3>
        {mechanismType && (
          <span className="ml-auto text-2xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-input)] px-2 py-0.5 rounded">
            {formatMechanismType(mechanismType)}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="label mb-1.5">{section.title}</p>
            <div className="bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
              {section.rows.map(({ label, value, unit, highlight }) => (
                <div key={label} className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
                  <span className={clsx(
                    'text-xs mono font-medium',
                    highlight ? 'text-blueprint-400' : ''
                  )}>
                    {value}{unit && <span className="text-[var(--color-text-muted)] ml-0.5">{unit}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSections(m, type) {
  const sections = [];

  // Link lengths
  const linkRows = [];
  if (m.a1 != null) linkRows.push({ label: 'a₁ (ground link)', value: formatNum(m.a1, 2) });
  if (m.a2 != null) linkRows.push({ label: 'a₂ (input crank)', value: formatNum(m.a2, 2) });
  if (m.a3 != null) linkRows.push({ label: 'a₃ (coupler)', value: formatNum(m.a3, 2) });
  if (m.a4 != null) linkRows.push({ label: 'a₄ (output rocker)', value: formatNum(m.a4, 2) });
  // 6-bar extra links
  if (m.a5 != null) linkRows.push({ label: 'a₅ (link 5)', value: formatNum(m.a5, 2) });
  if (m.a6 != null) linkRows.push({ label: 'a₆ (link 6)', value: formatNum(m.a6, 2) });
  // Slider offset
  if (m.offset != null) linkRows.push({ label: 'Slider offset', value: formatNum(m.offset, 2) });

  if (linkRows.length > 0) {
    sections.push({ title: 'Link Lengths', rows: linkRows });
  }

  // Coupler point
  const cpRows = [];
  if (m.p != null) cpRows.push({ label: 'p (coupler pt distance)', value: formatNum(m.p, 2), highlight: true });
  if (m.alpha != null) cpRows.push({ label: 'α (coupler pt angle)', value: formatAngle(m.alpha), highlight: true });
  if (m.couplerPointX != null && m.couplerPointY != null) {
    cpRows.push({ label: 'Coupler point (local)', value: `(${formatNum(m.couplerPointX)}, ${formatNum(m.couplerPointY)})` });
  }

  if (cpRows.length > 0) {
    sections.push({ title: 'Coupler Point', rows: cpRows });
  }

  // Ground pivots
  const pivotRows = [];
  if (m.pivotA) pivotRows.push({ label: 'Pivot A (input ground)', value: `(${formatNum(m.pivotA[0])}, ${formatNum(m.pivotA[1])})` });
  if (m.pivotD) pivotRows.push({ label: 'Pivot D (output ground)', value: `(${formatNum(m.pivotD[0])}, ${formatNum(m.pivotD[1])})` });
  if (m.groundAngle != null) pivotRows.push({ label: 'Ground angle', value: formatAngle(m.groundAngle) });
  if (m.groundLength != null) pivotRows.push({ label: 'Ground length', value: formatNum(m.groundLength, 2) });
  // 6-bar extra pivots
  if (m.pivotE) pivotRows.push({ label: 'Pivot E (6-bar)', value: `(${formatNum(m.pivotE[0])}, ${formatNum(m.pivotE[1])})` });

  if (pivotRows.length > 0) {
    sections.push({ title: 'Ground Pivots', rows: pivotRows });
  }

  // Initial angles
  const angleRows = [];
  if (m.theta2_0 != null) angleRows.push({ label: 'θ₂₀ (initial crank angle)', value: formatAngle(m.theta2_0) });
  if (m.theta3_0 != null) angleRows.push({ label: 'θ₃₀ (initial coupler angle)', value: formatAngle(m.theta3_0) });
  if (m.theta4_0 != null) angleRows.push({ label: 'θ₄₀ (initial rocker angle)', value: formatAngle(m.theta4_0) });

  if (angleRows.length > 0) {
    sections.push({ title: 'Initial Angles', rows: angleRows });
  }

  return sections;
}
