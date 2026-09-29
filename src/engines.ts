/**
 * Chess engines the user can pick. Each runs as a Web Worker from public/stockfish/ and speaks UCI.
 * Files come from official releases:
 * - Stockfish 19 Lite: stockfish.js by Nathan Rugg / Chess.com, npm `stockfish@19.0.0`
 *   (identical to https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.0), GPL-3.0.
 *   Single-threaded "lite" build: small NNUE net, no cross-origin isolation (COOP/COEP) needed.
 * - Stockfish 2018: the original niklasf/stockfish.js build (UCI name "Stockfish 2018-07-25
 *   Multi-Variant", classical evaluation), kept as the lightweight legacy option.
 */
export interface EngineInfo {
  id: string;
  /** Display name */
  name: string;
  /** Worker script; its .wasm is loaded from the same folder */
  url: string;
}

// Relative to the deploy base (e.g. /chess-evaluate/ on GitHub Pages), see `base` in vite.config.js
const BASE = import.meta.env.BASE_URL;

export const ENGINES: EngineInfo[] = [
  { id: 'sf19-lite', name: 'Stockfish 19 Lite', url: `${BASE}stockfish/stockfish-19-lite-single.js` },
  { id: 'sf-2018', name: 'Stockfish 2018 (classic)', url: `${BASE}stockfish/stockfish.js` },
];

export const DEFAULT_ENGINE_ID = ENGINES[0].id;

/** Engine by id, falling back to the default (e.g. for an outdated saved choice) */
export function getEngine(id: string): EngineInfo {
  return ENGINES.find((engine) => engine.id === id) ?? ENGINES[0];
}
