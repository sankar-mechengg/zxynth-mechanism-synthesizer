import { MECHANISM_TYPES } from '../../config/api';
import clsx from 'clsx';
import Tooltip from '../common/Tooltip';

/**
 * Mechanism type selector — visual radio cards showing each mechanism type
 * with link/joint count and Gruebler DOF calculation.
 *
 * @param {object} props
 * @param {string} props.value - Selected mechanism type id
 * @param {function} props.onChange - Called with selected type id
 * @param {string} [props.className]
 */

const TYPE_DETAILS = {
  four_bar: {
    svg: (
      <svg viewBox="0 0 80 50" className="w-full h-10" fill="none">
        <line x1="10" y1="40" x2="70" y2="40" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="10" y1="40" x2="25" y2="15" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        <line x1="25" y1="15" x2="60" y2="12" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="12" x2="70" y2="40" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="40" r="3" fill="#f59e0b" />
        <circle cx="70" cy="40" r="3" fill="#f59e0b" />
        <circle cx="25" cy="15" r="2.5" fill="#60a5fa" />
        <circle cx="60" cy="12" r="2.5" fill="#60a5fa" />
      </svg>
    ),
    dof: 'F = 3(4−1) − 2(4) = 1',
    desc: 'Simplest single-DOF linkage. Best for smooth curves with moderate complexity.',
  },
  six_bar_watt: {
    svg: (
      <svg viewBox="0 0 80 50" className="w-full h-10" fill="none">
        <line x1="5" y1="42" x2="75" y2="42" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="5" y1="42" x2="20" y2="18" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="18" x2="42" y2="10" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="10" x2="55" y2="30" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="10" x2="65" y2="8" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="65" y1="8" x2="75" y2="42" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="42" r="2.5" fill="#f59e0b" />
        <circle cx="75" cy="42" r="2.5" fill="#f59e0b" />
        <circle cx="55" cy="30" r="2.5" fill="#f59e0b" />
        {[20,42,65].map((x,i) => <circle key={i} cx={x} cy={[18,10,8][i]} r="2" fill="#60a5fa" />)}
      </svg>
    ),
    dof: 'F = 3(6−1) − 2(7) = 1',
    desc: 'Two ternary links adjacent. Better for complex curves with inflections.',
  },
  six_bar_stephenson: {
    svg: (
      <svg viewBox="0 0 80 50" className="w-full h-10" fill="none">
        <line x1="5" y1="42" x2="75" y2="42" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="5" y1="42" x2="18" y2="20" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="20" x2="38" y2="8" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="8" x2="58" y2="20" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="58" y1="20" x2="75" y2="42" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="8" x2="40" y2="42" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="42" r="2.5" fill="#f59e0b" />
        <circle cx="75" cy="42" r="2.5" fill="#f59e0b" />
        <circle cx="40" cy="42" r="2.5" fill="#f59e0b" />
        {[18,38,58].map((x,i) => <circle key={i} cx={x} cy={[20,8,20][i]} r="2" fill="#60a5fa" />)}
      </svg>
    ),
    dof: 'F = 3(6−1) − 2(7) = 1',
    desc: 'Two ternary links separated. Different coupler curve family than Watt.',
  },
  slider_crank: {
    svg: (
      <svg viewBox="0 0 80 50" className="w-full h-10" fill="none">
        <line x1="15" y1="35" x2="75" y2="35" stroke="var(--color-text-muted)" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="15" y1="35" x2="30" y2="12" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="12" x2="60" y2="35" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
        <circle cx="15" cy="35" r="3" fill="#f59e0b" />
        <circle cx="30" cy="12" r="2.5" fill="#60a5fa" />
        <rect x="54" y="30" width="12" height="10" rx="2" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="48" y1="35" x2="75" y2="35" stroke="var(--color-text-muted)" strokeWidth="2" />
      </svg>
    ),
    dof: 'F = 3(4−1) − 2(3R+1P) = 1',
    desc: 'Revolute + prismatic joints. Linear output motion from rotary input.',
  },
};

export default function MechanismTypeSelector({ value, onChange, className = '' }) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label className="label">Mechanism Type</label>
      <div className="grid grid-cols-2 gap-2">
        {MECHANISM_TYPES.map((type) => {
          const detail = TYPE_DETAILS[type.id];
          const isSelected = value === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={clsx(
                'card p-3 text-left transition-all duration-200',
                isSelected
                  ? 'glow-border bg-blueprint-500/5'
                  : 'hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-input)]/50'
              )}
            >
              {/* SVG illustration */}
              <div className="mb-2">{detail?.svg}</div>

              {/* Label */}
              <p className={clsx(
                'text-sm font-semibold mb-0.5',
                isSelected ? 'text-blueprint-400' : ''
              )}>
                {type.label}
              </p>

              {/* DOF formula */}
              <p className="text-2xs mono text-[var(--color-text-muted)] mb-1">
                {detail?.dof}
              </p>

              {/* Description */}
              <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
                {detail?.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
