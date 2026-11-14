// Logs you out after 15 minutes with no activity, with a warning at 14.
// It is always on, on every logged-in page.
// The time of the last activity is saved in localStorage, so every open tab
// shares it: activity in one tab resets the timer in all of them.

import { TEXT, idleCountdownText } from './ui-text.js';
import { TEST_IDS } from './test-ids.js';
import { clearSession } from './account-storage.js';
import { replaceWith } from './app-links.js';

export const LAST_ACTIVE_KEY = 'tradeloom.lastActive';
export const WARN_MS = 14 * 60 * 1000;
export const LOGOUT_MS = 15 * 60 * 1000;
export const TICK_MS = 1000;
export const IDLE_REASON = 'idle';

export const ACTIVITY_EVENTS = Object.freeze([
  'pointerdown',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
]);

let started = false;
let dialog = null;
let countdownNode = null;
let timer = null;
let leaving = false;

// --- the shared time of the last activity ---

export function writeLastActive(nowMs = Date.now()) {
  try {
    window.localStorage.setItem(LAST_ACTIVE_KEY, String(nowMs));
  } catch (error) {
    // Storage can be blocked. The page keeps working.
  }
}

export function readLastActive(nowMs = Date.now()) {
  let value = NaN;
  try {
    value = Number(window.localStorage.getItem(LAST_ACTIVE_KEY));
  } catch (error) {
    value = NaN;
  }
  // Missing, broken, or later than now: start the count from now.
  if (!Number.isFinite(value) || value <= 0 || value > nowMs) {
    writeLastActive(nowMs);
    return nowMs;
  }
  return value;
}

// Whole seconds still to go. It starts at 0:59 and ends at 0:00.
export function secondsLeft(idleMs) {
  return Math.max(0, Math.ceil((LOGOUT_MS - idleMs) / 1000) - 1);
}

// --- the dialog ---

function buildDialog() {
  dialog = document.createElement('dialog');
  dialog.setAttribute('data-testid', TEST_IDS.idleDialog);
  dialog.className = 'idle-dialog';
  dialog.innerHTML = `
    <h2>${TEXT.idle.dialogTitle}</h2>
    <p class="idle-text">${TEXT.idle.bodyStart}<span data-testid="${TEST_IDS.idleCountdown}">${idleCountdownText(59)}</span>${TEXT.idle.bodyEnd}</p>
    <div class="dialog-actions" style="margin-top: 20px;">
      <button type="button" class="btn" data-testid="${TEST_IDS.idleLogout}">${TEXT.idle.logoutNow}</button>
      <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.idleStay}" autofocus>${TEXT.idle.stay}</button>
    </div>
  `;

  countdownNode = dialog.querySelector(`[data-testid="${TEST_IDS.idleCountdown}"]`);

  dialog.querySelector(`[data-testid="${TEST_IDS.idleStay}"]`).addEventListener('click', stayLoggedIn);
  dialog.querySelector(`[data-testid="${TEST_IDS.idleLogout}"]`).addEventListener('click', endSession);

  // Esc must not wave the warning away. Only the two buttons answer it.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
  });

  document.body.append(dialog);
}

function dialogIsOpen() {
  return dialog !== null && dialog.open === true;
}

function openDialog() {
  if (dialog === null) buildDialog();
  if (!dialog.open) dialog.showModal();
}

function closeDialog() {
  if (dialogIsOpen()) dialog.close();
}

// --- what happens at 14 and at 15 minutes ---

export function stayLoggedIn(nowMs = Date.now()) {
  writeLastActive(typeof nowMs === 'number' ? nowMs : Date.now());
  closeDialog();
}

// Only the session goes. The account, the watchlist and the profile stay.
export function endSession() {
  if (leaving) return;
  leaving = true;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  closeDialog();
  clearSession();
  replaceWith('login', { reason: IDLE_REASON });
}

function tick() {
  if (leaving) return;

  const nowMs = Date.now();
  const idleMs = nowMs - readLastActive(nowMs);

  if (idleMs >= LOGOUT_MS) {
    endSession();
    return;
  }

  if (idleMs >= WARN_MS) {
    openDialog();
    countdownNode.textContent = idleCountdownText(secondsLeft(idleMs));
    return;
  }

  // Someone moved, here or in another tab.
  closeDialog();
}

// --- starting it ---

function onActivity() {
  // Activity behind the dialog does not count. Only "Stay logged in" does.
  if (dialogIsOpen()) return;
  writeLastActive();
}

export function startIdleTimer() {
  if (started) return;
  started = true;

  // Opening a page is activity.
  writeLastActive();

  for (const name of ACTIVITY_EVENTS) {
    window.addEventListener(name, onActivity, { passive: true, capture: true });
  }

  // Another tab wrote a newer time: close the warning at once.
  window.addEventListener('storage', (event) => {
    if (event.key === LAST_ACTIVE_KEY) tick();
  });

  // setInterval, so Playwright's Clock API can move it forward.
  timer = window.setInterval(tick, TICK_MS);
}

// Reads ?reason=idle from the log in page URL.
export function idleReasonFromUrl() {
  return new URLSearchParams(window.location.search).get('reason') === IDLE_REASON;
}
