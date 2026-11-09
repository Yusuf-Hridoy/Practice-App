// Portfolio page: what you own, what it is worth, and your gain.

import { TEXT, sharesWord, portfolioEmptyBody, gainPercentNote, paidNote, allocationLegendItem } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { href } from '../app-links.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import {
  formatMoney,
  formatSignedMoney,
  formatPercent,
  arrowFor,
  directionClass,
} from '../money-format.js';
import { priceMap } from '../price-engine.js';
import {
  averagePaidCents,
  holdingGainCents,
  gainPercent,
  stocksWorthCents,
  totalPaidCents,
  totalWorthCents,
} from '../trade-rules.js';

const REFRESH_MS = 5000;

let account = null;
let stocks = [];
let owned = [];
let rowParts = new Map();
let allocParts = new Map();

function statCardHtml(label, testId, note) {
  return `
    <div class="card">
      <div class="stat-label">${label}</div>
      <div class="stat-value" data-testid="${testId}" data-cents="0">-</div>
      <div class="stat-note" data-note-for="${testId}">${note}</div>
    </div>
  `;
}

function holdingRowHtml(stock) {
  return `
    <tr data-testid="${TEST_IDS.holdingRow}" data-symbol="${stock.symbol}">
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
      <td class="right" data-testid="${TEST_IDS.holdingShares}">-</td>
      <td class="right" data-testid="${TEST_IDS.holdingAvg}" data-cents="0">-</td>
      <td class="right" data-testid="${TEST_IDS.holdingPrice}" data-cents="0">-</td>
      <td class="right" data-testid="${TEST_IDS.holdingWorth}" data-cents="0">-</td>
      <td class="right" data-testid="${TEST_IDS.holdingGain}" data-cents="0">
        <span class="gain-money">-</span>
        <span class="small gain-percent"></span>
      </td>
      <td class="right">
        <a class="btn btn-small" data-testid="${TEST_IDS.holdingBuy}"
           href="${href('stock', { symbol: stock.symbol })}">${TEXT.portfolio.buy}</a>
      </td>
      <td class="right">
        <a class="btn btn-small sell-text" data-testid="${TEST_IDS.holdingSell}"
           href="${href('stock', { symbol: stock.symbol, mode: 'sell' })}">${TEXT.portfolio.sell}</a>
      </td>
    </tr>
  `;
}

function shellHtml() {
  return `
    <div class="wrap stack">
      <div class="row-between">
        <h1>${TEXT.portfolio.title}</h1>
        <a href="${href('market')}">${TEXT.portfolio.buyMore}</a>
      </div>

      <div class="grid-4">
        ${statCardHtml(TEXT.portfolio.statTotalWorth, TEST_IDS.statTotalWorth, TEXT.portfolio.statTotalWorthNote)}
        ${statCardHtml(TEXT.portfolio.statCash, TEST_IDS.statCash, '')}
        ${statCardHtml(TEXT.portfolio.statStocksWorth, TEST_IDS.statStocksWorth, '')}
        ${statCardHtml(TEXT.portfolio.statTotalGain, TEST_IDS.statTotalGain, '')}
      </div>

      <div class="card">
        <h2 class="card-title">${TEXT.portfolio.allocationTitle}</h2>
        <div class="alloc-bar" data-testid="${TEST_IDS.allocationBar}"></div>
        <div class="alloc-legend" data-testid="${TEST_IDS.allocationLegend}"></div>
      </div>

      <div class="card stack-sm">
        <div class="row-between">
          <h2>${TEXT.portfolio.holdingsTitle}</h2>
          <div class="field">
            <label for="holdings-sort-select">${TEXT.portfolio.sortLabel}</label>
            <select id="holdings-sort-select" data-testid="${TEST_IDS.holdingsSort}">
              <option value="gain">${TEXT.portfolio.sortGain}</option>
              <option value="value">${TEXT.portfolio.sortValue}</option>
              <option value="name">${TEXT.portfolio.sortName}</option>
            </select>
          </div>
        </div>

        <div class="table-scroll" id="holdings-table-box">
          <table data-testid="${TEST_IDS.holdingsTable}">
            <thead>
              <tr>
                <th>${TEXT.portfolio.colStock}</th>
                <th class="right">${TEXT.portfolio.colShares}</th>
                <th class="right">${TEXT.portfolio.colAvg}</th>
                <th class="right">${TEXT.portfolio.colPrice}</th>
                <th class="right">${TEXT.portfolio.colWorth}</th>
                <th class="right">${TEXT.portfolio.colGain}</th>
                <th class="right">${TEXT.portfolio.buy}</th>
                <th class="right">${TEXT.portfolio.sell}</th>
              </tr>
            </thead>
            <tbody id="holdings-rows"></tbody>
          </table>
        </div>

        <div class="stack-sm" data-testid="${TEST_IDS.portfolioEmpty}" hidden>
          <h2>${TEXT.portfolio.emptyTitle}</h2>
          <p class="muted" id="portfolio-empty-line"></p>
          <div><a class="btn btn-accent" href="${href('market')}">${TEXT.common.goToMarket}</a></div>
        </div>

        <p class="muted small">${TEXT.portfolio.help}</p>
      </div>
    </div>
  `;
}

