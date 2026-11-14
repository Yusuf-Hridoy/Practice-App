// Wallet page: cash, adding practice money with a test card, start over, and
// the history with its filters, pages and receipts.

import {
  TEXT,
  addButtonText,
  addedSoFarText,
  addedWithCardMessage,
  historyBought,
  historySold,
  historyAddWithCard,
  payingLine,
  shortBought,
  shortSold,
  receiptLinkLabel,
  showingText,
  pageButtonLabel,
} from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import { writeAccount, resetAccount, readAccount } from '../account-storage.js';
import { resetWatchlist } from '../watchlist-storage.js';
import { resetProfile } from '../profile-storage.js';
import { href } from '../app-links.js';
import {
  formatMoney,
  formatSignedMoney,
  formatDhakaTime,
  csvDhakaTime,
  centsToPlainNumber,
  directionClass,
} from '../money-format.js';
import { dhakaDateKey } from '../market-hours.js';
import { checkAdd, applyAdd, ADD_LIMIT_CENTS } from '../trade-rules.js';
import { TEST_CARDS, PAYMENT_MESSAGE_TYPE } from '../payment-rules.js';
import { isOffline } from '../connection-status.js';
import {
  DEFAULT_STATE,
  cleanState,
  readState,
  stateParams,
  datesBackwards,
  filterRows,
  pageOf,
} from '../history-filters.js';

let session = null;
let account = null;
let menu = null;

// The amount someone is paying for right now, while the card step is open.
let pendingChoice = null;

// The filters and the page, kept the same in the URL.
let filterState = { ...DEFAULT_STATE };

// Every row that matches the filters, all pages. The CSV uses these.
let filteredRows = [];

const CHOICES = [
  { cents: 100000, label: TEXT.wallet.choice1000, testId: TEST_IDS.addAmount1000 },
  { cents: 500000, label: TEXT.wallet.choice5000, testId: TEST_IDS.addAmount5000 },
  { cents: 1000000, label: TEXT.wallet.choice10000, testId: TEST_IDS.addAmount10000 },
];

const TYPE_OPTIONS = [
  { value: 'all', label: TEXT.wallet.filterAllTypes },
  { value: 'buy', label: TEXT.wallet.filterBuys },
  { value: 'sell', label: TEXT.wallet.filterSells },
  { value: 'add', label: TEXT.wallet.filterTopUps },
];

function choiceHtml(choice) {
  const checked = choice.cents === 500000 ? ' checked' : '';
  return `
    <label class="radio-button">
      <input type="radio" name="add-amount" value="${choice.cents}" data-testid="${choice.testId}"${checked}>
      <span>${choice.label}</span>
    </label>
  `;
}

function testCardHtml(card) {
  return `
    <li class="card-list-row">
      <code>${card.shown}</code>
      <span class="muted small">${card.result}</span>
    </li>
  `;
}

function typeOptionHtml(option) {
  return `<option value="${option.value}">${option.label}</option>`;
}

