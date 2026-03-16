import { Sun, Moon } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

/**
 * Animated theme toggle button.
 * Can be used standalone (not just in Navbar) — e.g., in settings panels.
 *
 * @param {object} props
 * @param {string} [props.size='md'] - 'sm' | 'md' | 'lg'
 * @param {string} [props.className] - Additional classes
 */
export default function ThemeToggle({ size = 'md', className = '' }) {
  const { theme, toggleTheme } = useAppStore();
  const isDark = theme === 'dark';

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative btn-ghost rounded-md transition-all duration-300
        ${size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2'}
        ${className}
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        <Sun
          size={iconSize}
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon
          size={iconSize}
          className={`transition-all duration-300 ${
            isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
      </div>
    </button>
  );
}
