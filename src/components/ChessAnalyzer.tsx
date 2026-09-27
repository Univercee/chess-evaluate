import { useState, useEffect } from 'react';
import { useStockfish, StockfishScore } from '../hooks/useStockfish';

interface ChessAnalyzerProps {
  fen?: string;
}

/**
 * Chess position analyzer component using Stockfish engine
 * Displays best move and evaluation for a given FEN position
 */
export function ChessAnalyzer({ fen: initialFen }: ChessAnalyzerProps) {
  const [fen, setFen] = useState(
    initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );
  const [inputFen, setInputFen] = useState(fen);

  const { analysis, analyze, stop, isLoading, error } = useStockfish();

  // Update FEN when prop changes
  useEffect(() => {
    if (initialFen) {
      setFen(initialFen);
      setInputFen(initialFen);
    }
  }, [initialFen]);

  /**
   * Format score for display
   */
  const formatScore = (score: StockfishScore | null): string => {
    if (!score) return 'N/A';

    if (score.type === 'mate') {
      return `Mate in ${Math.abs(score.value)}`;
    }

    // Convert centipawns to pawns
    const pawns = score.value / 100;
    const sign = pawns > 0 ? '+' : '';
    return `${sign}${pawns.toFixed(2)}`;
  };

  /**
   * Get score color based on evaluation
   */
  const getScoreColor = (score: StockfishScore | null): string => {
    if (!score) return 'text-gray-400';

    if (score.type === 'mate') {
      return score.value > 0 ? 'text-green-400' : 'text-red-400';
    }

    if (score.value > 50) return 'text-green-400';
    if (score.value < -50) return 'text-red-400';
    return 'text-yellow-400';
  };

  /**
   * Handle analyze button click
   */
  const handleAnalyze = async () => {
    setFen(inputFen);
    try {
      await analyze(inputFen, 15, 2000);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  /**
   * Handle stop button click
   */
  const handleStop = () => {
    stop();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">
        ♟ Chess Position Analyzer
      </h2>

      {/* FEN Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          FEN Position
        </label>
        <input
          type="text"
          value={inputFen}
          onChange={(e) => setInputFen(e.target.value)}
          disabled={!!error}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter FEN notation"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-md">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-red-300 font-semibold mb-1">Engine Error</h3>
              <p className="text-red-200 text-sm">{error}</p>
              <p className="text-red-300 text-xs mt-2">
                Make sure stockfish.js is placed in public/stockfish/ directory.
                See STOCKFISH_SETUP.md for instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="mb-4 p-4 bg-blue-900/50 border border-blue-700 rounded-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            <span className="text-blue-200 font-medium">Loading Stockfish engine...</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={analysis.isThinking || isLoading || !!error}
          className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
        >
          {analysis.isThinking ? 'Analyzing...' : 'Analyze'}
        </button>
        {analysis.isThinking && (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {/* Analysis Results */}
      {!error && (
        <div className="space-y-4">
          {/* Status Indicator */}
          {analysis.isThinking && (
            <div className="flex items-center gap-2 text-amber-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400"></div>
              <span className="font-medium">Thinking...</span>
            </div>
          )}

          {/* Best Move */}
          <div className="bg-gray-700 rounded-md p-4">
            <div className="text-sm text-gray-400 mb-1">Best Move</div>
            <div className="text-2xl font-mono font-bold text-white">
              {analysis.bestMove || (analysis.isThinking ? '...' : 'No move')}
            </div>
          </div>

          {/* Evaluation */}
          <div className="bg-gray-700 rounded-md p-4">
            <div className="text-sm text-gray-400 mb-1">Evaluation</div>
            <div className={`text-2xl font-mono font-bold ${getScoreColor(analysis.score)}`}>
              {formatScore(analysis.score)}
            </div>
            {analysis.score && (
              <div className="text-xs text-gray-500 mt-1">
                {analysis.score.type === 'cp' ? 'centipawns' : 'moves to mate'}
              </div>
            )}
          </div>

          {/* Depth */}
          <div className="bg-gray-700 rounded-md p-4">
            <div className="text-sm text-gray-400 mb-1">Search Depth</div>
            <div className="text-xl font-mono font-bold text-white">
              {analysis.depth || 0}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Powered by Stockfish Engine
      </div>
    </div>
  );
}
