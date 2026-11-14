// Made-up market news. The order and the times come from the seed, so the same
// seed at the same time gives the same news, in the same order, on any computer.
// It uses the same seeded random helpers as the price engine. No Math.random().

import { seedValue } from './app-links.js';
import { hashKey, mulberry32 } from './price-engine.js';
import { dhakaParts, dhakaDateKey, dhakaClockText, DAY_MS } from './market-hours.js';
import {
  TEXT,
  TIME_TEXT,
  minutesAgoText,
  hoursAgoText,
  yesterdayAtText,
  dateAtText,
  shortDateText,
} from './ui-text.js';

export const NEWS_PAGE_SIZE = 10;
export const ALL_STOCKS = 'ALL';
export const MARKET_TAG = 'MARKET';

// The newest headline sits on the last 10 minute mark.
export const BUCKET_MS = 10 * 60 * 1000;

// Every next headline is this many minutes older than the one before it.
export const MIN_GAP_MINUTES = 15;
export const MAX_GAP_MINUTES = 90;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

// --- the templates ---

let templatesPromise = null;

export function loadNewsTemplates() {
  if (!templatesPromise) {
    templatesPromise = fetch('/data/news-templates.json').then((response) => {
      if (!response.ok) throw new Error('Could not load news');
      return response.json();
    });
  }
  return templatesPromise;
}

// --- the order and the gaps, both from the seed ---

const orderCache = new Map();

function orderFor(templates) {
  const seed = seedValue();
  const cached = orderCache.get(seed);
  if (cached && cached.items.length === templates.length) return cached;

  // Fisher-Yates with the seeded generator: same seed, same order.
  const items = templates.slice();
  const orderRandom = mulberry32(hashKey(`${seed}|news|order`));
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(orderRandom() * (i + 1));
    const keep = items[i];
    items[i] = items[j];
    items[j] = keep;
  }

  // How far back each headline sits from the newest one.
  const gapRandom = mulberry32(hashKey(`${seed}|news|gaps`));
  const span = MAX_GAP_MINUTES - MIN_GAP_MINUTES + 1;
  const offsetsMs = [0];
  for (let i = 1; i < items.length; i += 1) {
    const minutes = MIN_GAP_MINUTES + Math.floor(gapRandom() * span);
    offsetsMs.push(offsetsMs[i - 1] + minutes * MINUTE_MS);
  }

  const entry = { items, offsetsMs };
  orderCache.set(seed, entry);
  return entry;
}

// Dhaka is a whole number of hours ahead of UTC, so cutting the clock down to
// the last 10 minutes is the same job on either clock.
export function newestTimeMs(nowMs = Date.now()) {
  return Math.floor(nowMs / BUCKET_MS) * BUCKET_MS;
}

// All 60 headlines, newest first, each with the time it was published.
export function orderedNews(templates, nowMs = Date.now()) {
  const { items, offsetsMs } = orderFor(templates);
  const newest = newestTimeMs(nowMs);
  return items.map((item, index) => ({
    id: item.id,
    stock: item.stock,
    headline: item.headline,
    summary: item.summary,
    timeMs: newest - offsetsMs[index],
  }));
}

// --- the helpers the pages use ---

export function filterNews(items, stock) {
  if (!stock || stock === ALL_STOCKS) return items;
  return items.filter((item) => item.stock === stock);
}

// The newest few, for the news box on the market page.
export function newestNews(templates, count = 3, nowMs = Date.now()) {
  return orderedNews(templates, nowMs).slice(0, count);
}

// A page of headlines starting at any position, for the news page.
export function newsPage(templates, options = {}, nowMs = Date.now()) {
  const stock = options.stock || ALL_STOCKS;
  const start = options.start || 0;
  const count = options.count === undefined ? NEWS_PAGE_SIZE : options.count;
  const all = filterNews(orderedNews(templates, nowMs), stock);
  return { items: all.slice(start, start + count), total: all.length };
}

export function newsForStock(templates, symbol, nowMs = Date.now()) {
  return filterNews(orderedNews(templates, nowMs), symbol);
}

export function findNews(templates, id, nowMs = Date.now()) {
  return orderedNews(templates, nowMs).find((item) => item.id === id) || null;
}

// --- time text ---

function shortDhakaDate(timeMs) {
  const parts = dhakaParts(timeMs);
  return shortDateText(parts.day, TIME_TEXT.months[parts.month - 1]);
}

function isDhakaYesterday(timeMs, nowMs) {
  return dhakaDateKey(timeMs) === dhakaDateKey(nowMs - DAY_MS);
}

export function newsTimeText(timeMs, nowMs = Date.now()) {
  const gap = Math.max(0, nowMs - timeMs);

  if (gap < HOUR_MS) {
    const minutes = Math.floor(gap / MINUTE_MS);
    return minutes < 1 ? TEXT.news.justNow : minutesAgoText(minutes);
  }

  if (gap < DAY_MS) return hoursAgoText(Math.floor(gap / HOUR_MS));

  const clock = dhakaClockText(timeMs);
  if (isDhakaYesterday(timeMs, nowMs)) return yesterdayAtText(clock);
  return dateAtText(shortDhakaDate(timeMs), clock);
}

// The small tag on a headline: the symbol, or "Market" for general news.
export function newsTagText(stock) {
  return stock === MARKET_TAG ? TEXT.news.marketTag : stock;
}
