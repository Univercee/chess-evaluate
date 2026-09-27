# Chess.com Game Import Documentation

## Overview

The application supports importing chess games from chess.com by username. This feature allows users to browse player archives, view games by month, and import specific games for analysis and replay.

## Features

- **Username Import**: Enter a chess.com username to browse their game archives
- **Archive Browsing**: View all monthly archives for a player
- **Game Selection**: Browse games within each archive with pagination
- **Move Navigation**: Navigate through moves with keyboard-like controls
- **Position Analysis**: Stockfish analyzes each position as you navigate
- **Evaluation Bar**: Visual evaluation updates with each move
- **Best Move Arrow**: Shows the best move for each position

## How It Works

1. **Enter Username**: User enters a chess.com username (e.g., "hikaru")
2. **Fetch Archives**: Application retrieves list of monthly archives via API
3. **Select Archive**: User selects a specific month to view games
4. **Browse Games**: Games are displayed with pagination (10 per page)
5. **Import Game**: User clicks on a game to load it for analysis

## Components

### ChessComImporter

**Location**: `src/components/ChessComImporter.tsx`

**Props**:
```typescript
interface ChessComImporterProps {
  onGameLoad: (game: Chess, moves: string[]) => void;
}
```

**State Management**:
```typescript
const [username, setUsername] = useState('');
const [archives, setArchives] = useState<string[]>([]);
const [selectedArchive, setSelectedArchive] = useState<string | null>(null);
const [games, setGames] = useState<GameData[]>([]);
const [currentPage, setCurrentPage] = useState(0);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Key Methods**:

1. **fetchArchives()**: Retrieves monthly archives for a player
   - Uses `chessAPI.getPlayerMonthlyArchives(username)`
   - Returns array of archive URLs
   - **Sorted in reverse order (newest first)** using `localeCompare`
   - Updates `archives` state

2. **fetchGamesFromArchive(archiveUrl)**: Loads games from selected archive
   - Parses year/month from archive URL
   - Uses `chessAPI.getPlayerCompleteMonthlyArchives(username, year, month)`
   - **Sorted by `end_time` in reverse order (newest first)**
   - Updates `games` state with game data

3. **loadGame(gameData)**: Imports selected game
   - Parses PGN using chess.js
   - Extracts move history
   - Calls `onGameLoad` callback

4. **getCurrentPageGames()**: Returns games for current page (pagination)
   - Returns 10 games per page
   - Controlled by `currentPage` state

5. **getTotalPages()**: Calculates total number of pages
   - Based on total games and GAMES_PER_PAGE constant

**Features**:
- Username input with Enter key support
- Archive list with month/year formatting
- Game list with player names and dates
- Pagination controls (Previous/Next)
- Loading states and error handling
- Back navigation between archives and games

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
2. Enter a chess.com username (e.g., "hikaru")
3. Click "Get Archives" to load the player's game archives
4. Select a month from the archive list
5. Browse games with pagination (10 per page)
6. Click on a game to import it
7. Use navigation controls to browse through moves

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

The importer uses the **chess-web-api** library with official Chess.com API endpoints.

**Library**: `chess-web-api` (npm package)

**Methods used**:

1. **getPlayerMonthlyArchives(username)**
   - Endpoint: `https://api.chess.com/pub/player/{username}/games/archives`
   - Returns: Array of archive URLs
   - Example response:
   ```json
   {
     "archives": [
       "https://api.chess.com/pub/player/hikaru/games/2024/01",
       "https://api.chess.com/pub/player/hikaru/games/2024/02",
       ...
     ]
   }
   ```

2. **getPlayerCompleteMonthlyArchives(username, year, month)**
   - Endpoint: `https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}`
   - Returns: Array of games with PGN and metadata
   - Example response:
   ```json
   {
     "games": [
       {
         "pgn": "[Event \"Live\"]\n1. e4 e5 ...",
         "url": "https://www.chess.com/game/live/123456789",
         "white": { "username": "hikaru", "rating": 2750 },
         "black": { "username": "opponent", "rating": 2600 },
         "end_time": 1704067200,
         "time_class": "blitz",
         ...
       },
       ...
     ]
   }
   ```

**Important notes**:
- Uses official Chess.com public API endpoints
- No authentication required for public data
- Rate limits apply (be respectful with requests)
- CORS enabled for browser-based applications
- Stable and officially supported by Chess.com

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

1. **Invalid Username**: Username doesn't exist or is misspelled
   - Message: "Failed to fetch archives"
   - Solution: Verify the username is correct and the player has public games

2. **No Archives Found**: Player exists but has no game archives
   - Message: "No game archives found for this player."
   - Solution: Player may be new or has no public games

3. **API Error**: Failed to fetch games from archive
   - Message: "Failed to fetch games: {error}"
   - Solution: Check network connection and try again

4. **Missing PGN**: Game data doesn't contain PGN
   - Message: "Game data does not contain PGN."
   - Solution: Game may be incomplete or corrupted

5. **Rate Limit**: Too many requests to Chess.com API
   - Message: "Failed to fetch archives" or "Failed to fetch games"
   - Solution: Wait a few minutes before trying again

### Error Display

Errors are shown in a red alert box below the input field with clear, actionable messages.

## Limitations

1. **Public Games Only**: Only public games can be imported
2. **No Authentication**: Cannot access private games
3. **API Rate Limits**: chess.com may rate-limit requests (be respectful)
4. **Monthly Archives**: Games are organized by month, not by individual game
5. **Pagination**: Only 10 games per page to avoid overwhelming the UI
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
