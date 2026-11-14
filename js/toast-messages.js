// Pop-up messages at the bottom right. Each one closes itself after 5 seconds,
// unless the caller asks for a shorter life.

import { TEXT } from './ui-text.js';
import { TEST_IDS } from './test-ids.js';

export const TOAST_LIFE_MS = 5000;
export const MAX_TOASTS = 3;

let area = null;

export function toastArea() {
  if (area && document.body.contains(area)) return area;

  area = document.createElement('div');
  area.className = 'toast-area';
  area.setAttribute('data-testid', TEST_IDS.toastArea);
  area.setAttribute('aria-live', 'polite');
  document.body.append(area);
  return area;
}

function removeToast(toast) {
  if (toast.dataset.timer) window.clearTimeout(Number(toast.dataset.timer));
  toast.remove();
}

export function openToasts() {
  return [...toastArea().querySelectorAll(`[data-testid="${TEST_IDS.toast}"]`)];
}

export function closeAllToasts() {
  for (const toast of openToasts()) removeToast(toast);
}

export function showToast({ symbol, title, detail, tone, lifeMs }) {
  const host = toastArea();

  const toast = document.createElement('div');
  toast.className = tone === 'ok' ? 'toast toast-ok' : 'toast';
  toast.setAttribute('data-testid', TEST_IDS.toast);
  toast.setAttribute('data-symbol', symbol);
  toast.setAttribute('role', 'status');

  const body = document.createElement('div');
  const titleLine = document.createElement('div');
  titleLine.className = 'toast-title';
  titleLine.textContent = title;
  const detailLine = document.createElement('div');
  detailLine.className = 'toast-detail';
  detailLine.textContent = detail;
  body.append(titleLine, detailLine);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'toast-close';
  close.setAttribute('data-testid', TEST_IDS.toastClose);
  close.setAttribute('aria-label', TEXT.toast.close);
  close.textContent = TEXT.watchlist.removeMark;
  close.addEventListener('click', () => removeToast(toast));

  toast.append(body, close);
  host.append(toast);

  // A 4th message pushes the oldest one out.
  const open = openToasts();
  for (let i = 0; i < open.length - MAX_TOASTS; i += 1) removeToast(open[i]);

  // setTimeout, so Playwright's Clock API can control it.
  const life = typeof lifeMs === 'number' ? lifeMs : TOAST_LIFE_MS;
  toast.dataset.timer = String(window.setTimeout(() => removeToast(toast), life));
  return toast;
}
