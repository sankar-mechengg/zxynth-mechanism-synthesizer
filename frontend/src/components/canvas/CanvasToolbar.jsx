import { Pencil, MousePointer2, CircleDot, Trash2, Undo2, Grid3X3, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '../common/Tooltip';

/**
 * Canvas toolbar — horizontal tool selector bar.
 *
 * @param {object} props
 * @param {'freehand' | 'point' | 'select'} props.activeTool - Currently active tool
 * @param {function} props.onToolChange - Called with tool id
 * @param {function} props.onClear - Clear all points
 * @param {function} props.onUndo - Undo last action
 * @param {boolean} props.snapEnabled - Grid snap state
 * @param {function} props.onToggleSnap - Toggle snap
 * @param {function} props.onZoomIn - Zoom in
 * @param {function} props.onZoomOut - Zoom out
 * @param {function} props.onFitView - Fit content in view
 * @param {boolean} [props.canUndo=false] - Whether undo is available
 * @param {boolean} [props.canClear=false] - Whether clear is available
 * @param {number} [props.pointCount=0] - Number of path points
 * @param {string} [props.className] - Additional classes
 */

const TOOLS = [
  { id: 'freehand', icon: Pencil, label: 'Freehand Draw', tip: 'Draw a path freehand with your mouse or pen' },
  { id: 'point', icon: CircleDot, label: 'Place Points', tip: 'Click to place control points; a smooth curve is fitted through them' },
  { id: 'select', icon: MousePointer2, label: 'Select & Edit', tip: 'Drag points to reposition; double-click to delete a point' },
];

export default function CanvasToolbar({
  activeTool = 'freehand',
  onToolChange,
  onClear,
  onUndo,
  snapEnabled = false,
  onToggleSnap,
  onZoomIn,
  onZoomOut,
  onFitView,
  canUndo = false,
  canClear = false,
  pointCount = 0,
  className = '',
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1 p-1.5 rounded-lg',
        'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
        'shadow-lg',
        className
      )}
    >
      {/* Drawing tools */}
      {TOOLS.map(({ id, icon: Icon, label, tip }) => (
        <Tooltip key={id} content={tip} position="bottom">
          <button
            onClick={() => onToolChange(id)}
            className={clsx(
              'p-2 rounded-md transition-all duration-150',
              activeTool === id
                ? 'bg-blueprint-500/15 text-blueprint-400 shadow-[0_0_8px_rgba(49,112,227,0.2)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-input)]'
            )}
            title={label}
          >
            <Icon size={16} />
          </button>
        </Tooltip>
      ))}

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      {/* Grid snap toggle */}
      <Tooltip content={`Grid snap: ${snapEnabled ? 'ON' : 'OFF'}`} position="bottom">
        <button
          onClick={onToggleSnap}
          className={clsx(
            'p-2 rounded-md transition-all duration-150',
            snapEnabled
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-input)]'
          )}
          title="Toggle grid snap"
        >
          <Grid3X3 size={16} />
        </button>
      </Tooltip>

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      {/* Zoom controls */}
      <Tooltip content="Zoom in" position="bottom">
        <button onClick={onZoomIn} className="btn-ghost p-2 rounded-md">
          <ZoomIn size={16} />
        </button>
      </Tooltip>
      <Tooltip content="Zoom out" position="bottom">
        <button onClick={onZoomOut} className="btn-ghost p-2 rounded-md">
          <ZoomOut size={16} />
        </button>
      </Tooltip>
      <Tooltip content="Fit to content" position="bottom">
        <button onClick={onFitView} className="btn-ghost p-2 rounded-md">
          <Maximize2 size={16} />
        </button>
      </Tooltip>

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      {/* Undo */}
      <Tooltip content="Undo last action" position="bottom">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={clsx(
            'p-2 rounded-md transition-colors',
            canUndo
              ? 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-input)]'
              : 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
          )}
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
      </Tooltip>

      {/* Clear all */}
      <Tooltip content="Clear all points" position="bottom">
        <button
          onClick={onClear}
          disabled={!canClear}
          className={clsx(
            'p-2 rounded-md transition-colors',
            canClear
              ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10'
              : 'text-[var(--color-text-muted)] opacity-30 cursor-not-allowed'
          )}
          title="Clear all"
        >
          <Trash2 size={16} />
        </button>
      </Tooltip>

      {/* Point count badge */}
      {pointCount > 0 && (
        <div className="ml-1 px-2 py-0.5 rounded-md bg-[var(--color-bg-input)] text-2xs mono text-[var(--color-text-muted)]">
          {pointCount} pts
        </div>
      )}
    </div>
  );
}
