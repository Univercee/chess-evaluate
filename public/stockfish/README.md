# Stockfish Engine Files

Chess engines loaded by the app as Web Workers. The list the user can pick from is in `src/engines.ts`.

| Engine | Files | Source |
|---|---|---|
| Stockfish 19 Lite (default) | `stockfish-19-lite-single.js`, `stockfish-19-lite-single.wasm` | [stockfish.js v19.0.0](https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.0) by Nathan Rugg / Chess.com (npm `stockfish@19.0.0`) |
| Stockfish 2018 (classic) | `stockfish.js`, `stockfish.wasm` | [niklasf/stockfish.js](https://github.com/niklasf/stockfish.js) (UCI name "Stockfish 2018-07-25 Multi-Variant") |

Both are licensed under the GNU GPL v3. The Stockfish 19 license text is in `COPYING-stockfish-19.txt`.

## Updating Stockfish 19 Lite

Download both files of the **lite single-threaded** flavor from the release page, or from the npm package
(`npm pack stockfish`, files in `package/bin/`). Check them against the package's published `integrity` hash.
Keep the `.js` and `.wasm` next to each other with matching names: the script loads the `.wasm` from its own URL.
If the version in the file names changes, update `url` in `src/engines.ts`.

The single-threaded build needs no special server headers. The multi-threaded builds (`stockfish-19.js`,
`stockfish-19-lite.js`) need cross-origin isolation (COOP/COEP headers), which would block
cross-origin images such as Chess.com avatars. The full single-threaded build (`stockfish-19-single.wasm`)
is about 99 MB, too large to ship with the page.
