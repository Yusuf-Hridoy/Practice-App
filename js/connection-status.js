// The offline banner, and the message when the internet comes back.
// Every logged-in page starts this from the top menu. Pages listen for
// CONNECTION_CHANGED to stop and restart their 5-second price refresh.

import { TEXT } from './ui-text.js';
import { TEST_IDS } from './test-ids.js';
import { showToast } from './toast-messages.js';

export const CONNECTION_CHANGED = 'tradeloom:connection-changed';
export const BACK_ONLINE_MS = 3000;

let started = false;
let banner = null;

export function isOffline() {
  return window.navigator.onLine === false;
}

function bannerNode() {
  if (banner && document.body.contains(banner)) return banner;

  banner = document.createElement('div');
  banner.className = 'offline-banner';
  banner.setAttribute('data-testid', TEST_IDS.offlineBanner);
  banner.setAttribute('role', 'alert');
  banner.textContent = TEXT.connection.offlineBanner;
  banner.hidden = true;
  document.body.prepend(banner);
  return banner;
}

function announce(offline) {
  bannerNode().hidden = !offline;
  window.dispatchEvent(new CustomEvent(CONNECTION_CHANGED, { detail: { offline } }));
}

export function startConnectionStatus() {
  if (started) return;
  started = true;

  // Whatever the browser says right now.
  announce(isOffline());

  window.addEventListener('offline', () => {
    announce(true);
  });

  window.addEventListener('online', () => {
    announce(false);
    showToast({
      symbol: '',
      title: TEXT.connection.backOnline,
      detail: '',
      tone: 'ok',
      lifeMs: BACK_ONLINE_MS,
    });
  });
}