function shellHtml() {
  return `
    <div class="wrap stack">
      <h1>${TEXT.wallet.title}</h1>

      <div class="card">
        <div class="stat-label">${TEXT.wallet.cashTitle}</div>
        <div class="big-price" data-testid="${TEST_IDS.walletCash}" data-cents="0">-</div>
      </div>

      <div class="card stack-sm">
        <h2 class="card-title">${TEXT.wallet.addTitle}</h2>
        <div class="radio-row">${CHOICES.map(choiceHtml).join('')}</div>
        <div>
          <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.addSubmit}">
            ${addButtonText(TEXT.wallet.choice5000)}
          </button>
        </div>
        <p class="muted small" id="added-so-far"></p>
        <progress data-testid="${TEST_IDS.addProgress}" max="${ADD_LIMIT_CENTS}" value="0"
                  aria-labelledby="added-so-far"></progress>
        <p class="muted small">${TEXT.wallet.addNote}</p>
        <p class="up ok-text" role="status" data-testid="${TEST_IDS.addMessage}"></p>
        <p class="error-text" role="alert" data-testid="${TEST_IDS.addError}"></p>

        <div class="pay-step stack-sm" data-testid="${TEST_IDS.payStep}" hidden>
          <h3>${TEXT.payment.stepTitle}</h3>
          <p data-testid="${TEST_IDS.payAmount}"></p>
          <div class="stack-sm" data-testid="${TEST_IDS.testCards}">
            <div class="label">${TEXT.payment.testCardsTitle}</div>
            <ul class="card-list">${TEST_CARDS.map(testCardHtml).join('')}</ul>
          </div>
          <iframe class="pay-frame" data-testid="${TEST_IDS.payFrame}" title="${TEXT.payment.frameTitle}"
                  src="about:blank"></iframe>
          <div>
            <button type="button" class="btn" data-testid="${TEST_IDS.payCancel}">${TEXT.common.cancel}</button>
          </div>
        </div>
      </div>

      <div class="card stack-sm">
        <h2 class="card-title">${TEXT.wallet.startOverTitle}</h2>
        <p class="muted">${TEXT.wallet.startOverBody}</p>
        <div>
          <button type="button" class="btn" data-testid="${TEST_IDS.startOver}">${TEXT.wallet.startOverButton}</button>
        </div>
        <p class="up ok-text" role="status" id="start-over-message"></p>
      </div>

      <div class="card stack-sm">
        <div class="row-between">
          <h2 class="card-title">${TEXT.wallet.historyTitle}</h2>
          <button type="button" class="btn btn-small" data-testid="${TEST_IDS.historyDownload}">
            ${TEXT.wallet.download}
          </button>
        </div>

        <div class="filter-row">
          <div class="field">
            <label for="history-type-select">${TEXT.wallet.filterTypeLabel}</label>
            <select id="history-type-select" data-testid="${TEST_IDS.historyFilterType}">
              ${TYPE_OPTIONS.map(typeOptionHtml).join('')}
            </select>
          </div>
          <div class="field">
            <label for="history-from-input">${TEXT.wallet.filterFromLabel}</label>
            <input type="date" id="history-from-input" data-testid="${TEST_IDS.historyFilterFrom}">
          </div>
          <div class="field">
            <label for="history-to-input">${TEXT.wallet.filterToLabel}</label>
            <input type="date" id="history-to-input" data-testid="${TEST_IDS.historyFilterTo}">
          </div>
          <div class="filter-actions">
            <button type="button" class="btn" data-testid="${TEST_IDS.historyClearFilters}">
              ${TEXT.wallet.clearFilters}
            </button>
          </div>
        </div>
        <p class="error-text" role="alert" data-testid="${TEST_IDS.historyFilterError}"></p>

        <div class="table-scroll" id="history-table-box">
          <table data-testid="${TEST_IDS.historyTable}">
            <thead>
              <tr>
                <th>${TEXT.wallet.colWhen}</th>
                <th>${TEXT.wallet.colWhat}</th>
                <th class="right">${TEXT.wallet.colAmount}</th>
                <th class="right">${TEXT.wallet.colCashAfter}</th>
                <th>${TEXT.wallet.colReceipt}</th>
              </tr>
            </thead>
            <tbody id="history-rows"></tbody>
          </table>
        </div>

        <p class="muted" data-testid="${TEST_IDS.historyEmpty}" hidden>${TEXT.wallet.historyEmpty}</p>

        <div class="row-between pager" id="history-pager">
          <p class="muted small" data-testid="${TEST_IDS.historyPageInfo}"></p>
          <div class="row">
            <button type="button" class="btn btn-small" data-testid="${TEST_IDS.historyPrev}">
              ${TEXT.wallet.previous}
            </button>
            <span class="row page-numbers" id="history-pages"></span>
            <button type="button" class="btn btn-small" data-testid="${TEST_IDS.historyNext}">
              ${TEXT.wallet.next}
            </button>
          </div>
        </div>

        <p class="muted small">${TEXT.wallet.historyNote}</p>
      </div>
    </div>

    <dialog data-testid="${TEST_IDS.startOverDialog}">
      <h2>${TEXT.wallet.startOverDialogTitle}</h2>
      <p class="muted">${TEXT.wallet.startOverDialogBody}</p>
      <div class="dialog-actions" style="margin-top: 20px;">
        <button type="button" class="btn" data-testid="${TEST_IDS.startOverCancel}">${TEXT.common.cancel}</button>
        <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.startOverConfirm}">
          ${TEXT.wallet.startOverConfirm}
        </button>
      </div>
    </dialog>
  `;
}

