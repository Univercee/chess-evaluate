# Stockfish Integration Guide

## Download Stockfish for Web

To integrate Stockfish into your React + Vite project, you need to download the web-compatible version.

### Option 1: Stockfish.js (Recommended for simplicity)

1. Go to the official Stockfish releases: https://github.com/official-stockfish/stockfish/releases
2. Download the latest release (e.g., `stockfish.js-16.1.zip`)
3. Extract and find these files:
   - `stockfish.js` - Main engine file
   - `stockfish.wasm` - WebAssembly binary (if included)

4. Create the directory structure:
   ```
   public/
   └── stockfish/
       ├── stockfish.js
       └── stockfish.wasm (if available)
   ```

### Option 2: Pre-built Web Version

Alternatively, use the pre-built web version from:
- https://github.com/lichess-org/stockfish.js/releases

Download:
- `stockfish.js`
- `stockfish.wasm` (if available)

Place them in `public/stockfish/`

### Important Notes

1. **File Location**: Files MUST be in `public/stockfish/` for Web Worker to access them
2. **CORS**: If hosting on a different domain, ensure CORS headers allow worker access
3. **HTTPS**: Web Workers require HTTPS in production (localhost works for development)
4. **Browser Support**: Modern browsers with Web Worker and WebAssembly support

### Verification

After downloading, your project structure should look like:
```
your-project/
├── public/
│   └── stockfish/
│       ├── stockfish.js
│       └── stockfish.wasm
├── src/
│   ├── hooks/
│   │   └── useStockfish.ts
│   └── components/
│       └── ChessAnalyzer.tsx
```

### Testing

To verify Stockfish is working:
1. Start your dev server: `npm run dev`
2. Open the browser console
3. Check that `stockfish.js` loads without 404 errors
4. The analyzer component should show "Thinking..." when analyzing a position

### Troubleshooting

**Error: "Failed to load Stockfish worker"**
- Check that files are in `public/stockfish/`
- Verify file names match exactly (case-sensitive)
- Check browser console for specific error messages

**Error: "Worker is not defined"**
- Ensure you're using a modern browser
- Check that the path to stockfish.js is correct

**Engine doesn't respond:**
- Check browser console for errors
- Verify UCI protocol commands are correct
- Try increasing analysis time in the component
