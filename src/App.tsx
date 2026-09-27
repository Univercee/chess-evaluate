import { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { ChessAnalyzer } from './components/ChessAnalyzer';

function App() {
  const [game, setGame] = useState(new Chess());
  const [showAnalyzer, setShowAnalyzer] = useState(false);

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
          <div className="w-full max-w-[600px]">
            <Chessboard
              position={fen}
              onPieceDrop={makeMove}
              boardWidth={600}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            />
          </div>

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
