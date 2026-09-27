import { useState, useEffect, useRef, useCallback } from 'react';

/** Score from Stockfish analysis */
export interface StockfishScore {
  type: 'cp' | 'mate';
  value: number;
}

/** Analysis result from Stockfish */
export interface StockfishAnalysis {
  bestMove: string | null;
  score: StockfishScore | null;
  depth: number;
  isThinking: boolean;
}

/** UCI info parsed from Stockfish output */
interface UCIInfo {
  depth?: number;
  score?: StockfishScore;
  pv?: string[];
}

/**
 * Hook for integrating Stockfish chess engine via Web Worker
 * Uses UCI protocol to communicate with the engine
 */
export function useStockfish() {
  const [analysis, setAnalysis] = useState<StockfishAnalysis>({
    bestMove: null,
    score: null,
    depth: 0,
    isThinking: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const currentAnalysisRef = useRef<{
    resolve: ((result: StockfishAnalysis) => void) | null;
  }>({ resolve: null });

  // Initialize Stockfish worker
  useEffect(() => {
    try {
      // Create worker from public/stockfish/stockfish.js
      workerRef.current = new Worker('/stockfish/stockfish.js');

      // Handle messages from Stockfish
      workerRef.current.onmessage = (e) => {
        const line = e.data as string;
        
        // Parse "info" lines
        if (line.startsWith('info')) {
          const info = parseUCIInfo(line);
          
          if (info.depth && info.score) {
            setAnalysis((prev) => ({
              ...prev,
              depth: info.depth!,
              score: info.score!,
            }));
          }
        }

        // Parse "bestmove" line
        if (line.startsWith('bestmove')) {
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
        setError('Failed to load Stockfish engine. Please check if stockfish.js is present in public/stockfish/');
        setIsLoading(false);
        setAnalysis((prev) => ({ ...prev, isThinking: false }));
      };

      // Initialize UCI protocol
      workerRef.current.postMessage('uci');
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
  }, []);

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
      setAnalysis({
        bestMove: null,
        score: null,
        depth: 0,
        isThinking: true,
      });

      // Send position to Stockfish
      workerRef.current.postMessage(`position fen ${fen}`);
      
      // Start analysis with depth and time limit
      workerRef.current.postMessage(`go depth ${depth} movetime ${movetime}`);

      // Return a promise that resolves when bestmove is received
      return new Promise((resolve) => {
        currentAnalysisRef.current.resolve = resolve;
      });
    },
    []
  );

  /**
   * Stop current analysis
   */
  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage('stop');
    }
  }, []);

  return {
    analysis,
    analyze,
    stop,
    isLoading,
    error,
  };
}