function buildRows() {
  const body = document.getElementById('holdings-rows');
  body.innerHTML = owned.map(holdingRowHtml).join('');
  rowParts = new Map();

  for (const stock of owned) {
    const row = body.querySelector(`[data-symbol="${stock.symbol}"]`);
    rowParts.set(stock.symbol, {
      row,
      shares: row.querySelector(`[data-testid="${TEST_IDS.holdingShares}"]`),
      avg: row.querySelector(`[data-testid="${TEST_IDS.holdingAvg}"]`),
      price: row.querySelector(`[data-testid="${TEST_IDS.holdingPrice}"]`),
      worth: row.querySelector(`[data-testid="${TEST_IDS.holdingWorth}"]`),
      gain: row.querySelector(`[data-testid="${TEST_IDS.holdingGain}"]`),
      gainMoney: row.querySelector('.gain-money'),
      gainPercent: row.querySelector('.gain-percent'),
      gainCents: 0,
      worthCents: 0,
    });
  }
}

function buildAllocation() {
  const bar = document.querySelector(`[data-testid="${TEST_IDS.allocationBar}"]`);
  const legend = document.querySelector(`[data-testid="${TEST_IDS.allocationLegend}"]`);
  allocParts = new Map();

  const pieces = [{ key: 'cash', label: TEXT.portfolio.cashLegend, color: 'var(--accent)' }].concat(
    owned.map((stock) => ({ key: stock.symbol, label: stock.name, color: stock.badgeText })),
  );

  bar.innerHTML = pieces
    .map((piece) => `<span class="alloc-part" data-alloc="${piece.key}" style="background: ${piece.color}; width: 0%;"></span>`)
    .join('');

  legend.innerHTML = pieces
    .map(
      (piece) => `
        <div class="alloc-item" data-legend="${piece.key}">
          <span class="alloc-dot" style="background: ${piece.color};" aria-hidden="true"></span>
          <span class="alloc-label"></span>
        </div>
      `,
    )
    .join('');

  for (const piece of pieces) {
    allocParts.set(piece.key, {
      label: piece.label,
      bar: bar.querySelector(`[data-alloc="${piece.key}"]`),
      text: legend.querySelector(`[data-legend="${piece.key}"] .alloc-label`),
    });
  }
}

function updateAllocation(prices) {
  const total = totalWorthCents(account, prices);
  const share = (cents) => (total === 0 ? 0 : (cents / total) * 100);

  const cashPart = allocParts.get('cash');
  cashPart.bar.style.width = `${share(account.cashCents).toFixed(2)}%`;
  cashPart.text.textContent = allocationLegendItem(cashPart.label, `${share(account.cashCents).toFixed(1)}%`);

  for (const stock of owned) {
    const part = allocParts.get(stock.symbol);
    const holding = account.holdings[stock.symbol];
    const worth = holding.shares * (prices[stock.symbol] || 0);
    part.bar.style.width = `${share(worth).toFixed(2)}%`;
    part.text.textContent = allocationLegendItem(part.label, `${share(worth).toFixed(1)}%`);
  }
}

