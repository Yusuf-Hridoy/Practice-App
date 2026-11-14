// Watchlist page: up to 6 stocks in your own order, with one price alert each.

import {
  TEXT,
  watchlistOptionText,
  moveHandleLabel,
  removeFromWatchlistLabel,
  setAlertLabel,
  movedMessage,
  removedFromWatchlistMessage,
  alertPillText,
  alertHitAtPill,
  alertHitOnPill,
  alertEditorTitle,
  alertPriceNowLine,
  alertRangeEndLow,
  alertRangeEndHigh,
  alertSavedMessage,
} from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { href } from '../app-links.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import { onEscape } from '../keyboard-shortcuts.js';
import { WATCHLIST_CHANGED } from '../alert-checker.js';
import {
  formatMoney,
  formatPercent,
  arrowFor,
  directionClass,
  dhakaClockOf,
  dhakaDayOf,
  isSameDhakaDay,
} from '../money-format.js';
import { priceNowCents, changeSinceOpen } from '../price-engine.js';
import { readWatchlist, changeWatchlist } from '../watchlist-storage.js';
import { isOffline, CONNECTION_CHANGED } from '../connection-status.js';
import {
  addSymbol,
  removeSymbol,
  removeAll,
  moveSymbol,
  saveAlert,
  deleteAlert,
  getAlert,
  alertRange,
  defaultAlertPriceCents,
  checkAlert,
  parseAlertPrice,
  directionLabel,
  directionWord,
} from '../watchlist-rules.js';

const REFRESH_MS = 5000;

let session = null;
let stocks = [];
let symbols = [];
let watchlist = { symbols: [], alerts: {} };
let rowParts = new Map();

let editorSymbol = null;
let editorRange = { lowCents: 0, highCents: 0 };
let editorPriceNowCents = 0;
let draggedSymbol = null;
let refreshTimer = null;

