import { Archive, GameSource, ImportedGameData, RateLimitError, UserNotFoundError } from './types';

const API = 'https://lichess.org/api';

/**
 * Games per request. Lichess streams exports to anonymous clients at about 20 games/s,
 * so pages are kept small and older games are loaded on demand.
 */
const PAGE_SIZE = 30;

/**
 * Lichess public API. It has no monthly archives, so months are derived from the account
 * creation date, and each month is queried with since/until timestamps.
 */
export const lichessSource: GameSource = {
  platform: 'lichess',
  label: 'Lichess',

  async fetchArchives(username) {
    const response = await fetch(`${API}/user/${encodeURIComponent(username)}`);
    if (response.status === 404) throw new UserNotFoundError();
    if (response.status === 429) throw new RateLimitError();
    if (!response.ok) throw new Error(`Lichess: HTTP ${response.status}`);
    const user = await response.json();
    if (user.disabled) throw new UserNotFoundError();

    // Every month from account creation to now, newest first (UTC, matching fetchGames bounds)
    const archives: Archive[] = [];
    const created = new Date(user.createdAt ?? Date.now());
    const now = new Date();
    for (let y = now.getUTCFullYear(), m = now.getUTCMonth(); ; m--) {
      if (m < 0) {
        m = 11;
        y--;
      }
      if (y < created.getUTCFullYear() || (y === created.getUTCFullYear() && m < created.getUTCMonth())) break;
      archives.push({ year: y, month: m + 1 });
    }

    return { username: user.username ?? username, archives };
  },

  async fetchGames(username, archive, cursor) {
    const monthStart = Date.UTC(archive.year, archive.month - 1, 1);
    const monthEnd = Date.UTC(archive.year, archive.month, 1) - 1;
    const params = new URLSearchParams({
      since: String(monthStart),
      until: String(cursor ?? monthEnd),
      max: String(PAGE_SIZE),
      pgnInJson: 'true',
      clocks: 'false',
      evals: 'false',
      opening: 'false',
    });

    const response = await fetch(`${API}/games/user/${encodeURIComponent(username)}?${params}`, {
      headers: { Accept: 'application/x-ndjson' },
    });
    if (response.status === 404) throw new UserNotFoundError();
    if (response.status === 429) throw new RateLimitError();
    if (!response.ok) throw new Error(`Lichess: HTTP ${response.status}`);

    // NDJSON: one game per line, newest first
    const raw: any[] = (await response.text())
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    const games: ImportedGameData[] = raw
      // Other variants and games from a custom position can't be replayed from the standard start
      .filter((game) => game.pgn && game.variant === 'standard' && !game.initialFen)
      .map((game) => ({
        platform: 'lichess',
        pgn: game.pgn,
        white: toPlayer(game.players?.white),
        black: toPlayer(game.players?.black),
        timeClass: game.speed,
        endTime: game.lastMoveAt ?? game.createdAt,
      }));

    // A full page means there may be older games in this month
    const oldest = raw[raw.length - 1];
    const nextCursor = raw.length === PAGE_SIZE && oldest?.createdAt ? oldest.createdAt - 1 : undefined;
    return { games, cursor: nextCursor };
  },
};

function toPlayer(player: any) {
  if (!player) return {};
  if (player.aiLevel) return { name: `Stockfish ${player.aiLevel}` };
  return { username: player.user?.name, rating: player.rating };
}
