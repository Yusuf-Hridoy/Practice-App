// One receipt, opened in a new tab from a history row. No top menu, and it
// prints on its own: the buttons are hidden on paper.

import { TEXT, receiptNumberText, receiptDateText, sharesOfText, cardEndingText } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { requireSession } from '../app-session.js';
import { href } from '../app-links.js';
import { formatMoney, dhakaLongStamp } from '../money-format.js';

function idFromUrl() {
  const value = new URLSearchParams(window.location.search).get('id');
  return String(value || '').trim();
}

function moneyHtml(cents, testId = '') {
  const idPart = testId === '' ? '' : ` data-testid="${testId}"`;
  return `<span class="receipt-value"${idPart} data-cents="${cents}">${formatMoney(cents)}</span>`;
}

function rowHtml(label, labelText, valueHtml) {
  return `
    <div class="receipt-row" data-testid="${TEST_IDS.receiptRow}" data-label="${label}">
      <span class="muted">${labelText}</span>
      <span>${valueHtml}</span>
    </div>
  `;
}

// The rows that fit this kind of history row, newest money last.
function rowsHtml(entry) {
  const rows = [];

  if (entry.type === 'buy' || entry.type === 'sell') {
    const isBuy = entry.type === 'buy';
    rows.push(
      rowHtml(
        isBuy ? 'bought' : 'sold',
        isBuy ? TEXT.receipt.bought : TEXT.receipt.sold,
        `<span class="receipt-value">${sharesOfText(entry.shares, entry.symbol)}</span>`,
      ),
    );
    rows.push(rowHtml('price-per-share', TEXT.receipt.pricePerShare, moneyHtml(entry.priceCents)));
    rows.push(rowHtml('total', TEXT.receipt.total, moneyHtml(Math.abs(entry.amountCents))));
  } else if (entry.type === 'add') {
    rows.push(rowHtml('added', TEXT.receipt.added, moneyHtml(entry.amountCents)));
    rows.push(
      rowHtml(
        'paid-with',
        TEXT.receipt.paidWith,
        `<span class="receipt-value">${entry.last4 ? cardEndingText(entry.last4) : TEXT.receipt.card}</span>`,
      ),
    );
  } else {
    rows.push(rowHtml('starting-money', TEXT.receipt.startingMoney, moneyHtml(entry.amountCents)));
  }

  rows.push(
    rowHtml('cash-after', TEXT.receipt.cashAfter, moneyHtml(entry.cashAfterCents, TEST_IDS.receiptCashAfter)),
  );

  return rows.join('');
}

function receiptHtml(user, entry) {
  return `
    <div class="receipt-page">
      <div class="card stack-sm receipt-card" data-testid="${TEST_IDS.receipt}">
        <h1>${TEXT.receipt.title}</h1>
        <p class="receipt-number" data-testid="${TEST_IDS.receiptNumber}">
          ${receiptNumberText(user.accountId, entry.id)}
        </p>
        <p class="muted small" data-testid="${TEST_IDS.receiptDate}">
          ${receiptDateText(dhakaLongStamp(entry.time))}
        </p>
        <div class="receipt-rows">${rowsHtml(entry)}</div>
        <p class="muted small">${TEXT.receipt.practiceNote}</p>
        <div class="row no-print">
          <button type="button" class="btn btn-accent" data-testid="${TEST_IDS.receiptPrint}">
            ${TEXT.receipt.print}
          </button>
          <a class="btn" href="${href('wallet')}" data-testid="${TEST_IDS.receiptBack}">
            ${TEXT.receipt.backToWallet}
          </a>
        </div>
      </div>
    </div>
  `;
}

function notFoundHtml() {
  return `
    <div class="receipt-page">
      <div class="card stack-sm receipt-card" data-testid="${TEST_IDS.receiptNotFound}">
        <h1>${TEXT.receipt.notFoundTitle}</h1>
        <p class="muted">${TEXT.receipt.notFoundBody}</p>
        <p class="no-print">
          <a class="btn btn-accent" href="${href('wallet')}" data-testid="${TEST_IDS.receiptBack}">
            ${TEXT.receipt.backToWallet}
          </a>
        </p>
      </div>
    </div>
  `;
}

async function start() {
  const session = await requireSession();
  if (!session) return;

  const wanted = idFromUrl();
  const entry = session.account.history.find((one) => one.id === wanted) || null;
  const page = document.getElementById('page');

  if (entry === null) {
    page.innerHTML = notFoundHtml();
    return;
  }

  page.innerHTML = receiptHtml(session.user, entry);
  page.querySelector(`[data-testid="${TEST_IDS.receiptPrint}"]`).addEventListener('click', () => {
    window.print();
  });
}

start();
