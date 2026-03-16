import { useState, useRef } from 'react';
import clsx from 'clsx';

/**
 * Hover tooltip with educational hint text.
 *
 * @param {object} props
 * @param {string} props.content - Tooltip text
 * @param {React.ReactNode} props.children - Trigger element
 * @param {'top' | 'bottom' | 'left' | 'right'} [props.position='top'] - Tooltip position
 * @param {number} [props.maxWidth=250] - Max width in pixels
 * @param {string} [props.className] - Additional classes on wrapper
 */
export default function Tooltip({
  content,
  children,
  position = 'top',
  maxWidth = 250,
  className = '',
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--color-bg-elevated)] border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--color-bg-elevated)] border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--color-bg-elevated)] border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--color-bg-elevated)] border-y-transparent border-l-transparent',
  };

  return (
    <div
      className={clsx('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && content && (
        <div
          className={clsx(
            'absolute z-[100] pointer-events-none animate-fade-in',
            positionClasses[position]
          )}
        >
          <div
            className="relative px-3 py-2 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-lg"
            style={{ maxWidth }}
          >
            <p className="text-2xs text-[var(--color-text-secondary)] leading-relaxed">
              {content}
            </p>
            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-[5px]',
                arrowClasses[position]
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
