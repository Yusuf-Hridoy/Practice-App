// Log in page.

import { TEXT } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { href, goToPath } from '../app-links.js';
import { attemptLogin, hasSession, nextFromUrl } from '../app-session.js';
import { loadDemoUsers } from '../account-storage.js';
import { logoHtml } from '../top-menu.js';
import { formatMoney, arrowFor, directionClass } from '../money-format.js';
import { priceNowCents, changeSinceOpen } from '../price-engine.js';

const TICKER_SYMBOLS = ['NOVA', 'KRYL', 'BRISK'];

function demoRowHtml(user) {
  return `
    <div class="demo-row" data-testid="${TEST_IDS.demoAccountRow}" data-email="${user.email}">
      <div>
        <div><strong>${user.displayName}</strong></div>
        <div class="muted small">${user.email}</div>
        <div class="muted small">${user.note}</div>
      </div>
      <button type="button" class="btn btn-small" data-testid="${TEST_IDS.demoAccountUse}">
        ${TEXT.login.use}
      </button>
    </div>
  `;
}

function render(users) {
  document.getElementById('page').innerHTML = `
    <div class="login-bar">
      ${logoHtml('login')}
      <div class="ticker" id="login-ticker"></div>
    </div>

    <div class="wrap grid-2-1">
      <div class="stack">
        <div><span class="pill pill-accent">${TEXT.login.practicePill}</span></div>
        <h1>${TEXT.login.heading}</h1>
        <p class="muted">${TEXT.login.blurb}</p>
      </div>

      <div class="stack">
        <form class="card stack-sm" id="login-form" novalidate>
          <h2>${TEXT.login.cardTitle}</h2>
          <div class="field">
            <label for="login-email-input">${TEXT.login.emailLabel}</label>
            <input type="email" id="login-email-input" name="email" autocomplete="username"
                   data-testid="${TEST_IDS.loginEmail}">
          </div>
          <div class="field">
            <label for="login-password-input">${TEXT.login.passwordLabel}</label>
            <input type="password" id="login-password-input" name="password" autocomplete="current-password"
                   data-testid="${TEST_IDS.loginPassword}">
          </div>
          <button type="submit" class="btn btn-accent btn-block" data-testid="${TEST_IDS.loginSubmit}">
            ${TEXT.login.submit}
          </button>
          <p class="error-text" role="alert" data-testid="${TEST_IDS.loginError}"></p>
        </form>

        <div class="card">
          <h2 class="card-title">${TEXT.login.demoTitle}</h2>
          <p class="muted small">${TEXT.login.demoPassword}</p>
          ${users.map(demoRowHtml).join('')}
        </div>
      </div>
    </div>

    <footer class="wrap">
      <p class="muted small">
        ${TEXT.login.footer}
        <a href="${href('rules')}">${TEXT.login.howItWorks}</a>
      </p>
    </footer>
  `;
}

function wireForm(users) {
  const form = document.getElementById('login-form');
  const emailInput = form.querySelector(`[data-testid="${TEST_IDS.loginEmail}"]`);
  const passwordInput = form.querySelector(`[data-testid="${TEST_IDS.loginPassword}"]`);
  const submitButton = form.querySelector(`[data-testid="${TEST_IDS.loginSubmit}"]`);
  const errorBox = form.querySelector(`[data-testid="${TEST_IDS.loginError}"]`);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    const result = await attemptLogin(emailInput.value, passwordInput.value);
    if (!result.ok) {
      errorBox.textContent = result.error;
      return;
    }
    const next = nextFromUrl();
    if (next) goToPath(next);
    else window.location.href = href('market');
  });

  for (const row of document.querySelectorAll(`[data-testid="${TEST_IDS.demoAccountRow}"]`)) {
    row.querySelector(`[data-testid="${TEST_IDS.demoAccountUse}"]`).addEventListener('click', () => {
      const email = row.getAttribute('data-email');
      const user = users.find((one) => one.email === email);
      emailInput.value = email;
      passwordInput.value = user ? user.password : '';
      errorBox.textContent = '';
      submitButton.focus();
    });
  }
}

function tickerItemHtml(symbol) {
  return `
    <span class="ticker-item" data-ticker="${symbol}">
      <span class="ticker-symbol">${symbol}</span>
      <span class="ticker-price"></span>
    </span>
  `;
}

async function startTicker() {
  const host = document.getElementById('login-ticker');
  let stocks;
  try {
    const response = await fetch('/data/stocks.json');
    if (!response.ok) throw new Error('no stocks');
    stocks = await response.json();
  } catch (error) {
    return; // The log in form still works without live prices.
  }

  const wanted = TICKER_SYMBOLS.map((symbol) => stocks.find((stock) => stock.symbol === symbol)).filter(Boolean);
  host.innerHTML = wanted.map((stock) => tickerItemHtml(stock.symbol)).join('');

  function refresh() {
    for (const stock of wanted) {
      const item = host.querySelector(`[data-ticker="${stock.symbol}"]`);
      const priceNode = item.querySelector('.ticker-price');
      const change = changeSinceOpen(stock);
      const cents = priceNowCents(stock);
      priceNode.setAttribute('data-cents', String(cents));
      priceNode.className = `ticker-price ${directionClass(change.cents)}`;
      priceNode.textContent = `${formatMoney(cents)} ${arrowFor(change.cents)}`.trim();
    }
  }

  refresh();
  window.setInterval(refresh, 5000);
}

async function start() {
  if (hasSession()) {
    window.location.replace(href('market'));
    return;
  }

  let users = [];
  try {
    users = await loadDemoUsers();
  } catch (error) {
    users = [];
  }

  render(users);
  wireForm(users);
  startTicker();
}

start();
