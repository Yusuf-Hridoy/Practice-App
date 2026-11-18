// GET /api/health

import { openRequest, sendJson, APP_VERSION } from './_shared.js';

export default async function handler(req, res) {
  const open = await openRequest(req, res);
  if (!open) return;

  sendJson(res, 200, { status: 'ok', version: APP_VERSION });
}
