import { Shield, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { formatAngle, formatGrashofType, formatNum } from '../../utils/formatUtils';

/**
 * Performance summary panel — Grashof, transmission angle, defect checks.
 *
 * @param {object} props
 * @param {string|null} props.grashofType - Grashof classification
 * @param {object|null} props.transmissionAngle - { min, max }
 * @param {object|null} props.defects - { branch: bool, order: bool, details: string[] }
 * @param {number} [props.grashofMargin] - s+l-(p+q) margin
 * @param {string} [props.className]
 */
export default function PerformanceSummary({
  grashofType,
  transmissionAngle,
  defects,
  grashofMargin,
  className = '',
}) {
  const checks = buildChecks(grashofType, transmissionAngle, defects, grashofMargin);

  return (
    <div className={clsx('card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-blue-400" />
        <h3 className="text-sm font-semibold">Performance & Feasibility</h3>
      </div>

      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={clsx(
              'flex items-start gap-3 p-3 rounded-md border',
              check.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/15' :
              check.status === 'warn' ? 'bg-amber-500/5 border-amber-500/15' :
              check.status === 'fail' ? 'bg-red-500/5 border-red-500/15' :
              'bg-[var(--color-bg-input)] border-[var(--color-border-subtle)]'
            )}
          >
            {/* Status icon */}
            <div className="mt-0.5 flex-shrink-0">
              {check.status === 'pass' && <CheckCircle2 size={16} className="text-emerald-400" />}
              {check.status === 'warn' && <AlertTriangle size={16} className="text-amber-400" />}
              {check.status === 'fail' && <XCircle size={16} className="text-red-400" />}
              {check.status === 'unknown' && <Shield size={16} className="text-[var(--color-text-muted)]" />}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className={clsx(
                  'text-sm font-medium',
                  check.status === 'pass' ? 'text-emerald-400' :
                  check.status === 'warn' ? 'text-amber-400' :
                  check.status === 'fail' ? 'text-red-400' :
                  'text-[var(--color-text-secondary)]'
                )}>
                  {check.title}
                </p>
                {check.badge && (
                  <span className="text-2xs mono text-[var(--color-text-muted)] bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded">
                    {check.badge}
                  </span>
                )}
              </div>
              <p className="text-2xs text-[var(--color-text-muted)] leading-relaxed">
                {check.description}
              </p>
              {check.details && (
                <p className="text-2xs text-[var(--color-text-muted)] mt-1 mono">
                  {check.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildChecks(grashofType, transmissionAngle, defects, grashofMargin) {
  const checks = [];

  // Grashof check
  const isGrashof = grashofType && grashofType !== 'non-grashof';
  checks.push({
    id: 'grashof',
    title: 'Grashof Condition',
    status: grashofType ? (isGrashof ? 'pass' : 'warn') : 'unknown',
    badge: grashofType ? formatGrashofType(grashofType) : null,
    description: isGrashof
      ? 'The shortest link can make full 360° rotations. Continuous crank input is possible.'
      : grashofType === 'non-grashof'
      ? 'No link can make full rotations. The mechanism oscillates — a rotary motor cannot drive it continuously.'
      : 'Grashof condition not evaluated.',
    details: grashofMargin != null ? `Margin: s+l−(p+q) = ${formatNum(grashofMargin, 2)}` : null,
  });

  // Transmission angle check
  if (transmissionAngle) {
    const minOk = transmissionAngle.min >= 40;
    const marginalOk = transmissionAngle.min >= 30;
    checks.push({
      id: 'transmission',
      title: 'Transmission Angle',
      status: minOk ? 'pass' : marginalOk ? 'warn' : 'fail',
      badge: `${formatAngle(transmissionAngle.min)} – ${formatAngle(transmissionAngle.max)}`,
      description: minOk
        ? 'Minimum transmission angle is above 40° — good force transmission throughout the cycle.'
        : marginalOk
        ? 'Minimum transmission angle is between 30°–40° — marginal force transmission. May cause jerky motion.'
        : 'Minimum transmission angle is below 30° — poor force transmission. The mechanism may jam or require excessive input torque.',
    });
  }

  // Branch defect check
  if (defects) {
    checks.push({
      id: 'branch',
      title: 'Branch Defect',
      status: defects.branch ? 'fail' : 'pass',
      description: defects.branch
        ? 'The mechanism changes assembly mode during operation — it would physically lock or jump.'
        : 'No branch defects detected. The mechanism stays in a single assembly mode.',
    });

    checks.push({
      id: 'order',
      title: 'Order Defect',
      status: defects.order ? 'warn' : 'pass',
      description: defects.order
        ? 'Precision points are reached in the wrong sequence. The path direction may be reversed.'
        : 'Precision points are reached in the correct order.',
    });
  }

  // Crank rotation check
  if (isGrashof && transmissionAngle) {
    checks.push({
      id: 'rotation',
      title: 'Full Crank Rotation',
      status: 'pass',
      description: 'The input crank can complete full 360° revolutions without locking. Compatible with continuous rotary motor input.',
    });
  }

  return checks;
}
