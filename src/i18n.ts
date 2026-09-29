import { useSyncExternalStore } from 'react';

const en = {
  'app.title': 'Chess Analyzer',
  'meta.title': 'Chess Analyzer: Chess.com & Lichess Games with Stockfish',
  'meta.description':
    'Free chess game analysis with Stockfish: import games from Chess.com and Lichess, see the top 3 engine lines and an evaluation bar, and find your mistakes.',
  'app.language': 'Language',
  'player.white': 'White',
  'player.black': 'Black',
  'analysis.bestLines': 'Best lines',
  'analysis.depth': 'Depth',
  'analysis.expand': 'Show full line',
  'analysis.collapse': 'Collapse line',
  'analysis.showArrow': 'Show best move arrow',
  'analysis.engine': 'Engine',
  'analysis.engineLoading': 'Loading engine…',
  'result.whiteWins': 'Checkmate. White wins',
  'result.blackWins': 'Checkmate. Black wins',
  'result.stalemate': 'Stalemate. Draw',
  'result.insufficient': 'Draw: insufficient material',
  'result.threefold': 'Draw: threefold repetition',
  'result.fiftyMoves': 'Draw: 50-move rule',
  'review.start': 'Start game review',
  'review.stop': 'Stop',
  'review.hint': 'Classifies every move of the game with Stockfish. Takes about a minute or two.',
  'review.title': 'Game review',
  'review.analyzing': 'Analyzing the game',
  'review.failed': 'Review failed',
  'review.brilliant': 'Brilliant',
  'review.only': 'Only move',
  'review.best': 'Best move',
  'review.excellent': 'Excellent',
  'review.good': 'Good',
  'review.inaccuracy': 'Inaccuracy',
  'review.mistake': 'Mistake',
  'review.blunder': 'Blunder',
  'review.forced': 'Forced',
  'analysis.engineError': 'Engine error',
  'nav.moves': 'Moves',
  'nav.start': 'Start',
  'nav.first': 'First move',
  'nav.prev': 'Previous move',
  'nav.next': 'Next move',
  'nav.last': 'Last move',
  'nav.variation': 'Variation',
  'nav.backToGame': 'Back to game',
  'nav.emptyFreePlay': 'Make a move on the board.',
  'game.newGame': 'New Game',
  'game.flipBoard': 'Flip board',
  'game.autoFlip': 'Auto-flip board',
  'import.title': 'Import a game',
  'import.usernamePlaceholder': 'Username',
  'import.search': 'Find',
  'import.loading': 'Loading…',
  'import.archives': 'Archives',
  'import.loadMore': 'Load more',
  'import.lastGame': 'Import last game',
  'import.changeUsername': 'Choose another username',
  'import.noRecentGames': 'No games in the last 6 months.',
  'import.noGames': 'No games this month.',
  'import.hint': 'Enter a username to browse their games by month.',
  'import.userNotFound': 'Player not found.',
  'import.noArchives': 'No game archives found for this player.',
  'import.fetchFailed': 'Failed to fetch data.',
  'import.rateLimited': 'Too many requests. Please try again in a minute.',
  'import.noPgn': 'Game data does not contain PGN.',
  'import.loadFailed': 'Failed to load game.',
  'import.computer': 'Computer',
};

export type TranslationKey = keyof typeof en;

