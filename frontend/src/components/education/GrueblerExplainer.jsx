import { useState } from 'react';
import clsx from 'clsx';

/**
 * Interactive Gruebler's equation explainer.
 * User can change n and j₁ to see DOF recalculate live.
 */
export default function GrueblerExplainer() {
  const [n, setN] = useState(4);
  const [j1, setJ1] = useState(4);
  const [j2, setJ2] = useState(0);

  const dof = 3 * (n - 1) - 2 * j1 - j2;

  const dofColor = dof === 1
    ? 'text-emerald-400'
    : dof === 0
    ? 'text-amber-400'
    : dof < 0
    ? 'text-red-400'
    : 'text-blue-400';

  const dofLabel = dof === 1
    ? 'Single-DOF mechanism ✓'
    : dof === 0
    ? 'Structure (no movement)'
    : dof < 0
    ? 'Over-constrained'
    : `${dof}-DOF mechanism (needs ${dof} inputs)`;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-blueprint-400">Gruebler&apos;s Equation</h3>

      <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
        The <strong>degree of freedom (DOF)</strong> tells you how many independent inputs
        you need to fully control the mechanism. For single-actuator designs, we need DOF = 1.
      </p>

      {/* Formula */}
      <div className="card p-3 text-center">
        <p className="mono text-sm text-[var(--color-text-secondary)]">
          F = 3(n − 1) − 2j₁ − j₂
        </p>
      </div>

      {/* Variable definitions */}
      <div className="space-y-1 text-2xs text-[var(--color-text-muted)]">
        <p><strong className="mono text-[var(--color-text-secondary)]">F</strong> = degrees of freedom (mobility)</p>
        <p><strong className="mono text-[var(--color-text-secondary)]">n</strong> = total links (including ground)</p>
        <p><strong className="mono text-[var(--color-text-secondary)]">j₁</strong> = lower pairs (revolute + prismatic joints; each removes 2 DOF)</p>
        <p><strong className="mono text-[var(--color-text-secondary)]">j₂</strong> = higher pairs (cam, gear; each removes 1 DOF)</p>
      </div>

      {/* Interactive calculator */}
      <div className="card p-3">
        <p className="label mb-2">Try It — Interactive Calculator</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <label className="text-2xs text-[var(--color-text-muted)] block mb-1">Links (n)</label>
            <input
              type="number"
              value={n}
              onChange={(e) => setN(Math.max(2, parseInt(e.target.value) || 2))}
              min={2} max={12}
              className="input-field w-full text-center mono text-sm py-1"
            />
          </div>
          <div className="text-center">
            <label className="text-2xs text-[var(--color-text-muted)] block mb-1">Lower Pairs (j₁)</label>
            <input
              type="number"
              value={j1}
              onChange={(e) => setJ1(Math.max(0, parseInt(e.target.value) || 0))}
              min={0} max={20}
              className="input-field w-full text-center mono text-sm py-1"
            />
          </div>
          <div className="text-center">
            <label className="text-2xs text-[var(--color-text-muted)] block mb-1">Higher Pairs (j₂)</label>
            <input
              type="number"
              value={j2}
              onChange={(e) => setJ2(Math.max(0, parseInt(e.target.value) || 0))}
              min={0} max={10}
              className="input-field w-full text-center mono text-sm py-1"
            />
          </div>
        </div>

        {/* Live calculation */}
        <div className="bg-[var(--color-bg-primary)] rounded-md p-2 border border-[var(--color-border-subtle)] space-y-0.5 mono text-xs">
          <p className="text-[var(--color-text-muted)]">F = 3({n} − 1) − 2({j1}) − {j2}</p>
          <p className="text-[var(--color-text-muted)]">F = {3 * (n - 1)} − {2 * j1} − {j2}</p>
          <p className={clsx('text-base font-bold', dofColor)}>F = {dof}</p>
        </div>

        <p className={clsx('text-2xs mt-2 font-medium', dofColor)}>{dofLabel}</p>
      </div>

      {/* Common examples */}
      <div>
        <p className="label mb-1.5">Common Configurations</p>
        <div className="space-y-1">
          {[
            { name: '4-Bar', n: 4, j1: 4, j2: 0, dof: 1 },
            { name: 'Slider-Crank', n: 4, j1: 4, j2: 0, dof: 1 },
            { name: '5-Bar', n: 5, j1: 5, j2: 0, dof: 2 },
            { name: '6-Bar (Watt/Stephenson)', n: 6, j1: 7, j2: 0, dof: 1 },
          ].map((ex) => (
            <button
              key={ex.name}
              onClick={() => { setN(ex.n); setJ1(ex.j1); setJ2(ex.j2); }}
              className="w-full flex items-center justify-between px-2 py-1 rounded text-2xs hover:bg-[var(--color-bg-input)] transition-colors"
            >
              <span className="text-[var(--color-text-secondary)]">{ex.name}</span>
              <span className="mono text-[var(--color-text-muted)]">
                n={ex.n}, j₁={ex.j1} → F={ex.dof}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Derivation hint */}
      <div className="p-2 rounded-md bg-blueprint-500/5 border border-blueprint-500/10">
        <p className="text-2xs text-blueprint-300/70 leading-relaxed">
          <strong>Derivation:</strong> Each of the (n−1) free links has 3 DOF in the plane
          (translate x, y, rotate). Each lower pair removes 2 DOF (constraining translation
          but allowing rotation, or vice versa). Net: F = 3(n−1) − 2j₁ − j₂.
        </p>
      </div>
    </div>
  );
}
