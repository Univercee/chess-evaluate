import { CSSProperties, useState } from 'react';
import { Chess } from 'chess.js';
import { ChevronDown, Cpu, MoveUpRight } from 'lucide-react';
import { ENGINES } from '../engines';
import { StockfishAnalysis, StockfishScore } from '../hooks/useStockfish';
import { t } from '../i18n';
import { usePersistentState } from '../hooks/usePersistentState';

interface PrincipalVariationsProps {
  analysis: StockfishAnalysis;
  /** Position currently shown on the board */
  fen: string;
  /** Number of lines to reserve space for */
  count?: number;
  /** Result message of a finished game: shown instead of lines, as there is nothing to analyze */
  gameOver?: string | null;
  /** Whether the best move arrow is shown on the board */
  showArrow: boolean;
  onShowArrowChange: (show: boolean) => void;
  /** Selected engine (see src/engines.ts) */
  engineId: string;
  onEngineChange: (engineId: string) => void;
  isEngineLoading: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Maximum number of moves shown per line */
const MAX_LINE_MOVES = 12;

/**
 * Convert a UCI line to SAN with move numbers, e.g. "1. e4 e5 2. Nf3"
 */
function formatLine(fen: string, uciMoves: string[]): string {
  const chess = new Chess(fen);
  const parts: string[] = [];

  for (const uci of uciMoves.slice(0, MAX_LINE_MOVES)) {
    const moveNumber = chess.moveNumber();
    const isWhite = chess.turn() === 'w';
    let san: string;
    try {
      san = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
    } catch {
      break;
    }

    if (isWhite) parts.push(`${moveNumber}. ${san}`);
    else parts.push(parts.length === 0 ? `${moveNumber}... ${san}` : san);
  }

  return parts.join(' ');
}

/**
 * Format a score from White's perspective: "+0.35", "-1.20", "M3", "-M2"
 */
function formatScore(score: StockfishScore, sideToMove: string): string {
  const value = sideToMove === 'w' ? score.value : -score.value;
  if (score.type === 'mate') return `${value < 0 ? '-' : ''}M${Math.abs(value)}`;
  const pawns = value / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`;
}

/**
 * List of the engine's top lines (principal variations)
 */
export function PrincipalVariations({
  analysis,
  fen,
  count = 3,
  gameOver,
  showArrow,
  onShowArrowChange,
  engineId,
  onEngineChange,
  isEngineLoading,
  className = '',
  style,
}: PrincipalVariationsProps) {
  // Lines from a previous position are meaningless for the current board
  const isCurrent = analysis.fen === fen;
  const lines = isCurrent ? analysis.lines : [];
  const sideToMove = fen.split(' ')[1];
  // Expanded line ranks; kept while lines update so an opened line stays open
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [isCollapsed, setIsCollapsed] = usePersistentState('bestLinesCollapsed', false);

  const toggle = (rank: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank);
      else next.add(rank);
      return next;
    });

  return (
    <div className={`bg-gray-800 rounded-lg p-3 ${className}`} style={style}>
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${isCollapsed ? '' : 'mb-2'}`}>
        {/* Title collapses/expands the lines; the engine keeps running for the eval bar */}
        <h2 className="flex-1 min-w-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            className="w-full flex items-center gap-1 text-left hover:text-white transition-colors"
          >
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
            <span className="truncate">{t('analysis.bestLines')}</span>
          </button>
        </h2>
        <span className="shrink-0 flex items-center gap-2">
          {!gameOver && (analysis.isThinking || !isCurrent) && (
            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400" />
          )}
          {!gameOver && isCurrent && analysis.depth > 0 && `${t('analysis.depth')} ${analysis.depth}`}
        </span>
        {/* Best move arrow switch */}
        <button
          role="switch"
          aria-checked={showArrow}
          onClick={() => onShowArrowChange(!showArrow)}
          title={t('analysis.showArrow')}
          aria-label={t('analysis.showArrow')}
          className="shrink-0 flex items-center gap-1 group"
        >
          <MoveUpRight className={`w-4 h-4 transition-colors ${showArrow ? 'text-green-400' : 'text-gray-500'}`} />
          <span
            className={`relative w-8 h-4 rounded-full transition-colors ${
              showArrow ? 'bg-green-600' : 'bg-gray-600 group-hover:bg-gray-500'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                showArrow ? 'translate-x-4' : ''
              }`}
            />
          </span>
        </button>
      </div>

      {/* Same height as the three line rows (3 × 36px + 2 × 6px gaps), so the layout doesn't jump */}
      {gameOver && !isCollapsed && (
        <div className="h-[120px] flex items-center justify-center bg-gray-900 rounded-md px-3 text-center text-gray-200 font-medium">
          {gameOver}
        </div>
      )}

      <div className={isCollapsed || gameOver ? 'hidden' : 'space-y-1.5'}>
        {Array.from({ length: count }, (_, i) => {
          const line = lines[i];
          const whiteScore = line && (sideToMove === 'w' ? line.score.value : -line.score.value);

          const isExpanded = expanded.has(i);

          // Collapsed rows have a fixed one-line height, so engine updates don't shift the layout
          return (
            <div
              key={i}
              className={`flex gap-2 bg-gray-900 rounded-md px-2 ${isExpanded ? 'items-start py-2' : 'items-center h-9'}`}
            >
              {line ? (
                <>
                  <span
                    className={`shrink-0 w-14 text-center rounded px-1 text-sm font-mono font-bold border ${
                      whiteScore >= 0
                        ? 'bg-gray-100 text-gray-900 border-gray-100'
                        : 'bg-gray-950 text-gray-100 border-gray-600'
                    }`}
                  >
                    {formatScore(line.score, sideToMove)}
                  </span>
                  <span
                    className={`flex-1 min-w-0 text-sm text-gray-200 leading-snug ${
                      isExpanded ? 'break-words' : 'truncate'
                    }`}
                  >
                    {formatLine(fen, line.moves)}
                  </span>
                  <button
                    onClick={() => toggle(i)}
                    title={t(isExpanded ? 'analysis.collapse' : 'analysis.expand')}
                    aria-label={t(isExpanded ? 'analysis.collapse' : 'analysis.expand')}
                    aria-expanded={isExpanded}
                    className="shrink-0 p-0.5 rounded text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">…</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Engine in use, with a picker; switching restarts analysis (and a running review) */}
      {!isCollapsed && (
        <label className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="shrink-0">{t('analysis.engine')}</span>
          <select
            value={engineId}
            onChange={(e) => onEngineChange(e.target.value)}
            className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {ENGINES.map((engine) => (
              <option key={engine.id} value={engine.id}>
                {engine.name}
              </option>
            ))}
          </select>
          {isEngineLoading && (
            <span
              className="shrink-0 animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"
              title={t('analysis.engineLoading')}
              aria-label={t('analysis.engineLoading')}
            />
          )}
        </label>
      )}
    </div>
  );
}
