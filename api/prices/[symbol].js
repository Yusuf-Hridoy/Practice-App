// GET /api/prices/KRYL?seed=42&at=…

import { openRequest, sendJson, sendError, readStocks, priceRow, requestUrl } from '../_shared.js';
import { stockMissingMessage } from '../../js/ui-text.js';

// Vercel hands the part of the address in square brackets over in req.query.
// The address itself is read as well, so the file also works on its own.
function symbolFrom(req) {
  const fromQuery = req.query && req.query.symbol;
  if (typeof fromQuery === 'string' && fromQuery.trim() !== '') return fromQuery.trim();

  const parts = requestUrl(req).pathname.split('/').filter((part) => part !== '');
  return parts.length === 0 ? '' : decodeURIComponent(parts[parts.length - 1]);
}

export default async function handler(req, res) {
  const open = await openRequest(req, res);
  if (!open) return;

  const wanted = symbolFrom(req).toUpperCase();
  const stock = readStocks().find((one) => one.symbol === wanted) || null;

  if (!stock) {
    sendError(res, 404, stockMissingMessage(wanted));
    return;
  }

  sendJson(res, 200, priceRow(stock, open.nowMs));
}
