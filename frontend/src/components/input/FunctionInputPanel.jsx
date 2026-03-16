import { useState, useEffect } from 'react';
import { Type, FileSpreadsheet, Table2, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import useFunctionStore from '../../stores/useFunctionStore';
import useFileUpload from '../../hooks/useFileUpload';
import { validateExpression, evaluateExpression } from '../../utils/mathParser';
import FileUploader from '../common/FileUploader';
import ParameterInput from '../common/ParameterInput';
import MechanismTypeSelector from './MechanismTypeSelector';
import AlgorithmSelector from './AlgorithmSelector';
import ConstraintPanel from './ConstraintPanel';
import ErrorBanner from '../common/ErrorBanner';

const INPUT_TABS = [
  { id: 'expression', label: 'Expression', icon: Type },
  { id: 'csv', label: 'CSV Upload', icon: FileSpreadsheet },
  { id: 'discrete', label: 'Manual Pairs', icon: Table2 },
];

/**
 * Complete input panel for function generation.
 */
export default function FunctionInputPanel({ className = '' }) {
  const store = useFunctionStore();
  const { processFile, error: uploadError, reset: resetUpload } = useFileUpload({ mode: 'function' });
  const [exprPreview, setExprPreview] = useState(null);

  // Validate expression on change
  useEffect(() => {
    if (store.inputMode !== 'expression' || !store.expression.trim()) {
      store.setExpressionValid(false, null);
      setExprPreview(null);
      return;
    }

    const result = validateExpression(store.expression);
    store.setExpressionValid(result.valid, result.error);

    if (result.valid) {
      try {
        const pairs = evaluateExpression(
          store.expression,
          store.thetaInRange[0],
          store.thetaInRange[1],
          51
        );
        store.setSampledPairs(pairs);
        setExprPreview(pairs);
      } catch (err) {
        store.setExpressionValid(false, err.message);
        setExprPreview(null);
      }
    } else {
      setExprPreview(null);
    }
  }, [store.expression, store.thetaInRange[0], store.thetaInRange[1], store.inputMode]);

  const handleCsvAccepted = async (fileData) => {
    try {
      const result = await processFile(fileData);
      if (result.metadata?.functionPairs) {
        store.setFromCsv(
          result.metadata.functionPairs,
          result.fileName,
          result.metadata.warnings || [],
          result.metadata.isMonotonic
        );
      }
    } catch {}
  };

  return (
    <div className={clsx('flex flex-col gap-5', className)}>
      {/* Input mode tabs */}
      <div>
        <label className="label mb-1.5 block">Function Input</label>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-input)]">
          {INPUT_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => store.setInputMode(id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all',
                store.inputMode === id
                  ? 'bg-[var(--color-bg-elevated)] text-blueprint-400 shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Expression mode */}
      {store.inputMode === 'expression' && (
        <div className="flex flex-col gap-3">
          {/* Input range */}
          <div className="grid grid-cols-2 gap-2">
            <ParameterInput
              label="θ_in Start"
              value={store.thetaInRange[0]}
              onChange={(v) => store.setThetaInRange([v, store.thetaInRange[1]])}
              min={0} max={360} step={5} unit="°"
            />
            <ParameterInput
              label="θ_in End"
              value={store.thetaInRange[1]}
              onChange={(v) => store.setThetaInRange([store.thetaInRange[0], v])}
              min={0} max={360} step={5} unit="°"
            />
          </div>

          {/* Expression input */}
          <div>
            <label className="label mb-1 block">Expression: θ_out = f(x) or f(theta)</label>
            <input
              type="text"
              value={store.expression}
              onChange={(e) => store.setExpression(e.target.value)}
              placeholder="e.g., 90 * sin(pi * x)  or  log(theta + 1) * 30"
              className={clsx(
                'input-field w-full mono text-sm',
                store.expressionError && 'border-red-500/50'
              )}
            />
            <p className="text-2xs text-[var(--color-text-muted)] mt-1">
              Use <code className="mono text-blueprint-400">x</code> (normalized 0–1) or{' '}
              <code className="mono text-blueprint-400">theta</code> (degrees). Functions: sin, cos, log, sqrt, exp, pow, etc.
            </p>
            {store.expressionError && (
              <p className="text-2xs text-red-400 mt-1">{store.expressionError}</p>
            )}
          </div>

          {/* Mini preview of the function */}
          {exprPreview && exprPreview.length > 1 && (
            <div className="card p-2">
              <svg viewBox="0 0 200 80" className="w-full h-16">
                <FunctionPreviewChart data={exprPreview} />
              </svg>
              <p className="text-2xs text-emerald-400 text-center mt-1">
                {exprPreview.length} sampled pairs
              </p>
            </div>
          )}
        </div>
      )}

      {/* CSV mode */}
      {store.inputMode === 'csv' && (
        <div>
          <FileUploader
            onFileAccepted={handleCsvAccepted}
            accept={['csv']}
            label="Drop CSV with θ_in, θ_out columns"
          />
          {uploadError && <ErrorBanner message={uploadError} type="error" onDismiss={resetUpload} className="mt-2" />}
          {store.csvFileName && (
            <div className="mt-2 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              Loaded: <strong>{store.csvFileName}</strong> — {store.sampledPairs.length} pairs
              {!store.csvIsMonotonic && <span className="text-amber-400 ml-2">(non-monotonic θ_in)</span>}
            </div>
          )}
        </div>
      )}

      {/* Discrete pairs mode */}
      {store.inputMode === 'discrete' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label">Precision Pairs (θ_in → θ_out)</label>
            <button onClick={store.addDiscretePair} className="btn-ghost text-2xs gap-1 text-blueprint-400">
              <Plus size={12} /> Add
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_1fr_28px] gap-2 text-2xs text-[var(--color-text-muted)] uppercase tracking-wider px-1">
              <span>θ_input (°)</span>
              <span>θ_output (°)</span>
              <span />
            </div>
            {store.discretePairs.map((pair, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_28px] gap-2 items-center">
                <input
                  type="number"
                  value={pair.thetaIn}
                  onChange={(e) => store.updateDiscretePair(i, 'thetaIn', parseFloat(e.target.value) || 0)}
                  className="input-field text-xs mono py-1"
                />
                <input
                  type="number"
                  value={pair.thetaOut}
                  onChange={(e) => store.updateDiscretePair(i, 'thetaOut', parseFloat(e.target.value) || 0)}
                  className="input-field text-xs mono py-1"
                />
                <button
                  onClick={() => store.removeDiscretePair(i)}
                  disabled={store.discretePairs.length <= 2}
                  className={clsx(
                    'p-1 rounded transition-colors',
                    store.discretePairs.length <= 2
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400'
                  )}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-2xs text-[var(--color-text-muted)] mt-2">
            Min 2 pairs (Freudenstein). 3 pairs = unique 4-bar. 4+ = over-determined → optimization.
          </p>
        </div>
      )}

      <div className="divider" />
      <MechanismTypeSelector value={store.mechanismType} onChange={store.setMechanismType} />
      <div className="divider" />
      <AlgorithmSelector
        algorithm={store.algorithm}
        onAlgorithmChange={store.setAlgorithm}
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
        showGroundPivots={false}
      />
    </div>
  );
}

/** Tiny SVG chart showing the function shape */
function FunctionPreviewChart({ data }) {
  if (data.length < 2) return null;
  const tIns = data.map((d) => d.thetaIn);
  const tOuts = data.map((d) => d.thetaOut);
  const minX = Math.min(...tIns), maxX = Math.max(...tIns);
  const minY = Math.min(...tOuts), maxY = Math.max(...tOuts);
  const rX = maxX - minX || 1, rY = maxY - minY || 1;
  const pad = 8;
  const w = 200 - pad * 2, h = 80 - pad * 2;

  const pts = data.map((d) =>
    `${pad + ((d.thetaIn - minX) / rX) * w},${pad + h - ((d.thetaOut - minY) / rY) * h}`
  ).join(' ');

  return (
    <>
      <polyline points={pts} fill="none" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1={pad} y1={pad + h} x2={pad + w} y2={pad + h} stroke="var(--color-text-muted)" strokeWidth="0.5" opacity="0.3" />
      <line x1={pad} y1={pad} x2={pad} y2={pad + h} stroke="var(--color-text-muted)" strokeWidth="0.5" opacity="0.3" />
    </>
  );
}
