// Market page: every stock, with live prices.

import { TEXT, noMatchMessage, marketClosedMessage, sharesWord } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { href } from '../app-links.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import { formatMoney, formatSignedMoney, formatPercent, arrowFor, directionClass } from '../money-format.js';
import { marketStatus } from '../market-hours.js';
import { priceNowCents, openPriceCents, changeSinceOpen, chartPoints, priceMap } from '../price-engine.js';
import { createMiniChart } from '../price-chart.js';
import { totalWorthCents, stocksChangeSinceOpenCents, ownedShares } from '../trade-rules.js';

const REFRESH_MS = 5000;

let account = null;
let stocks = [];
let rowParts = new Map();
let activeFilter = 'all';
let refreshTimer = null;

function shellHtml() {
  return `
    <div class="wrap stack">
      <div class="box box-warn" data-testid="${TEST_IDS.marketClosedBanner}" hidden></div>

      <div class="grid-3">
        <div class="card">
          <div class="stat-label">${TEXT.market.statTotalWorth}</div>
          <div class="stat-value" data-testid="${TEST_IDS.statTotalWorth}" data-cents="0">-</div>
        </div>
        <div class="card">
          <div class="stat-label">${TEXT.market.statToday}</div>
          <div class="stat-value" data-testid="${TEST_IDS.statToday}" data-cents="0">-</div>
          <div class="stat-note">${TEXT.market.statTodayNote}</div>
        </div>
        <div class="card">
          <div class="stat-label">${TEXT.market.statCash}</div>
          <div class="stat-value" data-testid="${TEST_IDS.statCash}" data-cents="0">-</div>
        </div>
      </div>

      <h1>${TEXT.market.title}</h1>

      <div class="card stack-sm">
        <div class="field">
          <label for="market-search-input">${TEXT.market.searchLabel}</label>
          <input type="search" id="market-search-input" data-testid="${TEST_IDS.marketSearch}"
                 placeholder="${TEXT.market.searchPlaceholder}" autocomplete="off">
        </div>

        <div class="row">
          <button type="button" class="chip" data-testid="${TEST_IDS.filterAll}" aria-pressed="true">${TEXT.market.filterAll}</button>
          <button type="button" class="chip" data-testid="${TEST_IDS.filterUp}" aria-pressed="false">${TEXT.market.filterUp}</button>
          <button type="button" class="chip" data-testid="${TEST_IDS.filterDown}" aria-pressed="false">${TEXT.market.filterDown}</button>
          <button type="button" class="chip" data-testid="${TEST_IDS.filterOwned}" aria-pressed="false">${TEXT.market.filterOwned}</button>
        </div>

        <p class="muted small">${TEXT.market.refreshNote}</p>

        <div data-testid="${TEST_IDS.marketLoading}" class="stack-sm">
          <span class="skeleton-bar"></span>
          <span class="skeleton-bar"></span>
          <span class="skeleton-bar"></span>
        </div>

        <div class="table-scroll" id="market-table-box" hidden>
          <table data-testid="${TEST_IDS.marketTable}">
            <thead>
              <tr>
                <th>${TEXT.market.colStock}</th>
                <th class="right">${TEXT.market.colPrice}</th>
                <th class="right">${TEXT.market.colToday}</th>
                <th>${TEXT.market.colLastHour}</th>
                <th class="right">${TEXT.market.colOwned}</th>
                <th class="right">${TEXT.market.colTrade}</th>
              </tr>
            </thead>
            <tbody id="market-rows"></tbody>
          </table>
        </div>

        <div class="stack-sm" data-testid="${TEST_IDS.marketEmpty}" hidden>
          <p id="market-empty-line"></p>
          <p class="muted small" id="market-empty-hint">${TEXT.market.emptyHint}</p>
          <div><button type="button" class="btn btn-small" data-testid="${TEST_IDS.clearSearch}">${TEXT.market.clearSearch}</button></div>
        </div>

        <div class="stack-sm" data-testid="${TEST_IDS.marketError}" hidden>
          <h2>${TEXT.market.errorTitle}</h2>
          <p class="muted">${TEXT.market.errorBody}</p>
          <div><button type="button" class="btn btn-accent" data-testid="${TEST_IDS.marketRetry}">${TEXT.common.tryAgain}</button></div>
        </div>
      </div>

      <p class="muted small">${TEXT.market.footer}</p>
    </div>
  `;
}