const ru: Record<TranslationKey, string> = {
  'app.title': 'Шахматный анализатор',
  'meta.title': 'Анализ шахматных партий Chess.com и Lichess со Stockfish',
  'meta.description':
    'Бесплатный анализ шахматных партий движком Stockfish: импорт с Chess.com и Lichess, три лучшие линии и шкала оценки. Загрузите партию и найдите ошибки.',
  'app.language': 'Язык',
  'player.white': 'Белые',
  'player.black': 'Чёрные',
  'analysis.bestLines': 'Лучшие линии',
  'analysis.depth': 'Глубина',
  'analysis.expand': 'Показать линию полностью',
  'analysis.collapse': 'Свернуть линию',
  'analysis.showArrow': 'Показывать стрелку лучшего хода',
  'analysis.engine': 'Движок',
  'analysis.engineLoading': 'Загрузка движка…',
  'result.whiteWins': 'Мат. Белые победили',
  'result.blackWins': 'Мат. Чёрные победили',
  'result.stalemate': 'Пат. Ничья',
  'result.insufficient': 'Ничья: недостаточно материала',
  'result.threefold': 'Ничья: троекратное повторение',
  'result.fiftyMoves': 'Ничья по правилу 50 ходов',
  'review.start': 'Запустить разбор партии',
  'review.stop': 'Остановить',
  'review.hint': 'Stockfish оценит каждый ход партии. Это займёт минуту-две.',
  'review.title': 'Разбор партии',
  'review.analyzing': 'Анализ партии',
  'review.failed': 'Ошибка анализа',
  'review.brilliant': 'Блестящий ход',
  'review.only': 'Единственный ход',
  'review.best': 'Лучший ход',
  'review.excellent': 'Отличный ход',
  'review.good': 'Хороший ход',
  'review.inaccuracy': 'Неточность',
  'review.mistake': 'Ошибка',
  'review.blunder': 'Зевок',
  'review.forced': 'Вынужденный ход',
  'analysis.engineError': 'Ошибка движка',
  'nav.moves': 'Ходы',
  'nav.start': 'Начало',
  'nav.first': 'К первому ходу',
  'nav.prev': 'Предыдущий ход',
  'nav.next': 'Следующий ход',
  'nav.last': 'К последнему ходу',
  'nav.variation': 'Вариант',
  'nav.backToGame': 'Вернуться к партии',
  'nav.emptyFreePlay': 'Сделайте ход на доске.',
  'game.newGame': 'Новая игра',
  'game.flipBoard': 'Перевернуть доску',
  'game.autoFlip': 'Автоповорот доски',
  'import.title': 'Импорт партии',
  'import.usernamePlaceholder': 'Ник игрока',
  'import.search': 'Найти',
  'import.loading': 'Загрузка…',
  'import.archives': 'Архивы',
  'import.loadMore': 'Загрузить ещё',
  'import.lastGame': 'Импорт последней партии',
  'import.changeUsername': 'Выбрать другой ник',
  'import.noRecentGames': 'Нет партий за последние 6 месяцев.',
  'import.noGames': 'В этом месяце партий нет.',
  'import.hint': 'Введите ник, чтобы посмотреть партии игрока по месяцам.',
  'import.userNotFound': 'Игрок не найден.',
  'import.noArchives': 'У игрока нет архивов партий.',
  'import.fetchFailed': 'Не удалось получить данные.',
  'import.rateLimited': 'Слишком много запросов. Попробуйте через минуту.',
  'import.noPgn': 'В данных партии нет PGN.',
  'import.loadFailed': 'Не удалось загрузить партию.',
  'import.computer': 'Компьютер',
};

const zh: Record<TranslationKey, string> = {
  'app.title': '国际象棋分析器',
  'meta.title': '国际象棋分析器：用 Stockfish 分析 Chess.com 和 Lichess 对局',
  'meta.description':
    '免费的国际象棋对局分析工具，基于 Stockfish 引擎：从 Chess.com 和 Lichess 导入对局，查看三条最佳着法和局面评估条，找出你的失误。',
  'app.language': '语言',
  'player.white': '白方',
  'player.black': '黑方',
  'analysis.bestLines': '最佳着法',
  'analysis.depth': '深度',
  'analysis.expand': '展开完整变化',
  'analysis.collapse': '收起变化',
  'analysis.showArrow': '显示最佳着法箭头',
  'analysis.engine': '引擎',
  'analysis.engineLoading': '正在加载引擎…',
  'result.whiteWins': '将死，白方胜',
  'result.blackWins': '将死，黑方胜',
  'result.stalemate': '逼和，和棋',
  'result.insufficient': '和棋：子力不足',
  'result.threefold': '和棋：三次重复局面',
  'result.fiftyMoves': '和棋：五十步规则',
  'review.start': '开始对局复盘',
  'review.stop': '停止',
  'review.hint': 'Stockfish 将评估对局的每一步，大约需要一两分钟。',
  'review.title': '对局复盘',
  'review.analyzing': '正在分析对局',
  'review.failed': '分析失败',
  'review.brilliant': '妙着',
  'review.only': '唯一着法',
  'review.best': '最佳着法',
  'review.excellent': '优秀',
  'review.good': '好棋',
  'review.inaccuracy': '不精确',
  'review.mistake': '错着',
  'review.blunder': '大错',
  'review.forced': '被迫着法',
  'analysis.engineError': '引擎错误',
  'nav.moves': '着法',
  'nav.start': '开局',
  'nav.first': '第一步',
  'nav.prev': '上一步',
  'nav.next': '下一步',
  'nav.last': '最后一步',
  'nav.variation': '变化',
  'nav.backToGame': '返回对局',
  'nav.emptyFreePlay': '在棋盘上走一步棋。',
  'game.newGame': '新对局',
  'game.flipBoard': '翻转棋盘',
  'game.autoFlip': '自动翻转棋盘',
  'import.title': '导入对局',
  'import.usernamePlaceholder': '用户名',
  'import.search': '查找',
  'import.loading': '加载中…',
  'import.archives': '存档',
  'import.loadMore': '加载更多',
  'import.lastGame': '导入最近一局',
  'import.changeUsername': '更换用户名',
  'import.noRecentGames': '最近 6 个月没有对局。',
  'import.noGames': '本月没有对局。',
  'import.hint': '输入用户名，按月份浏览其对局。',
  'import.userNotFound': '未找到该棋手。',
  'import.noArchives': '未找到该棋手的对局存档。',
  'import.fetchFailed': '获取数据失败。',
  'import.rateLimited': '请求过于频繁，请一分钟后再试。',
  'import.noPgn': '对局数据中没有 PGN。',
  'import.loadFailed': '加载对局失败。',
  'import.computer': '电脑',
};

