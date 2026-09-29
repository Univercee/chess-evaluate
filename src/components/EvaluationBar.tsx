import { memo } from 'react';
import { Color } from 'chess.js';
import { StockfishScore } from '../hooks/useStockfish';

interface EvaluationBarProps {
  score: StockfishScore | null;
  height: number;
  currentMove: Color;
  /** Result of a finished game; replaces the engine score */
  result?: '1-0' | '0-1' | '1/2-1/2';
  /** Board seen from Black: White's part of the bar is on top */
  flipped?: boolean;
}

/**
 * Vertical evaluation bar showing position advantage
 * Similar to chess.com and lichess.org evaluation bars
 */
function EvaluationBarComponent({ score, height, currentMove, result, flipped = false }: EvaluationBarProps) {
  // Stockfish scores are relative to the side to move; normalize to White's perspective
  const whiteScore = score && {
    ...score,
    value: currentMove === 'w' ? score.value : -score.value,
  };

  // Calculate fill percentage (50% = equal position)
  // Positive score = white advantage (bar fills from bottom)
  // Negative score = black advantage (bar fills from top)
  const getFillPercentage = () => {
    if (result) return result === '1-0' ? 100 : result === '0-1' ? 0 : 50;
    if (!whiteScore) return 50; // Equal position by default

    if (whiteScore.type === 'mate') {
      // Mate scores show as 100% or 0%
      return whiteScore.value > 0 ? 100 : 0;
    }

    // Convert centipawns to percentage
    // 100 centipawns = 1 pawn = significant advantage
    // Clamp between 10% and 90% for visual clarity
    const pawns = whiteScore.value / 100;
    const percentage = 50 + (pawns * 5); // 1 pawn = 5% shift
    return Math.max(10, Math.min(90, percentage));
  };

  // Format score text
  const getScoreText = () => {
    if (result) return result === '1/2-1/2' ? '½-½' : result;
    if (!whiteScore) return '0.0';

    if (whiteScore.type === 'mate') {
      return `M${Math.abs(whiteScore.value)}`;
    }

    const pawns = whiteScore.value / 100;
    const sign = pawns > 0 ? '+' : '';
    return `${sign}${pawns.toFixed(1)}`;
  };

  // Determine text color based on background
  const getTextColor = () => {
    if (result) return result === '0-1' ? 'text-white' : 'text-gray-800';
    if (!whiteScore) return 'text-gray-600';

    return whiteScore.value >= 0 ? 'text-gray-800' : 'text-white';
  };

  const fillPercentage = getFillPercentage();
  const scoreText = getScoreText();
  const textColor = getTextColor();

  return (
    <div 
      className="relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700"
      style={{ width: '40px', height: `${height}px` }}
    >
      {/* Black part - represents black's advantage (top, or bottom when flipped) */}
      <div
        className={`absolute left-0 right-0 bg-gray-900 transition-all duration-500 ease-out ${flipped ? 'bottom-0' : 'top-0'}`}
        style={{ height: `${100 - fillPercentage}%` }}
      />

      {/* White part - represents white's advantage (bottom, or top when flipped) */}
      <div
        className={`absolute left-0 right-0 bg-gray-100 transition-all duration-500 ease-out ${flipped ? 'top-0' : 'bottom-0'}`}
        style={{ height: `${fillPercentage}%` }}
      />

      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${textColor} drop-shadow-lg`}>
          {scoreText}
        </span>
      </div>

      {/* Center line indicator */}
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-500 opacity-30" />
    </div>
  );
}

/**
 * Re-render only when the score, result or height changes. currentMove is still used, but its
 * latest value is picked up on the next score update. This prevents the bar from flipping
 * when the turn changes before the new evaluation arrives.
 */
const isSameScore = (prev: EvaluationBarProps, next: EvaluationBarProps) =>
  prev.height === next.height &&
  prev.result === next.result &&
  prev.flipped === next.flipped &&
  prev.score?.type === next.score?.type &&
  prev.score?.value === next.score?.value;

export const EvaluationBar = memo(EvaluationBarComponent, isSameScore);
