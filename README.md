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

### 3. Game Import from Chess.com
- Import games by pasting chess.com URL
- Support for live and daily games
- Move-by-move navigation
- Position analysis for each move
- Evaluation bar visualization
- Best move arrow display

### 4. Evaluation Bar
- Visual position assessment
- Vertical bar showing advantage
- Numerical evaluation display
- Smooth animations
- Mate detection

## Architecture

### Main Components

#### `src/App.tsx`
Main application component that manages:
- Game state using `chess.js`
- View mode switching (Play/Analyze/Import)
- Chess board rendering using `react-chessboard`
- Game status detection
- Imported game state and navigation
- Integration with Stockfish analysis

#### `src/components/ChessAnalyzer.tsx`
Position analyzer component that:
- Accepts FEN position as prop
- Displays Stockfish analysis results
- Shows loading and error states
- Provides manual FEN input

#### `src/components/ChessComImporter.tsx`
Chess.com game import component that:
- Accepts chess.com game URLs
- Extracts game ID from various URL formats
- Fetches game data via chess.com API
- Parses PGN notation
- Loads game into chess.js instance

#### `src/components/MoveNavigator.tsx`
Move navigation component that:
- Displays move list with clickable moves
- Provides navigation buttons (first, prev, next, last)
- Shows current move counter
- Highlights current move

#### `src/components/EvaluationBar.tsx`
Visual evaluation component that:
- Displays position evaluation as vertical bar
- Shows numerical evaluation (centipawns or mate)
- Animates smoothly on evaluation changes
- Adapts to board height

#### `src/hooks/useStockfish.ts`
Custom React hook for Stockfish integration:
- Manages Web Worker lifecycle
- Implements UCI protocol communication
- Parses engine output (bestmove, score, depth)
- Provides type-safe API

### Libraries Used

- **react-chessboard** (v4.4.0): Interactive chess board component
- **chess.js**: Chess move validation and game logic
- **chess-web-api**: Chess.com API wrapper for game import
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

### Importing Games from Chess.com

1. Click "📥 Import" button to enter import mode
2. Enter a chess.com username (e.g., `hikaru`)
3. Click "Get Archives" to load the player's game archives
4. Select a month from the archive list
5. Browse games with pagination (10 per page)
6. Click on a game to import it
7. Use navigation controls (⏮ ◀ ▶ ⏭) to browse through moves
8. Click any move in the move list to jump directly to it
9. Stockfish analyzes each position automatically
10. Evaluation bar and best move arrow update with each move

**Features:**
- Browse all monthly archives for any player
- View games organized by month
- Pagination for easy navigation (10 games per page)
- Game metadata (players, ratings, time control, date)
- Uses official Chess.com API (stable and reliable)

See `CHESS_COM_IMPORT.md` for detailed documentation.

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

### Chess.com Game Import

The importer uses the **chess-web-api** library to fetch game data:

1. **URL Parsing**: Extracts game ID from chess.com URL
2. **API Call**: Uses `getGameByID(id)` method to fetch game data
3. **PGN Parsing**: Loads PGN into chess.js instance
4. **Move Extraction**: Extracts move history for navigation

**Note**: The `getGameByID` method is not an official Chess.com API endpoint. It uses an unofficial callback mechanism and may be unstable.

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
├── App.tsx                       # Main application component
├── components/
│   ├── ChessAnalyzer.tsx         # Stockfish analyzer component
│   ├── ChessComImporter.tsx      # Chess.com game import component
│   ├── MoveNavigator.tsx         # Move navigation component
│   └── EvaluationBar.tsx         # Visual evaluation bar component
├── hooks/
│   └── useStockfish.ts           # Stockfish Web Worker hook
├── main.tsx                      # Application entry point
└── index.css                     # Global styles

public/
└── stockfish/
    ├── stockfish.js              # Stockfish engine (required)
    └── stockfish.wasm            # WebAssembly binary (optional)
```

## Future Enhancements

Potential features to add:
- Position evaluation graph
- Opening book integration
- Multi-player support
- Timer/clock functionality
- Sound effects
- Custom board themes
- Keyboard shortcuts for move navigation
- Game metadata display (players, date, event)
- Export to PGN file
- Share game link

## License

MIT

## Credits

- **react-chessboard**: https://github.com/Clariity/react-chessboard
- **chess.js**: https://github.com/jhlywa/chess.js
- **Stockfish**: https://stockfishchess.org/
