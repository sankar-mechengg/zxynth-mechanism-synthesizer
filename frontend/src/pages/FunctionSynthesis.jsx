import { useEffect, useMemo } from 'react';
import useAppStore from '../stores/useAppStore';
import useFunctionStore from '../stores/useFunctionStore';
import useSynthesisStore from '../stores/useSynthesisStore';
import PageContainer from '../components/layout/PageContainer';
import FunctionInputPanel from '../components/input/FunctionInputPanel';
import SynthesisPage from '../components/synthesis/SynthesisPage';

/**
 * Function Generation synthesis page.
 * Layout: Function preview chart (left 55%) + Input/Synthesis panel (right 45%)
 */
export default function FunctionSynthesis() {
  const { setActiveProblemType } = useAppStore();
  const store = useFunctionStore();

  useEffect(() => {
    setActiveProblemType('function');
  }, [setActiveProblemType]);

  const hasInput = useMemo(() => {
    if (store.inputMode === 'expression') return store.expressionValid && store.sampledPairs.length >= 2;
    if (store.inputMode === 'csv') return store.sampledPairs.length >= 2;
    if (store.inputMode === 'discrete') return store.discretePairs.length >= 2;
    return false;
  }, [store.inputMode, store.expressionValid, store.sampledPairs.length, store.discretePairs.length]);

  // Get the active pairs for the chart
  const chartPairs = useMemo(() => {
    if (store.inputMode === 'discrete') {
      return store.discretePairs.map((p) => ({ thetaIn: p.thetaIn, thetaOut: p.thetaOut }));
    }
    return store.sampledPairs;
  }, [store.inputMode, store.discretePairs, store.sampledPairs]);

  return (
    <PageContainer fullWidth noPadding grid={false}>
      <div className="flex h-[calc(100vh-3.5rem-5rem)]">
        {/* Left: Function Preview Chart */}
        <div className="flex-1 min-w-0 p-3 border-r border-[var(--color-border-subtle)]">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Function Preview: θ_out = f(θ_in)
              </h2>
              {chartPairs.length > 0 && (
                <span className="text-2xs mono text-[var(--color-text-muted)]">
                  {chartPairs.length} points · {store.inputMode}
                </span>
              )}
            </div>

            {/* Chart area */}
            <div className="flex-1 min-h-0 bg-blueprint rounded-lg border border-[var(--color-border-subtle)] flex items-center justify-center overflow-hidden">
              {chartPairs.length >= 2 ? (
                <FunctionChart pairs={chartPairs} />
              ) : (
                <div className="text-center">
                  <p className="text-[var(--color-text-muted)] text-sm mb-1">
                    No function data yet
                  </p>
                  <p className="text-2xs text-[var(--color-text-muted)]">
                    Enter an expression, upload CSV, or add precision pairs
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Input + Synthesis Panel */}
        <div className="w-[440px] flex-shrink-0 overflow-y-auto">
          <div className="p-4">
            <SynthesisPage
              problemType="function"
              mechanismType={store.mechanismType}
              buildRequest={store.buildRequest}
              hasInput={hasInput}
              inputContent={<FunctionInputPanel />}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

/**
 * SVG-based function chart with axes, gridlines, and data curve.
 */
function FunctionChart({ pairs }) {
  if (pairs.length < 2) return null;

  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const width = 600;
  const height = 400;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const tIns = pairs.map((p) => p.thetaIn);
  const tOuts = pairs.map((p) => p.thetaOut);
  const minX = Math.min(...tIns), maxX = Math.max(...tIns);
  const minY = Math.min(...tOuts), maxY = Math.max(...tOuts);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const padY = rangeY * 0.1;

  const scaleX = (v) => margin.left + ((v - minX) / rangeX) * innerW;
  const scaleY = (v) => margin.top + innerH - ((v - (minY - padY)) / (rangeY + 2 * padY)) * innerH;

  // Polyline points
  const polyStr = pairs.map((p) => `${scaleX(p.thetaIn)},${scaleY(p.thetaOut)}`).join(' ');

  // Generate tick values
  const xTicks = generateTicks(minX, maxX, 6);
  const yTicks = generateTicks(minY - padY, maxY + padY, 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-[600px] max-h-[400px]">
      {/* Grid lines */}
      {xTicks.map((t, i) => (
        <line key={`gx${i}`} x1={scaleX(t)} y1={margin.top} x2={scaleX(t)} y2={margin.top + innerH}
          stroke="var(--grid-minor)" strokeWidth="1" />
      ))}
      {yTicks.map((t, i) => (
        <line key={`gy${i}`} x1={margin.left} y1={scaleY(t)} x2={margin.left + innerW} y2={scaleY(t)}
          stroke="var(--grid-minor)" strokeWidth="1" />
      ))}

      {/* Axes */}
      <line x1={margin.left} y1={margin.top + innerH} x2={margin.left + innerW} y2={margin.top + innerH}
        stroke="var(--color-border)" strokeWidth="1" />
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH}
        stroke="var(--color-border)" strokeWidth="1" />

      {/* X-axis ticks + labels */}
      {xTicks.map((t, i) => (
        <text key={`xt${i}`} x={scaleX(t)} y={margin.top + innerH + 18}
          textAnchor="middle" fontSize="10" fill="var(--color-text-muted)" fontFamily="JetBrains Mono, monospace">
          {t.toFixed(0)}°
        </text>
      ))}

      {/* Y-axis ticks + labels */}
      {yTicks.map((t, i) => (
        <text key={`yt${i}`} x={margin.left - 8} y={scaleY(t) + 3}
          textAnchor="end" fontSize="10" fill="var(--color-text-muted)" fontFamily="JetBrains Mono, monospace">
          {t.toFixed(0)}°
        </text>
      ))}

      {/* Axis labels */}
      <text x={margin.left + innerW / 2} y={height - 8} textAnchor="middle"
        fontSize="12" fill="var(--color-text-secondary)" fontFamily="Inter, sans-serif">
        θ_input (°)
      </text>
      <text x={14} y={margin.top + innerH / 2} textAnchor="middle"
        fontSize="12" fill="var(--color-text-secondary)" fontFamily="Inter, sans-serif"
        transform={`rotate(-90 14 ${margin.top + innerH / 2})`}>
        θ_output (°)
      </text>

      {/* Data curve */}
      <polyline points={polyStr} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Point markers for discrete pairs (if few points) */}
      {pairs.length <= 20 && pairs.map((p, i) => (
        <circle key={i} cx={scaleX(p.thetaIn)} cy={scaleY(p.thetaOut)} r="3.5"
          fill="#f59e0b" stroke="var(--color-bg-primary)" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function generateTicks(min, max, count) {
  const range = max - min;
  if (range === 0) return [min];
  const step = niceStep(range / count);
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max; v += step) {
    ticks.push(v);
  }
  return ticks;
}

function niceStep(rough) {
  const exp = Math.floor(Math.log10(rough));
  const frac = rough / Math.pow(10, exp);
  let nice;
  if (frac <= 1.5) nice = 1;
  else if (frac <= 3) nice = 2;
  else if (frac <= 7) nice = 5;
  else nice = 10;
  return nice * Math.pow(10, exp);
}
