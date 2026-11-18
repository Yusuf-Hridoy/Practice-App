// GET /api/prices?seed=42&at=…

import { openRequest, sendJson, readStocks, priceRow } from './_shared.js';

export default async function handler(req, res) {
  const open = await openRequest(req, res);
  if (!open) return;

  sendJson(res, 200, readStocks().map((stock) => priceRow(stock, open.nowMs)));
}
