import { Chess, Color, PieceSymbol } from 'chess.js';
import { StockfishScore } from '../hooks/useStockfish';

/**
 * Move classification for game review.
 *
 * Implemented from published rules (no code copied):
 * - Win probability and the inaccuracy/mistake/blunder thresholds follow Lichess:
 *   winning chances = 2 / (1 + e^(-0.00368208·cp)) - 1 with cp capped at ±1000 (mates count as ±1000),
 *   and a drop of 0.1 / 0.2 / 0.3 in winning chances (= 5 / 10 / 15 win-% points) is an
 *   inaccuracy / mistake / blunder.
 *   https://github.com/lichess-org/lila (modules/tree/src/main/Advice.scala, scalachess eval.scala),
 *   https://github.com/lichess-org/lila/pull/11148
 * - Brilliant, only move, best, excellent and good follow the scheme of the open-source
 *   Chess.com-style review in Chesskit (https://github.com/GuillaumeSD/Chesskit):
 *   brilliant = a piece sacrifice that doesn't lose win-%, only move = every alternative is at least
 *   10 win-% points worse, excellent/good = losing under 2 / 5 win-% points.
 */

export type MoveClass =
  | 'brilliant'
  | 'only'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'forced';

/** Engine line; score is relative to the side to move in the evaluated position */
export interface EngineLine {
  score: StockfishScore;
  pv: string[];
}

/** Engine evaluation of a position: best lines first (MultiPV) */
export interface PositionEval {
  lines: EngineLine[];
}

const CP_CEILING = 1000;

/**
 * Win probability (0-100) for the side to move
 */
export function winPercent(score: StockfishScore): number {
  const cp =
    score.type === 'mate'
      ? score.value > 0
        ? CP_CEILING
        : -CP_CEILING // mate 0: the side to move is checkmated
      : Math.max(-CP_CEILING, Math.min(CP_CEILING, score.value));
  const winningChances = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
  return 50 + 50 * winningChances;
}

const PIECE_VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function materialBalance(chess: Chess, color: Color): number {
  let balance = 0;
  for (const row of chess.board()) {
    for (const square of row) {
      if (square) balance += (square.color === color ? 1 : -1) * PIECE_VALUES[square.type];
    }
  }
  return balance;
}

function playUci(chess: Chess, uci: string) {
  return chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] as PieceSymbol | undefined });
}

/** Material the mover must be down, after the exchanges settle, for a move to count as a sacrifice */
const SACRIFICE_THRESHOLD = 2;
/** How far to follow the engine's reply while captures continue */
const MAX_EXCHANGE_PLIES = 8;

/**
 * Whether the move gives up material: play it and the engine's best continuation while the
 * sequence keeps capturing, then compare the mover's material with the starting position.
 */
function isSacrifice(fenBefore: string, playedUci: string, replyPv: string[]): boolean {
  const chess = new Chess(fenBefore);
  const mover = chess.turn();
  const start = materialBalance(chess, mover);

  try {
    playUci(chess, playedUci);
    for (const uci of replyPv.slice(0, MAX_EXCHANGE_PLIES)) {
      const move = playUci(chess, uci);
      // The exchange is over once a side makes a quiet move (it isn't answered by a capture)
      if (!move.captured && !move.promotion) break;
    }
  } catch {
    return false;
  }

  return start - materialBalance(chess, mover) >= SACRIFICE_THRESHOLD;
}

/**
 * A capture right back on the square where the opponent just captured: an obvious move,
 * never counted as the only move even when alternatives are much worse
 */
function isRecapture(previousMove: { to: string; captured?: string } | undefined, playedUci: string) {
  // The opponent's capturing piece stands on that square, so moving there captures it back
  return !!previousMove?.captured && playedUci.slice(2, 4) === previousMove.to;
}

export interface MoveContext {
  /** Position before the move */
  fenBefore: string;
  playedUci: string;
  /** Evaluation before the move (side to move = mover) */
  before: PositionEval;
  /** Evaluation after the move (side to move = opponent) */
  after: PositionEval;
  /** The opponent's previous move, for recapture detection */
  previousMove?: { to: string; captured?: string };
}

export function classifyMove({ fenBefore, playedUci, before, after, previousMove }: MoveContext): MoveClass | null {
  if (new Chess(fenBefore).moves().length === 1) return 'forced';
  if (!before.lines[0] || !after.lines[0]) return null;

  const winBefore = winPercent(before.lines[0].score);
  // When the played move is one of the engine's lines, take its value from that same search:
  // comparing two separate short searches adds their noise (e.g. 1...e5 flagged as inaccurate).
  // Otherwise use the evaluation after the move, flipped to the mover's perspective.
  const playedLine = before.lines.find((line) => line.pv[0] === playedUci);
  const winAfter = playedLine ? winPercent(playedLine.score) : 100 - winPercent(after.lines[0].score);
  const loss = winBefore - winAfter;

  const isBest = before.lines[0].pv[0] === playedUci;
  const alternative = before.lines.find((line) => line.pv[0] !== playedUci);
  const alternativeWin = alternative && winPercent(alternative.score);

  // Special moves: keep the evaluation, the position isn't lost, and the alternatives aren't
  // already crushing (then any move wins and nothing is special)
  if (loss <= 2 && alternativeWin !== undefined && winAfter >= 50 && alternativeWin <= 97) {
    if (isSacrifice(fenBefore, playedUci, after.lines[0].pv)) return 'brilliant';
    if (winAfter - alternativeWin >= 10 && !isRecapture(previousMove, playedUci)) return 'only';
  }

  if (isBest) return 'best';
  if (loss < 2) return 'excellent';
  if (loss < 5) return 'good';
  if (loss < 10) return 'inaccuracy';
  if (loss < 15) return 'mistake';
  return 'blunder';
}

/**
 * Evaluation of a finished position (no legal moves), which the engine doesn't analyze
 */
export function terminalEval(fen: string): PositionEval | null {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return { lines: [{ score: { type: 'mate', value: 0 }, pv: [] }] };
  if (chess.isStalemate()) return { lines: [{ score: { type: 'cp', value: 0 }, pv: [] }] };
  return null;
}