// The long line in the What column.
function whatText(entry) {
  if (entry.type === 'buy') return historyBought(entry.shares, entry.symbol, formatMoney(entry.priceCents));
  if (entry.type === 'sell') return historySold(entry.shares, entry.symbol, formatMoney(entry.priceCents));
  if (entry.type === 'add') return entry.last4 ? historyAddWithCard(entry.last4) : TEXT.wallet.historyAdd;
  return TEXT.wallet.historyStart;
}

// The short line the receipt link says out loud.
function shortWhatText(entry) {
  if (entry.type === 'buy') return shortBought(entry.shares, entry.symbol);
  if (entry.type === 'sell') return shortSold(entry.shares, entry.symbol);
  if (entry.type === 'add') return TEXT.wallet.historyAdd;
  return TEXT.wallet.historyStart;
}

function historyRowHtml(entry) {
  return `
    <tr data-testid="${TEST_IDS.historyRow}" data-type="${entry.type}" data-id="${entry.id}">
      <td>${formatDhakaTime(entry.time)}</td>
      <td>${whatText(entry)}</td>
      <td class="right ${directionClass(entry.amountCents)}" data-cents="${entry.amountCents}">${formatSignedMoney(entry.amountCents)}</td>
      <td class="right" data-cents="${entry.cashAfterCents}">${formatMoney(entry.cashAfterCents)}</td>
      <td>
        <a data-testid="${TEST_IDS.historyReceiptLink}" href="${href('receipt', { id: entry.id })}"
           target="_blank" rel="noopener"
           aria-label="${receiptLinkLabel(shortWhatText(entry))}">${TEXT.wallet.openReceipt}</a>
      </td>
    </tr>
  `;
}

function pageButtonsHtml(view) {
  const buttons = [];
  for (let page = 1; page <= view.pages; page += 1) {
    const current = page === view.page ? ' aria-current="page"' : '';
    buttons.push(
      `<button type="button" class="btn btn-small" data-testid="${TEST_IDS.historyPage}" data-page="${page}" aria-label="${pageButtonLabel(page)}"${current}>${page}</button>`,
    );
  }
  return buttons.join('');
}

