export type Platform = 'chesscom' | 'lichess';

/** A month of a player's games */
export interface Archive {
  year: number;
  /** 1-12 */
  month: number;
}

export interface ImportedPlayer {
  /** Missing for computer opponents */
  username?: string;
  /** Display name when there is no username, e.g. "Stockfish level 3" */
  name?: string;
  rating?: number;
}

/** Game normalized across platforms */
export interface ImportedGameData {
  platform: Platform;
  pgn: string;
  white: ImportedPlayer;
  black: ImportedPlayer;
  /** bullet / blitz / rapid / daily / classical… */
  timeClass?: string;
  /** Milliseconds since epoch */
  endTime?: number;
}

export interface GamesPage {
  games: ImportedGameData[];
  /** Pass back to fetch the next (older) page of the same month; absent when complete */
  cursor?: number;
}

export interface GameSource {
  platform: Platform;
  label: string;
  /** Resolves the canonical username and the months with games, newest first */
  fetchArchives(username: string): Promise<{ username: string; archives: Archive[] }>;
  fetchGames(username: string, archive: Archive, cursor?: number): Promise<GamesPage>;
}

/** Thrown when the player does not exist, so the UI can show a specific message */
export class UserNotFoundError extends Error {}

/** Thrown when the platform rate-limits us (HTTP 429); Lichess asks to wait a full minute */
export class RateLimitError extends Error {}
