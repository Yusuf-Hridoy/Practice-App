// Log in, log out and the page guard.

import {
  loadDemoUsers,
  findDemoUser,
  readSession,
  writeSession,
  clearSession,
  readAccount,
} from './account-storage.js';
import { href, replaceWith, isSafeNext, currentPathWithQuery, goToPath } from './app-links.js';
import { TEXT } from './ui-text.js';

export async function attemptLogin(emailRaw, passwordRaw) {
  const email = String(emailRaw || '').trim();
  const password = String(passwordRaw || '');

  if (email === '' || password === '') {
    return { ok: false, error: TEXT.login.missingFields };
  }

  const users = await loadDemoUsers();
  const user = findDemoUser(users, email);
  if (!user || user.password !== password) {
    return { ok: false, error: TEXT.login.wrongPair };
  }

  writeSession(user.email);
  readAccount(user.email, user.start);
  return { ok: true, user };
}

export function logout() {
  clearSession();
  replaceWith('login');
}

export function nextFromUrl() {
  const next = new URLSearchParams(window.location.search).get('next');
  return isSafeNext(next) ? next : null;
}

export function goAfterLogin() {
  const next = nextFromUrl();
  if (next) {
    goToPath(next);
    return;
  }
  window.location.href = href('market');
}

// Pages that need a session call this. It redirects to the log in page when
// there is no session, and comes back to this page after a good log in.
export async function requireSession() {
  const session = readSession();
  if (!session) {
    window.location.replace(href('login', { next: currentPathWithQuery() }));
    return null;
  }

  const users = await loadDemoUsers();
  const user = findDemoUser(users, session.email);
  if (!user) {
    clearSession();
    window.location.replace(href('login', { next: currentPathWithQuery() }));
    return null;
  }

  return { user, account: readAccount(user.email, user.start) };
}

// Pages that work logged out as well (the rules page) call this.
export async function optionalSession() {
  const session = readSession();
  if (!session) return null;
  const users = await loadDemoUsers();
  const user = findDemoUser(users, session.email);
  if (!user) {
    clearSession();
    return null;
  }
  return { user, account: readAccount(user.email, user.start) };
}

// Someone already logged in should not see the log in page.
export function hasSession() {
  return readSession() !== null;
}
