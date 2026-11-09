// Wallet page: cash, adding practice money, start over and history.

import {
  TEXT,
  addButtonText,
  addedSoFarText,
  addedMessage,
  historyBought,
  historySold,
} from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import { writeAccount, resetAccount, readAccount } from '../account-storage.js';
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

let session = null;
let account = null;
let menu = null;

const CHOICES = [
  { cents: 100000, label: TEXT.wallet.choice1000, testId: TEST_IDS.addAmount1000 },
  { cents: 500000, label: TEXT.wallet.choice5000, testId: TEST_IDS.addAmount5000 },
  { cents: 1000000, label: TEXT.wallet.choice10000, testId: TEST_IDS.addAmount10000 },
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
        <div class="table-scroll">
          <table data-testid="${TEST_IDS.historyTable}">
            <thead>
              <tr>
                <th>${TEXT.wallet.colWhen}</th>
                <th>${TEXT.wallet.colWhat}</th>
                <th class="right">${TEXT.wallet.colAmount}</th>
                <th class="right">${TEXT.wallet.colCashAfter}</th>
              </tr>
            </thead>
            <tbody id="history-rows"></tbody>
          </table>
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

function whatText(entry) {
  if (entry.type === 'buy') return historyBought(entry.shares, entry.symbol, formatMoney(entry.priceCents));
  if (entry.type === 'sell') return historySold(entry.shares, entry.symbol, formatMoney(entry.priceCents));
  if (entry.type === 'add') return TEXT.wallet.historyAdd;
  return TEXT.wallet.historyStart;
}

function historyRowHtml(entry) {
  return `
    <tr data-testid="${TEST_IDS.historyRow}" data-type="${entry.type}">
      <td>${formatDhakaTime(entry.time)}</td>
      <td>${whatText(entry)}</td>
      <td class="right ${directionClass(entry.amountCents)}" data-cents="${entry.amountCents}">${formatSignedMoney(entry.amountCents)}</td>
      <td class="right" data-cents="${entry.cashAfterCents}">${formatMoney(entry.cashAfterCents)}</td>
    </tr>
  `;
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

function drawAccount() {
  const cashNode = pick(TEST_IDS.walletCash);
  cashNode.setAttribute('data-cents', String(account.cashCents));
  cashNode.textContent = formatMoney(account.cashCents);

  document.getElementById('added-so-far').textContent = addedSoFarText(formatMoney(account.totalAddedCents));
  pick(TEST_IDS.addProgress).value = account.totalAddedCents;

  document.getElementById('history-rows').innerHTML = account.history
    .slice()
    .reverse()
    .map(historyRowHtml)
    .join('');
}

function downloadCsv() {
  const header = 'time_dhaka,type,symbol,shares,price,amount,cash_after';
  const lines = account.history
    .slice()
    .reverse()
    .map((entry) =>
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

function wire() {
  for (const choice of CHOICES) {
    pick(choice.testId).addEventListener('change', () => {
      pick(TEST_IDS.addSubmit).textContent = addButtonText(selectedChoice().label);
    });
  }

  pick(TEST_IDS.addSubmit).addEventListener('click', () => {
    const choice = selectedChoice();
    pick(TEST_IDS.addMessage).textContent = '';
    pick(TEST_IDS.addError).textContent = '';

    // Another tab may have changed the account since this page was drawn,
    // so the saved account is read again and checked before anything is written.
    reloadAccount();

    const check = checkAdd(account, choice.cents);
    if (!check.ok) {
      drawAccount();
      pick(TEST_IDS.addError).textContent = check.error;
      return;
    }

    const done = applyAdd(account, choice.cents);
    account = writeAccount(session.user.email, done.account);
    menu.setCash(account.cashCents);
    drawAccount();
    pick(TEST_IDS.addMessage).textContent = addedMessage(choice.label, formatMoney(account.cashCents));
  });

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
    pick(TEST_IDS.startOverDialog).close();
    menu.setCash(account.cashCents);
    pick(TEST_IDS.addMessage).textContent = '';
    pick(TEST_IDS.addError).textContent = '';
    drawAccount();
    document.getElementById('start-over-message').textContent = TEXT.wallet.startOverDone;
  });

  pick(TEST_IDS.historyDownload).addEventListener('click', downloadCsv);
}

async function start() {
  session = await requireSession();
  if (!session) return;
  account = session.account;

  document.getElementById('page').innerHTML = shellHtml();
  menu = renderTopMenu({ page: 'wallet', user: session.user, account });

  drawAccount();
  wire();
}

start();
