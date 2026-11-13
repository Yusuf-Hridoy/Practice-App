// Draws the shared top menu.

import { TEXT } from './ui-text.js';
import { TEST_IDS } from './test-ids.js';
import { href } from './app-links.js';
import { formatMoney } from './money-format.js';
import { marketStatus } from './market-hours.js';
import { logout } from './app-session.js';
import { startAlertChecker } from './alert-checker.js';
import { startKeyboardShortcuts } from './keyboard-shortcuts.js';
import { readProfile } from './profile-storage.js';
import { initialsFrom } from './profile-rules.js';

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

export function marketStatusHtml() {
  const status = marketStatus();
  const className = status.open ? 'pill pill-open' : 'pill pill-closed';
  const label = status.open ? TEXT.menu.marketOpen : TEXT.menu.marketClosed;
  return `<span class="${className}" data-testid="${TEST_IDS.marketStatus}">${label}</span>`;
}

function menuLinkHtml(page, label, testId, currentPage) {
  const current = page === currentPage ? ' aria-current="page"' : '';
  return `<a class="menu-link" data-testid="${testId}" href="${href(page)}"${current}>${label}</a>`;
}

// The circle at the right of the menu: the photo when there is one,
// the initials from the display name when there isn't.
export function avatarHtml(profile, user, currentPage) {
  const name = profile.displayName.trim() === '' ? user.displayName : profile.displayName;
  const inside = profile.photoDataUrl
    ? `<img class="avatar-photo" src="${profile.photoDataUrl}" alt="">`
    : initialsFrom(name);
  const current = currentPage === 'profile' ? ' aria-current="page"' : '';
  return `
    <a class="initials" data-testid="${TEST_IDS.menuLinkProfile}" href="${href('profile')}"
       aria-label="${TEXT.menu.profile}" title="${name}"${current}>${inside}</a>
  `;
}

// page: "market" | "portfolio" | "wallet" | "rules" | "profile"
export function renderTopMenu({ page, user, account }) {
  const host = document.getElementById('top-menu');
  if (!host) return { setCash() {}, setProfile() {}, refreshStatus() {}, stop() {} };

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
        ${marketStatusHtml()}
        <a class="menu-cash" data-testid="${TEST_IDS.menuCash}" href="${href('wallet')}"
           data-cents="${account.cashCents}">
          <span class="label">${TEXT.menu.cash}</span>
          <span class="menu-cash-value">${formatMoney(account.cashCents)}</span>
        </a>
        ${avatarHtml(readProfile(user.email, user.profileStart), user, page)}
        <button type="button" class="btn btn-small" data-testid="${TEST_IDS.logoutButton}">
          ${TEXT.menu.logout}
        </button>
      </div>
    </div>
  `;

  const statusPill = host.querySelector(`[data-testid="${TEST_IDS.marketStatus}"]`);
  const avatarBox = host.querySelector(`[data-testid="${TEST_IDS.menuLinkProfile}"]`);
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
    // The Profile page calls this after a save, so the circle changes
    // without a page reload.
    setProfile(profile) {
      const name = profile.displayName.trim() === '' ? user.displayName : profile.displayName;
      avatarBox.title = name;
      avatarBox.innerHTML = profile.photoDataUrl
        ? `<img class="avatar-photo" src="${profile.photoDataUrl}" alt="">`
        : initialsFrom(name);
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
