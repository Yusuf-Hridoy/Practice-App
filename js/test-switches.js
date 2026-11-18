// Test switches: values in the page link that make the app slow, broken or
// different, so hard testing problems can be practised.
//
// Every switch is off unless the link turns it on. With a plain link the app
// behaves exactly as it did before this file existed.
//
// This is the one place that answers "is X on?". The link is read once, when
// the page loads. The file is also safe to import in Node (the API), where
// there is no window: everything that touches the page is guarded.

import { TEXT } from './ui-text.js';

export const SLOW_MAX_MS = 10000;
export const API_FAIL_VALUE = '500';
export const FLAKY_VALUE = 'on';
export const BUG_NAMES = Object.freeze(['cost', 'gain', 'limit', 'sort', 'search']);
export const DRIFT_NAMES = Object.freeze(['text', 'ids', 'layout', 'popup']);
export const DRIFT_ALL = 'all';

// The Test switches page is never drifted, so there is always a way back.
export const DRIFT_FREE_PATHS = Object.freeze(['/switches', '/switches.html']);

// --- reading the link ---

// Anything that is not a name on the list is ignored, quietly.
function pickNames(raw, allowed, allowAll) {
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  if (text === '') return [];

  const picked = [];
  for (const piece of text.split(',')) {
    const name = piece.trim().toLowerCase();
    if (allowAll && name === DRIFT_ALL) {
      for (const one of allowed) if (!picked.includes(one)) picked.push(one);
    } else if (allowed.includes(name) && !picked.includes(name)) {
      picked.push(name);
    }
  }

  // Always in the order of the list above, so the same set reads the same way.
  return allowed.filter((name) => picked.includes(name));
}

function pickSlowMs(raw) {
  const text = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!/^[0-9]+$/.test(text)) return 0;
  const value = Number(text);
  if (value < 0 || value > SLOW_MAX_MS) return 0;
  return value;
}

// Pure, so the API can read its own query string with the same rules.
export function readSwitches(search) {
  const params = new URLSearchParams(search || '');
  return Object.freeze({
    slowMs: pickSlowMs(params.get('slow')),
    apiFail: String(params.get('api') || '').trim() === API_FAIL_VALUE,
    flaky: String(params.get('flaky') || '').trim().toLowerCase() === FLAKY_VALUE,
    bugs: Object.freeze(pickNames(params.get('bug'), BUG_NAMES, false)),
    drifts: Object.freeze(pickNames(params.get('drift'), DRIFT_NAMES, true)),
  });
}

// The switches that are on, ready to be put back on a link.
export function switchParamsFor(state) {
  const params = {};
  if (state.slowMs > 0) params.slow = String(state.slowMs);
  if (state.apiFail) params.api = API_FAIL_VALUE;
  if (state.flaky) params.flaky = FLAKY_VALUE;
  if (state.bugs.length > 0) params.bug = state.bugs.join(',');
  if (state.drifts.length > 0) params.drift = state.drifts.join(',');
  return params;
}

export function anySwitchOnIn(state) {
  return Object.keys(switchParamsFor(state)).length > 0;
}

// What the bar at the top lists, like ["slow=3000", "flaky", "bug=cost"].
export function switchSummaryFor(state) {
  const parts = [];
  if (state.slowMs > 0) parts.push(`slow=${state.slowMs}`);
  if (state.apiFail) parts.push(`api=${API_FAIL_VALUE}`);
  if (state.flaky) parts.push('flaky');
  if (state.bugs.length > 0) parts.push(`bug=${state.bugs.join(',')}`);
  if (state.drifts.length > 0) parts.push(`drift=${state.drifts.join(',')}`);
  return parts;
}

// --- the switches on this page ---

function pageSearch() {
  if (typeof window === 'undefined' || !window.location) return '';
  return window.location.search;
}

const STATE = readSwitches(pageSearch());

export function switchState() {
  return STATE;
}

export function slowMs() {
  return STATE.slowMs;
}

export function isApiFailOn() {
  return STATE.apiFail;
}

export function isFlakyOn() {
  return STATE.flaky;
}

export function isBugOn(name) {
  return STATE.bugs.includes(name);
}

function onDriftFreePage() {
  if (typeof window === 'undefined' || !window.location) return false;
  return DRIFT_FREE_PATHS.includes(window.location.pathname);
}

export function isDriftOn(name) {
  if (onDriftFreePage()) return false;
  return STATE.drifts.includes(name);
}

export function anySwitchOn() {
  return anySwitchOnIn(STATE);
}

export function switchParams() {
  return switchParamsFor(STATE);
}

// --- the bar at the very top ---

// The bar builds its own link. It cannot ask app-links.js, because app-links
// asks this file for the switches it copies onto every link.
function switchesPagePath() {
  const host = window.location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host === '';
  return local ? '/switches.html' : '/switches';
}

export function switchesPageHref() {
  const here = new URLSearchParams(window.location.search);
  const query = new URLSearchParams();

  const seed = (here.get('seed') || '').trim();
  if (seed !== '') query.set('seed', seed);
  const market = (here.get('market') || '').trim();
  if (market !== '') query.set('market', market);

  for (const [key, value] of Object.entries(switchParams())) query.set(key, value);

  const text = query.toString();
  return text === '' ? switchesPagePath() : `${switchesPagePath()}?${text}`;
}

export function switchBarText() {
  return `${TEXT.switches.barPrefix} ${switchSummaryFor(STATE).join(', ')}.`;
}

let bar = null;

export function renderSwitchBar() {
  if (!anySwitchOn()) return null;
  if (bar && document.body.contains(bar)) return bar;

  bar = document.createElement('div');
  bar.className = 'switch-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('data-testid', barTestId('switch-bar'));

  const line = document.createElement('span');
  line.textContent = switchBarText();

  const change = document.createElement('a');
  change.setAttribute('data-testid', barTestId('switch-bar-change'));
  change.href = switchesPageHref();
  change.textContent = TEXT.switches.change;

  bar.append(line, change);
  document.body.prepend(bar);
  return bar;
}

// The bar is drawn before test-ids.js can be imported here (that file asks
// this one about drift), so the two bar ids are drifted the same way by hand.
function barTestId(id) {
  return STATE.drifts.includes('ids') && !onDriftFreePage()
    ? `tl-${id.replace(/-/g, '_')}`
    : id;
}

// Every page imports this file, through app-links.js or test-ids.js, so the
// bar lands on every page on its own. Not inside the payment frame: that is a
// frame in a page, not a page of its own.
function startBar() {
  if (typeof document === 'undefined') return;
  if (!anySwitchOn()) return;
  if (window.top !== window.self) return;
  if (document.body) renderSwitchBar();
  else document.addEventListener('DOMContentLoaded', renderSwitchBar, { once: true });
}

startBar();
