# Chess Application Documentation

## Overview

This is a chess application built with React, TypeScript, and Tailwind CSS. It features an interactive chess board powered by `react-chessboard` and `chess.js` libraries, along with a Stockfish-powered position analyzer.

## Features

### 1. Interactive Chess Board
- Full chess game implementation using `react-chessboard` and `chess.js`
- Drag and drop piece movement
- Automatic move validation
- Game status display (check, checkmate, stalemate, draw)
- Pawn auto-promotion to queen
- New game reset button

### 2. Position Analyzer
- Stockfish engine integration via Web Worker
- Real-time position analysis
- Best move suggestion
- Evaluation display (centipawns or mate in N)
- Search depth indicator
- Loading and error states

## Architecture

### Main Components

#### `src/App.tsx`
Main application component that manages:
- Game state using `chess.js`
- View mode switching (Play/Analyze)
- Chess board rendering using `react-chessboard`
- Game status detection

#### `src/components/ChessAnalyzer.tsx`
Position analyzer component that:
- Accepts FEN position as prop
- Displays Stockfish analysis results
- Shows loading and error states
- Provides manual FEN input

#### `src/hooks/useStockfish.ts`
Custom React hook for Stockfish integration:
- Manages Web Worker lifecycle
- Implements UCI protocol communication
- Parses engine output (bestmove, score, depth)
- Provides type-safe API

### Libraries Used

- **react-chessboard** (v4.4.0): Interactive chess board component
- **chess.js**: Chess move validation and game logic
- **Stockfish**: Chess engine for position analysis (loaded via Web Worker)
- **React** 18.2.0: UI framework
- **TypeScript** 5.7.0: Type safety
- **Tailwind CSS** 4.1.7: Styling

## Setup

### Prerequisites

1. Node.js and npm installed
2. Stockfish engine files (see below)

### Stockfish Setup

Download Stockfish for web and place files in `public/stockfish/`:

1. Download from: https://github.com/lichess-org/stockfish.js/releases
2. Extract `stockfish.js` (and optionally `stockfish.wasm`)
3. Place in `public/stockfish/` directory

See `STOCKFISH_SETUP.md` for detailed instructions.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Usage

### Playing Chess

1. Click "Play" button to enter game mode
2. Drag and drop pieces to make moves
3. The game follows standard chess rules
4. Status bar shows current game state
5. Click "New Game" to reset

### Analyzing Positions

1. Click "Analyze" button to enter analysis mode
2. The analyzer shows the current board position
3. Click "Analyze" button to get Stockfish evaluation
4. View best move and evaluation score
5. You can manually enter FEN positions

## Technical Details

### Game State Management

The game uses `chess.js` for state management:
- Validates all moves according to chess rules
- Detects check, checkmate, stalemate, and draws
- Handles pawn promotion
- Provides FEN notation for position export

### Stockfish Integration

The analyzer communicates with Stockfish via UCI protocol:

1. **Initialization**: Worker loads `stockfish.js` from public directory
2. **Position Setup**: Sends `position fen <fen>` command
3. **Analysis**: Sends `go depth <n> movetime <ms>` command
4. **Parsing**: Extracts best move and evaluation from engine output
5. **Cleanup**: Terminates worker on component unmount

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

## Browser Requirements

- Modern browser with Web Worker support
- WebAssembly support (for Stockfish .wasm version)
- HTTPS in production (localhost works for development)

## Performance Tips

### Stockfish Analysis

- **Quick analysis**: `depth=12, movetime=1000`
- **Standard analysis**: `depth=15, movetime=2000`
- **Deep analysis**: `depth=20, movetime=5000`

### General

- Use `stop()` to cancel analysis early
- Engine runs in separate thread (no UI blocking)
- Automatic cleanup prevents memory leaks

## Troubleshooting

### Stockfish Not Loading

**Error**: "Failed to load Stockfish engine"

**Solutions**:
1. Check that `stockfish.js` exists in `public/stockfish/`
2. Verify file names match exactly (case-sensitive)
3. Check browser console for specific errors
4. Ensure you're using HTTPS (or localhost)

### Moves Not Working

**Issue**: Pieces don't move or moves are rejected

**Solutions**:
1. Check browser console for errors
2. Verify `chess.js` is properly installed
3. Ensure piece drag events are not blocked

### Build Errors

**Issue**: TypeScript or build errors

**Solutions**:
1. Run `npm install` to ensure all dependencies are installed
2. Check TypeScript version compatibility
3. Clear node_modules and reinstall

## File Structure

```
src/
├── App.tsx                    # Main application component
├── components/
│   └── ChessAnalyzer.tsx      # Stockfish analyzer component
├── hooks/
│   └── useStockfish.ts        # Stockfish Web Worker hook
├── main.tsx                   # Application entry point
└── index.css                  # Global styles

public/
└── stockfish/
    ├── stockfish.js           # Stockfish engine (required)
    └── stockfish.wasm         # WebAssembly binary (optional)
```

## Future Enhancements

Potential features to add:
- Move history display
- Position evaluation graph
- Opening book integration
- Game save/load (PGN format)
- Multi-player support
- Timer/clock functionality
- Sound effects
- Custom board themes

## License

MIT

## Credits

- **react-chessboard**: https://github.com/Clariity/react-chessboard
- **chess.js**: https://github.com/jhlywa/chess.js
- **Stockfish**: https://stockfishchess.org/
