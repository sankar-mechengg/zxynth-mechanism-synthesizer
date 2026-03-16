import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Dismissable notification banner.
 *
 * @param {object} props
 * @param {string} props.message - Message text
 * @param {'error' | 'warning' | 'info'} [props.type='error'] - Banner type
 * @param {function} [props.onDismiss] - Called when X is clicked
 * @param {string} [props.action] - Action button label
 * @param {function} [props.onAction] - Action button callback
 * @param {string} [props.className] - Additional classes
 */
export default function ErrorBanner({
  message,
  type = 'error',
  onDismiss,
  action,
  onAction,
  className = '',
}) {
  const styles = {
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      textColor: 'text-red-300',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      textColor: 'text-amber-300',
    },
    info: {
      bg: 'bg-blueprint-500/10 border-blueprint-500/20',
      icon: Info,
      iconColor: 'text-blueprint-400',
      textColor: 'text-blueprint-300',
    },
  };

  const { bg, icon: Icon, iconColor, textColor } = styles[type] || styles.error;

  return (
    <div className={clsx('flex items-start gap-2 p-3 rounded-lg border', bg, className)}>
      <Icon size={16} className={clsx(iconColor, 'mt-0.5 flex-shrink-0')} />
      <p className={clsx('text-sm flex-1', textColor)}>{message}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className={clsx('text-xs font-medium underline flex-shrink-0', textColor)}
        >
          {action}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <X size={14} className="text-[var(--color-text-muted)]" />
        </button>
      )}
    </div>
  );
}
