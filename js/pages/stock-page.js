// One stock: price, chart, facts and the trade box.

import {
  TEXT,
  stockMissingMessage,
  marketClosedMessage,
  sharesWord,
  maxButtonText,
  buyButtonText,
  sellButtonText,
  confirmBuyTitle,
  confirmSellTitle,
  boughtTitle,
  soldTitle,
  boughtDetail,
  soldDetail,
  priceMovedDetail,
  changeLine,
  gainOnLabel,
  chartLabelToday,
  chartLabelHour,
} from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { href } from '../app-links.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import { writeAccount, readAccount } from '../account-storage.js';
import {
  formatMoney,
  formatSignedMoney,
  formatPercent,
  arrowFor,
  directionClass,
} from '../money-format.js';
import { marketStatus } from '../market-hours.js';
import {
  priceNowCents,
  openPriceCents,
  changeSinceOpen,
  highLowToday,
  chartPoints,
} from '../price-engine.js';
import { createPriceChart } from '../price-chart.js';
import { isOffline, CONNECTION_CHANGED } from '../connection-status.js';
import {
  parseShares,
  checkBuy,
  checkSell,
  applyBuy,
  applySell,
  maxAffordableShares,
  ownedShares,
  getHolding,
  averagePaidCents,
  holdingGainCents,
  sellGainPreviewCents,
} from '../trade-rules.js';

const REFRESH_MS = 5000;

let session = null;
let account = null;
let stock = null;
let menu = null;
let chart = null;
let chartRange = 'today';
let mode = 'buy';
let reviewPriceCents = 0;
let refreshTimer = null;

