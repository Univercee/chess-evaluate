import { useState, useMemo, useEffect, CSSProperties } from 'react';
import { Chessboard } from 'react-chessboard';
import { ArrowUpDown } from 'lucide-react';
import { Chess, Color } from 'chess.js';
import { EvaluationBar } from './components/EvaluationBar';
import { GameImporter, ImportedPlayers } from './components/GameImporter';
import { PlayerBar, PlayerInfo } from './components/PlayerBar';
import { MoveNavigator } from './components/MoveNavigator';
import { PrincipalVariations } from './components/PrincipalVariations';
import { GameReviewPanel } from './components/GameReviewPanel';
import { MOVE_CLASS_META, MoveClassBadge } from './components/MoveClassBadge';
import { hasCachedReview, useGameReview } from './review/useGameReview';
import { GameResult, getGameResult } from './gameResult';
import { useStockfish } from './hooks/useStockfish';
import { usePersistentState } from './hooks/usePersistentState';
import { DEFAULT_ENGINE_ID, getEngine } from './engines';
import { t, useLanguage } from './i18n';
import { LanguageSwitcher } from './components/LanguageSwitcher';

// Free play has no real players: show piece colors and translated side names
const DEFAULT_PLAYERS: { white: PlayerInfo; black: PlayerInfo } = {
  white: { color: 'w' },
  black: { color: 'b' },
};

