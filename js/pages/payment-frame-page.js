// The card form, drawn inside the iframe on the Wallet page.
//
// It never touches the account. When a card goes through, or is turned down,
// it tells the page that holds it with a postMessage and nothing else.

import { TEXT, payButtonText } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { shortMoney } from '../money-format.js';
import {
  PAYMENT_MESSAGE_TYPE,
  PROCESSING_MS,
  checkCard,
  cardOutcome,
  formatCardNumber,
} from '../payment-rules.js';

const FIELDS = [
  { name: 'name', inputId: TEST_IDS.cardName, errorId: TEST_IDS.cardNameError },
  { name: 'number', inputId: TEST_IDS.cardNumber, errorId: TEST_IDS.cardNumberError },
  { name: 'expiry', inputId: TEST_IDS.cardExpiry, errorId: TEST_IDS.cardExpiryError },
  { name: 'cvc', inputId: TEST_IDS.cardCvc, errorId: TEST_IDS.cardCvcError },
];

let amountCents = 0;
let waiting = false;

function pick(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

// The amount comes from the page that opened this frame.
function amountFromUrl() {
  const raw = new URLSearchParams(window.location.search).get('amount');
  if (!/^[0-9]+$/.test(String(raw || ''))) return 0;
  return Number(raw);
}

function lockIconHtml() {
  return `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <rect x="4" y="10" width="16" height="10" rx="2"></rect>
      <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
    </svg>
  `;
}

function pageHtml() {
  return `
    <div class="pay-wrap stack-sm">
      <div class="pay-brand">
        ${lockIconHtml()}
        <div>
          <div class="pay-brand-name">${TEXT.payment.brand}</div>
          <div class="muted small">${TEXT.payment.brandNote}</div>
        </div>
      </div>

      <form class="stack-sm" id="card-form" novalidate>
        <div class="field">
          <label for="card-name-input">${TEXT.payment.nameLabel}</label>
          <input type="text" id="card-name-input" autocomplete="off" maxlength="60"
                 placeholder="${TEXT.payment.namePlaceholder}" data-testid="${TEST_IDS.cardName}">
          <p class="field-error" id="${TEST_IDS.cardNameError}" data-testid="${TEST_IDS.cardNameError}"></p>
        </div>

        <div class="field">
          <label for="card-number-input">${TEXT.payment.numberLabel}</label>
          <input type="text" id="card-number-input" autocomplete="off" inputmode="numeric" maxlength="19"
                 placeholder="0000 0000 0000 0000" data-testid="${TEST_IDS.cardNumber}">
          <p class="field-error" id="${TEST_IDS.cardNumberError}" data-testid="${TEST_IDS.cardNumberError}"></p>
        </div>

        <div class="pay-pair">
          <div class="field">
            <label for="card-expiry-input">${TEXT.payment.expiryLabel}</label>
            <input type="text" id="card-expiry-input" autocomplete="off" inputmode="numeric" maxlength="5"
                   placeholder="MM/YY" data-testid="${TEST_IDS.cardExpiry}">
            <p class="field-error" id="${TEST_IDS.cardExpiryError}" data-testid="${TEST_IDS.cardExpiryError}"></p>
          </div>
          <div class="field">
            <label for="card-cvc-input">${TEXT.payment.cvcLabel}</label>
            <input type="text" id="card-cvc-input" autocomplete="off" inputmode="numeric" maxlength="3"
                   placeholder="000" data-testid="${TEST_IDS.cardCvc}">
            <p class="field-error" id="${TEST_IDS.cardCvcError}" data-testid="${TEST_IDS.cardCvcError}"></p>
          </div>
        </div>

        <button type="submit" class="btn btn-accent btn-block" data-testid="${TEST_IDS.cardPay}">
          ${payButtonText(shortMoney(amountCents))}
        </button>
        <p class="error-text" role="alert" data-testid="${TEST_IDS.cardResult}"></p>
      </form>
    </div>
  `;
}

function fieldValues() {
  return {
    name: pick(TEST_IDS.cardName).value,
    number: pick(TEST_IDS.cardNumber).value,
    expiry: pick(TEST_IDS.cardExpiry).value,
    cvc: pick(TEST_IDS.cardCvc).value,
  };
}

function showFieldErrors(errors) {
  for (const field of FIELDS) {
    const input = pick(field.inputId);
    const box = pick(field.errorId);
    const message = errors[field.name];
    box.textContent = message;
    if (message === '') {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    } else {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', field.errorId);
    }
  }
}

function clearFieldErrors() {
  showFieldErrors({ name: '', number: '', expiry: '', cvc: '' });
}

// The only thing this frame ever says to the page that holds it.
function report(status, last4) {
  window.parent.postMessage(
    { type: PAYMENT_MESSAGE_TYPE, status, amountCents, last4 },
    window.location.origin,
  );
}

function finish() {
  const button = pick(TEST_IDS.cardPay);
  const outcome = cardOutcome(pick(TEST_IDS.cardNumber).value);

  waiting = false;
  button.disabled = false;
  button.textContent = payButtonText(shortMoney(amountCents));

  if (outcome.status === 'paid') {
    pick(TEST_IDS.cardResult).textContent = '';
    report('paid', outcome.last4);
    return;
  }

  // A card the list doesn't know says so and reports nothing at all.
  pick(TEST_IDS.cardResult).textContent = outcome.error;
  if (outcome.status === 'declined') report('declined', outcome.last4);
}

function submit(event) {
  event.preventDefault();
  if (waiting) return;

  pick(TEST_IDS.cardResult).textContent = '';
  const check = checkCard(fieldValues());
  showFieldErrors(check.errors);
  if (!check.ok) return;

  waiting = true;
  const button = pick(TEST_IDS.cardPay);
  button.disabled = true;
  button.textContent = TEXT.payment.processing;
  window.setTimeout(finish, PROCESSING_MS);
}

function wire() {
  const numberInput = pick(TEST_IDS.cardNumber);
  numberInput.addEventListener('input', () => {
    numberInput.value = formatCardNumber(numberInput.value);
  });

  for (const field of FIELDS) {
    pick(field.inputId).addEventListener('input', () => {
      pick(field.errorId).textContent = '';
      pick(field.inputId).removeAttribute('aria-invalid');
      pick(field.inputId).removeAttribute('aria-describedby');
    });
  }

  document.getElementById('card-form').addEventListener('submit', submit);
}

function start() {
  amountCents = amountFromUrl();
  document.getElementById('page').innerHTML = pageHtml();
  clearFieldErrors();
  wire();
}

start();
