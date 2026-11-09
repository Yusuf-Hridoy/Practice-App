// Reads and writes the session and the account (cash, shares, history) in localStorage.
// Bad or missing data is replaced with the account's start block. It never crashes.

export const SESSION_KEY = 'tradeloom.session';
export const ACCOUNT_KEY_PREFIX = 'tradeloom.account.';

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

function removeRaw(key) {
  memoryStore.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // Nothing to do.
  }
}

export function accountKey(email) {
  return `${ACCOUNT_KEY_PREFIX}${email}`;
}

// --- demo users ---

let demoUsersPromise = null;

export function loadDemoUsers() {
  if (!demoUsersPromise) {
    demoUsersPromise = fetch('/data/demo-users.json').then((response) => {
      if (!response.ok) throw new Error('Could not load demo users');
      return response.json();
    });
  }
  return demoUsersPromise;
}

export function findDemoUser(users, email) {
  const wanted = String(email || '').trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === wanted) || null;
}

// --- session ---

export function readSession() {
  const raw = readRaw(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') return parsed;
  } catch (error) {
    // Fall through and clear it.
  }
  removeRaw(SESSION_KEY);
  return null;
}

export function writeSession(email) {
  writeRaw(SESSION_KEY, JSON.stringify({ email }));
}

export function clearSession() {
  removeRaw(SESSION_KEY);
}

// --- account ---

function isWholeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

function isValidHoldings(holdings) {
  if (!holdings || typeof holdings !== 'object' || Array.isArray(holdings)) return false;
  return Object.values(holdings).every(
    (holding) =>
      holding &&
      typeof holding === 'object' &&
      isWholeNumber(holding.shares) &&
      holding.shares > 0 &&
      isWholeNumber(holding.totalPaidCents) &&
      holding.totalPaidCents >= 0,
  );
}

function isValidHistory(history) {
  if (!Array.isArray(history)) return false;
  return history.every(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.id === 'string' &&
      typeof entry.time === 'string' &&
      typeof entry.type === 'string' &&
      isWholeNumber(entry.amountCents) &&
      isWholeNumber(entry.cashAfterCents),
  );
}

export function isValidAccount(account) {
  if (!account || typeof account !== 'object') return false;
  if (!isWholeNumber(account.cashCents) || account.cashCents < 0) return false;
  if (!isWholeNumber(account.totalAddedCents) || account.totalAddedCents < 0) return false;
  if (!isValidHoldings(account.holdings)) return false;
  if (!isValidHistory(account.history)) return false;
  return true;
}

export function copyStartBlock(startBlock) {
  return JSON.parse(JSON.stringify(startBlock));
}

export function writeAccount(email, account) {
  writeRaw(accountKey(email), JSON.stringify(account));
  return account;
}

export function resetAccount(email, startBlock) {
  return writeAccount(email, copyStartBlock(startBlock));
}

export function readAccount(email, startBlock) {
  const raw = readRaw(accountKey(email));
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isValidAccount(parsed)) return parsed;
    } catch (error) {
      // Bad JSON. Fall through to the start block.
    }
  }
  return resetAccount(email, startBlock);
}

export function nextHistoryId(account) {
  return `h${account.history.length + 1}`;
}
