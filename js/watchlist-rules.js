// Add, remove, move and the price alert checks. All money is whole cents.

import { MAX_WATCHLIST } from './watchlist-storage.js';
import { formatMoney } from './money-format.js';
import { TEXT, alertRangeError, alertAboveError, alertBelowError } from './ui-text.js';

export { MAX_WATCHLIST };

export const RANGE_LOW_SHARE = 0.8;
export const RANGE_HIGH_SHARE = 1.2;
export const DEFAULT_ALERT_SHARE = 1.05;

function copy(watchlist) {
  return JSON.parse(JSON.stringify(watchlist));
}

export function isOnWatchlist(watchlist, symbol) {
  return watchlist.symbols.includes(symbol);
}

export function isFull(watchlist) {
  return watchlist.symbols.length >= MAX_WATCHLIST;
}

// New stocks go to the end.
export function addSymbol(watchlist, symbol) {
  // Nothing picked, or a symbol that is not a stock: leave the list alone.
  if (typeof symbol !== 'string' || symbol === '') return { ok: true, watchlist: copy(watchlist) };
  if (isOnWatchlist(watchlist, symbol)) return { ok: true, watchlist: copy(watchlist) };
  if (isFull(watchlist)) return { ok: false, error: TEXT.watchlist.full };

  const next = copy(watchlist);
  next.symbols.push(symbol);
  return { ok: true, watchlist: next };
}

// Removes the stock and its alert.
export function removeSymbol(watchlist, symbol) {
  const next = copy(watchlist);
  next.symbols = next.symbols.filter((one) => one !== symbol);
  delete next.alerts[symbol];
  return { ok: true, watchlist: next };
}

export function removeAll(watchlist) {
  return { ok: true, watchlist: { symbols: [], alerts: {} } };
}

// Moves a stock to a new position. Any order is allowed.
export function moveSymbol(watchlist, symbol, toIndex) {
  const next = copy(watchlist);
  const from = next.symbols.indexOf(symbol);
  if (from === -1) return { ok: true, watchlist: next };

  const target = Math.min(Math.max(toIndex, 0), next.symbols.length - 1);
  next.symbols.splice(from, 1);
  next.symbols.splice(target, 0, symbol);
  return { ok: true, watchlist: next, position: target + 1, total: next.symbols.length };
}

// --- alerts ---

// 80% to 120% of the price when the alert editor opens.
export function alertRange(priceNowCents) {
  return {
    lowCents: Math.round(priceNowCents * RANGE_LOW_SHARE),
    highCents: Math.round(priceNowCents * RANGE_HIGH_SHARE),
  };
}

export function defaultAlertPriceCents(priceNowCents) {
  return Math.round(priceNowCents * DEFAULT_ALERT_SHARE);
}

// A number with up to 2 decimals, in dollars. Returns whole cents.
export function parseAlertPrice(rawValue) {
  const text = String(rawValue === undefined || rawValue === null ? '' : rawValue).trim();
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(text)) return { ok: false };
  const cents = Math.round(Number(text) * 100);
  if (!Number.isFinite(cents)) return { ok: false };
  return { ok: true, cents };
}

export function checkAlert({ priceText, direction, priceNowCents, rangeCents, popup, browser }) {
  const range = rangeCents || alertRange(priceNowCents);
  const parsed = parseAlertPrice(priceText);

  if (!parsed.ok || parsed.cents < range.lowCents || parsed.cents > range.highCents) {
    return { ok: false, error: alertRangeError(formatMoney(range.lowCents), formatMoney(range.highCents)) };
  }
  if (direction === 'above' && parsed.cents <= priceNowCents) {
    return { ok: false, error: alertAboveError(formatMoney(priceNowCents)) };
  }
  if (direction === 'below' && parsed.cents >= priceNowCents) {
    return { ok: false, error: alertBelowError(formatMoney(priceNowCents)) };
  }
  if (!popup && !browser) {
    return { ok: false, error: TEXT.alertEditor.noChannel };
  }

  return {
    ok: true,
    alert: {
      direction,
      priceCents: parsed.cents,
      popup,
      browser,
      status: 'waiting',
      hitAt: null,
      hitPriceCents: null,
    },
  };
}

// One alert per stock. Saving replaces the old one and sets it back to waiting.
export function saveAlert(watchlist, symbol, alert) {
  const next = copy(watchlist);
  next.alerts[symbol] = alert;
  return { ok: true, watchlist: next };
}

export function deleteAlert(watchlist, symbol) {
  const next = copy(watchlist);
  delete next.alerts[symbol];
  return { ok: true, watchlist: next };
}

export function getAlert(watchlist, symbol) {
  return watchlist.alerts[symbol] || null;
}

// Above is hit at or over its price. Below is hit at or under it.
export function isAlertHit(alert, priceNowCents) {
  if (!alert || alert.status === 'hit') return false;
  if (alert.direction === 'above') return priceNowCents >= alert.priceCents;
  return priceNowCents <= alert.priceCents;
}

export function directionWord(direction) {
  return direction === 'above' ? 'above' : 'below';
}

export function directionLabel(direction) {
  return direction === 'above' ? TEXT.alertEditor.above : TEXT.alertEditor.below;
}
