import { Chess } from 'chess.js';

interface MoveNavigatorProps {
  game: Chess;
  moves: string[];
  currentMoveIndex: number;
  onMoveChange: (index: number) => void;
}

/**
 * Component for navigating through moves of an imported game
 */
export function MoveNavigator({ 
  game, 
  moves, 
  currentMoveIndex, 
  onMoveChange 
}: MoveNavigatorProps) {
  const handleFirst = () => onMoveChange(0);
  const handlePrev = () => onMoveChange(Math.max(0, currentMoveIndex - 1));
  const handleNext = () => onMoveChange(Math.min(moves.length, currentMoveIndex + 1));
  const handleLast = () => onMoveChange(moves.length);

  return (
    <div className="bg-gray-800 rounded-lg p-4 max-w-2xl mx-auto">
      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={handleFirst}
          disabled={currentMoveIndex === 0}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          title="First move"
        >
          ⏮
        </button>
        <button
          onClick={handlePrev}
          disabled={currentMoveIndex === 0}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          title="Previous move"
        >
          ◀
        </button>
        <div className="px-4 py-2 bg-gray-700 text-white rounded-md font-mono">
          {currentMoveIndex} / {moves.length}
        </div>
        <button
          onClick={handleNext}
          disabled={currentMoveIndex === moves.length}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          title="Next move"
        >
          ▶
        </button>
        <button
          onClick={handleLast}
          disabled={currentMoveIndex === moves.length}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          title="Last move"
        >
          ⏭
        </button>
      </div>

      {/* Move List */}
      <div className="max-h-40 overflow-y-auto bg-gray-900 rounded-md p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {moves.map((move, index) => (
            <button
              key={index}
              onClick={() => onMoveChange(index + 1)}
              className={`px-2 py-1 rounded text-left transition-colors ${
                index + 1 === currentMoveIndex
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
