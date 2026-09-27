# Evaluation Bar Documentation

## Overview

The Evaluation Bar is a visual component that displays the current position evaluation from Stockfish engine. It appears as a vertical bar next to the chess board, similar to those found on chess.com and lichess.org.

## Features

- **Visual Representation**: Shows position advantage as a vertical bar
- **Color Coding**: 
  - White/gray = White's advantage
  - Dark gray/black = Black's advantage
- **Numerical Display**: Shows evaluation in pawns (e.g., +1.5, -2.3) or mate notation (M3)
- **Smooth Animation**: Transitions smoothly when evaluation changes
- **Mate Detection**: Special display for forced mates (M1, M2, etc.)
- **Responsive**: Automatically adjusts height to match board size

## Implementation

### Component Location
`src/components/EvaluationBar.tsx`

### Props

```typescript
interface EvaluationBarProps {
  score: StockfishScore | null;  // Evaluation from Stockfish
  height: number;                // Height in pixels (matches board width)
}
```

### StockfishScore Type

```typescript
type StockfishScore = {
  type: 'cp' | 'mate';  // centipawns or mate
  value: number;         // positive = white advantage, negative = black advantage
}
```

## How It Works

### Evaluation Calculation

1. **Centipawn Evaluation** (type: 'cp'):
   - Value is in centipawns (1/100 of a pawn)
   - +100 = 1 pawn advantage for White
   - -150 = 1.5 pawn advantage for Black
   - Converted to percentage: `50 + (pawns * 5)`
   - Clamped between 10% and 90% for visual clarity

2. **Mate Evaluation** (type: 'mate'):
   - Positive value = White delivers mate
   - Negative value = Black delivers mate
   - Displayed as 100% or 0% fill
   - Text shows "M" + number of moves to mate

### Visual Layout

```
┌──────┐
│      │ ← Black's advantage (dark)
│      │
│ +1.5 │ ← Score text (centered)
│      │
│      │ ← White's advantage (light)
└──────┘
```

- **Height**: Matches board width (e.g., 600px)
- **Width**: Fixed at 40px
- **Background**: Gray border with rounded corners
- **Fill**: Animated transition (500ms ease-out)

### Color Logic

- **Text Color**:
  - Dark text on light background (White's advantage)
  - Light text on dark background (Black's advantage)
  - Uses `drop-shadow` for better readability

- **Fill Color**:
  - White side: `bg-gray-100` (light gray)
  - Black side: `bg-gray-900` (dark gray)

## Integration

### Usage in App.tsx

```typescript
import { EvaluationBar } from './components/EvaluationBar';

// In render:
<div className="flex gap-2 items-stretch">
  {showBestMove && (
    <EvaluationBar score={analysis.score} height={boardWidth} />
  )}
  
  <div className="relative" style={{ width: `${boardWidth}px` }}>
    <Chessboard ... />
  </div>
</div>
```

### Visibility Control

The Evaluation Bar is only shown when:
- `showBestMove` is true (user enabled best move analysis)
- Stockfish engine is loaded successfully

## Examples

### Equal Position
```
Score: 0.0
Fill: 50% (half white, half black)
```

### White Advantage
```
Score: +2.5
Fill: 62.5% (more white)
Text: "+2.5"
```

### Black Advantage
```
Score: -1.3
Fill: 43.5% (more black)
Text: "-1.3"
```

### Forced Mate
```
Score: mate in 3
Fill: 100% (all white)
Text: "M3"
```

## Styling

### Tailwind Classes Used

- **Container**: `bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700`
- **White Fill**: `bg-gray-100 transition-all duration-500 ease-out`
- **Black Fill**: `bg-gray-900 transition-all duration-500 ease-out`
- **Text**: `text-xs font-bold drop-shadow-lg`

### Animation

- **Duration**: 500ms
- **Easing**: ease-out
- **Properties**: height (for fill percentage)

## Technical Notes

1. **Performance**: Uses CSS transitions for smooth animation (GPU-accelerated)
2. **Accessibility**: Text has drop-shadow for contrast
3. **Responsive**: Height is dynamic based on board size
4. **Type Safety**: Fully typed with TypeScript

## Future Enhancements

Potential improvements:
- Add evaluation history graph
- Show evaluation trend (improving/worsening)
- Color gradient based on evaluation strength
- Click to toggle between cp/mate display
- Tooltip with detailed evaluation info

## Related Components

- `useStockfish` hook - provides evaluation data
- `Chessboard` - main board component
- `ChessAnalyzer` - detailed analysis panel
