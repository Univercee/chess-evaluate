import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { classifyMove, EngineLine, MoveClass, PositionEval, terminalEval } from './classify';

export interface GameReview {
  /** Classification per game move (index = ply - 1); null until evaluated */
  classes: (MoveClass | null)[];
  /** Positions evaluated so far, out of moves + 1 */
  evaluated: number;
  total: number;
  isRunning: boolean;
  error: boolean;
}

/**
 * Three lines: the best move, the best alternative ("only move" detection), and more chances that
 * the played move is scored within the same search (see classifyMove)
 */
const MULTI_PV = 3;
/**
 * Per-position search limit. A node budget (not time) plus a cleared hash (ucinewgame) makes the
 * review reproducible regardless of machine load: about 0.5 s per position (depth ~14) with
 * Stockfish 19 Lite, about 1-7 s with the legacy 2018 build.
 */
const GO_COMMAND = 'go nodes 300000';

const EMPTY: GameReview = { classes: [], evaluated: 0, total: 0, isRunning: false, error: false };

// Finished reviews per engine and game, so reopening a game doesn't re-analyze it
const reviewCache = new Map<string, GameReview>();
const cacheKeyFor = (engineUrl: string, moves: string[]) => `${engineUrl}|${moves.join(' ')}`;

/** Whether this game already has a finished review with this engine (shown without starting one) */
export function hasCachedReview(moves: string[], engineUrl: string): boolean {
  return reviewCache.has(cacheKeyFor(engineUrl, moves));
}

/**
 * Classify every move of a game with a dedicated engine worker, separate from the live analysis.
 * Results arrive progressively; the review restarts whenever `moves` or the engine changes.
 */
export function useGameReview(moves: string[] | null, engineUrl: string): GameReview {
  const [review, setReview] = useState<GameReview>(EMPTY);

  useEffect(() => {
    if (!moves || moves.length === 0) {
      setReview(EMPTY);
      return;
    }

    const cacheKey = cacheKeyFor(engineUrl, moves);
    const cached = reviewCache.get(cacheKey);
    if (cached) {
      setReview(cached);
      return;
    }

    // Positions and moves of the game
    const chess = new Chess();
    const fens = [chess.fen()];
    const history: { uci: string; to: string; captured?: string }[] = [];
    for (const san of moves) {
      const move = chess.move(san);
      history.push({ uci: move.from + move.to + (move.promotion ?? ''), to: move.to, captured: move.captured });
      fens.push(chess.fen());
    }

    const total = fens.length;
    const evals: (PositionEval | null)[] = new Array(total).fill(null);
    const classes: (MoveClass | null)[] = new Array(moves.length).fill(null);
    let current: GameReview = { classes, evaluated: 0, total, isRunning: true, error: false };
    setReview(current);

    const publish = (patch: Partial<GameReview>) => {
      current = { ...current, ...patch, classes: [...classes] };
      setReview(current);
    };

    // Classify the moves that led to and from a newly evaluated position
    const classifyAround = (index: number) => {
      for (const ply of [index, index + 1]) {
        const before = evals[ply - 1];
        const after = evals[ply];
        if (ply < 1 || ply > moves.length || !before || !after) continue;
        classes[ply - 1] = classifyMove({
          fenBefore: fens[ply - 1],
          playedUci: history[ply - 1].uci,
          before,
          after,
          previousMove: history[ply - 2],
        });
      }
    };

    let cancelled = false;
    let worker: Worker;
    try {
      worker = new Worker(engineUrl);
    } catch {
      publish({ isRunning: false, error: true });
      return;
    }

    let index = 0;
    // Latest line per multipv of the search in progress, and the last complete batch
    let pending: EngineLine[] = [];
    let pendingDepth = 0;
    let complete: EngineLine[] = [];
    // Lines to expect per batch: fewer when the position has fewer legal moves
    let expectedLines = MULTI_PV;

    const finishPosition = (evaluation: PositionEval) => {
      evals[index] = evaluation;
      classifyAround(index);
      index++;
      publish({ evaluated: index });
      if (index < total) {
        startPosition();
      } else {
        publish({ isRunning: false });
        reviewCache.set(cacheKey, current);
        worker.terminate();
      }
    };

    const startPosition = () => {
      if (cancelled) return;
      const terminal = terminalEval(fens[index]);
      if (terminal) {
        finishPosition(terminal);
        return;
      }
      pending = [];
      pendingDepth = 0;
      complete = [];
      expectedLines = Math.min(MULTI_PV, new Chess(fens[index]).moves().length);
      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fens[index]}`);
      worker.postMessage(GO_COMMAND);
    };

    worker.onmessage = (e) => {
      if (cancelled) return;
      const line = String(e.data);

      if (line === 'readyok') {
        startPosition();
        return;
      }

      if (line.startsWith('info') && line.includes(' pv ')) {
        const depth = Number(line.match(/ depth (\d+)/)?.[1]);
        const multipv = Number(line.match(/ multipv (\d+)/)?.[1] ?? 1);
        const score = line.match(/ score (cp|mate) (-?\d+)/);
        const pv = line.split(' pv ')[1]?.trim().split(' ') ?? [];
        // "mate 0" with a pv is a placeholder for a line not searched yet
        if (!score || (score[1] === 'mate' && score[2] === '0')) return;

        if (depth !== pendingDepth) {
          pending = [];
          pendingDepth = depth;
        }
        pending[multipv - 1] = { score: { type: score[1] as 'cp' | 'mate', value: Number(score[2]) }, pv };
        // Keep the last batch that has every line: a batch cut by the node limit mixes depths
        if (pending.filter(Boolean).length === expectedLines) complete = pending.filter(Boolean);
        return;
      }

      if (line.startsWith('bestmove')) {
        finishPosition({ lines: complete.length ? complete : pending.filter(Boolean) });
      }
    };

    worker.onerror = () => {
      if (!cancelled) publish({ isRunning: false, error: true });
    };

    worker.postMessage('uci');
    worker.postMessage(`setoption name MultiPV value ${MULTI_PV}`);
    worker.postMessage('isready');

    return () => {
      cancelled = true;
      worker.terminate();
    };
  }, [moves, engineUrl]);

  return review;
}
