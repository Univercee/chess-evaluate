# ♟ Chess

Interactive chess board with complete game logic, built with React + TypeScript + Tailwind CSS.

## 🎮 Features

- **Complete chess logic** with all rules validation
- **Interactive board** — click pieces to select and make moves
- **Move highlighting** — visual display of available moves
- **Special moves:**
  - Castling (kingside and queenside)
  - En passant capture
  - Pawn promotion with piece selection
- **Status checking:**
  - Check — orange highlight
  - Checkmate — winner announcement
  - Stalemate — draw announcement
- **Responsive design** — works on mobile and desktop

## 🏗️ Architecture

```
src/
├── types/
│   └── chess.ts          # Types, interfaces, utilities
├── classes/
│   ├── ChessPiece.ts     # Abstract base class for pieces
│   ├── Pieces.ts         # Concrete piece classes
│   └── ChessBoard.ts     # Board class with game logic
├── App.tsx               # Main UI component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

### Types and Interfaces (`src/types/chess.ts`)

Defines the core data structures:

- **`PieceColor`**: `'white' | 'black'`
- **`PieceType`**: `'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'`
- **`Position`**: `{ col: number, row: number }` — coordinates on the board (0-7)
- **`IChessPiece`**: interface for all pieces
- **`IChessBoard`**: interface for the board
- **`GameStatus`**: discriminated union for game status
- **`Move`**: move description

### Piece Classes (`src/classes/`)

#### `ChessPiece` (abstract base class)

Base class for all chess pieces:

```typescript
abstract class ChessPiece implements IChessPiece {
  readonly type: PieceType;
  readonly color: PieceColor;
  position: Position;
  hasMoved: boolean;
  readonly isPromotedPawn: boolean;

  getSymbol(): string;
  moveTo(position: Position): void;
  abstract getPossibleMoves(board: IChessBoard): Position[];
}
```

#### Concrete Pieces (`Pieces.ts`)

Each piece implements its own move logic:

- **`King`** — moves one square in any direction + castling
- **`Queen`** — combines rook and bishop moves
- **`Rook`** — moves horizontally and vertically
- **`Bishop`** — moves diagonally
- **`Knight`** — moves in an "L" shape
- **`Pawn`** — moves forward, captures diagonally, en passant

### Board Class (`ChessBoard.ts`)

Manages all game logic:

```typescript
class ChessBoard implements IChessBoard {
  private board: (IChessPiece | null)[][];
  private currentTurn: PieceColor;
  private moveHistory: Move[];
  private enPassantTarget: Position | null;

  // Main methods
  getPieceAt(position: Position): IChessPiece | null;
  getLegalMoves(position: Position): Position[];
  makeMove(from: Position, to: Position, promotion?: PieceType): Move | null;
  
  // Validation
  isKingInCheck(color: PieceColor): boolean;
  isCheckmate(color: PieceColor): boolean;
  isStalemate(color: PieceColor): boolean;
  getGameStatus(): GameStatus;
  
  // Special moves
  needsPromotion(from: Position, to: Position): boolean;
  getEnPassantTarget(): Position | null;
}
```

## 🎯 Implemented Rules

### Castling

Forbidden if:
- King or the required rook has already moved
- There are pieces between them
- King is in check
- King passes through an attacked square
- The destination square is under attack
- The rook is a promoted pawn

### En Passant

- `enPassantTarget` is set when a pawn moves 2 squares
- A pawn can capture en passant only on the next move
- When capturing, the pawn on the intermediate square is removed

### Pawn Promotion

- When reaching the opposite edge (8th rank for white, 1st rank for black)
- A modal window opens with piece selection: queen, rook, bishop, knight
- A new piece is created with `isPromotedPawn = true`

### Checkmate and Stalemate

- **Checkmate**: king is in check AND there are no legal moves
- **Stalemate**: king is NOT in check, but there are no legal moves
- After the game ends, all clicks are blocked

## 🎨 UI

### Piece Coloring

All pieces use one set of Unicode symbols (`♔♕♖♗♘♙`), coloring is done via CSS:

- **White pieces**: white color + black outline via `text-shadow`
- **Black pieces**: black color + white outline via `text-shadow`

### Highlighting

- **Selected piece**: blue square
- **Legal moves**: dots on empty squares, border on squares with pieces
- **Last move**: yellow highlight
- **Check**: orange status bar
- **Checkmate**: red status bar
- **Stalemate**: yellow status bar

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build production version
npm run build

# Type checking
npm run typecheck
```

## 📦 Dependencies

- **React** 18.2.0 — UI library
- **TypeScript** 5.7.0 — type safety
- **Tailwind CSS** 4.1.7 — styling
- **Vite** 6.3.5 — build tool

## 🔧 Implementation Features

1. **State mutation**: `ChessBoard` is mutated directly, no new objects are created
2. **Forced re-render**: `renderTrigger` is used to update UI after mutations
3. **Unified piece symbols**: all pieces use one Unicode set, coloring via CSS
4. **Centralized status**: `getGameStatus()` combines all checks (check/checkmate/stalemate)
5. **Legality check**: `isMoveLegal()` simulates the move and checks if the king remains in check
6. **`isPromotedPawn` flag**: prevents castling with a promoted pawn-rook

## 📝 Usage

1. Click on a piece of your color — available moves will be highlighted
2. Click on a highlighted square — the piece will move
3. If a pawn reaches the end of the board — a piece selection window will appear for promotion
4. After checkmate or stalemate, the board is locked and the result is displayed
5. Click "New Game" to reset

## 📄 License

MIT
