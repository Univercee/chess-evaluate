import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ChevronDown, ChevronLeft, Download, UserRound } from 'lucide-react';
import { PlayerInfo } from './PlayerBar';
import { getLocale, t } from '../i18n';
import { chessComSource } from '../importers/chesscom';
import { lichessSource } from '../importers/lichess';
import { Archive, GameSource, ImportedGameData, ImportedPlayer, Platform, RateLimitError, UserNotFoundError } from '../importers/types';

export interface ImportedPlayers {
  white: PlayerInfo;
  black: PlayerInfo;
}

interface GameImporterProps {
  /**
   * `perspective`: color played by the searched player (to show the board from their side),
   * or null if they aren't in the game
   */
  onGameLoad: (game: Chess, moves: string[], players: ImportedPlayers, perspective: 'w' | 'b' | null) => void;
  className?: string;
}

const SOURCES: GameSource[] = [chessComSource, lichessSource];

function formatArchive(archive: Archive) {
  return new Date(archive.year, archive.month - 1).toLocaleDateString(getLocale(), { year: 'numeric', month: 'long' });
}

function formatGameDate(game: ImportedGameData) {
  if (!game.endTime) return '';
  return new Date(game.endTime).toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' });
}

function playerName(player: ImportedPlayer, fallback: string) {
  return player.username ?? player.name ?? fallback;
}

const archiveKey = (archive: Archive) => `${archive.year}-${archive.month}`;

/** How many of the newest months "Import last game" looks through before giving up */
const LAST_GAME_MONTHS = 6;

/**
 * Sidebar panel for importing games from Chess.com or Lichess by username.
 * Each platform keeps its own username, archives and games (cached per month) after a game is
 * loaded: the panel collapses to a summary and can be reopened to pick another game.
 */