function rowHtml(stock) {
  return `
    <tr data-testid="${TEST_IDS.marketRow}" data-symbol="${stock.symbol}">
      <td>
        <div class="stock-cell">
          <span class="badge" style="background: ${stock.badgeBg}; color: ${stock.badgeText};" aria-hidden="true">
            ${stock.symbol.slice(0, 2)}
          </span>
          <span>
            <span class="stock-symbol">${stock.symbol}</span><br>
            <span class="stock-name">${stock.name}</span>
          </span>
        </div>
      </td>
      <td class="right" data-testid="${TEST_IDS.rowPrice}" data-cents="0">-</td>
      <td class="right" data-testid="${TEST_IDS.rowChange}">-</td>
      <td class="row-chart"></td>
      <td class="right" data-testid="${TEST_IDS.rowOwned}">${TEXT.market.noneOwned}</td>
      <td class="right">
        <a class="btn btn-small" data-testid="${TEST_IDS.rowTrade}"
           href="${href('stock', { symbol: stock.symbol })}">${TEXT.market.trade}</a>
      </td>
    </tr>
  `;
}

function buildRows() {
  const body = document.getElementById('market-rows');
  body.innerHTML = stocks.map(rowHtml).join('');
  rowParts = new Map();

  for (const stock of stocks) {
    const row = body.querySelector(`[data-symbol="${stock.symbol}"]`);
    const mini = createMiniChart();
    row.querySelector('.row-chart').append(mini.element);
    rowParts.set(stock.symbol, {
      row,
      price: row.querySelector(`[data-testid="${TEST_IDS.rowPrice}"]`),
      change: row.querySelector(`[data-testid="${TEST_IDS.rowChange}"]`),
      owned: row.querySelector(`[data-testid="${TEST_IDS.rowOwned}"]`),
      mini,
      changeCents: 0,
    });
  }

  document.getElementById('market-table-box').hidden = false;
  document.querySelector(`[data-testid="${TEST_IDS.marketLoading}"]`).hidden = true;
}

function searchText() {
  return document.querySelector(`[data-testid="${TEST_IDS.marketSearch}"]`).value.trim();
}

function applyFilters() {
  const text = searchText().toLowerCase();
  let shown = 0;

  for (const stock of stocks) {
    const parts = rowParts.get(stock.symbol);
    const matchesText =
      text === '' ||
      stock.symbol.toLowerCase().includes(text) ||
      stock.name.toLowerCase().includes(text);

    let matchesFilter = true;
    if (activeFilter === 'up') matchesFilter = parts.changeCents > 0;
    else if (activeFilter === 'down') matchesFilter = parts.changeCents < 0;
    else if (activeFilter === 'owned') matchesFilter = ownedShares(account, stock.symbol) > 0;

    const visible = matchesText && matchesFilter;
    parts.row.hidden = !visible;
    if (visible) shown += 1;
  }

  const emptyBox = document.querySelector(`[data-testid="${TEST_IDS.marketEmpty}"]`);
  const emptyLine = document.getElementById('market-empty-line');
  const emptyHint = document.getElementById('market-empty-hint');
  const clearButton = document.querySelector(`[data-testid="${TEST_IDS.clearSearch}"]`);
  const tableBox = document.getElementById('market-table-box');

  if (shown > 0) {
    emptyBox.hidden = true;
    tableBox.hidden = false;
    return;
  }

  tableBox.hidden = true;
  emptyBox.hidden = false;

  const ownedEmpty = activeFilter === 'owned' && searchText() === '';
  if (ownedEmpty) {
    emptyLine.textContent = TEXT.market.emptyOwned;
    emptyHint.hidden = true;
    clearButton.parentElement.hidden = true;
  } else {
    emptyLine.textContent = noMatchMessage(searchText());
    emptyHint.hidden = false;
    clearButton.parentElement.hidden = false;
  }
}

