// The / and Esc keys, on every logged-in page.

import { TEST_IDS } from './test-ids.js';
import { closeAllToasts } from './toast-messages.js';

let started = false;
let currentPage = '';
const escapeHandlers = [];

// The / key is for the page, not for something being typed.
function isTyping(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return true;
  return target.isContentEditable === true;
}

function focusSearchBox() {
  const search = document.querySelector(`[data-testid="${TEST_IDS.marketSearch}"]`);
  if (search) search.focus();
}

function focusAddSelect() {
  const select = document.querySelector(`[data-testid="${TEST_IDS.watchlistAddSelect}"]`);
  if (select) select.focus();
}

export function onEscape(handler) {
  escapeHandlers.push(handler);
}

function handleKey(event) {
  if (event.key === 'Escape') {
    closeAllToasts();
    for (const handler of escapeHandlers) handler();
    return;
  }

  if (isTyping(event.target)) return;

  if (event.key === '/') {
    if (currentPage === 'market') {
      event.preventDefault();
      focusSearchBox();
    } else if (currentPage === 'watchlist') {
      event.preventDefault();
      focusAddSelect();
    }
  }
}

export function startKeyboardShortcuts(page) {
  currentPage = page;
  if (started) return;
  started = true;
  document.addEventListener('keydown', handleKey);
}
