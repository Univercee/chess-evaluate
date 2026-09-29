import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GameReview } from '../review/useGameReview';
import { MoveClass } from '../review/classify';
import { MOVE_CLASS_META, MOVE_CLASS_ORDER, MoveClassBadge } from './MoveClassBadge';
import { t } from '../i18n';

interface GameReviewPanelProps {
  review: GameReview;
  /** Whether the review was started; it doesn't run by default */
  isRequested: boolean;
  onRequestChange: (requested: boolean) => void;
  /** Current game move index (number of game moves played on the board) */
  currentMoveIndex: number;
  /** Go to the position after the given game move (1-based ply) */
  onJump: (ply: number) => void;
  className?: string;
}

/**
 * Review summary: analysis progress, then counts of each move class per side.
 * Clicking a count jumps to that side's next move of that class (wrapping around).
 */
export function GameReviewPanel({
  review,
  isRequested,
  onRequestChange,
  currentMoveIndex,
  onJump,
  className = '',
}: GameReviewPanelProps) {
  // Expanded by default; not persisted, so every page and game load starts expanded
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Plies (1-based) per class and side; White plays odd plies
  const plies: Record<MoveClass, { w: number[]; b: number[] }> = Object.fromEntries(
    MOVE_CLASS_ORDER.map((c) => [c, { w: [], b: [] }])
  ) as any;
  review.classes.forEach((moveClass, i) => {
    if (moveClass) plies[moveClass][i % 2 === 0 ? 'w' : 'b'].push(i + 1);
  });

  const jumpToNext = (list: number[]) => {
    const next = list.find((ply) => ply > currentMoveIndex) ?? list[0];
    if (next !== undefined) onJump(next);
  };

  const progress = review.total ? Math.round((review.evaluated / review.total) * 100) : 0;

  const countButton = (list: number[], moveClass: MoveClass) => (
    <button
      onClick={() => jumpToNext(list)}
      disabled={list.length === 0}
      className="w-10 text-center rounded font-mono tabular-nums transition-colors enabled:hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-default"
      style={list.length ? { color: MOVE_CLASS_META[moveClass].color } : undefined}
    >
      {list.length}
    </button>
  );

  return (
    <div className={`bg-gray-800 rounded-lg p-3 ${className}`}>
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${isCollapsed ? '' : 'mb-2'}`}>
        <h2 className="flex-1 min-w-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            className="w-full flex items-center gap-1 text-left hover:text-white transition-colors"
          >
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
            <span className="truncate">{t('review.title')}</span>
          </button>
        </h2>
        {review.isRunning && <span className="shrink-0 font-mono">{progress}%</span>}
        {review.error && <span className="shrink-0 text-red-400">{t('review.failed')}</span>}
      </div>

      {!isCollapsed && !isRequested && (
        <>
          <p className="text-xs text-gray-400 mb-2">{t('review.hint')}</p>
          <button
            onClick={() => onRequestChange(true)}
            className="w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded-md font-medium transition-colors"
          >
            {t('review.start')}
          </button>
        </>
      )}

      {!isCollapsed && isRequested && (
        <>
          {review.isRunning && (
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('review.analyzing')}
              >
                <div className="h-full bg-green-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <button
                onClick={() => onRequestChange(false)}
                className="shrink-0 px-2 py-0.5 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                {t('review.stop')}
              </button>
            </div>
          )}

          <div className="bg-gray-900 rounded-md py-1 text-sm">
            <div className="flex items-center gap-2 px-2 pb-1 text-xs text-gray-500">
              <span className="flex-1" />
              <span className="w-10 text-center">{t('player.white')}</span>
              <span className="w-10 text-center">{t('player.black')}</span>
            </div>
            {MOVE_CLASS_ORDER.map((moveClass) => (
              <div key={moveClass} className="flex items-center gap-2 px-2 h-6">
                <MoveClassBadge moveClass={moveClass} size={16} />
                <span className="flex-1 min-w-0 truncate text-gray-200">{t(MOVE_CLASS_META[moveClass].label)}</span>
                {countButton(plies[moveClass].w, moveClass)}
                {countButton(plies[moveClass].b, moveClass)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
