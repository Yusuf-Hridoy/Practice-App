// POST /api/login with JSON { email, password }
//
// The token is only for practice. Nothing in the app or the API checks it.

import {
  openRequest,
  sendJson,
  sendError,
  readDemoUsers,
  readJsonBody,
  makeToken,
} from './_shared.js';
import { TEXT } from '../js/ui-text.js';
import { findDemoUser } from '../js/account-storage.js';

export default async function handler(req, res) {
  const open = await openRequest(req, res, 'POST');
  if (!open) return;

  const body = await readJsonBody(req);
  const email = body && typeof body.email === 'string' ? body.email.trim() : '';
  const password = body && typeof body.password === 'string' ? body.password : '';

  if (email === '' || password === '') {
    sendError(res, 400, TEXT.api.loginFields);
    return;
  }

  const user = findDemoUser(readDemoUsers(), email);
  if (!user || user.password !== password) {
    sendError(res, 401, TEXT.login.wrongPair);
    return;
  }

  sendJson(res, 200, {
    email: user.email,
    displayName: user.displayName,
    token: makeToken(user.email),
  });
}