function queryValue(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

// Reads the saved account again, so a second tab cannot be overwritten.
function reloadAccount() {
  account = readAccount(session.user.email, session.user.start);
  return account;
}

// The symbol comes from the page URL, so the message is put in with
// textContent. Any HTML in the URL shows as plain text.
function renderNotFound(symbolText) {
  document.getElementById('page').innerHTML = `
    <div class="wrap stack">
      <div class="card stack-sm" data-testid="${TEST_IDS.stockNotFound}">
        <h1>${TEXT.stock.notFoundTitle}</h1>
        <p class="muted" id="stock-not-found-line"></p>
        <div><a class="btn btn-accent" href="${href('market')}">${TEXT.common.backToMarket}</a></div>
      </div>
    </div>
  `;
  document.getElementById('stock-not-found-line').textContent = stockMissingMessage(symbolText);
}

// The stock list could not be loaded. That is not a missing page, so it
// shows the same box as the market page.
function renderLoadError() {
  document.getElementById('page').innerHTML = `
    <div class="wrap stack">
      <div class="card stack-sm" data-testid="${TEST_IDS.marketError}">
        <h1>${TEXT.market.errorTitle}</h1>
        <p class="muted">${TEXT.market.errorBody}</p>
        <div>
          <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.marketRetry}">
            ${TEXT.common.tryAgain}
          </button>
        </div>
      </div>
    </div>
  `;
  document
    .querySelector(`[data-testid="${TEST_IDS.marketRetry}"]`)
    .addEventListener('click', () => { buildPage(); });
}

function factRowHtml(label, testId, startValue) {
  return `
    <div class="dialog-row">
      <span class="muted">${label}</span>
      <span data-testid="${testId}">${startValue}</span>
    </div>
  `;
}

function pageHtml() {
  return `
    <div class="wrap stack">
      <p><a href="${href('market')}">${TEXT.common.backToMarket}</a></p>

      <div class="row">
        <span class="badge" style="background: ${stock.badgeBg}; color: ${stock.badgeText};" aria-hidden="true">
          ${stock.symbol.slice(0, 2)}
        </span>
        <h1 data-testid="${TEST_IDS.stockSymbol}">${stock.symbol}</h1>
        <span class="muted">${stock.name}</span>
      </div>
      <p class="muted">${stock.about} ${TEXT.stock.madeUp}</p>

      <div>
        <div class="big-price" data-testid="${TEST_IDS.stockPrice}" data-cents="0">-</div>
        <div data-testid="${TEST_IDS.stockChange}" data-cents="0">-</div>
      </div>

      <div class="grid-2-1">
        <div class="stack">
          <div class="card stack-sm">
            <div class="row">
              <button type="button" class="chip" data-testid="${TEST_IDS.chartRangeHour}" aria-pressed="false">${TEXT.stock.rangeHour}</button>
              <button type="button" class="chip" data-testid="${TEST_IDS.chartRangeToday}" aria-pressed="true">${TEXT.stock.rangeToday}</button>
            </div>
            <div class="chart-box" id="chart-host"></div>
            <p class="muted small">${TEXT.stock.chartNote}</p>
          </div>

          <div class="card stack-sm">
            <h2 class="card-title">${TEXT.stock.factsTitle}</h2>
            ${factRowHtml(TEXT.stock.factOpen, TEST_IDS.factOpen, '-')}
            ${factRowHtml(TEXT.stock.factHigh, TEST_IDS.factHigh, '-')}
            ${factRowHtml(TEXT.stock.factLow, TEST_IDS.factLow, '-')}
            ${factRowHtml(TEXT.stock.factOwned, TEST_IDS.factOwned, '-')}
            ${factRowHtml(TEXT.stock.factAvgPaid, TEST_IDS.factAvgPaid, '-')}
            ${factRowHtml(gainOnLabel(stock.symbol), TEST_IDS.factGain, '-')}
          </div>
        </div>

        <div class="stack">
          <div class="card stack-sm" id="trade-box">
            <div class="tabs" role="tablist" aria-label="${TEXT.stock.tabBuy} ${TEXT.stock.tabSell}">
              <button type="button" role="tab" class="chip" id="tab-buy-button" aria-selected="true"
                      aria-controls="trade-panel" data-testid="${TEST_IDS.tabBuy}">${TEXT.stock.tabBuy}</button>
              <button type="button" role="tab" class="chip" id="tab-sell-button" aria-selected="false"
                      aria-controls="trade-panel" data-testid="${TEST_IDS.tabSell}">${TEXT.stock.tabSell}</button>
            </div>

            <div role="tabpanel" id="trade-panel" aria-labelledby="tab-buy-button" class="stack-sm">
              <div class="box box-warn" data-testid="${TEST_IDS.tradeClosedBanner}" hidden></div>

              <div class="field">
                <label for="shares-input-field">${TEXT.stock.sharesLabel}</label>
                <div class="row">
                  <button type="button" class="btn btn-step" data-testid="${TEST_IDS.sharesMinus}"
                          aria-label="${TEXT.stock.oneLess}">&minus;</button>
                  <input type="text" inputmode="numeric" id="shares-input-field" value="1"
                         style="flex: 1 1 80px; width: auto;" data-testid="${TEST_IDS.sharesInput}" autocomplete="off">
                  <button type="button" class="btn btn-step" data-testid="${TEST_IDS.sharesPlus}"
                          aria-label="${TEXT.stock.oneMore}">+</button>
                </div>
                <p class="muted small">${TEXT.stock.wholeSharesOnly}</p>
                <div><button type="button" class="btn btn-small" data-testid="${TEST_IDS.sharesMax}">${maxButtonText(0)}</button></div>
              </div>

              <div class="stack-sm">
                <div class="dialog-row">
                  <span class="muted">${TEXT.stock.summaryPrice}</span>
                  <span data-testid="${TEST_IDS.summaryPrice}" data-cents="0">-</span>
                </div>
                <div class="dialog-row">
                  <span class="muted">${TEXT.stock.summaryShares}</span>
                  <span data-testid="${TEST_IDS.summaryShares}">&times; 1</span>
                </div>
                <div class="dialog-row">
                  <span class="muted" id="summary-total-label">${TEXT.stock.summaryTotalBuy}</span>
                  <span data-testid="${TEST_IDS.summaryTotal}" data-cents="0">-</span>
                </div>
                <div class="dialog-row">
                  <span class="muted">${TEXT.stock.summaryCashAfter}</span>
                  <span data-testid="${TEST_IDS.summaryCashAfter}" data-cents="0">-</span>
                </div>
              </div>

              <button type="button" class="btn btn-accent btn-block" data-testid="${TEST_IDS.tradeSubmit}">
                ${buyButtonText(1, stock.symbol)}
              </button>
              <p class="error-text" role="alert" data-testid="${TEST_IDS.tradeError}"></p>
              <p class="muted small">${TEXT.stock.tradeNote}</p>
            </div>
          </div>

          <div class="box box-ok stack-sm" data-testid="${TEST_IDS.tradeSuccess}" hidden>
            <h2 data-testid="${TEST_IDS.successTitle}"></h2>
            <p data-testid="${TEST_IDS.successDetail}"></p>
            <div class="row">
              <button type="button" class="btn" data-testid="${TEST_IDS.successAgain}">${TEXT.stock.makeAnotherTrade}</button>
              <a class="btn" href="${href('market')}">${TEXT.common.backToMarket}</a>
              <a class="btn" href="${href('portfolio')}">${TEXT.common.seePortfolio}</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog data-testid="${TEST_IDS.confirmDialog}">
      <h2 data-testid="${TEST_IDS.confirmTitle}"></h2>
      <div class="dialog-rows" id="confirm-rows"></div>
      <div class="dialog-actions">
        <button type="button" class="btn" data-testid="${TEST_IDS.confirmCancel}">${TEXT.common.cancel}</button>
        <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.confirmOk}">${TEXT.stock.confirmBuy}</button>
      </div>
    </dialog>
  `;
}

function pick(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

function sharesFieldValue() {
  return pick(TEST_IDS.sharesInput).value;
}

function sharesOrOne() {
  const parsed = parseShares(sharesFieldValue());
  return parsed.ok ? parsed.shares : 1;
}

function currentMaxShares(priceCents) {
  if (mode === 'buy') return maxAffordableShares(account.cashCents, priceCents);
  return ownedShares(account, stock.symbol);
}

function updateSummary(nowMs = Date.now()) {
  const priceCents = priceNowCents(stock, nowMs);
  const parsed = parseShares(sharesFieldValue());
  const shares = parsed.ok ? parsed.shares : 0;

  const priceNode = pick(TEST_IDS.summaryPrice);
  priceNode.setAttribute('data-cents', String(priceCents));
  priceNode.textContent = formatMoney(priceCents);

  pick(TEST_IDS.summaryShares).textContent = `× ${shares}`;

  const totalCents = shares * priceCents;
  const totalNode = pick(TEST_IDS.summaryTotal);
  totalNode.setAttribute('data-cents', String(totalCents));
  totalNode.textContent = formatMoney(totalCents);

  const cashAfter = mode === 'buy' ? account.cashCents - totalCents : account.cashCents + totalCents;
  const cashNode = pick(TEST_IDS.summaryCashAfter);
  cashNode.setAttribute('data-cents', String(cashAfter));
  cashNode.textContent = formatMoney(cashAfter);

  document.getElementById('summary-total-label').textContent =
    mode === 'buy' ? TEXT.stock.summaryTotalBuy : TEXT.stock.summaryTotalSell;

  const label = mode === 'buy' ? buyButtonText : sellButtonText;
  pick(TEST_IDS.tradeSubmit).textContent = label(parsed.ok ? parsed.shares : shares, stock.symbol);

  pick(TEST_IDS.sharesMax).textContent = maxButtonText(currentMaxShares(priceCents));
}

function updateFacts(nowMs = Date.now()) {
  const openCents = openPriceCents(stock, nowMs);
  const { highCents, lowCents } = highLowToday(stock, nowMs);
  const priceCents = priceNowCents(stock, nowMs);

  const openNode = pick(TEST_IDS.factOpen);
  openNode.setAttribute('data-cents', String(openCents));
  openNode.textContent = formatMoney(openCents);

  const highNode = pick(TEST_IDS.factHigh);
  highNode.setAttribute('data-cents', String(highCents));
  highNode.textContent = formatMoney(highCents);

  const lowNode = pick(TEST_IDS.factLow);
  lowNode.setAttribute('data-cents', String(lowCents));
  lowNode.textContent = formatMoney(lowCents);

  const holding = getHolding(account, stock.symbol);
  pick(TEST_IDS.factOwned).textContent = sharesWord(holding ? holding.shares : 0);

  const avgNode = pick(TEST_IDS.factAvgPaid);
  if (holding) {
    const avg = averagePaidCents(holding);
    avgNode.setAttribute('data-cents', String(avg));
    avgNode.textContent = formatMoney(avg);
  } else {
    avgNode.setAttribute('data-cents', '0');
    avgNode.textContent = TEXT.stock.none;
  }

  const gainCents = holding ? holdingGainCents(holding, priceCents) : 0;
  const gainNode = pick(TEST_IDS.factGain);
  gainNode.setAttribute('data-cents', String(gainCents));
  gainNode.className = directionClass(gainCents);
  gainNode.textContent = `${formatSignedMoney(gainCents)} ${arrowFor(gainCents)}`.trim();
}

function updateChart(nowMs = Date.now()) {
  const points = chartPoints(stock, chartRange, nowMs);
  const openCents = openPriceCents(stock, nowMs);
  const first = points[0].cents;
  const last = points[points.length - 1].cents;
  const label = chartRange === 'today' ? chartLabelToday : chartLabelHour;

  chart.update({
    points,
    openCents,
    goingUp: last >= first,
    ariaLabel: label(stock.symbol, formatMoney(first), formatMoney(last)),
  });
}

function updateHeader(nowMs = Date.now()) {
  const priceCents = priceNowCents(stock, nowMs);
  const change = changeSinceOpen(stock, nowMs);

  const priceNode = pick(TEST_IDS.stockPrice);
  priceNode.setAttribute('data-cents', String(priceCents));
  priceNode.textContent = formatMoney(priceCents);

  const changeNode = pick(TEST_IDS.stockChange);
  changeNode.setAttribute('data-cents', String(change.cents));
  changeNode.className = directionClass(change.cents);
  changeNode.textContent = changeLine(
    formatSignedMoney(change.cents),
    formatPercent(change.percent),
    arrowFor(change.cents),
  ).replace(/\s{2,}/g, ' ');
}

function updateClosedBanner() {
  const status = marketStatus();
  const banner = pick(TEST_IDS.tradeClosedBanner);
  banner.hidden = status.open;
  if (!status.open) banner.textContent = marketClosedMessage();
}

function refresh() {
  const nowMs = Date.now();
  updateHeader(nowMs);
  updateChart(nowMs);
  updateFacts(nowMs);
  updateSummary(nowMs);
  updateClosedBanner();
}

function showError(message) {
  pick(TEST_IDS.tradeError).textContent = message;
}

function clearError() {
  pick(TEST_IDS.tradeError).textContent = '';
}

function setMode(nextMode) {
  mode = nextMode;
  pick(TEST_IDS.tabBuy).setAttribute('aria-selected', nextMode === 'buy' ? 'true' : 'false');
  pick(TEST_IDS.tabSell).setAttribute('aria-selected', nextMode === 'sell' ? 'true' : 'false');
  document
    .getElementById('trade-panel')
    .setAttribute('aria-labelledby', nextMode === 'buy' ? 'tab-buy-button' : 'tab-sell-button');

  const submit = pick(TEST_IDS.tradeSubmit);
  submit.className = nextMode === 'buy' ? 'btn btn-accent btn-block' : 'btn btn-sell btn-block';

  const confirmOk = pick(TEST_IDS.confirmOk);
  confirmOk.className = nextMode === 'buy' ? 'btn btn-accent' : 'btn btn-sell';
  confirmOk.textContent = nextMode === 'buy' ? TEXT.stock.confirmBuy : TEXT.stock.confirmSell;

  clearError();
  updateSummary();
}

function setChartRange(range) {
  chartRange = range;
  pick(TEST_IDS.chartRangeToday).setAttribute('aria-pressed', range === 'today' ? 'true' : 'false');
  pick(TEST_IDS.chartRangeHour).setAttribute('aria-pressed', range === 'hour' ? 'true' : 'false');
  updateChart();
}

function checkNow(nowMs) {
  const priceCents = priceNowCents(stock, nowMs);
  const common = { sharesRaw: sharesFieldValue(), priceCents, account, symbol: stock.symbol, nowMs };
  const result = mode === 'buy' ? checkBuy(common) : checkSell(common);
  return { result, priceCents };
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

function openConfirm() {
  if (isOffline()) {
    showError(TEXT.connection.blocked);
    return;
  }

  const nowMs = Date.now();
  const { result, priceCents } = checkNow(nowMs);
  if (!result.ok) {
    showError(result.error);
    return;
  }

  clearError();
  reviewPriceCents = priceCents;
  const shares = result.shares;
  const dialog = pick(TEST_IDS.confirmDialog);
  const rows = document.getElementById('confirm-rows');

  if (mode === 'buy') {
    pick(TEST_IDS.confirmTitle).textContent = confirmBuyTitle(shares, stock.symbol);
    rows.innerHTML = `
      <div class="dialog-row"><span class="muted">${TEXT.stock.confirmPrice}</span><span data-cents="${priceCents}">${formatMoney(priceCents)}</span></div>
      <div class="dialog-row"><span class="muted">${TEXT.stock.confirmShares}</span><span>&times; ${shares}</span></div>
      <div class="dialog-row"><span class="muted">${TEXT.stock.confirmTotal}</span><span data-cents="${shares * priceCents}">${formatMoney(shares * priceCents)}</span></div>
    `;
  } else {
    const gainCents = sellGainPreviewCents(account, stock.symbol, shares, priceCents);
    pick(TEST_IDS.confirmTitle).textContent = confirmSellTitle(shares, stock.symbol);
    rows.innerHTML = `
      <div class="dialog-row"><span class="muted">${TEXT.stock.confirmPriceNow}</span><span data-cents="${priceCents}">${formatMoney(priceCents)}</span></div>
      <div class="dialog-row"><span class="muted">${TEXT.stock.confirmYouGet}</span><span data-cents="${shares * priceCents}">${formatMoney(shares * priceCents)}</span></div>
      <div class="dialog-row"><span class="muted">${TEXT.stock.confirmGain}</span><span class="${directionClass(gainCents)}" data-cents="${gainCents}">${formatSignedMoney(gainCents)}</span></div>
    `;
  }

  dialog.showModal();
}

function showSuccess(title, detail) {
  pick(TEST_IDS.successTitle).textContent = title;
  pick(TEST_IDS.successDetail).textContent = detail;
  document.getElementById('trade-box').hidden = true;
  pick(TEST_IDS.tradeSuccess).hidden = false;
}

function confirmTrade() {
  const nowMs = Date.now();
  const dialog = pick(TEST_IDS.confirmDialog);

  // The internet can drop while the dialog is open.
  if (isOffline()) {
    dialog.close();
    showError(TEXT.connection.blocked);
    return;
  }

  // Another tab may have traded since this page was drawn, so the saved
  // account is read again and checked before anything is written.
  reloadAccount();
  const { result, priceCents } = checkNow(nowMs);

  if (!result.ok) {
    dialog.close();
    showError(result.error);
    return;
  }

  const shares = result.shares;
  const priceMoved = priceCents !== reviewPriceCents;
  let title = '';
  let detail = '';

  if (mode === 'buy') {
    const done = applyBuy(account, { symbol: stock.symbol, shares, priceCents, nowMs });
    account = writeAccount(session.user.email, done.account);
    title = boughtTitle(shares, stock.symbol);
    detail = boughtDetail(formatMoney(done.costCents), formatMoney(done.cashAfterCents));
  } else {
    const done = applySell(account, { symbol: stock.symbol, shares, priceCents, nowMs });
    account = writeAccount(session.user.email, done.account);
    title = soldTitle(shares, stock.symbol);
    detail = soldDetail(formatMoney(done.proceedsCents), formatMoney(done.cashAfterCents));
  }

  if (priceMoved) detail = `${detail} ${priceMovedDetail(formatMoney(priceCents))}`;

  dialog.close();
  menu.setCash(account.cashCents);
  showSuccess(title, detail);
  updateFacts(nowMs);
  updateSummary(nowMs);
}

function stepShares(change) {
  const input = pick(TEST_IDS.sharesInput);
  const next = Math.max(1, sharesOrOne() + change);
  input.value = String(next);
  clearError();
  updateSummary();
}

function wire() {
  pick(TEST_IDS.sharesInput).addEventListener('input', () => {
    const parsed = parseShares(sharesFieldValue());
    if (parsed.ok) clearError();
    else showError(parsed.error);
    updateSummary();
  });

  pick(TEST_IDS.sharesMinus).addEventListener('click', () => stepShares(-1));
  pick(TEST_IDS.sharesPlus).addEventListener('click', () => stepShares(1));

  pick(TEST_IDS.sharesMax).addEventListener('click', () => {
    const max = currentMaxShares(priceNowCents(stock));
    pick(TEST_IDS.sharesInput).value = String(max);
    clearError();
    updateSummary();
  });

  pick(TEST_IDS.tabBuy).addEventListener('click', () => setMode('buy'));
  pick(TEST_IDS.tabSell).addEventListener('click', () => setMode('sell'));

  pick(TEST_IDS.chartRangeToday).addEventListener('click', () => setChartRange('today'));
  pick(TEST_IDS.chartRangeHour).addEventListener('click', () => setChartRange('hour'));

  pick(TEST_IDS.tradeSubmit).addEventListener('click', openConfirm);
  pick(TEST_IDS.confirmCancel).addEventListener('click', () => pick(TEST_IDS.confirmDialog).close());
  pick(TEST_IDS.confirmOk).addEventListener('click', confirmTrade);

  pick(TEST_IDS.successAgain).addEventListener('click', () => {
    pick(TEST_IDS.tradeSuccess).hidden = true;
    document.getElementById('trade-box').hidden = false;
    pick(TEST_IDS.sharesInput).value = '1';
    clearError();
    updateSummary();
  });
}

async function buildPage() {
  if (menu) {
    menu.stop();
    menu = null;
  }
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
  chart = null;

  let stocks;
  try {
    const response = await fetch('/data/stocks.json');
    if (!response.ok) throw new Error('Could not load stocks');
    stocks = await response.json();
  } catch (error) {
    stock = null;
    renderLoadError();
    menu = renderTopMenu({ page: 'market', user: session.user, account });
    return;
  }

  const wanted = queryValue('symbol').trim().toUpperCase();
  stock = stocks.find((one) => one.symbol === wanted) || null;

  if (!stock) {
    renderNotFound(wanted);
    menu = renderTopMenu({ page: 'market', user: session.user, account });
    return;
  }

  document.getElementById('page').innerHTML = pageHtml();
  menu = renderTopMenu({ page: 'market', user: session.user, account });

  chart = createPriceChart(TEST_IDS.priceChart);
  document.getElementById('chart-host').append(chart.element);

  wire();
  setMode(queryValue('mode').toLowerCase() === 'sell' ? 'sell' : 'buy');
  refresh();
  startRefresh();
}

async function start() {
  session = await requireSession();
  if (!session) return;
  account = session.account;

  window.addEventListener(CONNECTION_CHANGED, (event) => {
    if (event.detail.offline) stopRefresh();
    else if (stock && chart) {
      refresh();
      startRefresh();
    }
  });

  await buildPage();
}

start();
