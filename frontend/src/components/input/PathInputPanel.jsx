import { useState } from 'react';
import { Upload, PenTool } from 'lucide-react';
import clsx from 'clsx';
import usePathStore from '../../stores/usePathStore';
import useFileUpload from '../../hooks/useFileUpload';
import FileUploader from '../common/FileUploader';
import MechanismTypeSelector from './MechanismTypeSelector';
import AlgorithmSelector from './AlgorithmSelector';
import ConstraintPanel from './ConstraintPanel';
import TimingInputPanel from './TimingInputPanel';
import ErrorBanner from '../common/ErrorBanner';

/**
 * Complete input panel for path generation.
 * Handles SVG/CSV upload, links to canvas for freehand/point drawing,
 * and all mechanism/algorithm/constraint configuration.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function PathInputPanel({ className = '' }) {
  const store = usePathStore();
  const { processFile, error: uploadError, reset: resetUpload } = useFileUpload({ mode: 'path' });
  const [inputTab, setInputTab] = useState('upload'); // 'upload' | 'draw'

  const handleFileAccepted = async (fileData) => {
    try {
      const result = await processFile(fileData);
      store.setFromUpload(
        result.points,
        fileData.type === 'svg' ? 'upload_svg' : 'upload_csv',
        result.fileName,
        result.metadata
      );
    } catch {
      // Error is handled by useFileUpload
    }
  };

  return (
    <div className={clsx('flex flex-col gap-5', className)}>
      {/* Input source tabs */}
      <div>
        <label className="label mb-1.5 block">Path Input</label>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-input)]">
          <button
            onClick={() => setInputTab('upload')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all',
              inputTab === 'upload'
                ? 'bg-[var(--color-bg-elevated)] text-blueprint-400 shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            <Upload size={14} />
            Upload File
          </button>
          <button
            onClick={() => setInputTab('draw')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all',
              inputTab === 'draw'
                ? 'bg-[var(--color-bg-elevated)] text-blueprint-400 shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
          >
            <PenTool size={14} />
            Draw on Canvas
          </button>
        </div>
      </div>

      {/* File uploader */}
      {inputTab === 'upload' && (
        <div>
          <FileUploader
            onFileAccepted={handleFileAccepted}
            accept={['svg', 'csv']}
            label="Drop SVG or CSV path file"
          />
          {uploadError && (
            <ErrorBanner
              message={uploadError}
              type="error"
              onDismiss={resetUpload}
              className="mt-2"
            />
          )}
        </div>
      )}

      {/* Draw mode hint */}
      {inputTab === 'draw' && (
        <div className="card p-3 bg-blueprint-500/5 border-blueprint-500/20">
          <p className="text-sm text-blueprint-400 font-medium mb-1">Use the Canvas</p>
          <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
            Use the drawing tools on the canvas (left panel) to create your desired path.
            Select <strong>Freehand</strong> for quick sketching or <strong>Place Points</strong> for
            precise control with smooth Bézier curves.
          </p>
        </div>
      )}

      {/* Point count indicator */}
      {store.points.length > 0 && (
        <div className="flex items-center justify-between py-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs text-emerald-400">
            Path loaded: <strong className="mono">{store.points.length}</strong> points
          </span>
          {store.fileName && (
            <span className="text-2xs text-[var(--color-text-muted)] truncate max-w-[150px]">
              {store.fileName}
            </span>
          )}
        </div>
      )}

      <div className="divider" />

      {/* Timing */}
      <TimingInputPanel
        enabled={store.prescribedTiming}
        onToggle={() => store.setPrescribedTiming(!store.prescribedTiming)}
        timingMap={store.timingMap}
        onTimingMapChange={store.setTimingMap}
        totalPoints={store.points.length}
        crankRange={store.crankRange}
        onCrankRangeChange={store.setCrankRange}
      />

      <div className="divider" />

      {/* Mechanism type */}
      <MechanismTypeSelector
        value={store.mechanismType}
        onChange={store.setMechanismType}
      />

      <div className="divider" />

      {/* Algorithm */}
      <AlgorithmSelector
        algorithm={store.algorithm}
        onAlgorithmChange={store.setAlgorithm}
        hyperparams={store.hyperparams}
        onHyperparamsChange={store.setHyperparams}
      />

      <div className="divider" />

      {/* Constraints */}
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
