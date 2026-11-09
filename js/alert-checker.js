// Checks every price alert every 5 seconds, on every logged-in page.

import { toastTitle, toastDetail } from './ui-text.js';
import { formatMoney } from './money-format.js';
import { dhakaIsoString } from './market-hours.js';
import { priceNowCents } from './price-engine.js';
import { readWatchlist, writeWatchlist } from './watchlist-storage.js';
import { isAlertHit, directionWord } from './watchlist-rules.js';
import { showToast } from './toast-messages.js';

export const CHECK_MS = 5000;
export const WATCHLIST_CHANGED = 'tradeloom:watchlist-changed';

let started = false;

function canShowBrowserAlerts() {
  return typeof window.Notification === 'function' && window.Notification.permission === 'granted';
}

export function checkAlertsOnce(user, stocks, nowMs = Date.now()) {
  const symbols = stocks.map((stock) => stock.symbol);
  const watchlist = readWatchlist(user.email, user.watchlistStart, symbols);
  const hits = [];

  for (const symbol of watchlist.symbols) {
    const alert = watchlist.alerts[symbol];
    if (!alert || alert.status === 'hit') continue;

    const stock = stocks.find((one) => one.symbol === symbol);
    if (!stock) continue;

    const nowCents = priceNowCents(stock, nowMs);
    if (!isAlertHit(alert, nowCents)) continue;

    // Read it again. Another tab may have marked this alert first.
    const fresh = readWatchlist(user.email, user.watchlistStart, symbols);
    const freshAlert = fresh.alerts[symbol];
    if (!freshAlert || freshAlert.status === 'hit') continue;

    freshAlert.status = 'hit';
    freshAlert.hitAt = dhakaIsoString(nowMs);
    freshAlert.hitPriceCents = nowCents;
    writeWatchlist(user.email, fresh);

    const title = toastTitle(symbol, directionWord(freshAlert.direction), formatMoney(freshAlert.priceCents));
    const detail = toastDetail(formatMoney(nowCents));

    if (freshAlert.popup) showToast({ symbol, title, detail });
    if (freshAlert.browser && canShowBrowserAlerts()) {
      try {
        const notification = new window.Notification(title, { body: detail });
        void notification;
      } catch (error) {
        // Some browsers refuse a plain Notification. The pop-up still shows.
      }
    }

    window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGED, { detail: { symbol } }));
    hits.push(symbol);
  }

  return hits;
}

export function startAlertChecker(user) {
  if (started) return;
  started = true;

  let stocks = null;

  function check() {
    if (!stocks) return;
    checkAlertsOnce(user, stocks);
  }

  fetch('/data/stocks.json')
    .then((response) => {
      if (!response.ok) throw new Error('Could not load stocks');
      return response.json();
    })
    .then((loaded) => {
      stocks = loaded;
      check();
      window.setInterval(check, CHECK_MS);
    })
    .catch(() => {
      // Without the stock list there is nothing to check. The page still works.
    });
}