export function GameImporter({ onGameLoad, className = '' }: GameImporterProps) {
  const [platform, setPlatform] = useState<Platform>('chesscom');
  const [isOpen, setIsOpen] = useState(true);
  const [loadedGame, setLoadedGame] = useState<ImportedGameData | null>(null);
  const [summary, setSummary] = useState('');

  const loadGame = (gameData: ImportedGameData, context: string, searchedPlayer: string) => {
    const game = new Chess();
    game.loadPgn(gameData.pgn);
    const history = game.history();
    game.reset();

    // Player names and ratings come from the game's white/black data
    const toInfo = (player: ImportedPlayer, color: 'w' | 'b'): PlayerInfo => ({
      color,
      username: player.username ?? player.name,
      rating: player.rating,
      platform: player.username ? gameData.platform : undefined,
    });

    setLoadedGame(gameData);
    setSummary(context);
    setIsOpen(false);
    // Usernames are case-insensitive on both platforms ("hikaru" searched, "Hikaru" in the game)
    const searched = searchedPlayer.toLowerCase();
    const perspective =
      gameData.white.username?.toLowerCase() === searched
        ? 'w'
        : gameData.black.username?.toLowerCase() === searched
          ? 'b'
          : null;

    onGameLoad(game, history, { white: toInfo(gameData.white, 'w'), black: toInfo(gameData.black, 'b') }, perspective);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-3 ${className}`}>
      {/* Same header as the other sidebar panels: chevron before the title */}
      <h2>
        <button
          onClick={() => setIsOpen((open) => !open)}
          className="w-full flex items-center gap-1 text-left text-sm text-gray-400 hover:text-white transition-colors"
          aria-expanded={isOpen}
        >
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          <span className="truncate">{t('import.title')}</span>
        </button>
      </h2>
      {/* Collapsed: what is loaded, aligned with the title (chevron 16px + gap 4px) */}
      {!isOpen && summary && (
        <button onClick={() => setIsOpen(true)} className="block w-full pl-5 mt-1 text-left text-white font-medium truncate">
          {summary}
        </button>
      )}

      <div className={isOpen ? 'mt-2 space-y-2' : 'hidden'}>
        {/* Platform tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-900 rounded-md" role="tablist">
          {SOURCES.map((source) => (
            <button
              key={source.platform}
              role="tab"
              aria-selected={platform === source.platform}
              onClick={() => setPlatform(source.platform)}
              className={`py-1 rounded text-sm font-medium transition-colors ${
                platform === source.platform ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>

        {/* Both stay mounted so switching tabs keeps each platform's state */}
        {SOURCES.map((source) => (
          <div key={source.platform} className={platform === source.platform ? 'space-y-2 mb-0' : 'hidden'}>
            <SourceBrowser source={source} isVisible={isOpen && platform === source.platform} loadedGame={loadedGame} onLoad={loadGame} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface SourceBrowserProps {
  source: GameSource;
  isVisible: boolean;
  loadedGame: ImportedGameData | null;
  onLoad: (game: ImportedGameData, summary: string, searchedPlayer: string) => void;
}

/**
 * Username search, month list and game list for one platform
 */
/** localStorage key of the remembered username: "chesscomUsername" / "lichessUsername" */
const usernameKey = (platform: Platform) => `${platform}Username`;

function readSavedUsername(platform: Platform): string | null {
  try {
    return localStorage.getItem(usernameKey(platform)) || null;
  } catch {
    // Storage unavailable (private mode, blocked site data): just don't remember
    return null;
  }
}

function writeSavedUsername(platform: Platform, name: string | null) {
  try {
    if (name) localStorage.setItem(usernameKey(platform), name);
    else localStorage.removeItem(usernameKey(platform));
  } catch {
    // Not persisted, but still used for this session
  }
}

function SourceBrowser({ source, isVisible, loadedGame, onLoad }: SourceBrowserProps) {
  // Username remembered after a successful search; while set it replaces the input
  const [savedUsername, setSavedUsername] = useState(() => readSavedUsername(source.platform));
  const [username, setUsername] = useState(savedUsername ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  // Canonical username the archives belong to (the input may have been edited since)
  const [owner, setOwner] = useState('');
  const [archives, setArchives] = useState<Archive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [games, setGames] = useState<ImportedGameData[]>([]);
  const [cursor, setCursor] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Games (and the next-page cursor) per month, so going back and forth doesn't refetch
  const cache = useRef(new Map<string, { games: ImportedGameData[]; cursor?: number }>());
  const listRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<HTMLButtonElement>(null);

  // When the list is shown again, bring the loaded game into view (without scrolling the page)
  useEffect(() => {
    const list = listRef.current;
    const loaded = loadedRef.current;
    if (isVisible && list && loaded) {
      list.scrollTop = loaded.offsetTop - (list.clientHeight - loaded.offsetHeight) / 2;
    }
  }, [isVisible, selectedArchive]);

  const errorMessage = (err: unknown) =>
    err instanceof UserNotFoundError
      ? t('import.userNotFound')
      : err instanceof RateLimitError
        ? t('import.rateLimited')
        : t('import.fetchFailed');

  // Remember a username once it's confirmed to exist (the platform found the player)
  const rememberUsername = (name: string) => {
    writeSavedUsername(source.platform, name);
    setSavedUsername(name);
    setUsername(name);
  };

  // Forget the saved username: back to an empty input and empty lists
  const changeUsername = () => {
    writeSavedUsername(source.platform, null);
    setSavedUsername(null);
    setUsername('');
    setOwner('');
    setArchives([]);
    setSelectedArchive(null);
    setGames([]);
    setCursor(undefined);
    setError(null);
    cache.current.clear();
    // Focus once the input is rendered
    setTimeout(() => inputRef.current?.focus());
  };

  const search = async () => {
    const name = username.trim();
    if (!name) return;
    setError(null);
    setLoading(true);
    try {
      const result = await source.fetchArchives(name);
      if (result.archives.length === 0) {
        setError(t('import.noArchives'));
        return;
      }
      setOwner(result.username);
      rememberUsername(result.username);
      setArchives(result.archives);
      setSelectedArchive(null);
      setGames([]);
      cache.current.clear();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const openArchive = async (archive: Archive) => {
    setSelectedArchive(archive);
    setError(null);

    const cached = cache.current.get(archiveKey(archive));
    if (cached) {
      setGames(cached.games);
      setCursor(cached.cursor);
      return;
    }

    setGames([]);
    setCursor(undefined);
    await fetchPage(archive, [], undefined);
  };

  const fetchPage = async (archive: Archive, current: ImportedGameData[], from?: number) => {
    setLoading(true);
    try {
      const page = await source.fetchGames(owner, archive, from);
      const all = [...current, ...page.games];
      cache.current.set(archiveKey(archive), { games: all, cursor: page.cursor });
      setGames(all);
      setCursor(page.cursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // The month and player are passed explicitly when state hasn't caught up yet (import last game)
  const load = (game: ImportedGameData, archive = selectedArchive, ownerName = owner) => {
    try {
      onLoad(game, [ownerName, archive && formatArchive(archive)].filter(Boolean).join(' · '), ownerName);
    } catch {
      setError(t('import.loadFailed'));
    }
  };

  /**
   * Load the player's newest game: newest month with games (fetching archives unless already
   * loaded for this player), then its first game. The list is left on that month, with the game
   * highlighted, as if it had been picked by hand.
   */
  const importLastGame = async () => {
    const name = username.trim();
    if (!name) return;
    setError(null);
    setLoading(true);
    try {
      let currentOwner = owner;
      let currentArchives = archives;
      if (!owner || owner.toLowerCase() !== name.toLowerCase()) {
        const result = await source.fetchArchives(name);
        if (result.archives.length === 0) {
          setError(t('import.noArchives'));
          return;
        }
        currentOwner = result.username;
        currentArchives = result.archives;
        cache.current.clear();
        setOwner(currentOwner);
        rememberUsername(currentOwner);
        setArchives(currentArchives);
      }

      // Recent months can be empty (Lichess lists every month since registration)
      for (const archive of currentArchives.slice(0, LAST_GAME_MONTHS)) {
        let entry = cache.current.get(archiveKey(archive));
        if (!entry) {
          const page = await source.fetchGames(currentOwner, archive);
          entry = { games: page.games, cursor: page.cursor };
          cache.current.set(archiveKey(archive), entry);
        }
        if (entry.games.length > 0) {
          setSelectedArchive(archive);
          setGames(entry.games);
          setCursor(entry.cursor);
          load(entry.games[0], archive, currentOwner);
          return;
        }
      }
      setError(t('import.noRecentGames'));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const listClass = 'max-h-72 overflow-y-auto bg-gray-900 rounded-md p-1 space-y-1';

  return (
    <>
      {/* Saved username replaces the input; the searches below keep working with it */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        {savedUsername ? (
          <div
            className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
            title={`${source.label}: ${savedUsername}`}
          >
            <UserRound className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
            <span className="truncate font-medium">{savedUsername}</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={`${t('import.usernamePlaceholder')} (${source.label})`}
            aria-label={`${t('import.usernamePlaceholder')} (${source.label})`}
            className="flex-1 min-w-0 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={loading}
          />
        )}
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
        >
          {t('import.search')}
        </button>
      </form>

      <button
        onClick={importLastGame}
        disabled={loading || !username.trim()}
        className="w-full flex items-center justify-center gap-2 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
      >
        <Download className="w-4 h-4" />
        {t('import.lastGame')}
      </button>

      {savedUsername && (
        <button
          onClick={changeUsername}
          disabled={loading}
          className="block mx-auto text-xs text-gray-400 hover:text-white underline underline-offset-2 disabled:opacity-50 transition-colors"
        >
          {t('import.changeUsername')}
        </button>
      )}

      {error && <div className="p-2 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm">{error}</div>}

      {/* Month list */}
      {archives.length > 0 && !selectedArchive && (
        <>
          <div className="text-sm text-gray-400 px-1">
            {t('import.archives')} · {owner}
          </div>
          <div className={listClass}>
            {archives.map((archive) => (
              <button
                key={archiveKey(archive)}
                onClick={() => openArchive(archive)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-700 rounded text-white capitalize transition-colors"
              >
                {formatArchive(archive)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Game list */}
      {selectedArchive && (
        <>
          <button
            onClick={() => setSelectedArchive(null)}
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white px-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="capitalize">{formatArchive(selectedArchive)}</span>
            {games.length > 0 && <span className="text-gray-500">({games.length}{cursor !== undefined && '+'})</span>}
          </button>
          {games.length > 0 && (
            <div ref={listRef} className={`relative ${listClass}`}>
              {games.map((game, index) => {
                const isLoaded = game === loadedGame;
                return (
                  <button
                    key={index}
                    ref={isLoaded ? loadedRef : undefined}
                    onClick={() => load(game)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                      isLoaded ? 'bg-amber-600/30 ring-1 ring-amber-600' : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-sm text-white font-medium break-words">
                      {playerName(game.white, t('player.white'))}
                      <span className="text-gray-500 font-normal"> {game.white.rating}</span>
                      <span className="text-gray-500 font-normal"> – </span>
                      {playerName(game.black, t('player.black'))}
                      <span className="text-gray-500 font-normal"> {game.black.rating}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {[game.timeClass, formatGameDate(game)].filter(Boolean).join(' · ')}
                    </div>
                  </button>
                );
              })}
              {cursor !== undefined && (
                <button
                  onClick={() => fetchPage(selectedArchive, games, cursor)}
                  disabled={loading}
                  className="w-full py-1.5 text-sm text-amber-400 hover:bg-gray-700 disabled:text-gray-500 rounded transition-colors"
                >
                  {loading ? t('import.loading') : t('import.loadMore')}
                </button>
              )}
            </div>
          )}
          {games.length === 0 && !loading && !error && (
            <p className="text-sm text-gray-400 px-1">{t('import.noGames')}</p>
          )}
        </>
      )}

      {loading && games.length === 0 && <div className="text-sm text-gray-400 px-1">{t('import.loading')}</div>}

      {archives.length === 0 && !loading && !error && !savedUsername && (
        <p className="text-xs text-gray-400 px-1">{t('import.hint')}</p>
      )}
    </>
  );
}
