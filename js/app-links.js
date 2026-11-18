// Builds every link and redirect, so the app works both on a local
// python -m http.server (which needs .html) and on Vercel (clean URLs).
// It also copies the ?seed and ?market switches onto every link, so they survive page changes.
// Every test switch rides along the same way, so a switch stays on while you click around.
//
// The API imports this file (through the price engine) to ask for the seed.
// Node has no window, so everything that reads the page link is guarded.

import { switchParams } from './test-switches.js';

export const DEFAULT_SEED = 'tradeloom';

const PAGE_FILES = Object.freeze({
  login: 'index',
  market: 'market',
  stock: 'stock',
  portfolio: 'portfolio',
  watchlist: 'watchlist',
  news: 'news',
  wallet: 'wallet',
  profile: 'profile',
  rules: 'rules',
  paymentFrame: 'payment-frame',
  receipt: 'receipt',
  switches: 'switches',
  changelog: 'changelog',
  notFound: '404',
});

// There is no page link in Node. The API sets the seed itself instead.
let seedOverride = null;

export function setSeedOverride(value) {
  seedOverride = value === null || value === undefined || String(value).trim() === ''
    ? null
    : String(value).trim();
}

function linkParams() {
  if (typeof window === 'undefined' || !window.location) return new URLSearchParams('');
  return new URLSearchParams(window.location.search);
}

export function isLocalHost() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '';
}

export function getSeed() {
  if (seedOverride !== null) return seedOverride;
  const value = linkParams().get('seed');
  const trimmed = (value || '').trim();
  return trimmed === '' ? null : trimmed;
}

export function seedValue() {
  return getSeed() || DEFAULT_SEED;
}

// The only value the ?market switch understands. Anything else leaves the market open.
export const MARKET_CLOSED = 'closed';

export function getMarket() {
  const value = linkParams().get('market');
  const trimmed = (value || '').trim();
  return trimmed === '' ? null : trimmed;
}

export function isMarketClosedLink() {
  return getMarket() === MARKET_CLOSED;
}

// Just the path of a page, with nothing in the query. The Test switches page
// builds its own link, so it needs the path without today's switches on it.
export function pagePath(page) {
  const file = PAGE_FILES[page];
  if (!file) throw new Error(`Unknown page: ${page}`);
  const local = isLocalHost();
  if (page === 'login') return local ? '/index.html' : '/';
  return local ? `/${file}.html` : `/${file}`;
}

export function href(page, params = {}) {
  const path = pagePath(page);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }

  const seed = getSeed();
  if (seed && !query.has('seed')) query.set('seed', seed);

  const market = getMarket();
  if (market && !query.has('market')) query.set('market', market);

  for (const [key, value] of Object.entries(switchParams())) {
    if (!query.has(key)) query.set(key, value);
  }

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

// Keeps the ?seed and ?market switches, and every test switch, on a path the
// app sends someone to.
export function withSeed(path) {
  const seed = getSeed();
  const market = getMarket();
  const switches = switchParams();
  if (!seed && !market && Object.keys(switches).length === 0) return path;
  const [base, search = ''] = path.split('?');
  const query = new URLSearchParams(search);
  if (seed && !query.has('seed')) query.set('seed', seed);
  if (market && !query.has('market')) query.set('market', market);
  for (const [key, value] of Object.entries(switches)) {
    if (!query.has(key)) query.set(key, value);
  }
  const text = query.toString();
  return text === '' ? base : `${base}?${text}`;
}

export function goToPath(path) {
  window.location.href = withSeed(path);
}
