import { StockfishScore } from '../hooks/useStockfish';

interface EvaluationBarProps {
  score: StockfishScore | null;
  height: number;
}

/**
 * Vertical evaluation bar showing position advantage
 * Similar to chess.com and lichess.org evaluation bars
 */
export function EvaluationBar({ score, height }: EvaluationBarProps) {
  // Calculate fill percentage (50% = equal position)
  // Positive score = white advantage (bar fills from bottom)
  // Negative score = black advantage (bar fills from top)
  const getFillPercentage = () => {
    if (!score) return 50; // Equal position by default

    if (score.type === 'mate') {
      // Mate scores show as 100% or 0%
      return score.value > 0 ? 100 : 0;
    }

    // Convert centipawns to percentage
    // 100 centipawns = 1 pawn = significant advantage
    // Clamp between 10% and 90% for visual clarity
    const pawns = score.value / 100;
    const percentage = 50 + (pawns * 5); // 1 pawn = 5% shift
    return Math.max(10, Math.min(90, percentage));
  };

  // Format score text
  const getScoreText = () => {
    if (!score) return '0.0';

    if (score.type === 'mate') {
      return `M${Math.abs(score.value)}`;
    }

    const pawns = score.value / 100;
    const sign = pawns > 0 ? '+' : '';
    return `${sign}${pawns.toFixed(1)}`;
  };

  // Determine text color based on background
  const getTextColor = () => {
    if (!score) return 'text-gray-600';
    
    if (score.type === 'mate') {
      return score.value > 0 ? 'text-gray-800' : 'text-white';
    }

    return score.value >= 0 ? 'text-gray-800' : 'text-white';
  };

  const fillPercentage = getFillPercentage();
  const scoreText = getScoreText();
  const textColor = getTextColor();

  return (
    <div 
      className="relative bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700"
      style={{ width: '40px', height: `${height}px` }}
    >
      {/* Black part (top) - represents black's advantage */}
      <div 
        className="absolute top-0 left-0 right-0 bg-gray-900 transition-all duration-500 ease-out"
        style={{ height: `${100 - fillPercentage}%` }}
      />
      
      {/* White part (bottom) - represents white's advantage */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gray-100 transition-all duration-500 ease-out"
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