function refresh() {
  const nowMs = Date.now();

  const prices = priceMap(stocks, nowMs);
  const opens = {};
  for (const stock of stocks) opens[stock.symbol] = openPriceCents(stock, nowMs);

  for (const stock of stocks) {
    const parts = rowParts.get(stock.symbol);
    const cents = prices[stock.symbol];
    const change = changeSinceOpen(stock, nowMs);
    parts.changeCents = change.cents;

    parts.price.setAttribute('data-cents', String(cents));
    parts.price.textContent = formatMoney(cents);

    parts.change.className = `right ${directionClass(change.cents)}`;
    parts.change.textContent = `${formatPercent(change.percent)} ${arrowFor(change.cents)}`.trim();

    const owned = ownedShares(account, stock.symbol);
    parts.owned.textContent = owned > 0 ? sharesWord(owned) : TEXT.market.noneOwned;

    parts.mini.update(chartPoints(stock, 'mini', nowMs), change.cents >= 0);
  }

  const worth = totalWorthCents(account, prices);
  const todayCents = stocksChangeSinceOpenCents(account, prices, opens);

  const worthNode = document.querySelector(`[data-testid="${TEST_IDS.statTotalWorth}"]`);
  worthNode.setAttribute('data-cents', String(worth));
  worthNode.textContent = formatMoney(worth);

  const todayNode = document.querySelector(`[data-testid="${TEST_IDS.statToday}"]`);
  todayNode.setAttribute('data-cents', String(todayCents));
  todayNode.className = `stat-value ${directionClass(todayCents)}`;
  todayNode.textContent = `${formatSignedMoney(todayCents)} ${arrowFor(todayCents)}`.trim();

  const cashNode = document.querySelector(`[data-testid="${TEST_IDS.statCash}"]`);
  cashNode.setAttribute('data-cents', String(account.cashCents));
  cashNode.textContent = formatMoney(account.cashCents);

  const status = marketStatus(nowMs);
  const banner = document.querySelector(`[data-testid="${TEST_IDS.marketClosedBanner}"]`);
  banner.hidden = status.open;
  if (!status.open) banner.textContent = marketClosedMessage(status.nextOpen);

  applyFilters();
}

function setFilter(name) {
  activeFilter = name;
  const map = {
    all: TEST_IDS.filterAll,
    up: TEST_IDS.filterUp,
    down: TEST_IDS.filterDown,
    owned: TEST_IDS.filterOwned,
  };
  for (const [key, testId] of Object.entries(map)) {
    document
      .querySelector(`[data-testid="${testId}"]`)
      .setAttribute('aria-pressed', key === name ? 'true' : 'false');
  }
  applyFilters();
}

function wire() {
  document
    .querySelector(`[data-testid="${TEST_IDS.marketSearch}"]`)
    .addEventListener('input', applyFilters);

  document.querySelector(`[data-testid="${TEST_IDS.clearSearch}"]`).addEventListener('click', () => {
    const input = document.querySelector(`[data-testid="${TEST_IDS.marketSearch}"]`);
    input.value = '';
    input.focus();
    applyFilters();
  });

  document.querySelector(`[data-testid="${TEST_IDS.filterAll}"]`).addEventListener('click', () => setFilter('all'));
  document.querySelector(`[data-testid="${TEST_IDS.filterUp}"]`).addEventListener('click', () => setFilter('up'));
  document.querySelector(`[data-testid="${TEST_IDS.filterDown}"]`).addEventListener('click', () => setFilter('down'));
  document.querySelector(`[data-testid="${TEST_IDS.filterOwned}"]`).addEventListener('click', () => setFilter('owned'));

  document.querySelector(`[data-testid="${TEST_IDS.marketRetry}"]`).addEventListener('click', loadStocks);
}

async function loadStocks() {
  const errorBox = document.querySelector(`[data-testid="${TEST_IDS.marketError}"]`);
  const loadingBox = document.querySelector(`[data-testid="${TEST_IDS.marketLoading}"]`);

  errorBox.hidden = true;
  loadingBox.hidden = false;

  try {
    const response = await fetch('/data/stocks.json');
    if (!response.ok) throw new Error('Could not load stocks');
    stocks = await response.json();
  } catch (error) {
    loadingBox.hidden = true;
    document.getElementById('market-table-box').hidden = true;
    errorBox.hidden = false;
    return;
  }

  buildRows();
  refresh();
  if (refreshTimer === null) refreshTimer = window.setInterval(refresh, REFRESH_MS);
}

async function start() {
  const session = await requireSession();
  if (!session) return;

  account = session.account;
  document.getElementById('page').innerHTML = shellHtml();
  renderTopMenu({ page: 'market', user: session.user, account });
  wire();
  await loadStocks();
}

start();
