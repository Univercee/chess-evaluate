# Stockfish Setup Guide

## Overview

This application uses Stockfish chess engine for position analysis. The engine runs in a Web Worker to avoid blocking the UI.

## Quick Setup

### 1. Download Stockfish

Download the web-compatible version from:
- **Recommended**: https://github.com/lichess-org/stockfish.js/releases
- **Alternative**: https://github.com/official-stockfish/stockfish/releases

### 2. Extract Files

Extract the downloaded archive and locate:
- `stockfish.js` (required)
- `stockfish.wasm` (optional, improves performance)

### 3. Place Files

Create the directory structure:
```
public/
└── stockfish/
    ├── stockfish.js
    └── stockfish.wasm (if available)
```

**Important**: Files MUST be in `public/stockfish/` for the Web Worker to access them.

## Verification

After setup:
1. Start the dev server: `npm run dev`
2. Open the application
3. Click "Analyze" button
4. You should see "Loading Stockfish engine..." followed by the analyzer interface
5. Enter a FEN position and click "Analyze"

## Troubleshooting

### Error: "Failed to load Stockfish engine"

**Causes:**
- Files not in correct location
- Incorrect file names (case-sensitive)
- CORS issues (if hosting on different domain)
- Missing HTTPS (required in production)

**Solutions:**
1. Verify files are in `public/stockfish/`
2. Check file names match exactly: `stockfish.js`
3. Check browser console for specific error messages
4. Ensure you're using HTTPS or localhost

### Error: "Worker is not defined"

**Cause:** Browser doesn't support Web Workers

**Solution:** Use a modern browser (Chrome, Firefox, Safari, Edge)

### Engine doesn't respond

**Causes:**
- Invalid FEN position
- Engine crashed
- Network issues loading stockfish.js

**Solutions:**
1. Check browser console for errors
2. Verify FEN is valid
3. Try refreshing the page
4. Check that stockfish.js loads without 404 errors

## Technical Details

### How It Works

1. **Web Worker**: Stockfish runs in a separate thread
2. **UCI Protocol**: Communication via Universal Chess Interface
3. **Message Flow**:
   - App sends position (FEN) to worker
   - Worker analyzes and sends back results
   - App displays best move and evaluation

### File Loading

The application loads Stockfish from `/stockfish/stockfish.js`:
```typescript
const worker = new Worker('/stockfish/stockfish.js');
```

This path is relative to the public directory, so the file must be at:
```
public/stockfish/stockfish.js
```

### Browser Requirements

- Web Worker support
- WebAssembly support (for .wasm version)
- HTTPS in production (localhost works for development)

## Performance Tips

### Analysis Settings

Adjust depth and time based on needs:

- **Quick analysis**: depth=12, movetime=1000ms
- **Standard analysis**: depth=15, movetime=2000ms (default)
- **Deep analysis**: depth=20, movetime=5000ms

### Optimization

- Use `.wasm` version for better performance
- Call `stop()` to cancel analysis early
- Engine runs in separate thread (no UI blocking)

## Example FEN Positions

```
Starting position:
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

Italian Game:
r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3

Sicilian Defense:
rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2
```

## Support

For issues related to:
- **Stockfish engine**: https://stockfishchess.org/
- **Web Workers**: Browser compatibility tables
- **This application**: Check browser console for errors
