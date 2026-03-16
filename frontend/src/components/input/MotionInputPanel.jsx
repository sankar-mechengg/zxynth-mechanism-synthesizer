import { useState } from 'react';
import { Table2, MousePointer2, Plus, Trash2, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import useMotionStore from '../../stores/useMotionStore';
import useSynthesisStore from '../../stores/useSynthesisStore';
import useAppStore from '../../stores/useAppStore';
import ParameterInput from '../common/ParameterInput';
import MechanismTypeSelector from './MechanismTypeSelector';
import AlgorithmSelector from './AlgorithmSelector';
import ConstraintPanel from './ConstraintPanel';

/**
 * Complete input panel for motion generation (rigid-body guidance).
 * Supports table entry and interactive canvas placement of precision poses.
 */
export default function MotionInputPanel({ className = '' }) {
  const store = useMotionStore();

  return (
    <div className={clsx('flex flex-col gap-5', className)}>
      {/* Input mode tabs */}
      <div>
        <label className="label mb-1.5 block">Pose Input</label>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-input)]">
          <button
            onClick={() => store.setInputMode('table')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all',
              store.inputMode === 'table'
                ? 'bg-[var(--color-bg-elevated)] text-blueprint-400 shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            <Table2 size={14} />
            Table Entry
          </button>
          <button
            onClick={() => store.setInputMode('canvas')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all',
              store.inputMode === 'canvas'
                ? 'bg-[var(--color-bg-elevated)] text-blueprint-400 shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            <MousePointer2 size={14} />
            Canvas Placement
          </button>
        </div>
      </div>

      {/* Pose table */}
      {store.inputMode === 'table' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label">
              Precision Poses ({store.poses.length})
            </label>
            <button
              onClick={() => store.addPose()}
              disabled={store.poses.length >= 7}
              className={clsx(
                'btn-ghost text-2xs gap-1 text-blueprint-400',
                store.poses.length >= 7 && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Plus size={12} /> Add Pose
            </button>
          </div>

          <div className="space-y-1.5">
            {/* Header */}
            <div className="grid grid-cols-[20px_1fr_1fr_1fr_28px] gap-2 text-2xs text-[var(--color-text-muted)] uppercase tracking-wider px-1">
              <span>#</span>
              <span>X</span>
              <span>Y</span>
              <span>θ (°)</span>
              <span />
            </div>

            {store.poses.map((pose, i) => (
              <div
                key={i}
                className={clsx(
                  'grid grid-cols-[20px_1fr_1fr_1fr_28px] gap-2 items-center',
                  store.activePoseIndex === i && 'bg-blueprint-500/5 rounded-md'
                )}
              >
                {/* Index */}
                <span className="text-2xs mono text-[var(--color-text-muted)] text-center">
                  {i + 1}
                </span>

                {/* X */}
                <input
                  type="number"
                  value={pose.x}
                  onChange={(e) => store.updatePose(i, { x: parseFloat(e.target.value) || 0 })}
                  className="input-field text-xs mono py-1"
                  step={5}
                />

                {/* Y */}
                <input
                  type="number"
                  value={pose.y}
                  onChange={(e) => store.updatePose(i, { y: parseFloat(e.target.value) || 0 })}
                  className="input-field text-xs mono py-1"
                  step={5}
                />

                {/* Theta */}
                <input
                  type="number"
                  value={pose.theta}
                  onChange={(e) => store.updatePose(i, { theta: parseFloat(e.target.value) || 0 })}
                  className="input-field text-xs mono py-1"
                  step={5}
                />

                {/* Delete */}
                <button
                  onClick={() => store.removePose(i)}
                  disabled={store.poses.length <= 2}
                  className={clsx(
                    'p-1 rounded transition-colors',
                    store.poses.length <= 2
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400'
                  )}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <p className="text-2xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
            2–3 poses → analytical Burmester synthesis. 4–5 → precision-point synthesis.
            6+ → optimization-based. Max 7 recommended for 4-bar.
          </p>
        </div>
      )}

      {/* Canvas mode instructions */}
      {store.inputMode === 'canvas' && (
        <div className="card p-3 bg-blueprint-500/5 border-blueprint-500/20">
          <p className="text-sm text-blueprint-400 font-medium mb-1">Interactive Pose Placement</p>
          <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed mb-2">
            Click on the canvas to place a coupler body position. Drag to set orientation.
            Each placement adds a new precision pose (x, y, θ).
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => store.setPlacingNewPose(true)}
              className="btn-primary text-xs py-1.5 px-3"
            >
              <Plus size={12} />
              Place New Pose
            </button>
            <span className="text-2xs text-[var(--color-text-muted)]">
              {store.poses.length} pose{store.poses.length !== 1 ? 's' : ''} defined
            </span>
          </div>
        </div>
      )}

      {/* Pose summary */}
      {store.poses.length > 0 && (
        <div className="flex items-center gap-2 py-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs text-emerald-400">
            <strong className="mono">{store.poses.length}</strong> precision pose{store.poses.length !== 1 ? 's' : ''} defined
          </span>
          {store.poses.length <= 5 && (
            <span className="text-2xs text-[var(--color-text-muted)]">
              → analytical + optimization
            </span>
          )}
          {store.poses.length > 5 && (
            <span className="text-2xs text-amber-400">
              → optimization only ({'>'}5 poses)
            </span>
          )}
        </div>
      )}

      <div className="divider" />
      <MechanismTypeSelector
        value={store.mechanismType}
        onChange={(type) => {
          store.setMechanismType(type);
          useSynthesisStore.getState().reset();
          useAppStore.getState().resetWorkflow();
        }}
      />
      <div className="divider" />
      <AlgorithmSelector
        algorithm={store.algorithm}
        onAlgorithmChange={(algo) => {
          store.setAlgorithm(algo);
          useSynthesisStore.getState().reset();
        }}
        hyperparams={store.hyperparams}
        onHyperparamsChange={store.setHyperparams}
      />
      <div className="divider" />
      <ConstraintPanel
        tolerance={store.tolerance}
        onToleranceChange={store.setTolerance}
        minTransmissionAngle={store.minTransmissionAngle}
        onMinTransmissionAngleChange={store.setMinTransmissionAngle}
        grashofRequired={store.grashofRequired}
        onGrashofRequiredChange={store.setGrashofRequired}
        groundPivot1={store.groundPivot1}
        onGroundPivot1Change={store.setGroundPivot1}
        groundPivot2={store.groundPivot2}
        onGroundPivot2Change={store.setGroundPivot2}
      />
    </div>
  );
}
