# Stockfish Engine Files

This directory should contain the Stockfish chess engine files for web usage.

## Required Files

- `stockfish.js` - Main Stockfish engine compiled to JavaScript
- `stockfish.wasm` - WebAssembly binary (if available)

## How to Get These Files

1. Download from official Stockfish releases:
   https://github.com/official-stockfish/stockfish/releases

2. Or use pre-built web version:
   https://github.com/lichess-org/stockfish.js/releases

3. Place `stockfish.js` (and optionally `stockfish.wasm`) in this directory

## Usage

The ChessAnalyzer component will automatically load Stockfish from this location via Web Worker.

See STOCKFISH_SETUP.md in the project root for detailed instructions.
