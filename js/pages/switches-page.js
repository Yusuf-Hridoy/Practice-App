// Test switches page. Open to everyone, logged in or not.
//
// It ticks whatever its own link already says, builds the link to the Market
// page as you change things, and never drifts: whatever drift is on, this
// page keeps its own names and its own ids, so there is always a way back.

import { TEXT } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { optionalSession } from '../app-session.js';
import { renderTopMenu, renderLoggedOutMenu } from '../top-menu.js';
import { pagePath, href, seedValue, getMarket } from '../app-links.js';
import {
  switchState,
  BUG_NAMES,
  DRIFT_NAMES,
  API_FAIL_VALUE,
  FLAKY_VALUE,
} from '../test-switches.js';

export const COPIED_MS = 2000;

const SLOW_CHOICES = [
  { value: 0, label: TEXT.switches.slowOff },
  { value: 1000, label: TEXT.switches.slow1000 },
  { value: 3000, label: TEXT.switches.slow3000 },
  { value: 5000, label: TEXT.switches.slow5000 },
];

const BUG_CHOICES = [
  { value: 'cost', label: TEXT.switches.bugCost },
  { value: 'gain', label: TEXT.switches.bugGain },
  { value: 'limit', label: TEXT.switches.bugLimit },
  { value: 'sort', label: TEXT.switches.bugSort },
  { value: 'search', label: TEXT.switches.bugSearch },
];

const DRIFT_CHOICES = [
  { value: 'text', label: TEXT.switches.driftText },
  { value: 'ids', label: TEXT.switches.driftIds },
  { value: 'layout', label: TEXT.switches.driftLayout },
  { value: 'popup', label: TEXT.switches.driftPopup },
];

let copyTimer = null;

