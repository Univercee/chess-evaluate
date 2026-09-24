import { useState, useCallback, useMemo } from 'react';
import { ChessBoard } from './classes/ChessBoard';
import { Position, PieceType, PIECE_SYMBOLS, GameStatus } from './types/chess';

/** Фигуры, доступные для превращения пешки */
const PROMOTION_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

function App() {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Создаём доску один раз
  const [board] = useState(() => new ChessBoard());
  // Состояние для ререндера
  const [, setRenderTrigger] = useState(0);
  // Выбранная клетка
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  // Легальные ходы для выбранной фигуры
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  // Последний ход (для подсветки)
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  // Ожидаемое превращение пешки
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  const forceRender = useCallback(() => {
    setRenderTrigger((prev) => prev + 1);
  }, []);

  /** Выполнить ход с превращением (или без) */
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

  // Статус игры через централизованный метод
  const gameStatus: GameStatus = useMemo(() => {
    return board.getGameStatus();
  }, [board]);

  // Флаг окончания игры
  const isGameOver = gameStatus.type === 'checkmate' || gameStatus.type === 'stalemate';

  // Клик по клетке
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      // Если игра окончена — игнорируем клики
      if (isGameOver) return;

      // Если открыто окно превращения — игнорируем клики по доске
      if (pendingPromotion) return;

      const clickedPos = { row, col };

      // Если есть выбранная фигура и кликнули на легальный ход
      if (selectedPos) {
        const isLegalTarget = legalMoves.some(
          (m) => m.col === col && m.row === row
        );

        if (isLegalTarget) {
          // Проверяем, нужно ли превращение
          if (board.needsPromotion(selectedPos, clickedPos)) {
            // Открываем диалог выбора фигуры
            setPendingPromotion({ from: selectedPos, to: clickedPos });
            return;
          }

          executeMove(selectedPos, clickedPos);
          return;
        }
      }

      // Выбираем фигуру
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

  // Обработчик выбора фигуры для превращения
  const handlePromotionChoice = useCallback(
    (pieceType: PieceType) => {
      if (!pendingPromotion) return;
      executeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    },
    [pendingPromotion, executeMove]
  );

  // Текстовое описание статуса
  const statusText = useMemo(() => {
    switch (gameStatus.type) {
      case 'checkmate': {
        const winner = gameStatus.winner === 'white' ? 'Белые' : 'Чёрные';
        return `Мат! ${winner} победили!`;
      }
      case 'stalemate':
        return 'Пат! Ничья.';
      case 'playing':
        if (gameStatus.inCheck) {
          return `Шах! Ход ${gameStatus.turn === 'white' ? 'белых' : 'чёрных'}`;
        }
        return `Ход ${gameStatus.turn === 'white' ? 'белых' : 'чёрных'}`;
    }
  }, [gameStatus]);

  // Сброс игры
  const handleReset = useCallback(() => {
    window.location.reload();
  }, []);

  // Получить состояние доски
  const boardState = board.getBoardState();

  // Цвет пешки, ожидающей превращения
  const promotionColor = pendingPromotion
    ? board.getPieceAt(pendingPromotion.from)?.color ?? 'white'
    : 'white';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
        ♟ Шахматная доска
      </h1>

      {/* Статус */}
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
        {/* Цифры слева */}
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

        {/* Доска */}
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

                // Подсветка клетки
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
                    {/* Маркер легального хода */}
                    {isLegalTarget && !piece && (
                      <div className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-black/20" />
                    )}
                    {isLegalTarget && piece && (
                      <div className="absolute inset-0 border-4 border-black/30 rounded-sm" />
                    )}

                    {/* Фигура */}
                    {piece && (
                      <span
                        className={`
                          text-2xl sm:text-3xl md:text-4xl select-none
                          ${piece.color === 'white' ? 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' : 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]'}
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

          {/* Модальное окно превращения пешки */}
          {pendingPromotion && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded">
              <div className="bg-gray-800 border-2 border-amber-500 rounded-xl p-4 shadow-2xl">
                <p className="text-white text-center text-sm font-semibold mb-3">
                  Выберите фигуру
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
                      <span className="text-3xl sm:text-4xl select-none">
                        {PIECE_SYMBOLS[promotionColor][pieceType]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Цифры справа */}
        <div className="flex flex-col ml-1 sm:ml-2">
          {ranks.map((rank) => (
            <div
              key={rank}
              className="flex items-center justify-center text-gray-400 font-semibold text-xs sm:text-sm w-5 sm:w-7 h-10 sm:h-14 md:h-16"
            >
              {rank}
            </div>
          ))}
        </div>
      </div>

      {/* Буквы снизу */}
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

      {/* Кнопка сброса */}
      <button
        onClick={handleReset}
        className="mt-2 px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-lg"
      >
        Новая игра
      </button>

      {/* Подсказка */}
      <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md">
        Нажмите на фигуру, чтобы увидеть возможные ходы. При достижении пешкой
        противоположного края выберите фигуру для превращения.
      </p>
    </div>
  );
}

export default App;
