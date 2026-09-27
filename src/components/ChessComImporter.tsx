import { useState } from 'react';
import { Chess } from 'chess.js';
import ChessWebAPI from 'chess-web-api';

interface ChessComImporterProps {
  onGameLoad: (game: Chess, moves: string[]) => void;
}

interface GameData {
  pgn: string;
  url: string;
  [key: string]: any;
}

/**
 * Component for importing games from chess.com by username
 * Uses official Chess.com API to fetch player archives and games
 */
export function ChessComImporter({ onGameLoad }: ChessComImporterProps) {
  const [username, setUsername] = useState('');
  const [archives, setArchives] = useState<string[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize chess-web-api client
  const chessAPI = new ChessWebAPI();

  const GAMES_PER_PAGE = 10;

  /**
   * Fetch player archives from chess.com API
   */
  const fetchArchives = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await chessAPI.getPlayerMonthlyArchives(username);
      const archiveUrls = response.body.archives || [];
      
      if (archiveUrls.length === 0) {
        throw new Error('No game archives found for this player.');
      }

      setArchives(archiveUrls);
      setSelectedArchive(null);
      setGames([]);
      setCurrentPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch archives');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch games from selected archive
   */
  const fetchGamesFromArchive = async (archiveUrl: string) => {
    setError(null);
    setLoading(true);

    try {
      // Archive URL format: https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}
      const urlParts = archiveUrl.split('/');
      const year = urlParts[urlParts.length - 2];
      const month = urlParts[urlParts.length - 1];

      const response = await chessAPI.getPlayerCompleteMonthlyArchives(username, year, month);
      const gamesData = response.body.games || [];

      setGames(gamesData);
      setCurrentPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load a specific game
   */
  const loadGame = (gameData: GameData) => {
    try {
      if (!gameData.pgn) {
        throw new Error('Game data does not contain PGN.');
      }

      // Create chess instance and load PGN
      const game = new Chess();
      game.loadPgn(gameData.pgn);

      // Extract moves
      const history = game.history();
      
      // Reset to starting position
      game.reset();

      // Call callback with loaded game
      onGameLoad(game, history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    }
  };

  /**
   * Get current page games
   */
  const getCurrentPageGames = () => {
    const startIndex = currentPage * GAMES_PER_PAGE;
    const endIndex = startIndex + GAMES_PER_PAGE;
    return games.slice(startIndex, endIndex);
  };

  /**
   * Get total pages
   */
  const getTotalPages = () => {
    return Math.ceil(games.length / GAMES_PER_PAGE);
  };

  /**
   * Format archive URL to readable date
   */
  const formatArchiveDate = (archiveUrl: string) => {
    const urlParts = archiveUrl.split('/');
    const year = urlParts[urlParts.length - 2];
    const month = urlParts[urlParts.length - 1];
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  /**
   * Format game date
   */
  const formatGameDate = (gameData: GameData) => {
    if (!gameData.end_time) return 'Unknown date';
    const date = new Date(gameData.end_time * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">
        📥 Import from Chess.com
      </h2>

      {/* Username Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Chess.com Username
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username (e.g., hikaru)"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={loading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && username.trim()) {
                fetchArchives();
              }
            }}
          />
          <button
            onClick={fetchArchives}
            disabled={loading || !username.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {loading ? 'Loading...' : 'Get Archives'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Archives List */}
      {archives.length > 0 && !selectedArchive && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Select Archive ({archives.length} months)
          </h3>
          <div className="max-h-60 overflow-y-auto bg-gray-900 rounded-md p-3">
            <div className="space-y-2">
              {archives.map((archiveUrl) => (
                <button
                  key={archiveUrl}
                  onClick={() => {
                    setSelectedArchive(archiveUrl);
                    fetchGamesFromArchive(archiveUrl);
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                >
                  {formatArchiveDate(archiveUrl)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Games List with Pagination */}
      {selectedArchive && games.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">
              Games from {formatArchiveDate(selectedArchive)} ({games.length} games)
            </h3>
            <button
              onClick={() => {
                setSelectedArchive(null);
                setGames([]);
                setCurrentPage(0);
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
            >
              ← Back to Archives
            </button>
          </div>

          {/* Games Grid */}
          <div className="bg-gray-900 rounded-md p-3 mb-3">
            <div className="space-y-2">
              {getCurrentPageGames().map((gameData, index) => (
                <button
                  key={index}
                  onClick={() => loadGame(gameData)}
                  className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {gameData.white?.username || 'White'} vs {gameData.black?.username || 'Black'}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({gameData.time_class || 'Unknown'})
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatGameDate(gameData)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {getTotalPages() > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                ← Previous
              </button>
              <span className="text-white text-sm">
                Page {currentPage + 1} of {getTotalPages()}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(getTotalPages() - 1, currentPage + 1))}
                disabled={currentPage === getTotalPages() - 1}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-400">
        <p className="mb-1">How to use:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Enter a Chess.com username</li>
          <li>Click "Get Archives" to load game archives</li>
          <li>Select a month to view games</li>
          <li>Click on a game to import it</li>
        </ol>
      </div>
    </div>
  );
}
