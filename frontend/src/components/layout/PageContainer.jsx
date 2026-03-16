import clsx from 'clsx';

/**
 * PageContainer wraps page content with the blueprint grid background,
 * centered max-width layout, and consistent padding.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} [props.fullWidth=false] - If true, removes max-width constraint
 * @param {boolean} [props.noPadding=false] - If true, removes horizontal padding
 * @param {boolean} [props.grid=true] - If true, shows blueprint grid background
 * @param {string} [props.className] - Additional class names
 */
export default function PageContainer({
  children,
  fullWidth = false,
  noPadding = false,
  grid = true,
  className,
}) {
  return (
    <div
      className={clsx(
        'min-h-[calc(100vh-3.5rem-5rem)] w-full',
        grid && 'bg-blueprint',
        className
      )}
    >
      <div
        className={clsx(
          'mx-auto w-full',
          !fullWidth && 'max-w-[1440px]',
          !noPadding && 'px-4 py-6'
        )}
      >
        {children}
      </div>
    </div>
  );
}
