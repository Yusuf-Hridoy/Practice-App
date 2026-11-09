// Draws the shared top menu.

import { TEXT } from './ui-text.js';
import { TEST_IDS } from './test-ids.js';
import { href } from './app-links.js';
import { formatMoney } from './money-format.js';
import { marketStatus } from './market-hours.js';
import { logout } from './app-session.js';
import { startAlertChecker } from './alert-checker.js';
import { startKeyboardShortcuts } from './keyboard-shortcuts.js';

export function logoHtml(linkTo = 'market') {
  return `
    <a class="logo" href="${href(linkTo)}">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="M3 17l6-6 4 4 8-8"></path>
        <path d="M15 7h6v6"></path>
      </svg>
      <span class="logo-word">${TEXT.brand}</span>
    </a>
  `;
}

export function marketStatusHtml(nowMs = Date.now()) {
  const status = marketStatus(nowMs);
  const className = status.open ? 'pill pill-open' : 'pill pill-closed';
  const label = status.open ? TEXT.menu.marketOpen : TEXT.menu.marketClosed;
  return `<span class="${className}" data-testid="${TEST_IDS.marketStatus}">${label}</span>`;
}

function menuLinkHtml(page, label, testId, currentPage) {
  const current = page === currentPage ? ' aria-current="page"' : '';
  return `<a class="menu-link" data-testid="${testId}" href="${href(page)}"${current}>${label}</a>`;
}

// page: "market" | "portfolio" | "wallet" | "rules"
export function renderTopMenu({ page, user, account, nowMs = Date.now() }) {
  const host = document.getElementById('top-menu');
  if (!host) return { setCash() {}, stop() {} };

  host.className = 'top-menu';
  host.setAttribute('data-testid', TEST_IDS.topMenu);
  host.innerHTML = `
    <div class="top-menu-inner">
      <div class="menu-left">
        ${logoHtml('market')}
        <nav class="menu-left" aria-label="${TEXT.menu.navLabel}">
          ${menuLinkHtml('market', TEXT.menu.market, TEST_IDS.menuLinkMarket, page)}
          ${menuLinkHtml('portfolio', TEXT.menu.portfolio, TEST_IDS.menuLinkPortfolio, page)}
          ${menuLinkHtml('watchlist', TEXT.menu.watchlist, TEST_IDS.menuLinkWatchlist, page)}
          ${menuLinkHtml('wallet', TEXT.menu.wallet, TEST_IDS.menuLinkWallet, page)}
          ${menuLinkHtml('rules', TEXT.menu.rules, TEST_IDS.menuLinkRules, page)}
        </nav>
      </div>
      <div class="menu-right">
        ${marketStatusHtml(nowMs)}
        <a class="menu-cash" data-testid="${TEST_IDS.menuCash}" href="${href('wallet')}"
           data-cents="${account.cashCents}">
          <span class="label">${TEXT.menu.cash}</span>
          <span class="menu-cash-value">${formatMoney(account.cashCents)}</span>
        </a>
        <span class="initials" title="${user.displayName}">${user.initials}</span>
        <button type="button" class="btn btn-small" data-testid="${TEST_IDS.logoutButton}">
          ${TEXT.menu.logout}
        </button>
      </div>
    </div>
  `;

  const statusPill = host.querySelector(`[data-testid="${TEST_IDS.marketStatus}"]`);
  const cashBox = host.querySelector(`[data-testid="${TEST_IDS.menuCash}"]`);
  const cashValue = cashBox.querySelector('.menu-cash-value');

  host.querySelector(`[data-testid="${TEST_IDS.logoutButton}"]`).addEventListener('click', () => {
    logout();
  });

  function refreshStatus() {
    const status = marketStatus();
    statusPill.className = status.open ? 'pill pill-open' : 'pill pill-closed';
    statusPill.textContent = status.open ? TEXT.menu.marketOpen : TEXT.menu.marketClosed;
  }

  const timer = window.setInterval(refreshStatus, 5000);

  // Price alerts and the keyboard shortcuts run on every logged-in page.
  startAlertChecker(user);
  startKeyboardShortcuts(page);

  return {
    setCash(cents) {
      cashBox.setAttribute('data-cents', String(cents));
      cashValue.textContent = formatMoney(cents);
    },
    refreshStatus,
    stop() {
      window.clearInterval(timer);
    },
  };
}

// The rules page is open to everyone, so it has a smaller menu when logged out.
export function renderLoggedOutMenu() {
  const host = document.getElementById('top-menu');
  if (!host) return;
  host.className = 'top-menu';
  host.innerHTML = `
    <div class="top-menu-inner">
      <div class="menu-left">${logoHtml('login')}</div>
      <div class="menu-right">
        <a class="btn btn-small" href="${href('login')}">${TEXT.common.login}</a>
      </div>
    </div>
  `;
}
