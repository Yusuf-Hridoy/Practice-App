// Dhaka time helpers (UTC+6, no daylight saving) and the market switch.
// The market is open all day, every day. It is closed only when the page
// link carries ?market=closed.
// Every time function takes an optional nowMs so it can be checked with a fixed time.

import { isMarketClosedLink } from './app-links.js';

export const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function dhakaParts(nowMs = Date.now()) {
  const d = new Date(nowMs + DHAKA_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
  };
}

export function dhakaDateKey(nowMs = Date.now()) {
  const p = dhakaParts(nowMs);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

export function dhakaIsoString(nowMs = Date.now()) {
  const p = dhakaParts(nowMs);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hours)}:${pad2(p.minutes)}:${pad2(p.seconds)}+06:00`;
}

export function dhakaClockText(nowMs = Date.now()) {
  const p = dhakaParts(nowMs);
  return `${pad2(p.hours)}:${pad2(p.minutes)}`;
}

export function shiftDays(nowMs, days) {
  return nowMs + days * DAY_MS;
}

// Open all day, every day. Only the ?market=closed switch closes it.
export function isMarketOpen() {
  return !isMarketClosedLink();
}

export function marketStatus() {
  return { open: isMarketOpen() };
}
