import { CheckCircle2, Waypoints, TrendingUp, Move3D } from 'lucide-react';
import clsx from 'clsx';

const PROBLEM_INFO = {
  path: {
    icon: Waypoints,
    label: 'Path Generation',
    color: 'text-emerald-400',
    description: 'A coupler point must trace a prescribed curve in the plane.',
    method: 'Coupler curve optimization — minimize deviation between desired and actual path.',
    families: [
      'Planar linkages (4-bar, 6-bar) — primary candidates',
      'Slider-crank — if linear components needed',
    ],
    reasoning: 'Linkages are preferred over cams/gears because they provide continuous, smooth coupler curves suitable for path tracing with single-DOF input.',
  },
  function: {
    icon: TrendingUp,
    label: 'Function Generation',
    color: 'text-blue-400',
    description: 'The output link angle must be a specified function of the input link angle: θ_out = f(θ_in).',
    method: 'Freudenstein equation (analytical) + optimization for best fit beyond 3 precision points.',
    families: [
      'Planar 4-bar linkage — the standard choice',
      '6-bar for higher-order approximation',
      'Slider-crank for linear output',
    ],
    reasoning: 'The 4-bar linkage is the most efficient for function generation because Freudenstein\'s equation directly relates input-output angles to link lengths.',
  },
  motion: {
    icon: Move3D,
    label: 'Motion Generation',
    color: 'text-pink-400',
    description: 'The entire coupler link must pass through prescribed positions AND orientations (x, y, θ).',
    method: 'Burmester circle-point theory (analytical) + optimization for best multi-pose fit.',
    families: [
      'Planar 4-bar — up to 5 analytical precision poses',
      '6-bar — for higher complexity guidance',
      'Slider-crank — if linear ground constraint',
    ],
    reasoning: 'Each precision pose constrains both position and orientation, requiring the full Burmester framework to find compatible circle and center points.',
  },
};

/**
 * Type Synthesis step — shows problem classification and recommended mechanism family.
 *
 * @param {object} props
 * @param {string} props.problemType - 'path' | 'function' | 'motion'
 * @param {string} props.mechanismType - Selected mechanism type id
 * @param {string} [props.className]
 */
export default function TypeSynthesisStep({ problemType, mechanismType, className = '' }) {
  const info = PROBLEM_INFO[problemType];
  if (!info) return null;

  const Icon = info.icon;

  return (
    <div className={clsx('flex flex-col gap-4 animate-in', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={clsx('p-2.5 rounded-lg bg-[var(--color-bg-input)]', info.color)}>
          <Icon size={22} />
        </div>
        <div>
          <h3 className="text-base font-semibold">Type Synthesis</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Classifying the problem and selecting mechanism family
          </p>
        </div>
        <CheckCircle2 size={18} className="text-emerald-400 ml-auto" />
      </div>

      {/* Classification card */}
      <div className="card p-4 space-y-3">
        <div>
          <p className="label mb-1">Problem Classification</p>
          <p className={clsx('text-sm font-semibold', info.color)}>{info.label}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">{info.description}</p>
        </div>

        <div className="divider" />

        <div>
          <p className="label mb-1">Synthesis Method</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{info.method}</p>
        </div>

        <div className="divider" />

        <div>
          <p className="label mb-1">Recommended Mechanism Families</p>
          <ul className="space-y-1">
            {info.families.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className={clsx('mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0', info.color.replace('text-', 'bg-'))} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="divider" />

        <div>
          <p className="label mb-1">Reasoning</p>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed italic">
            {info.reasoning}
          </p>
        </div>
      </div>

      {/* Selected mechanism confirmation */}
      <div className="card p-3 bg-emerald-500/5 border-emerald-500/20">
        <p className="text-xs text-emerald-400">
          <strong>Selected:</strong>{' '}
          {mechanismType === 'four_bar' && '4-Bar Linkage (4 links, 4 revolute joints)'}
          {mechanismType === 'six_bar_watt' && '6-Bar Watt-I (6 links, 7 revolute joints)'}
          {mechanismType === 'six_bar_stephenson' && '6-Bar Stephenson-III (6 links, 7 revolute joints)'}
          {mechanismType === 'slider_crank' && 'Slider-Crank (4 links, 3R + 1P joints)'}
        </p>
      </div>
    </div>
  );
}