function setStat(testId, cents, text, note, className) {
  const node = document.querySelector(`[data-testid="${testId}"]`);
  node.setAttribute('data-cents', String(cents));
  node.textContent = text;
  node.className = `stat-value ${className || ''}`.trim();
  if (note !== null && note !== undefined) {
    document.querySelector(`[data-note-for="${testId}"]`).textContent = note;
  }
}

function refresh() {
  const nowMs = Date.now();
  const prices = priceMap(stocks, nowMs);

  for (const stock of owned) {
    const parts = rowParts.get(stock.symbol);
    const holding = account.holdings[stock.symbol];
    const price = prices[stock.symbol];
    const avg = averagePaidCents(holding);
    const worth = holding.shares * price;
    const gain = holdingGainCents(holding, price);

    parts.shares.textContent = sharesWord(holding.shares);

    parts.avg.setAttribute('data-cents', String(avg));
    parts.avg.textContent = formatMoney(avg);

    parts.price.setAttribute('data-cents', String(price));
    parts.price.textContent = formatMoney(price);

    parts.worth.setAttribute('data-cents', String(worth));
    parts.worth.textContent = formatMoney(worth);

    parts.gain.setAttribute('data-cents', String(gain));
    parts.gain.className = `right ${directionClass(gain)}`;
    parts.gainMoney.textContent = `${formatSignedMoney(gain)} ${arrowFor(gain)}`.trim();
    parts.gainPercent.textContent = formatPercent(gainPercent(gain, holding.totalPaidCents));

    parts.gainCents = gain;
    parts.worthCents = worth;
  }

  const stocksWorth = stocksWorthCents(account, prices);
  const paid = totalPaidCents(account);
  const totalGain = stocksWorth - paid;
  const worth = totalWorthCents(account, prices);

  setStat(TEST_IDS.statTotalWorth, worth, formatMoney(worth), TEXT.portfolio.statTotalWorthNote, '');
  setStat(TEST_IDS.statCash, account.cashCents, formatMoney(account.cashCents), '', '');
  setStat(TEST_IDS.statStocksWorth, stocksWorth, formatMoney(stocksWorth), paidNote(formatMoney(paid)), '');
  setStat(
    TEST_IDS.statTotalGain,
    totalGain,
    `${formatSignedMoney(totalGain)} ${arrowFor(totalGain)}`.trim(),
    gainPercentNote(formatPercent(gainPercent(totalGain, paid))),
    directionClass(totalGain),
  );

  updateAllocation(prices);
}

function sortRows() {
  const how = document.querySelector(`[data-testid="${TEST_IDS.holdingsSort}"]`).value;
  const body = document.getElementById('holdings-rows');

  const order = owned.slice().sort((a, b) => {
    const left = rowParts.get(a.symbol);
    const right = rowParts.get(b.symbol);
    if (how === 'value') return right.worthCents - left.worthCents;
    if (how === 'name') return a.name.localeCompare(b.name);
    return right.gainCents - left.gainCents;
  });

  for (const stock of order) body.append(rowParts.get(stock.symbol).row);
}

async function start() {
  const session = await requireSession();
  if (!session) return;
  account = session.account;

  document.getElementById('page').innerHTML = shellHtml();
  renderTopMenu({ page: 'portfolio', user: session.user, account });

  try {
    const response = await fetch('/data/stocks.json');
    if (!response.ok) throw new Error('Could not load stocks');
    stocks = await response.json();
  } catch (error) {
    stocks = [];
  }

  owned = stocks.filter((stock) => account.holdings[stock.symbol]);

  buildRows();
  buildAllocation();

  const empty = owned.length === 0;
  document.getElementById('holdings-table-box').hidden = empty;
  document.querySelector(`[data-testid="${TEST_IDS.portfolioEmpty}"]`).hidden = !empty;
  if (empty) {
    document.getElementById('portfolio-empty-line').textContent = portfolioEmptyBody(formatMoney(account.cashCents));
  }

  refresh();
  sortRows();

  document
    .querySelector(`[data-testid="${TEST_IDS.holdingsSort}"]`)
    .addEventListener('change', sortRows);

  window.setInterval(refresh, REFRESH_MS);
}

start();
