import { useState, useCallback, useMemo } from 'react';
import { ChessBoard } from './classes/ChessBoard';
import { Position, PieceType, PIECE_SYMBOLS, GameStatus } from './types/chess';
import { ChessAnalyzer } from './components/ChessAnalyzer';

/** Pieces available for pawn promotion */
const PROMOTION_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

function App() {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // View mode: 'board' or 'analyzer'
  const [viewMode, setViewMode] = useState<'board' | 'analyzer'>('board');

  // Create the board once
  const [board] = useState(() => new ChessBoard());
  // State for re-rendering
  const [renderTrigger, setRenderTrigger] = useState(0);
  // Selected square
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  // Legal moves for the selected piece
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  // Last move (for highlighting)
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  // Pending pawn promotion
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  const forceRender = useCallback(() => {
    setRenderTrigger((prev) => prev + 1);
  }, []);

  /** Execute a move with promotion (or without) */
  const executeMove = useCallback(
    (from: Position, to: Position, promotion?: PieceType) => {
      const move = board.makeMove(from, to, promotion);
      if (move) {
        setLastMove({ from, to });
        setSelectedPos(null);
        setLegalMoves([]);
        setPendingPromotion(null);
        forceRender();
      }
    },
    [board, forceRender]
  );

  // Game status via centralized method
  const gameStatus: GameStatus = useMemo(() => {
    return board.getGameStatus();
  }, [board, renderTrigger]);

  // Game over flag
  const isGameOver = gameStatus.type === 'checkmate' || gameStatus.type === 'stalemate';

  // Square click handler
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      // If game is over — ignore clicks
      if (isGameOver) return;

      // If promotion dialog is open — ignore board clicks
      if (pendingPromotion) return;

      const clickedPos = { row, col };

      // If there's a selected piece and clicked on a legal move
      if (selectedPos) {
        const isLegalTarget = legalMoves.some(
          (m) => m.col === col && m.row === row
        );

        if (isLegalTarget) {
          // Check if promotion is needed
          if (board.needsPromotion(selectedPos, clickedPos)) {
            // Open piece selection dialog
            setPendingPromotion({ from: selectedPos, to: clickedPos });
            return;
          }

          executeMove(selectedPos, clickedPos);
          return;
        }
      }

      // Select a piece
      const piece = board.getPieceAt(clickedPos);
      if (piece && piece.color === board.getCurrentTurn()) {
        setSelectedPos(clickedPos);
        setLegalMoves(board.getLegalMoves(clickedPos));
      } else {
        setSelectedPos(null);
        setLegalMoves([]);
      }
    },
    [board, selectedPos, legalMoves, pendingPromotion, executeMove, isGameOver]
  );

  // Promotion piece selection handler
  const handlePromotionChoice = useCallback(
    (pieceType: PieceType) => {
      if (!pendingPromotion) return;
      executeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    },
    [pendingPromotion, executeMove]
  );

  // Status text description
  const statusText = useMemo(() => {
    switch (gameStatus.type) {
      case 'checkmate': {
        const winner = gameStatus.winner === 'white' ? 'White' : 'Black';
        return `Checkmate! ${winner} wins!`;
      }
      case 'stalemate':
        return 'Stalemate! Draw.';
      case 'playing':
        if (gameStatus.inCheck) {
          return `Check! ${gameStatus.turn === 'white' ? "White's" : "Black's"} turn`;
        }
        return `${gameStatus.turn === 'white' ? "White's" : "Black's"} turn`;
    }
  }, [gameStatus]);

  // Reset game
  const handleReset = useCallback(() => {
    window.location.reload();
  }, []);

  // Get board state
  const boardState = board.getBoardState();

  // Color of the pawn awaiting promotion
  const promotionColor = pendingPromotion
    ? board.getPieceAt(pendingPromotion.from)?.color ?? 'white'
    : 'white';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 gap-4">
      {/* Mode Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('board')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'board'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ♟ Play
        </button>
        <button
          onClick={() => setViewMode('analyzer')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'analyzer'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔍 Analyze
        </button>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            ♟ Chess Board
          </h1>

      {/* Status */}
      <div
        className={`px-4 py-2 rounded-lg font-semibold text-sm sm:text-base ${
          gameStatus.type === 'checkmate'
            ? 'bg-red-600 text-white'
            : gameStatus.type === 'stalemate'
            ? 'bg-yellow-500 text-black'
            : gameStatus.type === 'playing' && gameStatus.inCheck
            ? 'bg-orange-500 text-white'
            : 'bg-gray-700 text-gray-200'
        }`}
      >
        {statusText}
      </div>

      <div className="flex items-center">
        {/* Numbers on the left */}
        <div className="flex flex-col mr-1 sm:mr-2">
          {ranks.map((rank) => (
            <div
              key={rank}
              className="flex items-center justify-center text-gray-400 font-semibold text-xs sm:text-sm w-5 sm:w-7 h-10 sm:h-14 md:h-16"
            >
              {rank}
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="border-4 border-amber-900 rounded shadow-2xl relative">
          {ranks.map((rank, rowIndex) => (
            <div key={rank} className="flex">
              {files.map((file, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const piece = boardState[rowIndex][colIndex];
                const isSelected =
                  selectedPos?.row === rowIndex && selectedPos?.col === colIndex;
                const isLegalTarget = legalMoves.some(
                  (m) => m.row === rowIndex && m.col === colIndex
                );
                const isLastMoveSquare =
                  lastMove &&
                  ((lastMove.from.row === rowIndex && lastMove.from.col === colIndex) ||
                    (lastMove.to.row === rowIndex && lastMove.to.col === colIndex));

                // Square highlighting
                let bgClass = isLight ? 'bg-amber-100' : 'bg-amber-800';
                if (isSelected) {
                  bgClass = 'bg-sky-400';
                } else if (isLastMoveSquare) {
                  bgClass = isLight ? 'bg-yellow-200' : 'bg-yellow-600';
                }

                return (
                  <div
                    key={`${file}${rank}`}
                    className={`
                      w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16
                      flex items-center justify-center
                      cursor-pointer relative
                      transition-colors duration-100
                      ${bgClass}
                      hover:brightness-110
                    `}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {/* Legal move marker */}
                    {isLegalTarget && !piece && (
                      <div className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-black/20" />
                    )}
                    {isLegalTarget && piece && (
                      <div className="absolute inset-0 border-4 border-black/30 rounded-sm" />
                    )}

                    {/* Piece */}
                    {piece && (
                      <span
                        className={`
                          text-2xl sm:text-3xl md:text-4xl select-none
                          ${piece.color === 'white'
                            ? 'text-white [text-shadow:_0_0_2px_#000,_0_0_2px_#000,_0_0_2px_#000]'
                            : 'text-black [text-shadow:_0_0_1px_#fff,_0_0_1px_#fff]'
                          }
                        `}
                      >
                        {piece.getSymbol()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Pawn promotion modal */}
          {pendingPromotion && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded">
              <div className="bg-gray-800 border-2 border-amber-500 rounded-xl p-4 shadow-2xl">
                <p className="text-white text-center text-sm font-semibold mb-3">
                  Choose a piece
                </p>
                <div className="flex gap-2">
                  {PROMOTION_PIECES.map((pieceType) => (
                    <button
                      key={pieceType}
                      onClick={() => handlePromotionChoice(pieceType)}
                      className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center
                                 bg-amber-100 hover:bg-amber-300 rounded-lg
                                 transition-colors duration-150
                                 border-2 border-amber-700 hover:border-amber-400"
                      title={pieceType}
                    >
                      <span
                        className={`text-3xl sm:text-4xl select-none ${
                          promotionColor === 'white'
                            ? 'text-white [text-shadow:_0_0_2px_#000,_0_0_2px_#000,_0_0_2px_#000]'
                            : 'text-black [text-shadow:_0_0_1px_#fff,_0_0_1px_#fff]'
                        }`}
                      >
                        {PIECE_SYMBOLS[promotionColor][pieceType]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Letters at the bottom */}
      <div className="flex ml-6 sm:ml-9">
        {files.map((file) => (
          <div
            key={file}
            className="flex items-center justify-center text-gray-400 font-semibold text-xs sm:text-sm w-10 sm:w-14 md:w-16 h-5 sm:h-6"
          >
            {file}
          </div>
        ))}
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="mt-2 px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-lg"
      >
        New Game
      </button>

      {/* Hint */}
      <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md">
        Click on a piece to see available moves. When a pawn reaches the opposite
        edge, choose a piece for promotion.
      </p>
        </>
      )}

      {/* Analyzer View */}
      {viewMode === 'analyzer' && (
        <ChessAnalyzer />
      )}
    </div>
  );
}

export default App;
