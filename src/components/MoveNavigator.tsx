import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { t } from '../i18n';
import { MoveClass } from '../review/classify';
import { MoveClassBadge } from './MoveClassBadge';

interface MoveNavigatorProps {
  moves: string[];
  currentMoveIndex: number;
  onMoveChange: (index: number) => void;
  /** User's own moves (SAN) played from the position at currentMoveIndex */
  variation?: string[];
  onVariationChange?: (variation: string[]) => void;
  /** Review classification per game move (index = ply - 1) */
  moveClasses?: (MoveClass | null)[];
  /** Shown in the list while there are no moves */
  emptyText?: string;
  className?: string;
}

/**
 * Component for navigating through moves of an imported game.
 * Supports keyboard: ←/→ previous/next, Home/End first/last.
 *
 * While a variation exists, moving forward along the game is blocked:
 * "previous" takes back the last variation move, and "first", clicking an
 * earlier game move or the close button leave the variation.
 */
export function MoveNavigator({
  moves,
  currentMoveIndex,
  onMoveChange,
  variation = [],
  onVariationChange,
  moveClasses = [],
  emptyText,
  className = '',
}: MoveNavigatorProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  // Collapsing hides the move list; the navigation buttons stay (the only way to step on touch screens)
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasVariation = variation.length > 0;
  const canGoBack = hasVariation || currentMoveIndex > 0;
  const canGoForward = !hasVariation && currentMoveIndex < moves.length;

  const goTo = (index: number) => onMoveChange(Math.max(0, Math.min(moves.length, index)));

  const goBack = () => {
    if (hasVariation) onVariationChange?.(variation.slice(0, -1));
    else if (currentMoveIndex > 0) goTo(currentMoveIndex - 1);
  };

  const goForward = () => {
    if (canGoForward) goTo(currentMoveIndex + 1);
  };

  const goToLast = () => {
    if (canGoForward) goTo(moves.length);
  };

  // Keyboard navigation (ignored while typing in form fields)
  const keyActions = useRef<Record<string, () => void>>({});
  keyActions.current = {
    ArrowLeft: goBack,
    ArrowRight: goForward,
    Home: () => goTo(0),
    End: goToLast,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;

      const action = keyActions.current[e.key];
      if (!action) return;

      e.preventDefault();
      action();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep the current move visible inside the list without scrolling the page
  useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    if (!list) return;
    if (!active) {
      list.scrollTop = 0;
      return;
    }
    // The list is the nearest positioned ancestor, so offsetTop is already relative to it
    const top = active.offsetTop;
    if (top < list.scrollTop) list.scrollTop = top - 4;
    else if (top + active.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + active.offsetHeight - list.clientHeight + 4;
    }
  }, [currentMoveIndex, variation.length, isCollapsed]);

  // Group moves in pairs: [white, black]
  const rows = Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => [moves[2 * i], moves[2 * i + 1]]);

  const renderMove = (move: string | undefined, index: number) => {
    if (!move) return <span />;
    const isCurrent = index + 1 === currentMoveIndex;
    // With a variation, later game moves are unreachable until the variation is left
    const isLocked = hasVariation && index + 1 > currentMoveIndex;
    const moveClass = moveClasses[index];
    return (
      <button
        ref={isCurrent && !hasVariation ? activeRef : undefined}
        onClick={() => goTo(index + 1)}
        disabled={isLocked}
        className={`flex items-center justify-between gap-1 text-left px-2 py-0.5 rounded font-medium transition-colors disabled:text-gray-600 disabled:cursor-not-allowed ${
          isCurrent
            ? hasVariation
              ? 'bg-amber-600/30 text-amber-200'
              : 'bg-amber-600 text-white'
            : 'text-gray-200 enabled:hover:bg-gray-700'
        }`}
      >
        <span className="truncate">{move}</span>
        {moveClass && <MoveClassBadge moveClass={moveClass} size={14} className={isLocked ? 'opacity-40' : ''} />}
      </button>
    );
  };

  // User's moves shown under the current game move, numbered from that position
  const renderVariation = () => (
    <div className="mx-1 my-1 pl-2 pr-1 py-1 border-l-2 border-amber-500 bg-amber-500/10 rounded-r flex items-start gap-1">
      <div className="flex flex-wrap items-center gap-x-0.5 gap-y-0.5 flex-1 min-w-0">
        {variation.map((move, i) => {
          const ply = currentMoveIndex + i;
          const moveNumber = Math.floor(ply / 2) + 1;
          const isWhite = ply % 2 === 0;
          const prefix = isWhite ? `${moveNumber}.` : i === 0 ? `${moveNumber}...` : '';
          const isLast = i === variation.length - 1;
          return (
            <span key={i} className="flex items-center">
              {prefix && <span className="text-gray-500 font-mono text-xs mr-0.5">{prefix}</span>}
              <button
                ref={isLast ? activeRef : undefined}
                onClick={() => onVariationChange?.(variation.slice(0, i + 1))}
                className={`px-1.5 py-0.5 rounded italic transition-colors ${
                  isLast ? 'bg-amber-600 text-white' : 'text-amber-100 hover:bg-gray-700'
                }`}
              >
                {move}
              </button>
            </span>
          );
        })}
      </div>
      <button
        onClick={() => onVariationChange?.([])}
        title={t('nav.backToGame')}
        aria-label={t('nav.backToGame')}
        className="shrink-0 p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // Row after which the variation is shown (-1: before the first row, from the starting position)
  const variationRow = hasVariation ? Math.floor((currentMoveIndex - 1) / 2) : null;

  const navButton = (label: string, onClick: () => void, disabled: boolean, Icon: typeof ChevronLeft) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex-1 flex justify-center py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-gray-700 disabled:cursor-not-allowed text-white rounded-md transition-colors"
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className={`bg-gray-800 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
        <h2 className="flex-1 min-w-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            className="w-full flex items-center gap-1 text-left hover:text-white transition-colors"
          >
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
            <span className="truncate">{t('nav.moves')}</span>
          </button>
        </h2>
        <span className="shrink-0 font-mono">
          {hasVariation && <span className="text-amber-400 font-sans mr-2">{t('nav.variation')}</span>}
          {currentMoveIndex === 0 ? t('nav.start') : `${currentMoveIndex} / ${moves.length}`}
        </span>
      </div>

      {/* Score sheet: move number | White | Black */}
      <div
        ref={listRef}
        className={`relative max-h-56 overflow-y-auto bg-gray-900 rounded-md py-1 text-sm ${isCollapsed ? 'hidden' : ''}`}
      >
        {moves.length === 0 && !hasVariation && emptyText && (
          <p className="px-3 py-2 text-gray-500">{emptyText}</p>
        )}
        {variationRow === -1 && renderVariation()}
        {rows.map(([white, black], i) => (
          <div key={i}>
            <div className={`grid grid-cols-[2.5rem_1fr_1fr] items-center gap-1 px-1 ${i % 2 ? 'bg-gray-800/40' : ''}`}>
              <span className="text-gray-500 text-right pr-1 font-mono">{i + 1}.</span>
              {renderMove(white, 2 * i)}
              {renderMove(black, 2 * i + 1)}
            </div>
            {variationRow === i && renderVariation()}
          </div>
        ))}
      </div>

      <div className={`flex gap-1 ${isCollapsed ? '' : 'mt-2'}`}>
        {navButton(t('nav.first'), () => goTo(0), !canGoBack, ChevronsLeft)}
        {navButton(t('nav.prev'), goBack, !canGoBack, ChevronLeft)}
        {navButton(t('nav.next'), goForward, !canGoForward, ChevronRight)}
        {navButton(t('nav.last'), goToLast, !canGoForward, ChevronsRight)}
      </div>
    </div>
  );
}
