// Seeded moving prices. Same seed, same day, same time, same price, on any computer.
// No Math.random() anywhere in the app.

import { seedValue } from './app-links.js';
import { dhakaParts, dhakaDateKey, shiftDays, isWeekend, OPEN_HOUR } from './market-hours.js';

export const STEP_SECONDS = 5;
export const STEPS_PER_DAY = 5760;
export const STEPS_PER_HOUR = 720;
export const MIN_PRICE_CENTS = 100;

// FNV-1a 32-bit hash of a text key.
function hashKey(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

// mulberry32 seeded generator.
function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Monday to Friday use today. Saturday and Sunday use the Friday before.
export function tradingDateKey(nowMs = Date.now()) {
  const p = dhakaParts(nowMs);
  if (p.weekday === 6) return dhakaDateKey(shiftDays(nowMs, -1));
  if (p.weekday === 0) return dhakaDateKey(shiftDays(nowMs, -2));
  return dhakaDateKey(nowMs);
}

export function currentStep(nowMs = Date.now()) {
  const p = dhakaParts(nowMs);
  if (isWeekend(p.weekday)) return STEPS_PER_DAY;
  const secondsSinceOpen = p.hours * 3600 + p.minutes * 60 + p.seconds - OPEN_HOUR * 3600;
  const step = Math.floor(secondsSinceOpen / STEP_SECONDS);
  if (step < 0) return 0;
  if (step > STEPS_PER_DAY) return STEPS_PER_DAY;
  return step;
}

// Clock text for a step, like "09:05". Step 0 is 09:00.
export function stepClockText(step) {
  const totalSeconds = OPEN_HOUR * 3600 + step * STEP_SECONDS;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const dayCache = new Map();

function dayData(stock, nowMs) {
  const date = tradingDateKey(nowMs);
  const seed = seedValue();
  const cacheKey = `${seed}|${stock.symbol}|${date}`;

  let entry = dayCache.get(cacheKey);
  if (!entry) {
    const openRandom = mulberry32(hashKey(`${seed}|${stock.symbol}|${date}|open`));
    const move = (openRandom() * 2 - 1) * 0.03;
    const openCents = Math.max(MIN_PRICE_CENTS, Math.round(stock.basePriceCents * (1 + move)));
    entry = {
      openCents,
      prices: [openCents],
      random: mulberry32(hashKey(`${seed}|${stock.symbol}|${date}|walk`)),
      stepMaxBps: stock.stepMaxBps,
    };
    dayCache.set(cacheKey, entry);
  }

  const step = currentStep(nowMs);
  while (entry.prices.length - 1 < step) {
    const r = entry.random() * 2 - 1;
    const previous = entry.prices[entry.prices.length - 1];
    const moved = Math.round(previous * (1 + (r * entry.stepMaxBps) / 10000));
    entry.prices.push(Math.max(MIN_PRICE_CENTS, moved));
  }

  return entry;
}

export function openPriceCents(stock, nowMs = Date.now()) {
  return dayData(stock, nowMs).openCents;
}

export function priceNowCents(stock, nowMs = Date.now()) {
  const data = dayData(stock, nowMs);
  return data.prices[currentStep(nowMs)];
}

export function changeSinceOpen(stock, nowMs = Date.now()) {
  const data = dayData(stock, nowMs);
  const now = data.prices[currentStep(nowMs)];
  const cents = now - data.openCents;
  const percent = data.openCents === 0 ? 0 : (cents / data.openCents) * 100;
  return { cents, percent };
}

export function highLowToday(stock, nowMs = Date.now()) {
  const data = dayData(stock, nowMs);
  const step = currentStep(nowMs);
  let high = data.prices[0];
  let low = data.prices[0];
  for (let i = 1; i <= step; i += 1) {
    const value = data.prices[i];
    if (value > high) high = value;
    if (value < low) low = value;
  }
  return { highCents: high, lowCents: low };
}

// range: "today" (every 5 minutes), "hour" (last hour, every minute),
// "mini" (last hour, every 5 minutes).
export function chartPoints(stock, range, nowMs = Date.now()) {
  const data = dayData(stock, nowMs);
  const step = currentStep(nowMs);

  let start = 0;
  let every = 60;
  if (range === 'hour') {
    start = Math.max(0, step - STEPS_PER_HOUR);
    every = 12;
  } else if (range === 'mini') {
    start = Math.max(0, step - STEPS_PER_HOUR);
    every = 60;
  }

  const points = [];
  for (let i = start; i <= step; i += every) {
    points.push({ step: i, cents: data.prices[i] });
  }
  if (points.length === 0 || points[points.length - 1].step !== step) {
    points.push({ step, cents: data.prices[step] });
  }
  return points;
}

export function priceMap(stocks, nowMs = Date.now()) {
  const map = {};
  for (const stock of stocks) map[stock.symbol] = priceNowCents(stock, nowMs);
  return map;
}
