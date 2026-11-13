// Every buy, sell and add-money rule. All money is whole cents.
// Each check returns { ok: true, ... } or { ok: false, error: "<exact text>" }.

import { marketStatus } from './market-hours.js';
import { dhakaIsoString } from './market-hours.js';
import { formatMoney } from './money-format.js';
import { nextHistoryId } from './account-storage.js';
import {
  badSharesMessage,
  marketClosedMessage,
  notEnoughCashMessage,
  cannotAffordOneMessage,
  ownNoneMessage,
  ownFewerMessage,
  addLimitLeftMessage,
  addLimitReachedMessage,
} from './ui-text.js';

export const MIN_SHARES = 1;
export const MAX_SHARES = 1000000;
export const ADD_LIMIT_CENTS = 5000000;
export const ADD_CHOICES_CENTS = Object.freeze([100000, 500000, 1000000]);

// --- small helpers ---

export function parseShares(rawValue) {
  const text = String(rawValue === undefined || rawValue === null ? '' : rawValue).trim();
  if (!/^[0-9]+$/.test(text)) return { ok: false, error: badSharesMessage() };
  const shares = Number(text);
  if (!Number.isInteger(shares) || shares < MIN_SHARES || shares > MAX_SHARES) {
    return { ok: false, error: badSharesMessage() };
  }
  return { ok: true, shares };
}

export function marketClosedError() {
  const status = marketStatus();
  return status.open ? null : marketClosedMessage();
}

export function maxAffordableShares(cashCents, priceCents) {
  if (priceCents <= 0) return 0;
  return Math.floor(cashCents / priceCents);
}

export function getHolding(account, symbol) {
  return account.holdings[symbol] || null;
}

export function ownedShares(account, symbol) {
  const holding = getHolding(account, symbol);
  return holding ? holding.shares : 0;
}

export function averagePaidCents(holding) {
  if (!holding || holding.shares === 0) return 0;
  return Math.round(holding.totalPaidCents / holding.shares);
}

export function holdingWorthCents(holding, priceCents) {
  return holding.shares * priceCents;
}

export function holdingGainCents(holding, priceCents) {
  return holding.shares * priceCents - holding.totalPaidCents;
}

export function gainPercent(gainCents, totalPaidCents) {
  if (totalPaidCents === 0) return 0;
  return (gainCents / totalPaidCents) * 100;
}

export function stocksWorthCents(account, pricesBySymbol) {
  return Object.entries(account.holdings).reduce((sum, [symbol, holding]) => {
    const price = pricesBySymbol[symbol] || 0;
    return sum + holding.shares * price;
  }, 0);
}

export function totalPaidCents(account) {
  return Object.values(account.holdings).reduce((sum, holding) => sum + holding.totalPaidCents, 0);
}

export function totalWorthCents(account, pricesBySymbol) {
  return account.cashCents + stocksWorthCents(account, pricesBySymbol);
}

export function stocksChangeSinceOpenCents(account, pricesBySymbol, openBySymbol) {
  return Object.entries(account.holdings).reduce((sum, [symbol, holding]) => {
    const now = pricesBySymbol[symbol] || 0;
    const open = openBySymbol[symbol] || 0;
    return sum + holding.shares * (now - open);
  }, 0);
}

function cloneAccount(account) {
  return JSON.parse(JSON.stringify(account));
}

// --- buying ---

export function checkBuy({ sharesRaw, priceCents, account, symbol, nowMs = Date.now() }) {
  const shares = parseShares(sharesRaw);
  if (!shares.ok) return shares;

  const closed = marketClosedError();
  if (closed) return { ok: false, error: closed };

  const costCents = shares.shares * priceCents;
  if (costCents > account.cashCents) {
    const maxShares = maxAffordableShares(account.cashCents, priceCents);
    if (maxShares === 0) return { ok: false, error: cannotAffordOneMessage(symbol) };
    return {
      ok: false,
      error: notEnoughCashMessage(
        shares.shares,
        symbol,
        formatMoney(costCents),
        formatMoney(account.cashCents),
        maxShares,
      ),
    };
  }

  return { ok: true, shares: shares.shares, costCents };
}

