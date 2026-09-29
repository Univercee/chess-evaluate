import ChessWebAPI from 'chess-web-api';
import { Archive, GameSource, ImportedGameData, UserNotFoundError } from './types';

const chessAPI = new ChessWebAPI();

/**
 * Chess.com public API via chess-web-api: player archives are months, each fetched whole
 */
export const chessComSource: GameSource = {
  platform: 'chesscom',
  label: 'Chess.com',

  async fetchArchives(username) {
    let archiveUrls: string[];
    try {
      const response = await chessAPI.getPlayerMonthlyArchives(username);
      archiveUrls = response.body.archives || [];
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.status === 404) throw new UserNotFoundError();
      throw err;
    }

    // Archive URL format: https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}
    const archives: Archive[] = archiveUrls
      .map((url) => {
        const parts = url.split('/');
        return { year: parseInt(parts[parts.length - 2], 10), month: parseInt(parts[parts.length - 1], 10) };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);

    return { username, archives };
  },

  async fetchGames(username, archive) {
    const month = String(archive.month).padStart(2, '0');
    const response = await chessAPI.getPlayerCompleteMonthlyArchives(username, archive.year, month);
    const games: any[] = response.body.games || [];

    const normalized: ImportedGameData[] = games
      // Chess960 and other variants can't be replayed from the standard starting position
      .filter((game) => game.pgn && (game.rules === undefined || game.rules === 'chess'))
      .map((game) => ({
        platform: 'chesscom',
        pgn: game.pgn,
        white: { username: game.white?.username, rating: game.white?.rating },
        black: { username: game.black?.username, rating: game.black?.rating },
        timeClass: game.time_class,
        endTime: game.end_time ? game.end_time * 1000 : undefined,
      }));

    // Newest first
    return { games: normalized.sort((a, b) => (b.endTime ?? 0) - (a.endTime ?? 0)) };
  },
};
