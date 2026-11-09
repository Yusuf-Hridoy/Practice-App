// Reads, writes and resets each user's watchlist in localStorage.
// Bad or missing data is replaced with the user's watchlistStart. It never crashes.

export const WATCHLIST_KEY_PREFIX = 'tradeloom.watchlist.';
export const MAX_WATCHLIST = 6;

const memoryStore = new Map();

function readRaw(key) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? (memoryStore.has(key) ? memoryStore.get(key) : null) : value;
  } catch (error) {
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  }
}

function writeRaw(key, value) {
  memoryStore.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Storage can be blocked. The in-memory copy keeps the page working.
  }
}

export function watchlistKey(email) {
  return `${WATCHLIST_KEY_PREFIX}${email}`;
}

function isWholeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

function isValidAlert(alert) {
  if (!alert || typeof alert !== 'object') return false;
  if (alert.direction !== 'above' && alert.direction !== 'below') return false;
  if (!isWholeNumber(alert.priceCents) || alert.priceCents <= 0) return false;
  if (typeof alert.popup !== 'boolean' || typeof alert.browser !== 'boolean') return false;
  if (alert.status !== 'waiting' && alert.status !== 'hit') return false;
  if (alert.hitAt !== null && typeof alert.hitAt !== 'string') return false;
  if (alert.hitPriceCents !== null && !isWholeNumber(alert.hitPriceCents)) return false;
  return true;
}

// knownSymbols is the list of symbols in data/stocks.json.
export function isValidWatchlist(watchlist, knownSymbols) {
  if (!watchlist || typeof watchlist !== 'object') return false;
  if (!Array.isArray(watchlist.symbols)) return false;
  if (watchlist.symbols.length > MAX_WATCHLIST) return false;
  if (!watchlist.symbols.every((symbol) => typeof symbol === 'string')) return false;
  if (new Set(watchlist.symbols).size !== watchlist.symbols.length) return false;

  const known = new Set(knownSymbols || []);
  if (known.size > 0 && !watchlist.symbols.every((symbol) => known.has(symbol))) return false;

  const alerts = watchlist.alerts;
  if (!alerts || typeof alerts !== 'object' || Array.isArray(alerts)) return false;

  const onList = new Set(watchlist.symbols);
  return Object.entries(alerts).every(([symbol, alert]) => onList.has(symbol) && isValidAlert(alert));
}

export function copyWatchlistStart(watchlistStart) {
  const start = watchlistStart || { symbols: [], alerts: {} };
  return JSON.parse(JSON.stringify(start));
}

export function writeWatchlist(email, watchlist) {
  writeRaw(watchlistKey(email), JSON.stringify(watchlist));
  return watchlist;
}

export function resetWatchlist(email, watchlistStart) {
  return writeWatchlist(email, copyWatchlistStart(watchlistStart));
}

export function readWatchlist(email, watchlistStart, knownSymbols) {
  const raw = readRaw(watchlistKey(email));
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isValidWatchlist(parsed, knownSymbols)) return parsed;
    } catch (error) {
      // Bad JSON. Fall through to the start block.
    }
  }
  return resetWatchlist(email, watchlistStart);
}

// Every change reads the saved watchlist again first, so a second tab
// cannot be overwritten. The change function is given the fresh copy.
export function changeWatchlist(email, watchlistStart, knownSymbols, change) {
  const fresh = readWatchlist(email, watchlistStart, knownSymbols);
  const result = change(fresh);
  if (!result || result.ok === false) return result;
  writeWatchlist(email, result.watchlist);
  return result;
}
