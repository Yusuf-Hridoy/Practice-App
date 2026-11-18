// Drift: the app pretending to be a newer version where things were renamed
// or moved. It is for practising self-healing tests.
//
// Four switches, all off by default:
//   drift=text    eleven labels are renamed
//   drift=ids     every data-testid changes (that one lives in js/test-ids.js)
//   drift=layout  three parts of the app move
//   drift=popup   a cookie banner and a Pro dialog turn up once per tab
//
// Messages and error texts never change. The Test switches page is never
// drifted, so there is always a way back.

import { TEXT, DRIFT_TEXT, buyButtonText, sellButtonText, addButtonText, driftAddButtonText } from './ui-text.js';
import { TEST_IDS } from './test-ids.js';
import { isDriftOn } from './test-switches.js';

export const COOKIE_DELAY_MS = 2000;
export const COOKIE_SHOWN_KEY = 'tradeloom.drift.cookie';
export const PROMO_SHOWN_KEY = 'tradeloom.drift.promo';

export function isTextDrift() {
  return isDriftOn('text');
}

export function isLayoutDrift() {
  return isDriftOn('layout');
}

export function isPopupDrift() {
  return isDriftOn('popup');
}

// --- renamed labels ---

// The one helper every renamed label goes through. The text still comes from
// ui-text.js; this only picks the newer name for it when drift=text is on.
// Nothing ever searches the drawn page for words to replace.
export function driftLabel(text) {
  if (!isTextDrift()) return text;
  const swaps = DRIFT_TEXT.swaps;
  return Object.prototype.hasOwnProperty.call(swaps, text) ? swaps[text] : text;
}

// The big button at the bottom of the trade box.
export function tradeButtonText(mode, shares, symbol) {
  if (isTextDrift()) {
    return mode === 'buy' ? DRIFT_TEXT.buyMainButton : DRIFT_TEXT.sellMainButton;
  }
  return mode === 'buy' ? buyButtonText(shares, symbol) : sellButtonText(shares, symbol);
}

// The Add button on the Wallet page.
export function addMoneyButtonText(amountLabel) {
  return isTextDrift() ? driftAddButtonText(amountLabel) : addButtonText(amountLabel);
}

// --- surprise popups ---

// Once per browser tab. Storage can be blocked; then the popup shows again,
// which is still only once per page.
function wasShown(key) {
  try {
    return window.sessionStorage.getItem(key) === 'yes';
  } catch (error) {
    return false;
  }
}

function markShown(key) {
  try {
    window.sessionStorage.setItem(key, 'yes');
  } catch (error) {
    // Nothing to do. The popup keeps working for this page.
  }
}

function buildCookieBanner() {
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('data-testid', TEST_IDS.cookieBanner);
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', TEXT.popups.cookieBody);

  const line = document.createElement('p');
  line.className = 'cookie-line';
  line.textContent = TEXT.popups.cookieBody;

  const row = document.createElement('div');
  row.className = 'row';

  const accept = document.createElement('button');
  accept.type = 'button';
  accept.className = 'btn btn-accent';
  accept.setAttribute('data-testid', TEST_IDS.cookieAccept);
  accept.textContent = TEXT.popups.cookieAccept;

  const reject = document.createElement('button');
  reject.type = 'button';
  reject.className = 'btn';
  reject.setAttribute('data-testid', TEST_IDS.cookieReject);
  reject.textContent = TEXT.popups.cookieReject;

  function close() {
    banner.remove();
  }

  accept.addEventListener('click', close);
  reject.addEventListener('click', close);

  row.append(accept, reject);
  banner.append(line, row);
  return banner;
}

// Two seconds after the first logged-in page of this tab. Every logged-in
// page starts it from the top menu; only the first one gets to show it.
export function startCookieBanner() {
  if (!isPopupDrift()) return;
  if (wasShown(COOKIE_SHOWN_KEY)) return;

  // setTimeout, so Playwright's Clock API controls the wait.
  window.setTimeout(() => {
    if (wasShown(COOKIE_SHOWN_KEY)) return;
    markShown(COOKIE_SHOWN_KEY);
    document.body.append(buildCookieBanner());
  }, COOKIE_DELAY_MS);
}

// A real <dialog> opened with showModal, so nothing behind it can be clicked.
export function startPromoDialog() {
  if (!isPopupDrift()) return;
  if (wasShown(PROMO_SHOWN_KEY)) return;
  markShown(PROMO_SHOWN_KEY);

  const dialog = document.createElement('dialog');
  dialog.setAttribute('data-testid', TEST_IDS.promoDialog);

  const heading = document.createElement('h2');
  heading.textContent = TEXT.popups.proTitle;

  const body = document.createElement('p');
  body.className = 'muted';
  body.textContent = TEXT.popups.proBody;

  const actions = document.createElement('div');
  actions.className = 'dialog-actions';

  const no = document.createElement('button');
  no.type = 'button';
  no.className = 'btn';
  no.setAttribute('data-testid', TEST_IDS.promoNoThanks);
  no.textContent = TEXT.popups.proNoThanks;

  const learn = document.createElement('button');
  learn.type = 'button';
  learn.className = 'btn btn-accent';
  learn.setAttribute('data-testid', TEST_IDS.promoLearnMore);
  learn.textContent = TEXT.popups.proLearnMore;

  function close() {
    dialog.close();
    dialog.remove();
  }

  no.addEventListener('click', close);
  learn.addEventListener('click', close);

  actions.append(no, learn);
  dialog.append(heading, body, actions);
  document.body.append(dialog);
  dialog.showModal();
}
