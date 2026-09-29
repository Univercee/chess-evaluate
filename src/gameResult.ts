import { Chess } from 'chess.js';
import { TranslationKey } from './i18n';

export interface GameResult {
  /** PGN-style result */
  score: '1-0' | '0-1' | '1/2-1/2';
  /** Why the game ended, as a translation key */
  message: TranslationKey;
}

/**
 * Result of a finished position, or null while the game goes on.
 * Needs the move history in `chess` for threefold repetition.
 */
export function getGameResult(chess: Chess): GameResult | null {
  if (chess.isCheckmate()) {
    // The side to move is mated
    return chess.turn() === 'w'
      ? { score: '0-1', message: 'result.blackWins' }
      : { score: '1-0', message: 'result.whiteWins' };
  }
  if (chess.isStalemate()) return { score: '1/2-1/2', message: 'result.stalemate' };
  if (chess.isInsufficientMaterial()) return { score: '1/2-1/2', message: 'result.insufficient' };
  if (chess.isThreefoldRepetition()) return { score: '1/2-1/2', message: 'result.threefold' };
  if (chess.isDrawByFiftyMoves()) return { score: '1/2-1/2', message: 'result.fiftyMoves' };
  return null;
}
