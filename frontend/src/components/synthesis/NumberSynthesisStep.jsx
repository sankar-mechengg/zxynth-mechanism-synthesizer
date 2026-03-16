import { CheckCircle2, Hash } from 'lucide-react';
import clsx from 'clsx';

const MECHANISM_DATA = {
  four_bar: { n: 4, j1: 4, j2: 0, topology: '4R (all revolute)', isomers: 1 },
  six_bar_watt: { n: 6, j1: 7, j2: 0, topology: '7R (Watt-I: ternary links adjacent)', isomers: 2 },
  six_bar_stephenson: { n: 6, j1: 7, j2: 0, topology: '7R (Stephenson-III: ternary links separated)', isomers: 3 },
  slider_crank: { n: 4, j1: 4, j2: 0, topology: '3R + 1P (revolute + prismatic)', isomers: 1 },
};

/**
 * Number Synthesis step — shows Gruebler's equation calculation and topology.
 *
 * @param {object} props
 * @param {string} props.mechanismType - Selected mechanism type id
 * @param {string} [props.className]
 */
export default function NumberSynthesisStep({ mechanismType, className = '' }) {
  const data = MECHANISM_DATA[mechanismType];
  if (!data) return null;

  const dof = 3 * (data.n - 1) - 2 * data.j1 - data.j2;
  const dofValid = dof === 1;

  return (
    <div className={clsx('flex flex-col gap-4 animate-in', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-[var(--color-bg-input)] text-amber-400">
          <Hash size={22} />
        </div>
        <div>
          <h3 className="text-base font-semibold">Number Synthesis</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Verifying DOF and enumerating topology
          </p>
        </div>
        {dofValid && <CheckCircle2 size={18} className="text-emerald-400 ml-auto" />}
      </div>

      {/* Gruebler's Equation Card */}
      <div className="card p-4 space-y-4">
        {/* Formula */}
        <div>
          <p className="label mb-2">Gruebler&apos;s Equation (Kutzbach Criterion)</p>
          <div className="bg-[var(--color-bg-primary)] rounded-md p-3 border border-[var(--color-border-subtle)]">
            <p className="mono text-sm text-center text-[var(--color-text-secondary)]">
              F = 3(n − 1) − 2j₁ − j₂
            </p>
          </div>
        </div>

        {/* Variable values */}
        <div>
          <p className="label mb-2">Substituting Values</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--color-bg-primary)] rounded-md p-2.5 text-center border border-[var(--color-border-subtle)]">
              <p className="text-2xs text-[var(--color-text-muted)]">Links (n)</p>
              <p className="text-lg font-bold mono text-blueprint-400">{data.n}</p>
            </div>
            <div className="bg-[var(--color-bg-primary)] rounded-md p-2.5 text-center border border-[var(--color-border-subtle)]">
              <p className="text-2xs text-[var(--color-text-muted)]">Lower Pairs (j₁)</p>
              <p className="text-lg font-bold mono text-blueprint-400">{data.j1}</p>
            </div>
            <div className="bg-[var(--color-bg-primary)] rounded-md p-2.5 text-center border border-[var(--color-border-subtle)]">
              <p className="text-2xs text-[var(--color-text-muted)]">Higher Pairs (j₂)</p>
              <p className="text-lg font-bold mono text-blueprint-400">{data.j2}</p>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div>
          <p className="label mb-2">Calculation</p>
          <div className="bg-[var(--color-bg-primary)] rounded-md p-3 border border-[var(--color-border-subtle)] space-y-1">
            <p className="mono text-sm text-[var(--color-text-secondary)]">
              F = 3({data.n} − 1) − 2({data.j1}) − {data.j2}
            </p>
            <p className="mono text-sm text-[var(--color-text-secondary)]">
              F = 3({data.n - 1}) − {2 * data.j1} − {data.j2}
            </p>
            <p className="mono text-sm text-[var(--color-text-secondary)]">
              F = {3 * (data.n - 1)} − {2 * data.j1 + data.j2}
            </p>
            <p className={clsx(
              'mono text-base font-bold',
              dofValid ? 'text-emerald-400' : 'text-red-400'
            )}>
              F = {dof} {dofValid ? '✓' : '✗'}
            </p>
          </div>
        </div>

        {/* DOF interpretation */}
        <div className={clsx(
          'p-3 rounded-md border',
          dofValid
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-red-500/5 border-red-500/20'
        )}>
          <p className={clsx('text-sm font-medium', dofValid ? 'text-emerald-400' : 'text-red-400')}>
            {dofValid
              ? 'DOF = 1 — Single-input mechanism. One motor drives the entire mechanism. ✓'
              : `DOF = ${dof} — This configuration requires ${dof} independent inputs. Not suitable for single-actuator design.`
            }
          </p>
        </div>

        <div className="divider" />

        {/* Topology info */}
        <div>
          <p className="label mb-2">Topology</p>
          <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
            <div className="flex justify-between">
              <span>Joint configuration:</span>
              <span className="mono">{data.topology}</span>
            </div>
            <div className="flex justify-between">
              <span>Distinct topological isomers:</span>
              <span className="mono">{data.isomers}</span>
            </div>
            {mechanismType === 'six_bar_watt' && (
              <p className="text-2xs text-[var(--color-text-muted)] italic mt-1">
                Watt chain: two ternary links share a common joint. This gives a more compact mechanism.
              </p>
            )}
            {mechanismType === 'six_bar_stephenson' && (
              <p className="text-2xs text-[var(--color-text-muted)] italic mt-1">
                Stephenson chain: two ternary links are not directly connected. Offers different coupler curve families than Watt.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