function pick(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

// Reads the saved account again, so a second tab cannot be overwritten.
function reloadAccount() {
  account = readAccount(session.user.email, session.user.start);
  return account;
}

function selectedChoice() {
  const checked = document.querySelector('input[name="add-amount"]:checked');
  const cents = checked ? Number(checked.value) : 500000;
  return CHOICES.find((choice) => choice.cents === cents) || CHOICES[1];
}

// --- drawing ---

function drawCash() {
  const cashNode = pick(TEST_IDS.walletCash);
  cashNode.setAttribute('data-cents', String(account.cashCents));
  cashNode.textContent = formatMoney(account.cashCents);

  document.getElementById('added-so-far').textContent = addedSoFarText(formatMoney(account.totalAddedCents));
  pick(TEST_IDS.addProgress).value = account.totalAddedCents;
}

function drawHistory() {
  filteredRows = filterRows(account.history, filterState);
  const view = pageOf(filteredRows, filterState.page);

  // A page that is no longer there quietly becomes page 1.
  if (view.page !== filterState.page) filterState = { ...filterState, page: view.page };

  document.getElementById('history-rows').innerHTML = view.rows.map(historyRowHtml).join('');

  const empty = view.total === 0;
  document.getElementById('history-table-box').hidden = empty;
  pick(TEST_IDS.historyEmpty).hidden = !empty;
  document.getElementById('history-pager').hidden = empty;

  pick(TEST_IDS.historyPageInfo).textContent = showingText(view.start, view.end, view.total);
  document.getElementById('history-pages').innerHTML = pageButtonsHtml(view);
  pick(TEST_IDS.historyPrev).hidden = view.page === 1;
  pick(TEST_IDS.historyNext).hidden = view.page === view.pages;
}

function drawAll() {
  drawCash();
  drawHistory();
}

// --- the filters and the page in the URL ---

function urlForState() {
  return href('wallet', stateParams(filterState));
}

function syncFilterInputs() {
  pick(TEST_IDS.historyFilterType).value = filterState.type;
  pick(TEST_IDS.historyFilterFrom).value = filterState.from;
  pick(TEST_IDS.historyFilterTo).value = filterState.to;
}

function pushUrl() {
  const url = urlForState();
  if (url !== window.location.pathname + window.location.search) {
    window.history.pushState(stateParams(filterState), '', url);
  }
}

// Used on the first draw and on Back: whatever the URL says, as far as it
// makes sense. A From after a To is a bad pair, so both dates are dropped.
function applyUrlState() {
  const fromUrl = readState(window.location.search);
  filterState = datesBackwards(fromUrl) ? { ...fromUrl, from: '', to: '' } : fromUrl;

  pick(TEST_IDS.historyFilterError).textContent = '';
  syncFilterInputs();
  drawHistory();

  const url = urlForState();
  if (url !== window.location.pathname + window.location.search) {
    window.history.replaceState(stateParams(filterState), '', url);
  }
}

function onFilterChange() {
  const next = cleanState({
    type: pick(TEST_IDS.historyFilterType).value,
    from: pick(TEST_IDS.historyFilterFrom).value,
    to: pick(TEST_IDS.historyFilterTo).value,
    page: 1,
  });

  // A backwards pair of dates says so and leaves the table as it was.
  if (datesBackwards(next)) {
    pick(TEST_IDS.historyFilterError).textContent = TEXT.wallet.datesBackwards;
    return;
  }

  pick(TEST_IDS.historyFilterError).textContent = '';
  filterState = next;
  pushUrl();
  drawHistory();
}

function goToPage(page) {
  if (page === filterState.page) return;
  filterState = { ...filterState, page };
  pushUrl();
  drawHistory();
}

// --- the card step ---

function openPayStep(choice) {
  pendingChoice = choice;
  pick(TEST_IDS.payAmount).textContent = payingLine(choice.label);
  pick(TEST_IDS.payFrame).src = href('paymentFrame', { amount: choice.cents });
  pick(TEST_IDS.payStep).hidden = false;
}

function closePayStep() {
  pendingChoice = null;
  pick(TEST_IDS.payStep).hidden = true;
  pick(TEST_IDS.payFrame).src = 'about:blank';
}

// Only a message from this same site, of this one kind, for the amount being
// paid right now, is worth listening to. Everything else is ignored.
function onPaymentMessage(event) {
  if (event.origin !== window.location.origin) return;

  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type !== PAYMENT_MESSAGE_TYPE) return;
  if (pendingChoice === null) return;
  if (data.amountCents !== undefined && data.amountCents !== pendingChoice.cents) return;

  // A card that was turned down keeps the step open. The frame says why.
  if (data.status !== 'paid') return;

  const choice = pendingChoice;
  const last4 = String(data.last4 || '');

  // Another tab may have added money since the card step opened.
  reloadAccount();
  const check = checkAdd(account, choice.cents);
  if (!check.ok) {
    closePayStep();
    drawAll();
    pick(TEST_IDS.addError).textContent = check.error;
    return;
  }

  const done = applyAdd(account, choice.cents, Date.now(), last4);
  account = writeAccount(session.user.email, done.account);
  menu.setCash(account.cashCents);
  closePayStep();
  drawAll();
  pick(TEST_IDS.addMessage).textContent = addedWithCardMessage(
    choice.label,
    last4,
    formatMoney(account.cashCents),
  );
}

// --- the CSV ---

