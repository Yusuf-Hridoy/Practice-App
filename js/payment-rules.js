// Card checks for the practice payment frame, and the three test cards.
// No real card ever goes through here. Every message comes from ui-text.js.

import { TEXT } from './ui-text.js';
import { dhakaParts } from './market-hours.js';

export const CARD_DIGITS = 16;
export const CVC_DIGITS = 3;

// The frame tells the page what happened with this message type, and nothing else.
export const PAYMENT_MESSAGE_TYPE = 'tradeloom-payment';

// How long "Processing…" lasts. A setTimeout, so a test clock can move it along.
export const PROCESSING_MS = 2000;

export const TEST_CARDS = Object.freeze([
  Object.freeze({
    shown: '4242 4242 4242 4242',
    digits: '4242424242424242',
    status: 'paid',
    result: TEXT.payment.cardWorks,
  }),
  Object.freeze({
    shown: '4000 0000 0000 0002',
    digits: '4000000000000002',
    status: 'declined',
    result: TEXT.payment.declined,
  }),
  Object.freeze({
    shown: '4000 0000 0000 9995',
    digits: '4000000000009995',
    status: 'declined',
    result: TEXT.payment.noFunds,
  }),
]);

export function onlyDigits(value) {
  return String(value === undefined || value === null ? '' : value).replace(/[^0-9]/g, '');
}

// "4242424242424" becomes "4242 4242 4242 4", as someone types.
export function formatCardNumber(value) {
  const digits = onlyDigits(value).slice(0, CARD_DIGITS);
  const groups = digits.match(/.{1,4}/g);
  return groups === null ? '' : groups.join(' ');
}

export function last4Of(value) {
  return onlyDigits(value).slice(-4);
}

// Each check gives back the exact error text, or "" when the field is fine.

export function checkName(value) {
  return String(value === undefined || value === null ? '' : value).trim() === ''
    ? TEXT.payment.nameMissing
    : '';
}

export function checkNumber(value) {
  return onlyDigits(value).length === CARD_DIGITS ? '' : TEXT.payment.numberBad;
}

export function checkExpiry(value, nowMs = Date.now()) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  const match = /^([0-9]{2})\/([0-9]{2})$/.exec(text);
  if (match === null) return TEXT.payment.expiryBad;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return TEXT.payment.expiryBad;

  // A card works until the end of the month printed on it, in Dhaka time.
  const now = dhakaParts(nowMs);
  if (year < now.year || (year === now.year && month < now.month)) return TEXT.payment.expiryPast;
  return '';
}

export function checkCvc(value) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  return /^[0-9]{3}$/.test(text) ? '' : TEXT.payment.cvcBad;
}

export function checkCard(fields, nowMs = Date.now()) {
  const errors = {
    name: checkName(fields.name),
    number: checkNumber(fields.number),
    expiry: checkExpiry(fields.expiry, nowMs),
    cvc: checkCvc(fields.cvc),
  };
  return { ok: Object.values(errors).every((error) => error === ''), errors };
}

// What a card number does: "paid", "declined" or "unknown".
export function cardOutcome(value) {
  const digits = onlyDigits(value);
  const card = TEST_CARDS.find((one) => one.digits === digits) || null;
  const last4 = last4Of(digits);
  if (card === null) return { status: 'unknown', error: TEXT.payment.unknownCard, last4 };
  if (card.status === 'paid') return { status: 'paid', error: '', last4 };
  return { status: 'declined', error: card.result, last4 };
}
