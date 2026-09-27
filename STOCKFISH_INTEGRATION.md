# Stockfish Integration - Quick Start

## What Was Created

### 1. Type-Safe Hook: `src/hooks/useStockfish.ts`

A React hook that manages communication with Stockfish via Web Worker using UCI protocol.

**Features:**
- Type-safe API with TypeScript interfaces
- Parses UCI protocol responses (bestmove, score, depth)
- Supports both centipawn and mate scores
- Promise-based analysis with async/await
- Automatic cleanup on unmount

**Usage:**
```typescript
import { useStockfish } from './hooks/useStockfish';

const { analysis, analyze, stop } = useStockfish();

// Analyze a position
const result = await analyze(fen, depth, movetime);
// result.bestMove - best move in UCI format (e.g., "e2e4")
// result.score - evaluation (cp or mate)
// result.depth - search depth reached
// result.isThinking - whether engine is analyzing
```

### 2. Analyzer Component: `src/components/ChessAnalyzer.tsx`

A ready-to-use UI component for position analysis.

**Props:**
- `fen?: string` - Optional initial FEN position

**Features:**
- FEN input field
- Analyze/Stop buttons
- Real-time analysis status ("Thinking...")
- Best move display
- Evaluation display (with color coding)
- Search depth indicator
- Responsive design with Tailwind CSS

**Usage:**
```typescript
import { ChessAnalyzer } from './components/ChessAnalyzer';

// Basic usage
<ChessAnalyzer />

// With initial position
<ChessAnalyzer fen="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3" />
```

### 3. Setup Instructions: `STOCKFISH_SETUP.md`

Detailed guide on downloading and setting up Stockfish files.

### 4. Integration in App

The main App now includes a mode switcher between:
- **Play** - Interactive chess board
- **Analyze** - Stockfish position analyzer

## Stockfish Files Required

Download and place in `public/stockfish/`:
- `stockfish.js` - Main engine (required)
- `stockfish.wasm` - WebAssembly binary (optional, improves performance)

**Download from:**
- Official: https://github.com/official-stockfish/stockfish/releases
- Pre-built: https://github.com/lichess-org/stockfish.js/releases

## Technical Details

### UCI Protocol Implementation

The hook implements the Universal Chess Interface protocol:

1. **Initialization:**
   - Sends `uci` command to initialize engine
   - Sends `isready` to confirm engine is ready

2. **Analysis:**
   - Sends `position fen <fen>` to set position
   - Sends `go depth <n> movetime <ms>` to start analysis
   - Receives `info` lines with depth, score, pv (principal variation)
   - Receives `bestmove <move>` when analysis completes

3. **Parsing:**
   - Extracts depth from `info depth <n>`
   - Extracts score from `info score cp <n>` or `info score mate <n>`
   - Extracts best move from `bestmove <move>`

### Type Safety

All Stockfish interactions are fully typed:

```typescript
interface StockfishScore {
  type: 'cp' | 'mate';
  value: number;
}

interface StockfishAnalysis {
  bestMove: string | null;
  score: StockfishScore | null;
  depth: number;
  isThinking: boolean;
}
```

### Web Worker Architecture

- Stockfish runs in a separate Web Worker thread
- Prevents UI blocking during analysis
- Communicates via postMessage API
- Automatic cleanup on component unmount

## Browser Requirements

- Web Worker support
- WebAssembly support (for .wasm version)
- HTTPS in production (localhost works for development)

## Performance Tips

1. **Depth vs Time:**
   - Use `depth` for fixed-depth analysis (more predictable)
   - Use `movetime` for time-limited analysis (better for UI responsiveness)

2. **Recommended Settings:**
   - Quick analysis: `depth=12, movetime=1000`
   - Standard analysis: `depth=15, movetime=2000`
   - Deep analysis: `depth=20, movetime=5000`

3. **Stop Early:**
   - Call `stop()` to cancel analysis if user navigates away

## Error Handling

The hook includes error handling for:
- Worker initialization failures
- Invalid FEN positions
- Engine crashes
- Network issues (when loading stockfish.js)

Check browser console for detailed error messages.

## Next Steps

To complete the integration:

1. Download Stockfish files (see STOCKFISH_SETUP.md)
2. Place them in `public/stockfish/`
3. Test the analyzer with a FEN position
4. Adjust analysis parameters as needed

## Example FEN Positions

```
Starting position:
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

Italian Game:
r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3

Sicilian Defense:
rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2
```
