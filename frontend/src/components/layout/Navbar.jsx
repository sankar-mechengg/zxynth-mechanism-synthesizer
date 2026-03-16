import { Link, useLocation } from 'react-router-dom';
import { Waypoints, TrendingUp, Move3D, Sun, Moon, BookOpen } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

const NAV_ITEMS = [
  { path: '/path', label: 'Path', icon: Waypoints, description: 'Path Generation' },
  { path: '/function', label: 'Function', icon: TrendingUp, description: 'Function Generation' },
  { path: '/motion', label: 'Motion', icon: Move3D, description: 'Motion Generation' },
];

export default function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme, toggleSidebar, sidebarOpen, activeProblemType } = useAppStore();
  const isLanding = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border-subtle)] backdrop-blur-md"
      style={{ backgroundColor: theme === 'dark' ? 'rgba(10, 14, 26, 0.85)' : 'rgba(248, 250, 252, 0.85)' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {/* Inline logo mark */}
          <svg viewBox="0 0 42 48" className="w-7 h-8 flex-shrink-0" fill="none">
            <path d="M6 12 C16 12, 20 36, 36 36" stroke="#3170e3" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M36 12 C26 12, 22 36, 6 36" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="21" cy="24" r="3" fill="#f59e0b"/>
            <circle cx="6" cy="12" r="2.5" fill="#3170e3"/>
            <circle cx="36" cy="36" r="2.5" fill="#3170e3"/>
            <circle cx="36" cy="12" r="2.5" fill="#34d399"/>
            <circle cx="6" cy="36" r="2.5" fill="#34d399"/>
          </svg>
          <span className="text-lg font-bold tracking-tight group-hover:text-blueprint-400 transition-colors">
            Zxynth
          </span>
        </Link>

        {/* Center nav — problem type links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-blueprint-500/15 text-blueprint-400 glow-border'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-input)]'
                  }
                `}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right — education toggle + theme toggle */}
        <div className="flex items-center gap-1">
          {/* Education sidebar toggle — only show on synthesis pages */}
          {!isLanding && (
            <button
              onClick={toggleSidebar}
              className={`
                btn-ghost rounded-md p-2
                ${sidebarOpen ? 'text-blueprint-400 bg-blueprint-500/10' : ''}
              `}
              title="Toggle education panel"
            >
              <BookOpen size={18} />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost rounded-md p-2"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
