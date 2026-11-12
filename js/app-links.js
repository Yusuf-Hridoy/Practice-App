// Builds every link and redirect, so the app works both on a local
// python -m http.server (which needs .html) and on Vercel (clean URLs).
// It also copies the ?seed switch onto every link, so a seed survives page changes.

export const DEFAULT_SEED = 'tradeloom';

const PAGE_FILES = Object.freeze({
  login: 'index',
  market: 'market',
  stock: 'stock',
  portfolio: 'portfolio',
  watchlist: 'watchlist',
  wallet: 'wallet',
  profile: 'profile',
  rules: 'rules',
  paymentFrame: 'payment-frame',
  receipt: 'receipt',
  notFound: '404',
});

export function isLocalHost() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '';
}

export function getSeed() {
  const value = new URLSearchParams(window.location.search).get('seed');
  const trimmed = (value || '').trim();
  return trimmed === '' ? null : trimmed;
}

export function seedValue() {
  return getSeed() || DEFAULT_SEED;
}

export function href(page, params = {}) {
  const file = PAGE_FILES[page];
  if (!file) throw new Error(`Unknown page: ${page}`);

  const local = isLocalHost();
  let path;
  if (page === 'login') path = local ? '/index.html' : '/';
  else path = local ? `/${file}.html` : `/${file}`;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }

  const seed = getSeed();
  if (seed && !query.has('seed')) query.set('seed', seed);

  const text = query.toString();
  return text === '' ? path : `${path}?${text}`;
}

export function go(page, params = {}) {
  window.location.href = href(page, params);
}

export function replaceWith(page, params = {}) {
  window.location.replace(href(page, params));
}

export function currentPathWithQuery() {
  return window.location.pathname + window.location.search;
}

// Only paths inside this app are safe to send someone to.
export function isSafeNext(value) {
  if (typeof value !== 'string' || value === '') return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (value.includes('\\')) return false;
  return true;
}

export function withSeed(path) {
  const seed = getSeed();
  if (!seed) return path;
  const [base, search = ''] = path.split('?');
  const query = new URLSearchParams(search);
  if (!query.has('seed')) query.set('seed', seed);
  const text = query.toString();
  return text === '' ? base : `${base}?${text}`;
}

export function goToPath(path) {
  window.location.href = withSeed(path);
}