function downloadCsv() {
  const header = 'time_dhaka,type,symbol,shares,price,amount,cash_after';
  const lines = filteredRows.map((entry) =>
    [
      csvDhakaTime(entry.time),
      entry.type,
      entry.symbol || '',
      entry.shares === undefined ? '' : String(entry.shares),
      entry.priceCents === undefined ? '' : centsToPlainNumber(entry.priceCents),
      centsToPlainNumber(entry.amountCents),
      centsToPlainNumber(entry.cashAfterCents),
    ].join(','),
  );

  const text = [header].concat(lines).join('\r\n');
  const blob = new Blob([text], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `tradeloom-history-${dhakaDateKey()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// --- wiring ---

function wireAddMoney() {
  for (const choice of CHOICES) {
    pick(choice.testId).addEventListener('change', () => {
      pick(TEST_IDS.addSubmit).textContent = addButtonText(selectedChoice().label);
    });
  }

  pick(TEST_IDS.addSubmit).addEventListener('click', () => {
    const choice = selectedChoice();
    pick(TEST_IDS.addMessage).textContent = '';
    pick(TEST_IDS.addError).textContent = '';

    if (isOffline()) {
      closePayStep();
      pick(TEST_IDS.addError).textContent = TEXT.connection.blocked;
      return;
    }

    // Another tab may have changed the account since this page was drawn, so
    // the saved account is read again and checked before the card form opens.
    reloadAccount();

    const check = checkAdd(account, choice.cents);
    if (!check.ok) {
      closePayStep();
      drawAll();
      pick(TEST_IDS.addError).textContent = check.error;
      return;
    }

    openPayStep(choice);
  });

  pick(TEST_IDS.payCancel).addEventListener('click', () => {
    closePayStep();
  });

  window.addEventListener('message', onPaymentMessage);
}

function wireStartOver() {
  pick(TEST_IDS.startOver).addEventListener('click', () => {
    document.getElementById('start-over-message').textContent = '';
    pick(TEST_IDS.startOverDialog).showModal();
  });

  pick(TEST_IDS.startOverCancel).addEventListener('click', () => {
    pick(TEST_IDS.startOverDialog).close();
  });

  pick(TEST_IDS.startOverConfirm).addEventListener('click', () => {
    reloadAccount();
    account = resetAccount(session.user.email, session.user.start);
    resetWatchlist(session.user.email, session.user.watchlistStart);

    // The profile goes back too, including the theme, which is applied at once.
    const freshProfile = resetProfile(session.user.email, session.user.profileStart);
    window.TradeloomTheme.applySaved();
    menu.setProfile(freshProfile);

    pick(TEST_IDS.startOverDialog).close();
    menu.setCash(account.cashCents);
    closePayStep();
    pick(TEST_IDS.addMessage).textContent = '';
    pick(TEST_IDS.addError).textContent = '';
    drawAll();
    document.getElementById('start-over-message').textContent = TEXT.wallet.startOverDone;
  });
}

function wireHistory() {
  pick(TEST_IDS.historyFilterType).addEventListener('change', onFilterChange);
  pick(TEST_IDS.historyFilterFrom).addEventListener('change', onFilterChange);
  pick(TEST_IDS.historyFilterTo).addEventListener('change', onFilterChange);

  pick(TEST_IDS.historyClearFilters).addEventListener('click', () => {
    filterState = { ...DEFAULT_STATE };
    pick(TEST_IDS.historyFilterError).textContent = '';
    syncFilterInputs();
    pushUrl();
    drawHistory();
  });

  pick(TEST_IDS.historyPrev).addEventListener('click', () => {
    goToPage(filterState.page - 1);
  });

  pick(TEST_IDS.historyNext).addEventListener('click', () => {
    goToPage(filterState.page + 1);
  });

  document.getElementById('history-pages').addEventListener('click', (event) => {
    const button = event.target.closest(`[data-testid="${TEST_IDS.historyPage}"]`);
    if (button) goToPage(Number(button.getAttribute('data-page')));
  });

  pick(TEST_IDS.historyDownload).addEventListener('click', downloadCsv);

  window.addEventListener('popstate', applyUrlState);
}

async function start() {
  session = await requireSession();
  if (!session) return;
  account = session.account;

  document.getElementById('page').innerHTML = shellHtml();
  menu = renderTopMenu({ page: 'wallet', user: session.user, account });

  drawCash();
  wireAddMoney();
  wireStartOver();
  wireHistory();
  applyUrlState();
}

start();
