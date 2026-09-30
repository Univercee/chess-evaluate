import { Archive, GameSource, ImportedGameData, RateLimitError, UserNotFoundError } from './types';

const API = 'https://api.chess.com/pub/player';

/**
 * GET a Chess.com public API endpoint as JSON.
 *
 * Deliberately a plain fetch with no custom headers, so it stays a CORS "simple request".
 * The API's preflight only allows the `Origin` header: any other header (e.g. the
 * `User-Agent` the chess-web-api package used to set, which Safari/iOS and Firefox actually
 * send while Chrome drops it) makes the browser block the request.
 */
async function getJson(url: string) {
  const response = await fetch(url);
  if (response.status === 404) throw new UserNotFoundError();
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`Chess.com: HTTP ${response.status}`);
  return response.json();
}

/**
 * Chess.com public API: player archives are months, each fetched whole
 * https://www.chess.com/news/view/published-data-api
 */
export const chessComSource: GameSource = {
  platform: 'chesscom',
  label: 'Chess.com',

  async fetchArchives(username) {
    const data = await getJson(`${API}/${encodeURIComponent(username.toLowerCase())}/games/archives`);
    const archiveUrls: string[] = data.archives || [];

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
    const data = await getJson(`${API}/${encodeURIComponent(username.toLowerCase())}/games/${archive.year}/${month}`);
    const games: any[] = data.games || [];

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
