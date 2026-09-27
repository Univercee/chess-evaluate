import { useState, useMemo, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ChessAnalyzer } from './components/ChessAnalyzer';
import { useStockfish } from './hooks/useStockfish';

function App() {
  const [game, setGame] = useState(new Chess());
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showBestMove, setShowBestMove] = useState(true);
  const [boardWidth, setBoardWidth] = useState(600);

  // Stockfish hook for best move analysis
  const { analysis, analyze, isLoading: isEngineLoading, error: engineError } = useStockfish();

  // Get current FEN position
  const fen = game.fen();

  // Make a move
  const makeMove = (sourceSquare: string, targetSquare: string, piece: string) => {
    const gameCopy = new Chess(game.fen());
    
    // Check if it's a pawn promotion
    const moveDetails = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' as 'q' | 'r' | 'b' | 'n' | undefined,
    };

    // Check if this is a pawn promotion move
    if (piece === 'wP' && sourceSquare[1] === '7' && targetSquare[1] === '8') {
      moveDetails.promotion = 'q'; // Auto-promote to queen for simplicity
    } else if (piece === 'bP' && sourceSquare[1] === '2' && targetSquare[1] === '1') {
      moveDetails.promotion = 'q'; // Auto-promote to queen for simplicity
    }

    try {
      const move = gameCopy.move(moveDetails);
      
      // Illegal move
      if (move === null) return false;

      setGame(gameCopy);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Check game status
  const gameStatus = useMemo(() => {
    if (game.isCheckmate()) {
      return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`;
    }
    if (game.isDraw()) {
      if (game.isStalemate()) return 'Stalemate! Draw.';
      if (game.isThreefoldRepetition()) return 'Draw by repetition.';
      if (game.isInsufficientMaterial()) return 'Draw by insufficient material.';
      return 'Draw.';
    }
    if (game.isCheck()) {
      return `Check! ${game.turn() === 'w' ? "White's" : "Black's"} turn`;
    }
    return `${game.turn() === 'w' ? "White's" : "Black's"} turn`;
  }, [game]);

  // Reset game
  const resetGame = () => {
    setGame(new Chess());
  };

  // Analyze position after each move
  useEffect(() => {
    if (!showAnalyzer && showBestMove && !isEngineLoading && !engineError) {
      // Small delay to avoid rapid analysis
      const timer = setTimeout(() => {
        analyze(fen, 15, 2000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fen, showAnalyzer, showBestMove, isEngineLoading, engineError, analyze]);

  // Responsive board width
  useEffect(() => {
    const updateWidth = () => {
      const maxWidth = Math.min(600, window.innerWidth - 40);
      setBoardWidth(maxWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Convert best move to custom arrows format
  const customArrows = useMemo(() => {
    if (!showBestMove || !analysis.bestMove || analysis.isThinking) {
      return [];
    }

    // Parse UCI notation (e.g., "e2e4")
    const startSquare = analysis.bestMove.substring(0, 2);
    const endSquare = analysis.bestMove.substring(2, 4);

    // Arrow format: [startSquare, endSquare, color?]
    return [[startSquare, endSquare, '#22c55e']] as any;
  }, [showBestMove, analysis.bestMove, analysis.isThinking]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
        ♟ Chess Board
      </h1>

      {/* Mode Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowAnalyzer(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !showAnalyzer
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ♟ Play
        </button>
        <button
          onClick={() => setShowAnalyzer(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showAnalyzer
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔍 Analyze
        </button>
        {!showAnalyzer && (
          <button
            onClick={() => setShowBestMove(!showBestMove)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showBestMove
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Show best move arrow"
          >
            ➤ Best Move
          </button>
        )}
      </div>

      {/* Board View */}
      {!showAnalyzer && (
        <>
          {/* Status */}
          <div
            className={`px-4 py-2 rounded-lg font-semibold text-sm sm:text-base ${
              game.isCheckmate()
                ? 'bg-red-600 text-white'
                : game.isDraw()
                ? 'bg-yellow-500 text-black'
                : game.isCheck()
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-200'
            }`}
          >
            {gameStatus}
          </div>

          {/* Chess Board */}
          <div className="w-full max-w-[600px] relative">
            <Chessboard
              position={fen}
              onPieceDrop={makeMove}
              boardWidth={boardWidth}
              customArrows={customArrows}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            />
            {/* Analysis Status */}
            {showBestMove && analysis.isThinking && (
              <div className="absolute top-2 right-2 bg-gray-800/90 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                Analyzing...
              </div>
            )}
            {/* Engine Error */}
            {showBestMove && engineError && (
              <div className="absolute top-2 right-2 bg-red-800/90 text-white px-3 py-1 rounded-lg text-sm">
                ⚠️ Engine error
              </div>
            )}
          </div>

          {/* Best Move Info */}
          {showBestMove && analysis.bestMove && !analysis.isThinking && (
            <div className="bg-gray-800 rounded-lg p-4 max-w-[600px] w-full">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400">Best Move</div>
                  <div className="text-xl font-mono font-bold text-white">
                    {analysis.bestMove}
                  </div>
                </div>
                {analysis.score && (
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Evaluation</div>
                    <div className={`text-xl font-mono font-bold ${
                      analysis.score.type === 'mate'
                        ? analysis.score.value > 0 ? 'text-green-400' : 'text-red-400'
                        : analysis.score.value > 50 ? 'text-green-400'
                        : analysis.score.value < -50 ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}>
                      {analysis.score.type === 'mate'
                        ? `Mate in ${Math.abs(analysis.score.value)}`
                        : `${analysis.score.value > 0 ? '+' : ''}${(analysis.score.value / 100).toFixed(2)}`
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={resetGame}
            className="mt-2 px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            New Game
          </button>

          {/* Hint */}
          <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md">
            Drag and drop pieces to make moves. The game follows standard chess rules.
          </p>
        </>
      )}

      {/* Analyzer View */}
      {showAnalyzer && (
        <ChessAnalyzer fen={fen} />
      )}
    </div>
  );
}

export default App;
