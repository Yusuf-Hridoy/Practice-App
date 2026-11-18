// Every data load in the app goes through here: the stock list, the demo
// accounts and the news templates. That is what lets the slow, api and flaky
// switches work everywhere at once.
//
// With no switches in the link this is exactly today's fetch: start it now,
// throw when the answer is not ok, hand back the JSON.

import { slowMs, isApiFailOn, isFlakyOn } from './test-switches.js';
import { seedValue } from './app-links.js';
import { hashKey, mulberry32 } from './price-engine.js';

export const STOCKS_PATH = '/data/stocks.json';
export const DEMO_USERS_PATH = '/data/demo-users.json';
export const NEWS_TEMPLATES_PATH = '/data/news-templates.json';

// About one load in three fails. The rest wait somewhere in this range.
export const FLAKY_FAIL_CHANCE = 1 / 3;
export const FLAKY_MAX_WAIT_MS = 2000;

const STEADY = Object.freeze({ fail: false, waitMs: 0 });

// How many loads this page has asked for. It is part of the flaky key, so the
// same seed and the same order of loads always give the same run of failures.
let loadCount = 0;

export function loadsSoFar() {
  return loadCount;
}

// Pure, so the API can use the same rule for its own one load.
export function flakyOutcome(seed, path, count) {
  const random = mulberry32(hashKey(`${seed}|${path}|${count}`));
  if (random() < FLAKY_FAIL_CHANCE) return { fail: true, waitMs: 0 };
  return { fail: false, waitMs: Math.round(random() * FLAKY_MAX_WAIT_MS) };
}

// options.canFail: false means the error switches leave this load alone.
// Only the account list uses it. Without that one exception a broken server
// would bounce every page back to the log in page, and the error boxes on the
// pages themselves could never be seen. The slow switch still applies.
export function loadJson(path, failMessage = 'Could not load data', options = {}) {
  const canFail = options.canFail !== false;
  const count = loadCount;
  loadCount += 1;

  const flake = isFlakyOn() && canFail ? flakyOutcome(seedValue(), path, count) : STEADY;
  const waitMs = slowMs() + flake.waitMs;

  function run() {
    if (flake.fail || (isApiFailOn() && canFail)) return Promise.reject(new Error(failMessage));
    return fetch(path).then((response) => {
      if (!response.ok) throw new Error(failMessage);
      return response.json();
    });
  }

  if (waitMs <= 0) return run();

  // setTimeout, so Playwright's Clock API controls the wait.
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      run().then(resolve, reject);
    }, waitMs);
  });
}

export function loadStocks(options = {}) {
  return loadJson(STOCKS_PATH, 'Could not load stocks', options);
}
