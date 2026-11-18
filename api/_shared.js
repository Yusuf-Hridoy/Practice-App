// Shared helpers for the small API. This file is not an endpoint.
//
// The API answers from the same JSON files and the same price and news
// engines the pages use, so the same seed and the same time always give the
// same answer on both sides. There is no database and no package: only what
// Node gives us.

import { readFileSync } from 'node:fs';

import { TEXT, APP_VERSION } from '../js/ui-text.js';
import { setSeedOverride, seedValue } from '../js/app-links.js';
import { readSwitches } from '../js/test-switches.js';
import { flakyOutcome } from '../js/data-loader.js';
import {
  hashKey,
  mulberry32,
  priceNowCents,
  openPriceCents,
  changeSinceOpen,
} from '../js/price-engine.js';
import { dhakaIsoString } from '../js/market-hours.js';

export { APP_VERSION };

export const TOKEN_PREFIX = 'demo-';
export const TOKEN_LENGTH = 12;
export const TOKEN_LETTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const NEWS_LIMIT_DEFAULT = 10;
export const NEWS_LIMIT_MIN = 1;
export const NEWS_LIMIT_MAX = 60;

// --- the data files ---
//
// Each path is written out in full, so the host that packs the function can
// see which files it has to take along.

let stocksFile = null;
let demoUsersFile = null;
let newsTemplatesFile = null;

export function readStocks() {
  if (!stocksFile) {
    stocksFile = JSON.parse(readFileSync(new URL('../data/stocks.json', import.meta.url), 'utf8'));
  }
  return stocksFile;
}

export function readDemoUsers() {
  if (!demoUsersFile) {
    demoUsersFile = JSON.parse(readFileSync(new URL('../data/demo-users.json', import.meta.url), 'utf8'));
  }
  return demoUsersFile;
}

export function readNewsTemplates() {
  if (!newsTemplatesFile) {
    newsTemplatesFile = JSON.parse(
      readFileSync(new URL('../data/news-templates.json', import.meta.url), 'utf8'),
    );
  }
  return newsTemplatesFile;
}

// --- answers ---

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(body));
}

export function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

// true when the request used the wrong method, and the 405 has been sent.
export function wrongMethod(req, res, allowed) {
  if (req.method === allowed) return false;
  res.setHeader('Allow', allowed);
  sendError(res, 405, allowed === 'POST' ? TEXT.api.usePost : TEXT.api.useGet);
  return true;
}

// --- the query ---

export function requestUrl(req) {
  return new URL(req.url, 'http://tradeloom.invalid');
}

export function queryOf(req) {
  return requestUrl(req).searchParams;
}

// ?seed= works exactly like it does in the app.
export function applySeed(params) {
  const seed = (params.get('seed') || '').trim();
  setSeedOverride(seed === '' ? null : seed);
}

// ?at= takes an ISO time or a number of milliseconds, and defaults to now.
export function readAt(params) {
  const raw = (params.get('at') || '').trim();
  if (raw === '') return { ok: true, nowMs: Date.now() };

  if (/^[0-9]+$/.test(raw)) {
    const ms = Number(raw);
    if (Number.isFinite(ms)) return { ok: true, nowMs: ms };
  }

  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) return { ok: true, nowMs: parsed };

  return { ok: false };
}

export function readWholeNumber(params, name, fallback) {
  const raw = (params.get(name) || '').trim();
  if (raw === '') return { ok: true, value: fallback };
  if (!/^[0-9]+$/.test(raw)) return { ok: false };
  return { ok: true, value: Number(raw) };
}

// --- the slow, api and flaky switches, on the API too ---

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// One request is one load, so the flaky key counts it as load 0 of this
// address. Same seed, same address: same answer, every time.
export async function applySwitches(req, params) {
  const state = readSwitches(params.toString());
  const path = requestUrl(req).pathname;
  const flake = state.flaky ? flakyOutcome(seedValue(), path, 0) : { fail: false, waitMs: 0 };

  const waitMs = state.slowMs + flake.waitMs;
  if (waitMs > 0) await sleep(waitMs);

  return { ok: !(state.apiFail || flake.fail) };
}

// Everything every endpoint does before it answers: the method, the seed,
// the time and the switches. It answers by itself when something is wrong.
export async function openRequest(req, res, method = 'GET') {
  if (wrongMethod(req, res, method)) return null;

  const params = queryOf(req);
  applySeed(params);

  const at = readAt(params);
  if (!at.ok) {
    sendError(res, 400, TEXT.api.badAt);
    return null;
  }

  const run = await applySwitches(req, params);
  if (!run.ok) {
    sendError(res, 500, TEXT.api.serverProblem);
    return null;
  }

  return { params, nowMs: at.nowMs };
}

// --- one price line ---
//
// The same engine the pages use, so the API and the pages always agree.

export function priceRow(stock, nowMs) {
  const change = changeSinceOpen(stock, nowMs);
  return {
    symbol: stock.symbol,
    priceCents: priceNowCents(stock, nowMs),
    openCents: openPriceCents(stock, nowMs),
    changeCents: change.cents,
    changePercent: Math.round(change.percent * 100) / 100,
    at: dhakaIsoString(nowMs),
  };
}

// --- the practice token ---
//
// It is made from the seed and the email, so the same log in always gives the
// same token. Nothing in the app or the API ever checks it.

export function makeToken(email) {
  const random = mulberry32(hashKey(`${seedValue()}|login|${email}`));
  let text = '';
  for (let i = 0; i < TOKEN_LENGTH; i += 1) {
    text += TOKEN_LETTERS[Math.floor(random() * TOKEN_LETTERS.length)];
  }
  return `${TOKEN_PREFIX}${text}`;
}

// --- the body of a POST ---

export async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch (error) {
        return null;
      }
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (text === '') return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}
