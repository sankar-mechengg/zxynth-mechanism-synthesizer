import { useState } from 'react';
import { RotateCcw, Play, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import useSynthesisStore from '../../stores/useSynthesisStore';
import { formatNum, formatAngle, formatGrashofType } from '../../utils/formatUtils';
import axios from 'axios';
import { API } from '../../config/api';

/**
 * Kinematic inversion panel.
 * Allows user to select which link to fix as ground, triggering re-synthesis.
 *
 * @param {object} props
 * @param {string} [props.mechanismType='four_bar'] - Current mechanism type
 * @param {string} [props.className]
 */

const LINK_OPTIONS = {
  four_bar: [
    { index: 0, label: 'Link 1 (Ground)', desc: 'Original configuration' },
    { index: 1, label: 'Link 2 (Crank)', desc: 'Fix the input crank as ground' },
    { index: 2, label: 'Link 3 (Coupler)', desc: 'Fix the coupler as ground' },
    { index: 3, label: 'Link 4 (Rocker)', desc: 'Fix the output rocker as ground' },
  ],
  slider_crank: [
    { index: 0, label: 'Link 1 (Ground)', desc: 'Original configuration' },
    { index: 1, label: 'Link 2 (Crank)', desc: 'Fix crank → oscillating slider' },
    { index: 2, label: 'Link 3 (Connecting Rod)', desc: 'Fix connecting rod' },
    { index: 3, label: 'Link 4 (Slider)', desc: 'Fix slider → oscillating crank' },
  ],
  six_bar_watt: [
    { index: 0, label: 'Link 1 (Ground)', desc: 'Original configuration' },
    { index: 1, label: 'Link 2', desc: 'Fix link 2 as ground' },
    { index: 2, label: 'Link 3', desc: 'Fix link 3 as ground' },
    { index: 3, label: 'Link 4', desc: 'Fix link 4 as ground' },
  ],
  six_bar_stephenson: [
    { index: 0, label: 'Link 1 (Ground)', desc: 'Original configuration' },
    { index: 1, label: 'Link 2', desc: 'Fix link 2 as ground' },
    { index: 2, label: 'Link 3', desc: 'Fix link 3 as ground' },
    { index: 3, label: 'Link 4', desc: 'Fix link 4 as ground' },
  ],
};

export default function InversionPanel({ mechanismType = 'four_bar', className = '' }) {
  const {
    activeInversion,
    setActiveInversion,
    inversions,
    addInversionResult,
    mechanism,
    jobId,
  } = useSynthesisStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const options = LINK_OPTIONS[mechanismType] || LINK_OPTIONS.four_bar;

  const handleInversionChange = async (linkIndex) => {
    setActiveInversion(linkIndex);

    // Original configuration (index 0) — no re-synthesis needed
    if (linkIndex === 0) return;

    // Check if already computed
    if (inversions[linkIndex]) return;

    // Request inversion from backend
    if (!mechanism || !jobId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API.base}/inversion`, {
        jobId,
        fixedLinkIndex: linkIndex,
        mechanism,
      });
      addInversionResult(linkIndex, response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to compute inversion');
    } finally {
      setLoading(false);
    }
  };

  const activeResult = activeInversion === 0 ? null : inversions[activeInversion];

  return (
    <div className={clsx('card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <RotateCcw size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold">Kinematic Inversion</h3>
      </div>

      <p className="text-2xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
        Fixing a different link as ground creates a new mechanism from the same kinematic chain.
        Each inversion has different motion characteristics while maintaining the same DOF.
      </p>

      {/* Link selector */}
      <div className="space-y-1.5 mb-3">
        {options.map((opt) => {
          const isActive = activeInversion === opt.index;
          const hasResult = opt.index === 0 || !!inversions[opt.index];

          return (
            <button
              key={opt.index}
              onClick={() => handleInversionChange(opt.index)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all border',
                isActive
                  ? 'border-amber-400/50 bg-amber-500/5'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-text-muted)]'
              )}
            >
              <div className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border-2',
                isActive ? 'border-amber-400 text-amber-400' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
              )}>
                {opt.index}
              </div>
              <div className="flex-1">
                <p className={clsx('text-xs font-medium', isActive && 'text-amber-400')}>
                  {opt.label}
                </p>
                <p className="text-2xs text-[var(--color-text-muted)]">{opt.desc}</p>
              </div>
              {loading && isActive && opt.index !== 0 && !hasResult && (
                <Loader2 size={14} className="text-amber-400 animate-spin" />
              )}
              {hasResult && opt.index !== 0 && (
                <span className="text-2xs text-emerald-400">computed</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-3">
          {error}
        </div>
      )}

      {/* Active inversion result */}
      {activeResult && (
        <div className="bg-[var(--color-bg-primary)] rounded-md p-3 border border-[var(--color-border-subtle)]">
          <p className="label mb-2">Inversion Result (Fixed: Link {activeInversion})</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {activeResult.mechanism && (
              <>
                {['a1', 'a2', 'a3', 'a4'].map((key, i) => (
                  activeResult.mechanism[key] != null && (
                    <div key={key} className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">a{i + 1}:</span>
                      <span className="mono">{formatNum(activeResult.mechanism[key], 2)}</span>
                    </div>
                  )
                ))}
              </>
            )}
            {activeResult.grashofType && (
              <div className="col-span-2 flex justify-between mt-1 pt-1 border-t border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Grashof:</span>
                <span className="mono">{formatGrashofType(activeResult.grashofType)}</span>
              </div>
            )}
            {activeResult.transmissionAngle && (
              <div className="col-span-2 flex justify-between">
                <span className="text-[var(--color-text-muted)]">Trans. angle:</span>
                <span className="mono">
                  {formatAngle(activeResult.transmissionAngle.min)} – {formatAngle(activeResult.transmissionAngle.max)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