const translations = { en, ru, zh };

export type Language = keyof typeof translations;

export const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'zh', label: '中文', name: '中文' },
];

/** BCP 47 locale per language, for <html lang> and date formatting */
const LOCALES: Record<Language, string> = { en: 'en-US', ru: 'ru-RU', zh: 'zh-CN' };

const STORAGE_KEY = 'language';

/**
 * ?lang= in the URL first (each language has its own URL for hreflang), then the saved
 * choice, then the browser locale, falling back to English
 */
function detectLanguage(): Language {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && fromUrl in translations) return fromUrl as Language;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in translations) return saved as Language;
  } catch {
    // Storage may be unavailable (private mode, blocked site data)
  }
  const browser = navigator.language?.toLowerCase() ?? '';
  if (browser.startsWith('ru')) return 'ru';
  if (browser.startsWith('zh')) return 'zh';
  return 'en';
}

let language = detectLanguage();
const listeners = new Set<() => void>();

/** og:locale values */
const OG_LOCALES: Record<Language, string> = { en: 'en_US', ru: 'ru_RU', zh: 'zh_CN' };

function setMeta(selector: string, content: string) {
  document.head.querySelector(selector)?.setAttribute('content', content);
}

/**
 * Reflect the language in the document: <html lang>, title, description and social tags,
 * and the ?lang= URL (English has none) together with the canonical link
 */
function applyToDocument() {
  document.documentElement.lang = LOCALES[language];
  document.title = t('meta.title');
  setMeta('meta[name="description"]', t('meta.description'));
  setMeta('meta[property="og:title"]', t('meta.title'));
  setMeta('meta[property="og:description"]', t('meta.description'));
  setMeta('meta[name="twitter:title"]', t('meta.title'));
  setMeta('meta[name="twitter:description"]', t('meta.description'));
  setMeta('meta[property="og:locale"]', OG_LOCALES[language]);

  const url = new URL(location.href);
  if (language === 'en') url.searchParams.delete('lang');
  else url.searchParams.set('lang', language);
  if (url.href !== location.href) history.replaceState(history.state, '', url);

  // Canonical/og:url only exist when the build knows the site address (SITE_URL)
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) {
    const canonicalUrl = new URL(canonical.href);
    canonicalUrl.search = language === 'en' ? '' : `?lang=${language}`;
    canonical.href = canonicalUrl.href;
    setMeta('meta[property="og:url"]', canonicalUrl.href);
  }
}
applyToDocument();

export function getLanguage(): Language {
  return language;
}

export function setLanguage(next: Language) {
  if (next === language) return;
  language = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not persisted, but still applied for this session
  }
  applyToDocument();
  listeners.forEach((listener) => listener());
}

/**
 * Current language; re-renders the calling component when it changes.
 * App subscribes, so the whole (non-memoized) tree re-renders with new strings.
 */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Locale of the current language, e.g. for toLocaleDateString */
export function getLocale(): string {
  return LOCALES[language];
}

export function t(key: TranslationKey): string {
  return translations[language][key];
}