function App() {
  // Re-render the whole tree with new strings when the language changes
  useLanguage();
  // Free play: moves made on the board (SAN) and how many of them are shown; stepping back and
  // playing a different move replaces the moves after that point (taking moves back)
  const [playMoves, setPlayMoves] = useState<string[]>([]);
  const [playIndex, setPlayIndex] = useState(0);
  const [boardWidth, setBoardWidth] = useState(600);
  
  // Imported game state
  const [importedGame, setImportedGame] = useState<Chess | null>(null);
  const [importedMoves, setImportedMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [importedPlayers, setImportedPlayers] = useState<ImportedPlayers | null>(null);
  // User's own moves (SAN) played on the board from the imported position at currentMoveIndex
  const [variation, setVariation] = useState<string[]>([]);

  // Classification of every imported game move, by a separate engine worker
  // The review is started by the user (or shown right away if this game was reviewed before)
  const [isReviewRequested, setIsReviewRequested] = useState(false);
  // Increments on every game load, to reset per-game UI (e.g. the review panel's collapse state)
  const [gameLoadId, setGameLoadId] = useState(0);
  // Engine for live analysis and review (user's choice, remembered per browser)
  const [engineId, setEngineId] = usePersistentState('engine', DEFAULT_ENGINE_ID);
  const engine = getEngine(engineId);

  const review = useGameReview(importedGame && isReviewRequested ? importedMoves : null, engine.url);

  // Stockfish hook for best move analysis
  const { analysis, analyze, cancel, isLoading: isEngineLoading, error: engineError } = useStockfish(engine.url);

  // Get current FEN position (use imported game position if a game is loaded)
  // Displayed position with its move history (needed for threefold repetition)
  const position = useMemo(() => {
    if (importedGame) {
      // Replay moves up to currentMoveIndex, then the user's variation on top
      const tempGame = new Chess();
      for (let i = 0; i < currentMoveIndex; i++) {
        tempGame.move(importedMoves[i]);
      }
      for (const move of variation) {
        tempGame.move(move);
      }
      return tempGame;
    }
    const freePlay = new Chess();
    for (let i = 0; i < playIndex; i++) {
      freePlay.move(playMoves[i]);
    }
    return freePlay;
  }, [importedGame, importedMoves, currentMoveIndex, variation, playMoves, playIndex]);
  const fen = position.fen();
  const gameResult: GameResult | null = useMemo(() => getGameResult(position), [position]);

  // Side to move in the displayed position (Stockfish scores are relative to it)
  const sideToMove = fen.split(' ')[1] as Color;

  // Make a move in free play from the shown position; later moves (if stepped back) are dropped
  const makeMove = (sourceSquare: string, targetSquare: string) => {
    // Replay to keep the move history (needed for threefold repetition detection)
    const next = new Chess();
    for (let i = 0; i < playIndex; i++) {
      next.move(playMoves[i]);
    }
    try {
      // Pawns always promote to a queen; the promotion field is ignored for other moves
      const move = next.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      setPlayMoves([...playMoves.slice(0, playIndex), move.san]);
      setPlayIndex(playIndex + 1);
      return true;
    } catch {
      // Illegal move
      return false;
    }
  };

  // New game: close any imported game and reset the free-play board
  const resetGame = () => {
    setPlayMoves([]);
    setPlayIndex(0);
    setImportedGame(null);
    setImportedMoves([]);
    setImportedPlayers(null);
    setCurrentMoveIndex(0);
    setVariation([]);
  };

  // Handle imported game load
  const handleGameLoad = (
    loadedGame: Chess,
    moves: string[],
    players: ImportedPlayers,
    perspective: 'w' | 'b' | null
  ) => {
    // Show the game from the searched player's side (Black at the bottom if they played Black)
    if (perspective) setIsFlipped(perspective === 'b');
    setImportedGame(loadedGame);
    setImportedMoves(moves);
    setImportedPlayers(players);
    setCurrentMoveIndex(0);
    setVariation([]);
    setIsReviewRequested(hasCachedReview(moves, engine.url));
    setGameLoadId((id) => id + 1);
  };

  // Handle move navigation in imported game (leaves any variation)
  const handleMoveChange = (index: number) => {
    setCurrentMoveIndex(index);
    setVariation([]);
  };

  // Play a move on the imported game's board: it extends the variation from the current game move
  const makeVariationMove = (sourceSquare: string, targetSquare: string) => {
    try {
      const move = new Chess(fen).move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      setVariation((prev) => [...prev, move.san]);
      return true;
    } catch {
      // Illegal move
      return false;
    }
  };

  // Analyze position after each move
  useEffect(() => {
    if (isEngineLoading || engineError) return;
    // Nothing to analyze once the game is over: stop the search and clear the lines
    if (gameResult) {
      cancel(fen);
      return;
    }
    // Short delay so fast navigation (e.g. a held arrow key) doesn't start a search per step
    const timer = setTimeout(() => {
      analyze(fen, 15, 2000);
    }, 100);
    return () => clearTimeout(timer);
  }, [fen, gameResult, isEngineLoading, engineError, analyze, cancel]);

  // Responsive board width
  useEffect(() => {
    const updateWidth = () => {
      // Leave room for page padding (2 * 16px) plus the evaluation bar (40px) and its gap (8px)
      // Clamp so a transiently tiny viewport never yields a negative board size
      const maxWidth = Math.max(120, Math.min(600, document.documentElement.clientWidth - 32 - 48));
      setBoardWidth(maxWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Best move arrow: follows the engine's current best line while it is still searching,
  // and is only shown for the position it was computed for
  const [showArrow, setShowArrow] = usePersistentState('showBestMoveArrow', true);
  // Board seen from Black; kept across games until flipped back
  const [isFlipped, setIsFlipped] = useState(false);
  // Auto-flip: the side to move is at the bottom; the flip button still inverts that view
  const [autoFlip, setAutoFlip] = usePersistentState('autoFlip', false);
  const boardFlipped = isFlipped !== (autoFlip && sideToMove === 'b');
  const bestMove = showArrow && analysis.fen === fen ? analysis.lines[0]?.moves[0] ?? analysis.bestMove : null;
  const customArrows = useMemo(() => {
    if (!bestMove) {
      return [];
    }

    // Parse UCI notation (e.g., "e2e4")
    const startSquare = bestMove.substring(0, 2);
    const endSquare = bestMove.substring(2, 4);

    // Arrow format: [startSquare, endSquare, color?]
    return [[startSquare, endSquare, '#22c55e']] as any;
  }, [bestMove]);

  // Player row aligned with the board: offset by evaluation bar width (40px) + gap (8px)
  const renderPlayer = (player: PlayerInfo) => (
    <div className="pl-12" style={{ width: `${boardWidth + 48}px` }}>
      <PlayerBar player={player} />
    </div>
  );

  // Players, evaluation bar and board
  const players = importedPlayers ?? DEFAULT_PLAYERS;
  // The player whose pieces are at the bottom sits below the board
  const [topPlayer, bottomPlayer] = boardFlipped ? [players.white, players.black] : [players.black, players.white];
  // Last game move on the board and its review class (not shown while exploring a variation)
  const lastGameMove = useMemo(() => {
    if (!importedGame || currentMoveIndex === 0 || variation.length > 0) return null;
    const chess = new Chess();
    let move = null;
    for (let i = 0; i < currentMoveIndex; i++) move = chess.move(importedMoves[i]);
    return move && { from: move.from, to: move.to, moveClass: review.classes[currentMoveIndex - 1] };
  }, [importedGame, importedMoves, currentMoveIndex, variation.length, review.classes]);

  // Tint both squares of the last move in its class color
  const customSquareStyles = useMemo(() => {
    if (!lastGameMove?.moveClass) return {};
    const background = `${MOVE_CLASS_META[lastGameMove.moveClass].color}80`;
    return { [lastGameMove.from]: { background }, [lastGameMove.to]: { background } };
  }, [lastGameMove]);

  // Class badge on the top-right corner of the destination square (board seen from White), kept inside the board
  const renderMoveBadge = () => {
    if (!lastGameMove?.moveClass) return null;
    const square = boardWidth / 8;
    const size = Math.max(18, Math.round(square * 0.4));
    // Column/row of the square as displayed: a1 is bottom-left, or top-right when flipped
    const fileIndex = lastGameMove.to.charCodeAt(0) - 97;
    const rankNumber = Number(lastGameMove.to[1]);
    const file = boardFlipped ? 7 - fileIndex : fileIndex;
    const rank = boardFlipped ? 9 - rankNumber : rankNumber;
    const left = Math.min((file + 1) * square - size * 0.65, boardWidth - size);
    const top = Math.max((8 - rank) * square - size * 0.35, 0);
    return (
      <div className="absolute z-10 pointer-events-none drop-shadow" style={{ left, top }}>
        <MoveClassBadge moveClass={lastGameMove.moveClass} size={size} />
      </div>
    );
  };

  const board = (
    // Where there is room (board at full 600px), right padding mirrors the evaluation bar so the board itself is centered
    <div className="flex flex-col gap-2 xl:col-start-2 min-[728px]:pr-12">
      {renderPlayer(topPlayer)}
      <div className="flex gap-2 items-stretch">
        <EvaluationBar
          score={analysis.score}
          height={boardWidth}
          currentMove={sideToMove}
          result={gameResult?.score}
          flipped={boardFlipped}
        />
        <div className="relative" style={{ width: `${boardWidth}px`, height: `${boardWidth}px` }}>
          <Chessboard
            position={fen}
            boardWidth={boardWidth}
            boardOrientation={boardFlipped ? 'black' : 'white'}
            onPieceDrop={importedGame ? makeVariationMove : makeMove}
            customArrows={customArrows}
            customSquareStyles={customSquareStyles}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          />
          {renderMoveBadge()}
          {engineError && (
            <div className="absolute top-2 right-2 bg-red-800/90 text-white px-3 py-1 rounded-lg text-sm">
              ⚠️ {t('analysis.engineError')}
            </div>
          )}
        </div>
      </div>
      {renderPlayer(bottomPlayer)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 gap-4">
      {/* Title centered; language switcher on the right (on its own row above the title on phones) */}
      <header className="w-full flex flex-col-reverse items-center gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <h1 className="text-xl sm:text-3xl font-bold text-white tracking-wide text-center sm:col-start-2">
          ♟ {t('app.title')}
        </h1>
        <LanguageSwitcher className="self-end sm:justify-self-end" />
      </header>

      {/* Board centered with the sidebar to its right on wide screens; sidebar below the board otherwise.
          The side columns share free space equally, and the right one never gets narrower than the sidebar.
          When stacked, the sidebar spans the eval bar + board on phones and exactly the board from 728px up. */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto_minmax(18rem,1fr)] gap-4 xl:gap-6 justify-items-center items-start">
        {board}
        <aside
          className="flex flex-col gap-3 w-(--sidebar-width) min-[728px]:w-(--board-width) xl:w-72 xl:justify-self-start xl:mt-10"
          style={{ '--sidebar-width': `${boardWidth + 48}px`, '--board-width': `${boardWidth}px` } as CSSProperties}
        >
          <GameImporter onGameLoad={handleGameLoad} />
          {!importedGame && (
            <MoveNavigator
              moves={playMoves}
              currentMoveIndex={playIndex}
              onMoveChange={setPlayIndex}
              emptyText={t('nav.emptyFreePlay')}
            />
          )}
          {importedGame && (
            <MoveNavigator
              moves={importedMoves}
              currentMoveIndex={currentMoveIndex}
              onMoveChange={handleMoveChange}
              variation={variation}
              onVariationChange={setVariation}
              moveClasses={review.classes}
            />
          )}
          {importedGame && (
            <GameReviewPanel
              // New game → fresh panel (expanded again)
              key={gameLoadId}
              review={review}
              isRequested={isReviewRequested}
              onRequestChange={setIsReviewRequested}
              currentMoveIndex={currentMoveIndex}
              onJump={handleMoveChange}
            />
          )}
          <PrincipalVariations
            analysis={analysis}
            fen={fen}
            gameOver={gameResult && t(gameResult.message)}
            showArrow={showArrow}
            onShowArrowChange={setShowArrow}
            engineId={engine.id}
            onEngineChange={setEngineId}
            isEngineLoading={isEngineLoading}
          />
          {/* Flip button and its auto-flip switch, grouped tightly as one control */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsFlipped((flipped) => !flipped)}
              aria-pressed={isFlipped}
              className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              {t('game.flipBoard')}
            </button>
            {/* Auto-flip switch: turn the board so the side to move is at the bottom */}
            <button
              role="switch"
              aria-checked={autoFlip}
              onClick={() => setAutoFlip(!autoFlip)}
              className="w-full flex items-center justify-between gap-2 px-3 py-0.5 text-xs text-gray-400 hover:text-white group"
            >
              <span>{t('game.autoFlip')}</span>
              <span
                className={`relative shrink-0 w-7 h-3.5 rounded-full transition-colors ${
                  autoFlip ? 'bg-green-600' : 'bg-gray-600 group-hover:bg-gray-500'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                    autoFlip ? 'translate-x-3.5' : ''
                  }`}
                />
              </span>
            </button>
          </div>
          <button
            onClick={resetGame}
            className="w-full px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            {t('game.newGame')}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default App;