function pick(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

function stockFor(symbol) {
  return stocks.find((one) => one.symbol === symbol) || null;
}

function reloadWatchlist() {
  watchlist = readWatchlist(session.user.email, session.user.watchlistStart, symbols);
  return watchlist;
}

// Every change reads the saved watchlist again first, so a second tab is safe.
function change(apply) {
  const result = changeWatchlist(session.user.email, session.user.watchlistStart, symbols, apply);
  if (result && result.ok !== false) watchlist = result.watchlist;
  else reloadWatchlist();
  return result;
}

// --- markup ---

function shellHtml() {
  return `
    <div class="wrap stack">
      <div class="row-between">
        <div class="stack-sm">
          <h1>${TEXT.watchlist.title}</h1>
          <p class="muted">${TEXT.watchlist.intro}</p>
        </div>
        <div class="stack-sm">
          <div class="row">
            <button type="button" class="btn" data-testid="${TEST_IDS.browserAlertsButton}">
              ${TEXT.watchlist.browserAlertsButton}
            </button>
            <button type="button" class="btn" data-testid="${TEST_IDS.removeAll}">
              ${TEXT.watchlist.removeAll}
            </button>
          </div>
          <p class="muted small" data-testid="${TEST_IDS.browserAlertsStatus}"></p>
        </div>
      </div>

      <div class="grid-2-1">
        <div class="stack">
          <div class="card stack-sm">
            <div class="row-between">
              <div class="row add-row">
                <div class="field">
                  <label for="watchlist-add-field">${TEXT.watchlist.addLabel}</label>
                  <select id="watchlist-add-field" data-testid="${TEST_IDS.watchlistAddSelect}"></select>
                </div>
                <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.watchlistAddSubmit}">
                  ${TEXT.watchlist.add}
                </button>
              </div>
              <p class="key-hint muted small">
                ${TEXT.watchlist.keyHintPress} <kbd>${TEXT.watchlist.keySlash}</kbd> ${TEXT.watchlist.keyHintSearch}
                ${TEXT.watchlist.keyHintDot}
                <kbd>${TEXT.watchlist.keyEsc}</kbd> ${TEXT.watchlist.keyHintClose}
              </p>
            </div>
            <p class="error-text" role="alert" data-testid="${TEST_IDS.watchlistAddError}"></p>
            <p class="up ok-text" role="status" data-testid="${TEST_IDS.watchlistStatus}"></p>
          </div>

          <div class="card">
            <div class="watch-list" id="watchlist-rows" role="list"></div>
            <div class="stack-sm" data-testid="${TEST_IDS.watchlistEmpty}" hidden>
              <h2>${TEXT.watchlist.emptyTitle}</h2>
              <p class="muted">${TEXT.watchlist.emptyBody}</p>
            </div>
          </div>
        </div>

        <div class="card stack-sm" data-testid="${TEST_IDS.alertEditor}">
          <p class="muted" data-testid="${TEST_IDS.alertEditorClosed}">${TEXT.alertEditor.closedHint}</p>

          <div class="stack-sm" id="alert-editor-open" hidden>
            <h2 id="alert-editor-title"></h2>
            <p class="muted" data-testid="${TEST_IDS.alertPriceNow}" data-cents="0"></p>

            <fieldset class="alert-fieldset">
              <legend>${TEXT.alertEditor.legend}</legend>
              <div class="radio-row">
                <label class="radio-button">
                  <input type="radio" name="alert-direction" value="above" data-testid="${TEST_IDS.alertDirectionAbove}">
                  <span>${TEXT.alertEditor.above}</span>
                </label>
                <label class="radio-button">
                  <input type="radio" name="alert-direction" value="below" data-testid="${TEST_IDS.alertDirectionBelow}">
                  <span>${TEXT.alertEditor.below}</span>
                </label>
              </div>
            </fieldset>

            <div class="field">
              <label for="alert-price-range">${TEXT.alertEditor.priceLabel}</label>
              <input type="range" id="alert-price-range" step="0.01" data-testid="${TEST_IDS.alertPriceSlider}">
              <div class="row-between small muted">
                <span id="alert-range-low"></span>
                <span id="alert-range-high"></span>
              </div>
            </div>

            <input type="text" inputmode="decimal" autocomplete="off"
                   aria-label="${TEXT.alertEditor.priceInputLabel}" data-testid="${TEST_IDS.alertPriceInput}">

            <label class="check-row">
              <input type="checkbox" data-testid="${TEST_IDS.alertPopupCheckbox}">
              <span>${TEXT.alertEditor.popupLabel}</span>
            </label>
            <label class="check-row">
              <input type="checkbox" data-testid="${TEST_IDS.alertBrowserCheckbox}">
              <span>${TEXT.alertEditor.browserLabel}</span>
            </label>
            <p class="muted small" data-testid="${TEST_IDS.alertBrowserHint}" hidden>${TEXT.alertEditor.browserHint}</p>

            <div class="row">
              <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.alertSave}">${TEXT.alertEditor.save}</button>
              <button type="button" class="btn" data-testid="${TEST_IDS.alertDelete}" hidden>${TEXT.alertEditor.delete}</button>
              <button type="button" class="btn btn-quiet" data-testid="${TEST_IDS.alertClose}">${TEXT.alertEditor.close}</button>
            </div>

            <p class="error-text" role="alert" data-testid="${TEST_IDS.alertError}"></p>
            <p class="up ok-text" role="status" data-testid="${TEST_IDS.alertMessage}"></p>
            <p class="muted small">${TEXT.alertEditor.note}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function rowHtml(stock) {
  return `
    <div class="watch-row" role="listitem" draggable="true"
         data-testid="${TEST_IDS.watchlistRow}" data-symbol="${stock.symbol}">
      <button type="button" class="drag-handle" data-testid="${TEST_IDS.watchlistDragHandle}"
              aria-label="${moveHandleLabel(stock.symbol)}">${TEXT.watchlist.dragHandle}</button>
      <span class="badge" style="background: ${stock.badgeBg}; color: ${stock.badgeText};" aria-hidden="true">
        ${stock.symbol.slice(0, 2)}
      </span>
      <span class="watch-name">
        <a class="stock-symbol" href="${href('stock', { symbol: stock.symbol })}">${stock.symbol}</a><br>
        <span class="stock-name">${stock.name}</span>
      </span>
      <span class="watch-figure">
        <span class="label">${TEXT.watchlist.colPrice}</span>
        <span data-testid="${TEST_IDS.watchlistPrice}" data-cents="0">-</span>
      </span>
      <span class="watch-figure">
        <span class="label">${TEXT.watchlist.colToday}</span>
        <span data-testid="${TEST_IDS.watchlistChange}">-</span>
      </span>
      <span class="pill" data-testid="${TEST_IDS.watchlistAlertStatus}">${TEXT.watchlist.noAlert}</span>
      <button type="button" class="btn btn-small" data-testid="${TEST_IDS.watchlistAlertOpen}"
              aria-label="${setAlertLabel(stock.symbol)}">${TEXT.watchlist.alertButton}</button>
      <button type="button" class="btn btn-small" data-testid="${TEST_IDS.watchlistRemove}"
              aria-label="${removeFromWatchlistLabel(stock.symbol)}">${TEXT.watchlist.removeMark}</button>
    </div>
  `;
}

// --- drawing ---

function setStatusLine(message) {
  pick(TEST_IDS.watchlistStatus).textContent = message;
}

function updateAddSelect() {
  const select = pick(TEST_IDS.watchlistAddSelect);
  const keep = select.value;
  const free = stocks.filter((stock) => !watchlist.symbols.includes(stock.symbol));

  select.innerHTML = free
    .map((stock) => `<option value="${stock.symbol}">${watchlistOptionText(stock.symbol, stock.name)}</option>`)
    .join('');

  if (free.some((stock) => stock.symbol === keep)) select.value = keep;
  select.disabled = free.length === 0;
}

function alertPillFor(symbol, nowMs) {
  const alert = getAlert(watchlist, symbol);
  if (!alert) return TEXT.watchlist.noAlert;
  if (alert.status === 'hit') {
    return isSameDhakaDay(alert.hitAt, nowMs)
      ? alertHitAtPill(dhakaClockOf(alert.hitAt))
      : alertHitOnPill(dhakaDayOf(alert.hitAt));
  }
  return alertPillText(directionLabel(alert.direction), formatMoney(alert.priceCents));
}

function updateAlertPills(nowMs = Date.now()) {
  for (const [symbol, parts] of rowParts) {
    parts.alertStatus.textContent = alertPillFor(symbol, nowMs);
    const alert = getAlert(watchlist, symbol);
    parts.alertStatus.className = `pill${alert && alert.status === 'hit' ? ' pill-accent' : ''}`;
  }
}

function renderRows() {
  const host = document.getElementById('watchlist-rows');
  const rows = watchlist.symbols.map(stockFor).filter(Boolean);
  host.innerHTML = rows.map(rowHtml).join('');
  rowParts = new Map();

  for (const stock of rows) {
    const row = host.querySelector(`[data-symbol="${stock.symbol}"]`);
    rowParts.set(stock.symbol, {
      row,
      price: row.querySelector(`[data-testid="${TEST_IDS.watchlistPrice}"]`),
      change: row.querySelector(`[data-testid="${TEST_IDS.watchlistChange}"]`),
      alertStatus: row.querySelector(`[data-testid="${TEST_IDS.watchlistAlertStatus}"]`),
    });
    wireRow(row, stock.symbol);
  }

  const empty = rows.length === 0;
  host.hidden = empty;
  pick(TEST_IDS.watchlistEmpty).hidden = !empty;

  updateAddSelect();
  refresh();
}

function refresh() {
  const nowMs = Date.now();

  for (const [symbol, parts] of rowParts) {
    const stock = stockFor(symbol);
    if (!stock) continue;
    const cents = priceNowCents(stock, nowMs);
    const change = changeSinceOpen(stock, nowMs);

    parts.price.setAttribute('data-cents', String(cents));
    parts.price.textContent = formatMoney(cents);

    parts.change.className = directionClass(change.cents);
    parts.change.textContent = `${formatPercent(change.percent)} ${arrowFor(change.cents)}`.trim();
  }

  updateAlertPills(nowMs);

  if (editorSymbol) {
    const stock = stockFor(editorSymbol);
    if (stock) {
      editorPriceNowCents = priceNowCents(stock, nowMs);
      const line = pick(TEST_IDS.alertPriceNow);
      line.setAttribute('data-cents', String(editorPriceNowCents));
      line.textContent = alertPriceNowLine(formatMoney(editorPriceNowCents));
    }
  }
}

// --- the alert editor ---

function browserPermission() {
  if (typeof window.Notification !== 'function') return 'unsupported';
  return window.Notification.permission;
}

function browserStatusText(permission) {
  if (permission === 'granted') return TEXT.browserAlerts.granted;
  if (permission === 'denied') return TEXT.browserAlerts.denied;
  if (permission === 'unsupported') return TEXT.browserAlerts.unsupported;
  return TEXT.browserAlerts.off;
}

// On page load the line only shows when the answer is already known.
// After the button is pressed it always shows, even if nothing was decided.
function updateBrowserBits(permission = browserPermission(), always = false) {
  if (always || permission !== 'default') {
    pick(TEST_IDS.browserAlertsStatus).textContent = browserStatusText(permission);
  }
  pick(TEST_IDS.alertBrowserHint).hidden = permission === 'granted';
}

function clearEditorMessages() {
  pick(TEST_IDS.alertError).textContent = '';
  pick(TEST_IDS.alertMessage).textContent = '';
}

function setEditorPrice(cents) {
  const dollars = (cents / 100).toFixed(2);
  pick(TEST_IDS.alertPriceSlider).value = dollars;
  pick(TEST_IDS.alertPriceInput).value = dollars;
}

export function closeEditor() {
  editorSymbol = null;
  document.getElementById('alert-editor-open').hidden = true;
  pick(TEST_IDS.alertEditorClosed).hidden = false;
}

function openEditor(symbol) {
  const stock = stockFor(symbol);
  if (!stock) return;

  editorSymbol = symbol;
  editorPriceNowCents = priceNowCents(stock);
  editorRange = alertRange(editorPriceNowCents);

  document.getElementById('alert-editor-title').textContent = alertEditorTitle(symbol);

  const slider = pick(TEST_IDS.alertPriceSlider);
  slider.min = (editorRange.lowCents / 100).toFixed(2);
  slider.max = (editorRange.highCents / 100).toFixed(2);

  document.getElementById('alert-range-low').textContent = alertRangeEndLow(formatMoney(editorRange.lowCents));
  document.getElementById('alert-range-high').textContent = alertRangeEndHigh(formatMoney(editorRange.highCents));

  const saved = getAlert(watchlist, symbol);
  const above = pick(TEST_IDS.alertDirectionAbove);
  const below = pick(TEST_IDS.alertDirectionBelow);

  if (saved) {
    above.checked = saved.direction === 'above';
    below.checked = saved.direction === 'below';
    setEditorPrice(saved.priceCents);
    pick(TEST_IDS.alertPopupCheckbox).checked = saved.popup;
    pick(TEST_IDS.alertBrowserCheckbox).checked = saved.browser;
  } else {
    above.checked = true;
    below.checked = false;
    setEditorPrice(defaultAlertPriceCents(editorPriceNowCents));
    pick(TEST_IDS.alertPopupCheckbox).checked = true;
    pick(TEST_IDS.alertBrowserCheckbox).checked = false;
  }

  pick(TEST_IDS.alertDelete).hidden = !saved;
  clearEditorMessages();
  updateBrowserBits();

  pick(TEST_IDS.alertEditorClosed).hidden = true;
  document.getElementById('alert-editor-open').hidden = false;
  refresh();
}

function saveEditorAlert() {
  if (!editorSymbol) return;
  clearEditorMessages();

  if (isOffline()) {
    pick(TEST_IDS.alertError).textContent = TEXT.connection.blocked;
    return;
  }

  const direction = pick(TEST_IDS.alertDirectionBelow).checked ? 'below' : 'above';
  const checked = checkAlert({
    priceText: pick(TEST_IDS.alertPriceInput).value,
    direction,
    priceNowCents: editorPriceNowCents,
    rangeCents: editorRange,
    popup: pick(TEST_IDS.alertPopupCheckbox).checked,
    browser: pick(TEST_IDS.alertBrowserCheckbox).checked,
  });

  if (!checked.ok) {
    pick(TEST_IDS.alertError).textContent = checked.error;
    return;
  }

  const symbol = editorSymbol;
  change((fresh) => saveAlert(fresh, symbol, checked.alert));

  pick(TEST_IDS.alertDelete).hidden = false;
  updateAlertPills();
  pick(TEST_IDS.alertMessage).textContent = alertSavedMessage(
    symbol,
    directionWord(checked.alert.direction),
    formatMoney(checked.alert.priceCents),
  );
}

function deleteEditorAlert() {
  if (!editorSymbol) return;
  clearEditorMessages();

  const symbol = editorSymbol;
  change((fresh) => deleteAlert(fresh, symbol));

  pick(TEST_IDS.alertDelete).hidden = true;
  updateAlertPills();
  pick(TEST_IDS.alertMessage).textContent = TEXT.alertEditor.deleted;
}

// --- moving rows ---

function moveTo(symbol, toIndex) {
  const result = change((fresh) => moveSymbol(fresh, symbol, toIndex));
  renderRows();
  if (result && result.position) setStatusLine(movedMessage(symbol, result.position, result.total));
  return result;
}

function clearDropMarks() {
  for (const parts of rowParts.values()) {
    parts.row.classList.remove('drop-above', 'drop-below');
  }
}

function wireRow(row, symbol) {
  const handle = row.querySelector(`[data-testid="${TEST_IDS.watchlistDragHandle}"]`);

  handle.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();

    const from = watchlist.symbols.indexOf(symbol);
    const to = event.key === 'ArrowUp' ? from - 1 : from + 1;
    if (to < 0 || to >= watchlist.symbols.length) return;

    moveTo(symbol, to);
    // Focus stays on the handle of the row that moved.
    const moved = rowParts.get(symbol);
    if (moved) moved.row.querySelector(`[data-testid="${TEST_IDS.watchlistDragHandle}"]`).focus();
  });

  row.addEventListener('dragstart', (event) => {
    draggedSymbol = symbol;
    row.classList.add('dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', symbol);
    }
  });

  row.addEventListener('dragend', () => {
    draggedSymbol = null;
    row.classList.remove('dragging');
    clearDropMarks();
  });

  row.addEventListener('dragover', (event) => {
    if (!draggedSymbol || draggedSymbol === symbol) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';

    clearDropMarks();
    const from = watchlist.symbols.indexOf(draggedSymbol);
    const over = watchlist.symbols.indexOf(symbol);
    row.classList.add(over < from ? 'drop-above' : 'drop-below');
  });

  row.addEventListener('dragleave', () => {
    row.classList.remove('drop-above', 'drop-below');
  });

  row.addEventListener('drop', (event) => {
    event.preventDefault();
    const moving = draggedSymbol || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : '');
    clearDropMarks();
    if (!moving || moving === symbol) return;
    moveTo(moving, watchlist.symbols.indexOf(symbol));
  });

  row.querySelector(`[data-testid="${TEST_IDS.watchlistAlertOpen}"]`).addEventListener('click', () => {
    openEditor(symbol);
  });

  row.querySelector(`[data-testid="${TEST_IDS.watchlistRemove}"]`).addEventListener('click', () => {
    pick(TEST_IDS.watchlistAddError).textContent = '';
    change((fresh) => removeSymbol(fresh, symbol));
    if (editorSymbol === symbol) closeEditor();
    renderRows();
    setStatusLine(removedFromWatchlistMessage(symbol));
  });
}

// --- page wiring ---

function wire() {
  pick(TEST_IDS.watchlistAddSubmit).addEventListener('click', () => {
    const select = pick(TEST_IDS.watchlistAddSelect);
    const symbol = select.value;
    pick(TEST_IDS.watchlistAddError).textContent = '';
    setStatusLine('');
    if (!symbol) return;

    const result = change((fresh) => addSymbol(fresh, symbol));
    if (result && result.ok === false) {
      pick(TEST_IDS.watchlistAddError).textContent = result.error;
      return;
    }
    renderRows();
  });

  pick(TEST_IDS.removeAll).addEventListener('click', () => {
    pick(TEST_IDS.watchlistAddError).textContent = '';
    setStatusLine('');
    if (!window.confirm(TEXT.watchlist.removeAllConfirm)) return;

    change((fresh) => removeAll(fresh));
    closeEditor();
    renderRows();
  });

  pick(TEST_IDS.browserAlertsButton).addEventListener('click', () => {
    if (typeof window.Notification !== 'function') {
      updateBrowserBits('unsupported');
      return;
    }
    const answer = window.Notification.requestPermission();
    if (answer && typeof answer.then === 'function') {
      answer.then((permission) => updateBrowserBits(permission || browserPermission(), true));
    } else {
      updateBrowserBits(browserPermission(), true);
    }
  });

  pick(TEST_IDS.alertSave).addEventListener('click', saveEditorAlert);
  pick(TEST_IDS.alertDelete).addEventListener('click', deleteEditorAlert);
  pick(TEST_IDS.alertClose).addEventListener('click', closeEditor);

  const slider = pick(TEST_IDS.alertPriceSlider);
  const priceInput = pick(TEST_IDS.alertPriceInput);

  slider.addEventListener('input', () => {
    priceInput.value = Number(slider.value).toFixed(2);
  });

  // A typed value that is not valid does not move the slider.
  priceInput.addEventListener('input', () => {
    const parsed = parseAlertPrice(priceInput.value);
    if (!parsed.ok) return;
    if (parsed.cents < editorRange.lowCents || parsed.cents > editorRange.highCents) return;
    slider.value = (parsed.cents / 100).toFixed(2);
  });

  for (const testId of [TEST_IDS.alertBrowserCheckbox, TEST_IDS.alertPopupCheckbox]) {
    pick(testId).addEventListener('change', () => updateBrowserBits());
  }

  onEscape(() => {
    if (editorSymbol) closeEditor();
  });

  window.addEventListener(WATCHLIST_CHANGED, () => {
    reloadWatchlist();
    updateAlertPills();
  });
}

// Prices are paused while the internet is down.
function startRefresh() {
  if (refreshTimer !== null || isOffline()) return;
  refreshTimer = window.setInterval(refresh, REFRESH_MS);
}

function stopRefresh() {
  if (refreshTimer === null) return;
  window.clearInterval(refreshTimer);
  refreshTimer = null;
}

async function start() {
  session = await requireSession();
  if (!session) return;

  document.getElementById('page').innerHTML = shellHtml();
  renderTopMenu({ page: 'watchlist', user: session.user, account: session.account });

  try {
    const response = await fetch('/data/stocks.json');
    if (!response.ok) throw new Error('Could not load stocks');
    stocks = await response.json();
  } catch (error) {
    stocks = [];
  }
  symbols = stocks.map((stock) => stock.symbol);

  reloadWatchlist();
  wire();
  updateBrowserBits();
  renderRows();

  startRefresh();

  window.addEventListener(CONNECTION_CHANGED, (event) => {
    if (event.detail.offline) stopRefresh();
    else {
      refresh();
      startRefresh();
    }
  });
}

start();
