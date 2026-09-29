import { useState, useEffect, useRef, useCallback } from 'react';

/** Score from Stockfish analysis */
export interface StockfishScore {
  type: 'cp' | 'mate';
  value: number;
}

/** One principal variation (engine line) */
export interface PrincipalVariation {
  /** 1-based rank of the line (1 = best) */
  multipv: number;
  depth: number;
  score: StockfishScore;
  /** Moves in UCI notation, e.g. ["e2e4", "e7e5"] */
  moves: string[];
}

/** Analysis result from Stockfish */
export interface StockfishAnalysis {
  /** Position being analyzed; scores are relative to its side to move */
  fen: string | null;
  bestMove: string | null;
  score: StockfishScore | null;
  depth: number;
  /** Top lines sorted by rank */
  lines: PrincipalVariation[];
  isThinking: boolean;
}

/** UCI info parsed from Stockfish output */
interface UCIInfo {
  depth?: number;
  multipv?: number;
  score?: StockfishScore;
  pv?: string[];
}

/** Number of principal variations the engine reports */
const MULTI_PV = 3;

/**
 * Hook for integrating Stockfish chess engine via Web Worker
 * Uses UCI protocol to communicate with the engine
 */
export function useStockfish(engineUrl: string) {
  const [analysis, setAnalysis] = useState<StockfishAnalysis>({
    fen: null,
    bestMove: null,
    score: null,
    depth: 0,
    lines: [],
    isThinking: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const currentAnalysisRef = useRef<{
    resolve: ((result: StockfishAnalysis) => void) | null;
  }>({ resolve: null });
  // Stockfish prints its lines as a batch (multipv 1..N); collect a batch and publish it whole,
  // otherwise lines from different batches get mixed and appear out of order
  const pendingLinesRef = useRef<PrincipalVariation[]>([]);
  // Whether a "go" is running. A new analysis stops it first and waits for its "bestmove"
  // before starting: this engine build otherwise delays the old "bestmove" until the new
  // search ends, making the two searches' output indistinguishable
  const isSearchingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const queuedSearchRef = useRef<{ fen: string; depth: number; movetime: number } | null>(null);

  // Start the engine worker; switching engines replaces it and resets all search state
  useEffect(() => {
    isSearchingRef.current = false;
    isStoppingRef.current = false;
    queuedSearchRef.current = null;
    pendingLinesRef.current = [];
    currentAnalysisRef.current.resolve = null;
    setIsLoading(true);
    setError(null);
    setAnalysis({ fen: null, bestMove: null, score: null, depth: 0, lines: [], isThinking: false });

    try {
      workerRef.current = new Worker(engineUrl);

      // Handle messages from Stockfish
      workerRef.current.onmessage = (e) => {
        const line = e.data as string;

        // Output of a search stopped by a newer analyze() call: skip it, then start the queued search
        if (isStoppingRef.current) {
          if (line.startsWith('bestmove')) {
            isStoppingRef.current = false;
            isSearchingRef.current = false;
            const queued = queuedSearchRef.current;
            queuedSearchRef.current = null;
            if (queued) startSearch(queued.fen, queued.depth, queued.movetime);
          }
          if (line.startsWith('info') || line.startsWith('bestmove')) return;
        }

        // Parse "info" lines
        if (line.startsWith('info')) {
          const info = parseUCIInfo(line);
          
          // "mate 0" with a pv is Stockfish's placeholder for a line it has not searched yet
          // (printed when the time limit interrupts a MultiPV iteration)
          const isPlaceholder = info.score?.type === 'mate' && info.score.value === 0;

          if (info.depth && info.score && info.pv?.length && !isPlaceholder) {
            const line: PrincipalVariation = {
              multipv: info.multipv ?? 1,
              depth: info.depth,
              score: info.score,
              moves: info.pv,
            };

            if (line.multipv === 1) {
              // A new batch starts; publish the previous one if it was cut short
              // (positions with fewer legal moves than MULTI_PV)
              publishPendingLines();
            }
            pendingLinesRef.current[line.multipv - 1] = line;
            if (line.multipv === MULTI_PV) {
              publishPendingLines();
            }

            // Only the best line drives the overall score/depth
            if (line.multipv === 1) {
              setAnalysis((prev) => ({ ...prev, depth: line.depth, score: line.score }));
            }
          }
        }

        // Parse "bestmove" line
        if (line.startsWith('bestmove')) {
          isSearchingRef.current = false;

          // Publish a final batch that has fewer lines than MULTI_PV
          publishPendingLines();

          const parts = line.split(' ');
          const bestMove = parts[1] !== '(none)' ? parts[1] : null;

          setAnalysis((prev) => {
            const result = {
              ...prev,
              bestMove,
              isThinking: false,
            };

            // Resolve the promise
            if (currentAnalysisRef.current.resolve) {
              currentAnalysisRef.current.resolve(result);
              currentAnalysisRef.current.resolve = null;
            }

            return result;
          });
        }

        // Check if engine is ready
        if (line.startsWith('readyok')) {
          setIsLoading(false);
          setError(null);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        setError(`Failed to load the engine (${engineUrl}). Check that its files are present in public/stockfish/`);
        setIsLoading(false);
        setAnalysis((prev) => ({ ...prev, isThinking: false }));
      };

      // Initialize UCI protocol
      workerRef.current.postMessage('uci');
      workerRef.current.postMessage(`setoption name MultiPV value ${MULTI_PV}`);
      workerRef.current.postMessage('isready');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      setError('Failed to initialize Stockfish engine. Web Workers may not be supported in your browser.');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [engineUrl]);

  /**
   * Send a position and start searching it
   */
  function startSearch(fen: string, depth: number, movetime: number) {
    if (!workerRef.current) return;
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${depth} movetime ${movetime}`);
    isSearchingRef.current = true;
  }

  /**
   * Publish the collected lines of the current depth to the analysis state
   */
  function publishPendingLines() {
    const lines = pendingLinesRef.current.filter(Boolean);
    pendingLinesRef.current = [];
    // A batch printed when the time limit interrupts an iteration mixes new-depth lines with
    // stale previous-depth scores and is out of order; keep the last complete batch instead
    const isConsistent = lines.every((line) => line.depth === lines[0].depth);
    if (lines.length > 0 && isConsistent) {
      setAnalysis((prev) => ({ ...prev, lines }));
    }
  }

  /**
   * Parse UCI info line from Stockfish
   * Example: "info depth 20 score cp 35 pv e2e4 e7e5"
   */
  const parseUCIInfo = (line: string): UCIInfo => {
    const parts = line.split(' ');
    const info: UCIInfo = {};

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'depth' && parts[i + 1]) {
        info.depth = parseInt(parts[i + 1], 10);
      } else if (parts[i] === 'multipv' && parts[i + 1]) {
        info.multipv = parseInt(parts[i + 1], 10);
      } else if (parts[i] === 'score') {
        if (parts[i + 1] === 'cp' && parts[i + 2]) {
          info.score = {
            type: 'cp',
            value: parseInt(parts[i + 2], 10),
          };
        } else if (parts[i + 1] === 'mate' && parts[i + 2]) {
          info.score = {
            type: 'mate',
            value: parseInt(parts[i + 2], 10),
          };
        }
      } else if (parts[i] === 'pv') {
        info.pv = parts.slice(i + 1);
        break;
      }
    }

    return info;
  };

  /**
   * Analyze a position given in FEN notation
   * @param fen - FEN string of the position
   * @param depth - Search depth (default: 15)
   * @param movetime - Time limit in milliseconds (default: 2000)
   * @returns Promise with analysis result
   */
  const analyze = useCallback(
    async (
      fen: string,
      depth: number = 15,
      movetime: number = 2000
    ): Promise<StockfishAnalysis> => {
      if (!workerRef.current) {
        throw new Error('Stockfish worker not initialized');
      }

      // Reset analysis state
      pendingLinesRef.current = [];
      setAnalysis({
        fen,
        bestMove: null,
        score: null,
        depth: 0,
        lines: [],
        isThinking: true,
      });

      if (isSearchingRef.current) {
        // Interrupt the running search instead of letting it run out its time; the new one
        // starts once it has stopped (only the latest request is kept)
        queuedSearchRef.current = { fen, depth, movetime };
        if (!isStoppingRef.current) {
          isStoppingRef.current = true;
          workerRef.current.postMessage('stop');
        }
      } else {
        startSearch(fen, depth, movetime);
      }

      // Return a promise that resolves when bestmove is received
      return new Promise((resolve) => {
        currentAnalysisRef.current.resolve = resolve;
      });
    },
    []
  );

  /**
   * Stop analyzing (e.g. the game is over): interrupt a running search, drop a queued one and
   * clear the results, attributing the empty analysis to `fen`
   */
  const cancel = useCallback((fen: string | null = null) => {
    queuedSearchRef.current = null;
    if (isSearchingRef.current && !isStoppingRef.current && workerRef.current) {
      // Its remaining output is skipped in onmessage until its "bestmove"
      isStoppingRef.current = true;
      workerRef.current.postMessage('stop');
    }
    pendingLinesRef.current = [];
    setAnalysis({ fen, bestMove: null, score: null, depth: 0, lines: [], isThinking: false });
  }, []);

  return {
    analysis,
    analyze,
    cancel,
    isLoading,
    error,
  };
}
