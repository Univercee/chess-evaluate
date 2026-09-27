import { useState } from 'react';
import { Chess } from 'chess.js';

interface ChessComImporterProps {
  onGameLoad: (game: Chess, moves: string[]) => void;
}

/**
 * Component for importing games from chess.com by URL
 */
export function ChessComImporter({ onGameLoad }: ChessComImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extract game ID from chess.com URL
   * Supported formats:
   * - https://www.chess.com/game/live/123456789
   * - https://www.chess.com/game/daily/123456789
   * - https://www.chess.com/live/game/123456789
   */
  const extractGameId = (url: string): { type: string; id: string } | null => {
    try {
      // Match various chess.com URL patterns
      const patterns = [
        /chess\.com\/game\/live\/(\d+)/,
        /chess\.com\/game\/daily\/(\d+)/,
        /chess\.com\/live\/game\/(\d+)/,
        /chess\.com\/daily\/game\/(\d+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const type = url.includes('/live/') || url.includes('/live/game/') ? 'live' : 'daily';
          return { type, id: match[1] };
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  /**
   * Fetch game data from chess.com API
   */
  const fetchGame = async (gameId: string, gameType: string) => {
    // chess.com public API endpoint
    const endpoint = gameType === 'live' 
      ? `https://api.chess.com/pub/game/live/${gameId}`
      : `https://api.chess.com/pub/game/daily/${gameId}`;

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch game: ${response.statusText}`);
    }

    return await response.json();
  };

  /**
   * Handle import button click
   */
  const handleImport = async () => {
    setError(null);
    setLoading(true);

    try {
      // Extract game ID from URL
      const gameInfo = extractGameId(url);
      if (!gameInfo) {
        throw new Error('Invalid chess.com URL. Please provide a valid game URL.');
      }

      // Fetch game data
      const gameData = await fetchGame(gameInfo.id, gameInfo.type);

      // Parse PGN
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

      // Clear input
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">
        📥 Import from Chess.com
      </h2>

      {/* URL Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Chess.com Game URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.chess.com/game/live/123456789"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={loading || !url.trim()}
        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Loading...
          </span>
        ) : (
          'Import Game'
        )}
      </button>

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-400">
        <p className="mb-1">Supported URL formats:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>https://www.chess.com/game/live/...</li>
          <li>https://www.chess.com/game/daily/...</li>
          <li>https://www.chess.com/live/game/...</li>
          <li>https://www.chess.com/daily/game/...</li>
        </ul>
      </div>
    </div>
  );
}