function pick(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

function slowOptionHtml(choice) {
  return `<option value="${choice.value}">${choice.label}</option>`;
}

function bugCheckHtml(choice) {
  return `
          <label class="check-row">
            <input type="checkbox" data-testid="${TEST_IDS.switchesBug}" data-bug="${choice.value}">
            <span>${choice.label}</span>
          </label>
  `;
}

function driftCheckHtml(choice) {
  return `
          <label class="check-row">
            <input type="checkbox" data-testid="${TEST_IDS.switchesDrift}" data-drift="${choice.value}">
            <span>${choice.label}</span>
          </label>
  `;
}

function pageHtml() {
  return `
    <div class="wrap stack">
      <h1>${TEXT.switches.title}</h1>
      <p class="muted">${TEXT.switches.intro}</p>

      <div class="card">
        <fieldset class="plain-fieldset stack-sm">
          <legend>${TEXT.switches.speedLegend}</legend>
          <div class="field">
            <label for="switches-slow-select">${TEXT.switches.slowLabel}</label>
            <select id="switches-slow-select" data-testid="${TEST_IDS.switchesSlow}">
              ${SLOW_CHOICES.map(slowOptionHtml).join('')}
            </select>
          </div>
          <label class="check-row">
            <input type="checkbox" data-testid="${TEST_IDS.switchesApi}">
            <span>${TEXT.switches.apiLabel}</span>
          </label>
          <label class="check-row">
            <input type="checkbox" data-testid="${TEST_IDS.switchesFlaky}">
            <span>${TEXT.switches.flakyLabel}</span>
          </label>
        </fieldset>
      </div>

      <div class="card">
        <fieldset class="plain-fieldset">
          <legend>${TEXT.switches.bugsLegend}</legend>
          <div class="check-group">
            ${BUG_CHOICES.map(bugCheckHtml).join('')}
          </div>
        </fieldset>
      </div>

      <div class="card">
        <fieldset class="plain-fieldset">
          <legend>${TEXT.switches.driftLegend}</legend>
          <div class="check-group">
            ${DRIFT_CHOICES.map(driftCheckHtml).join('')}
          </div>
        </fieldset>
      </div>

      <div class="card stack-sm">
        <h2 class="card-title">${TEXT.switches.linkTitle}</h2>
        <p class="link-box"><code data-testid="${TEST_IDS.switchesLink}"></code></p>
        <div class="row">
          <button type="button" class="btn" data-testid="${TEST_IDS.switchesCopy}">${TEXT.switches.copy}</button>
          <a class="btn btn-accent" data-testid="${TEST_IDS.switchesOpen}" href="#">${TEXT.switches.open}</a>
          <button type="button" class="btn" data-testid="${TEST_IDS.switchesOff}">${TEXT.switches.turnOff}</button>
        </div>
        <p class="up ok-text" role="status" data-testid="${TEST_IDS.switchesCopyStatus}"></p>
      </div>

      <p class="muted small">
        <a data-testid="${TEST_IDS.versionLink}" href="${href('changelog')}">${TEXT.changelog.versionLabel}</a>
      </p>
    </div>
  `;
}

// --- reading the form ---

function bugBoxes() {
  return Array.from(document.querySelectorAll(`[data-testid="${TEST_IDS.switchesBug}"]`));
}

function driftBoxes() {
  return Array.from(document.querySelectorAll(`[data-testid="${TEST_IDS.switchesDrift}"]`));
}

function tickedValues(boxes, attribute) {
  return boxes.filter((box) => box.checked).map((box) => box.getAttribute(attribute));
}

function chosenParams() {
  const params = new URLSearchParams();
  params.set('seed', seedValue());

  const market = getMarket();
  if (market) params.set('market', market);

  const slow = Number(pick(TEST_IDS.switchesSlow).value);
  if (slow > 0) params.set('slow', String(slow));
  if (pick(TEST_IDS.switchesApi).checked) params.set('api', API_FAIL_VALUE);
  if (pick(TEST_IDS.switchesFlaky).checked) params.set('flaky', FLAKY_VALUE);

  const ticked = tickedValues(bugBoxes(), 'data-bug');
  const bugs = BUG_NAMES.filter((name) => ticked.includes(name));
  if (bugs.length > 0) params.set('bug', bugs.join(','));

  const drifted = tickedValues(driftBoxes(), 'data-drift');
  const drifts = DRIFT_NAMES.filter((name) => drifted.includes(name));
  if (drifts.length > 0) params.set('drift', drifts.join(','));

  return params;
}

function chosenPath() {
  return `${pagePath('market')}?${chosenParams().toString()}`;
}

function fullLink() {
  return `${window.location.origin}${chosenPath()}`;
}

function drawLink() {
  pick(TEST_IDS.switchesLink).textContent = fullLink();
  pick(TEST_IDS.switchesOpen).href = chosenPath();
}

// --- the switches this page was opened with ---

function fillFromLink() {
  const state = switchState();

  const slow = pick(TEST_IDS.switchesSlow);
  const known = SLOW_CHOICES.some((choice) => choice.value === state.slowMs);
  slow.value = String(known ? state.slowMs : 0);

  pick(TEST_IDS.switchesApi).checked = state.apiFail;
  pick(TEST_IDS.switchesFlaky).checked = state.flaky;

  for (const box of bugBoxes()) box.checked = state.bugs.includes(box.getAttribute('data-bug'));
  for (const box of driftBoxes()) box.checked = state.drifts.includes(box.getAttribute('data-drift'));
}

function turnAllOff() {
  pick(TEST_IDS.switchesSlow).value = '0';
  pick(TEST_IDS.switchesApi).checked = false;
  pick(TEST_IDS.switchesFlaky).checked = false;
  for (const box of bugBoxes()) box.checked = false;
  for (const box of driftBoxes()) box.checked = false;
  drawLink();
}

function sayForAWhile(message) {
  const status = pick(TEST_IDS.switchesCopyStatus);
  status.textContent = message;
  if (copyTimer !== null) window.clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => {
    status.textContent = '';
    copyTimer = null;
  }, COPIED_MS);
}

async function copyLink() {
  try {
    await window.navigator.clipboard.writeText(fullLink());
    sayForAWhile(TEXT.switches.copied);
  } catch (error) {
    sayForAWhile(TEXT.switches.copyFailed);
  }
}

function wire() {
  pick(TEST_IDS.switchesSlow).addEventListener('change', drawLink);
  pick(TEST_IDS.switchesApi).addEventListener('change', drawLink);
  pick(TEST_IDS.switchesFlaky).addEventListener('change', drawLink);
  for (const box of bugBoxes()) box.addEventListener('change', drawLink);
  for (const box of driftBoxes()) box.addEventListener('change', drawLink);

  pick(TEST_IDS.switchesCopy).addEventListener('click', copyLink);
  pick(TEST_IDS.switchesOff).addEventListener('click', turnAllOff);
}

async function start() {
  const session = await optionalSession();
  document.getElementById('page').innerHTML = pageHtml();

  if (session) renderTopMenu({ page: 'switches', user: session.user, account: session.account });
  else renderLoggedOutMenu();

  fillFromLink();
  wire();
  drawLink();
}

start();
