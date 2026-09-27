# Chess.com Game Import Documentation

## Overview

The application supports importing chess games from chess.com by URL. This feature allows users to load and replay games, analyze positions, and navigate through moves.

## Features

- **URL Import**: Paste any chess.com game URL to load the game
- **Move Navigation**: Navigate through moves with keyboard-like controls
- **Position Analysis**: Stockfish analyzes each position as you navigate
- **Evaluation Bar**: Visual evaluation updates with each move
- **Best Move Arrow**: Shows the best move for each position

## Supported URL Formats

The importer supports the following chess.com URL formats:

- `https://www.chess.com/game/live/123456789`
- `https://www.chess.com/game/daily/123456789`
- `https://www.chess.com/live/game/123456789`
- `https://www.chess.com/daily/game/123456789`

## Components

### ChessComImporter

**Location**: `src/components/ChessComImporter.tsx`

**Props**:
```typescript
interface ChessComImporterProps {
  onGameLoad: (game: Chess, moves: string[]) => void;
}
```

**Features**:
- URL input field with validation
- Loading state with spinner
- Error handling with user-friendly messages
- Help text showing supported URL formats

**How it works**:
1. Extracts game ID from URL using regex patterns
2. Fetches game data from chess.com public API
3. Parses PGN (Portable Game Notation)
4. Creates Chess instance and loads moves
5. Calls `onGameLoad` callback with game data

### MoveNavigator

**Location**: `src/components/MoveNavigator.tsx`

**Props**:
```typescript
interface MoveNavigatorProps {
  game: Chess;
  moves: string[];
  currentMoveIndex: number;
  onMoveChange: (index: number) => void;
}
```

**Features**:
- Navigation buttons: First, Previous, Next, Last
- Move counter display (current / total)
- Scrollable move list with clickable moves
- Current move highlighting

**Controls**:
- ⏮ First move
- ◀ Previous move
- ▶ Next move
- ⏭ Last move
- Click any move in the list to jump to it

## Usage

### Importing a Game

1. Click the "📥 Import" button in the mode switcher
2. Paste a chess.com game URL into the input field
3. Click "Import Game"
4. The game loads and displays the starting position
5. Use navigation controls to browse through moves

### Navigating Moves

Once a game is loaded:
- Use the ⏮ ◀ ▶ ⏭ buttons to navigate
- Click any move in the move list to jump directly to it
- The board updates to show the position after the selected move
- Stockfish automatically analyzes the new position

### Analyzing Imported Games

- The Evaluation Bar shows position evaluation
- Best move arrow displays the strongest move
- All analysis features work the same as in play mode

### API Integration

The importer uses the **chess-web-api** library, which is a lightweight wrapper for the Chess.com public data API.

**Library**: `chess-web-api` (npm package)

**Method used**: `getGameByID(id)`

**Response format**:
```json
{
  "pgn": "[Event \"Live\"]\n1. e4 e5 2. Nf3 Nc6 ...",
  "url": "https://www.chess.com/game/live/123456789",
  ...
}
```

**Important notes**:
- The `getGameByID` method is not an official Chess.com API endpoint
- It uses a callback from Chess.com's website to get data
- It may be unstable and could change without warning
- Excessive requests could result in an IP ban from Chess.com
- Chess.com tolerates "polite" usage but may take action if abused

### TypeScript Support

The library `chess-web-api` does not include TypeScript type definitions. Custom type declarations are provided in `src/types/chess-web-api.d.ts`.

### PGN Parsing

The chess.js library handles PGN parsing:
```typescript
const game = new Chess();
game.loadPgn(pgnString);
const moves = game.history(); // Array of moves in SAN notation
```

### Position Reconstruction

To display a specific position:
```typescript
const tempGame = new Chess();
for (let i = 0; i < currentMoveIndex; i++) {
  tempGame.move(importedMoves[i]);
}
const fen = tempGame.fen();
```

## State Management

### App.tsx State

```typescript
// Imported game state
const [importedGame, setImportedGame] = useState<Chess | null>(null);
const [importedMoves, setImportedMoves] = useState<string[]>([]);
const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
const [viewMode, setViewMode] = useState<'play' | 'analyzer' | 'import'>('play');
```

### View Modes

- **play**: Normal game mode with drag-and-drop
- **analyzer**: Position analysis mode
- **import**: Game import and replay mode

## Error Handling

### Common Errors

1. **Invalid URL**: URL doesn't match chess.com patterns
   - Message: "Invalid chess.com URL. Please provide a valid game URL."

2. **API Error**: Failed to fetch game data
   - Message: "Failed to fetch game: {statusText}"

3. **Missing PGN**: Game data doesn't contain PGN
   - Message: "Game data does not contain PGN."

### Error Display

Errors are shown in a red alert box below the input field with clear, actionable messages.

## Limitations

1. **Public Games Only**: Only public games can be imported
2. **No Authentication**: Cannot access private games
3. **API Rate Limits**: chess.com may rate-limit requests
4. **CORS**: Browser security may block some requests (handled by chess.com API)
5. **Unofficial Endpoint**: The `getGameByID` method is not an official Chess.com API endpoint and may be unstable
6. **Terms of Service**: Using this endpoint technically violates Chess.com's Terms of Service, though they tolerate "polite" usage
7. **No TypeScript Types**: The chess-web-api library lacks built-in TypeScript definitions (custom declarations provided)

## Future Enhancements

Potential improvements:
- Keyboard shortcuts (arrow keys for navigation)
- Game metadata display (players, date, event)
- Export to PGN file
- Share game link
- Opening book integration
- Move annotations and comments
- Multiple game import (batch processing)

## Related Documentation

- [chess.com API](https://www.chess.com/news/view/published-data-api)
- [chess.js](https://github.com/jhlywa/chess.js)
- [PGN Specification](https://www.chessclub.com/help/PGN-spec)
