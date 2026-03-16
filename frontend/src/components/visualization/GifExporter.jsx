import { useState } from 'react';
import { Film, Download, Loader2, Settings2 } from 'lucide-react';
import clsx from 'clsx';
import useVisualizationStore from '../../stores/useVisualizationStore';
import ParameterInput from '../common/ParameterInput';

/**
 * GIF export panel with settings and progress.
 * Uses gif.js to capture SVG frames into an animated GIF.
 *
 * @param {object} props
 * @param {function} props.captureFrame - Function that returns a canvas/image for the given angle
 * @param {string} [props.className]
 */
export default function GifExporter({ captureFrame, className = '' }) {
  const { gifSettings, setGifSettings } = useVisualizationStore();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    if (!captureFrame) return;

    setExporting(true);
    setProgress(0);
    setError(null);

    try {
      // Dynamic import of gif.js
      const GIF = (await import('gif.js')).default;

      const gif = new GIF({
        workers: 2,
        quality: gifSettings.quality,
        width: gifSettings.width,
        height: gifSettings.height,
        workerScript: undefined, // Use default worker
      });

      const totalFrames = Math.ceil(
        ((gifSettings.endAngle - gifSettings.startAngle) / 360) * gifSettings.fps * 6
      ); // 6 seconds per revolution at 1x speed
      const angleStep = (gifSettings.endAngle - gifSettings.startAngle) / totalFrames;
      const frameDelay = 1000 / gifSettings.fps;

      for (let i = 0; i <= totalFrames; i++) {
        const angle = gifSettings.startAngle + i * angleStep;
        const frame = await captureFrame(angle, gifSettings.width, gifSettings.height);

        if (frame) {
          gif.addFrame(frame, { delay: frameDelay, copy: true });
        }

        setProgress(((i + 1) / (totalFrames + 1)) * 100);
      }

      // Render GIF
      const blob = await new Promise((resolve, reject) => {
        gif.on('finished', (blob) => resolve(blob));
        gif.on('error', (err) => reject(err));
        gif.render();
      });

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zxynth-mechanism.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExporting(false);
      setProgress(100);
    } catch (err) {
      setError(`GIF export failed: ${err.message}`);
      setExporting(false);
    }
  };

  return (
    <div className={clsx('card p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Film size={14} className="text-purple-400" />
          <span className="text-xs font-semibold">GIF Export</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={clsx(
            'btn-ghost p-1 rounded',
            showSettings && 'text-blueprint-400'
          )}
        >
          <Settings2 size={13} />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)]">
          <ParameterInput
            label="Width" value={gifSettings.width}
            onChange={(v) => setGifSettings({ width: v })}
            min={200} max={1920} step={100} unit="px"
          />
          <ParameterInput
            label="Height" value={gifSettings.height}
            onChange={(v) => setGifSettings({ height: v })}
            min={200} max={1080} step={100} unit="px"
          />
          <ParameterInput
            label="FPS" value={gifSettings.fps}
            onChange={(v) => setGifSettings({ fps: v })}
            min={5} max={60} step={5}
          />
          <ParameterInput
            label="Quality" value={gifSettings.quality}
            onChange={(v) => setGifSettings({ quality: v })}
            min={1} max={20} step={1}
            tooltip="1 = best quality (slow), 20 = fastest (lower quality)"
          />
          <ParameterInput
            label="Start Angle" value={gifSettings.startAngle}
            onChange={(v) => setGifSettings({ startAngle: v })}
            min={0} max={360} step={5} unit="°"
          />
          <ParameterInput
            label="End Angle" value={gifSettings.endAngle}
            onChange={(v) => setGifSettings({ endAngle: v })}
            min={0} max={720} step={5} unit="°"
          />
        </div>
      )}

      {/* Export button + progress */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={exporting || !captureFrame}
          className={clsx(
            'btn-secondary text-xs gap-1.5',
            exporting && 'opacity-60'
          )}
        >
          {exporting ? (
            <><Loader2 size={13} className="animate-spin" /> Exporting...</>
          ) : (
            <><Download size={13} /> Export GIF</>
          )}
        </button>

        {exporting && (
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-[var(--color-bg-input)] overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-2xs text-[var(--color-text-muted)] mt-0.5">
              {progress.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-2xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
