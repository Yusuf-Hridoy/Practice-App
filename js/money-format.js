// Turns whole cents into text. Money math never happens here, only display.

import { TEXT, TIME_TEXT } from './ui-text.js';
import { dhakaParts, dhakaDateKey } from './market-hours.js';

const usDollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function formatMoney(cents) {
  return usDollars.format(Math.round(cents) / 100);
}

// "$5,000" instead of "$5,000.00", for the round amounts on the buttons.
export function shortMoney(cents) {
  const text = formatMoney(cents);
  return text.endsWith('.00') ? text.slice(0, -3) : text;
}

export function formatSignedMoney(cents) {
  const whole = Math.round(cents);
  if (whole > 0) return `+${formatMoney(whole)}`;
  if (whole < 0) return `-${formatMoney(-whole)}`;
  return formatMoney(0);
}

export function roundPercent(percent) {
  const rounded = Math.round(percent * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatPercent(percent) {
  const value = roundPercent(percent);
  if (value > 0) return `+${value.toFixed(1)}%`;
  if (value < 0) return `-${Math.abs(value).toFixed(1)}%`;
  return '0.0%';
}

export function arrowFor(value) {
  if (value > 0) return TEXT.common.upArrow;
  if (value < 0) return TEXT.common.downArrow;
  return '';
}

export function directionClass(value) {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return '';
}

// "Today 11:42", "Yesterday 15:10" or "3 Nov 11:42", all in Dhaka time.
export function formatDhakaTime(timeValue, nowMs = Date.now()) {
  const ms = typeof timeValue === 'number' ? timeValue : Date.parse(timeValue);
  if (Number.isNaN(ms)) return '';

  const p = dhakaParts(ms);
  const clock = `${pad2(p.hours)}:${pad2(p.minutes)}`;
  const key = dhakaDateKey(ms);

  if (key === dhakaDateKey(nowMs)) return `${TIME_TEXT.today} ${clock}`;
  if (key === dhakaDateKey(nowMs - 24 * 60 * 60 * 1000)) return `${TIME_TEXT.yesterday} ${clock}`;
  return `${p.day} ${TIME_TEXT.months[p.month - 1]} ${clock}`;
}

export function isSameDhakaDay(timeValue, nowMs = Date.now()) {
  const ms = typeof timeValue === 'number' ? timeValue : Date.parse(timeValue);
  if (Number.isNaN(ms)) return false;
  return dhakaDateKey(ms) === dhakaDateKey(nowMs);
}

// "10:42" in Dhaka time.
export function dhakaClockOf(timeValue) {
  const ms = typeof timeValue === 'number' ? timeValue : Date.parse(timeValue);
  if (Number.isNaN(ms)) return '';
  const p = dhakaParts(ms);
  return `${pad2(p.hours)}:${pad2(p.minutes)}`;
}

// "3 Nov" in Dhaka time.
export function dhakaDayOf(timeValue) {
  const ms = typeof timeValue === 'number' ? timeValue : Date.parse(timeValue);
  if (Number.isNaN(ms)) return '';
  const p = dhakaParts(ms);
  return `${p.day} ${TIME_TEXT.months[p.month - 1]}`;
}

// "3 Nov 2026, 11:42" in Dhaka time, for a receipt.
export function dhakaLongStamp(timeValue) {
  const ms = typeof timeValue === 'number' ? timeValue : Date.parse(timeValue);
  if (Number.isNaN(ms)) return '';
  const p = dhakaParts(ms);
  return `${p.day} ${TIME_TEXT.months[p.month - 1]} ${p.year}, ${pad2(p.hours)}:${pad2(p.minutes)}`;
}

// Plain "YYYY-MM-DD HH:MM" in Dhaka time, for the CSV file.
export function csvDhakaTime(timeValue) {
  const ms = typeof timeValue === 'number' ? timeValue : Date.parse(timeValue);
  if (Number.isNaN(ms)) return '';
  const p = dhakaParts(ms);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${pad2(p.hours)}:${pad2(p.minutes)}`;
}

// Plain number with 2 decimals, no currency sign and no commas, for the CSV file.
export function centsToPlainNumber(cents) {
  return (Math.round(cents) / 100).toFixed(2);
}