export function applyBuy(account, { symbol, shares, priceCents, nowMs = Date.now() }) {
  const next = cloneAccount(account);
  const costCents = shares * priceCents;

  next.cashCents -= costCents;
  const holding = next.holdings[symbol] || { shares: 0, totalPaidCents: 0 };
  holding.shares += shares;
  holding.totalPaidCents += costCents;
  next.holdings[symbol] = holding;

  next.history.push({
    id: nextHistoryId(next),
    time: dhakaIsoString(nowMs),
    type: 'buy',
    symbol,
    shares,
    priceCents,
    amountCents: -costCents,
    cashAfterCents: next.cashCents,
  });

  return { account: next, costCents, cashAfterCents: next.cashCents };
}

// --- selling ---

export function checkSell({ sharesRaw, priceCents, account, symbol, nowMs = Date.now() }) {
  const shares = parseShares(sharesRaw);
  if (!shares.ok) return shares;

  const closed = marketClosedError();
  if (closed) return { ok: false, error: closed };

  const owned = ownedShares(account, symbol);
  if (owned === 0) return { ok: false, error: ownNoneMessage(symbol) };
  if (shares.shares > owned) return { ok: false, error: ownFewerMessage(owned, symbol) };

  return { ok: true, shares: shares.shares, proceedsCents: shares.shares * priceCents };
}

export function applySell(account, { symbol, shares, priceCents, nowMs = Date.now() }) {
  const next = cloneAccount(account);
  const holding = next.holdings[symbol];
  const proceedsCents = shares * priceCents;

  const removedPaidCents =
    shares === holding.shares
      ? holding.totalPaidCents
      : Math.round((holding.totalPaidCents * shares) / holding.shares);

  holding.shares -= shares;
  holding.totalPaidCents -= removedPaidCents;
  if (holding.shares === 0) delete next.holdings[symbol];

  next.cashCents += proceedsCents;

  next.history.push({
    id: nextHistoryId(next),
    time: dhakaIsoString(nowMs),
    type: 'sell',
    symbol,
    shares,
    priceCents,
    amountCents: proceedsCents,
    cashAfterCents: next.cashCents,
  });

  return {
    account: next,
    proceedsCents,
    removedPaidCents,
    gainCents: proceedsCents - removedPaidCents,
    cashAfterCents: next.cashCents,
  };
}

export function sellGainPreviewCents(account, symbol, shares, priceCents) {
  const holding = getHolding(account, symbol);
  if (!holding || holding.shares === 0) return 0;
  const safeShares = Math.min(shares, holding.shares);
  const removedPaidCents =
    safeShares === holding.shares
      ? holding.totalPaidCents
      : Math.round((holding.totalPaidCents * safeShares) / holding.shares);
  return safeShares * priceCents - removedPaidCents;
}

// --- adding practice money ---

export function addLeftCents(account) {
  return Math.max(0, ADD_LIMIT_CENTS - account.totalAddedCents);
}

export function checkAdd(account, amountCents) {
  const left = addLeftCents(account);
  if (left === 0) return { ok: false, error: addLimitReachedMessage() };
  if (amountCents > left) return { ok: false, error: addLimitLeftMessage(formatMoney(left)) };
  return { ok: true, amountCents };
}

// last4 is the last 4 digits of the test card that paid. The history row keeps
// it, so the wallet line and the receipt can both say which card was used.
export function applyAdd(account, amountCents, nowMs = Date.now(), last4 = '') {
  const next = cloneAccount(account);
  next.cashCents += amountCents;
  next.totalAddedCents += amountCents;

  const entry = {
    id: nextHistoryId(next),
    time: dhakaIsoString(nowMs),
    type: 'add',
    amountCents,
    cashAfterCents: next.cashCents,
  };
  if (String(last4) !== '') entry.last4 = String(last4);
  next.history.push(entry);

  return { account: next, cashAfterCents: next.cashCents };
}
