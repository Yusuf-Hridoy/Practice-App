// GET /api/stocks

import { openRequest, sendJson, readStocks } from './_shared.js';

export default async function handler(req, res) {
  const open = await openRequest(req, res);
  if (!open) return;

  const list = readStocks().map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    about: stock.about,
  }));

  sendJson(res, 200, list);
}
