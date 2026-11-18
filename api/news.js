// GET /api/news?seed=42&at=…&stock=KRYL&limit=10&offset=0

import {
  openRequest,
  sendJson,
  sendError,
  readNewsTemplates,
  readWholeNumber,
  NEWS_LIMIT_DEFAULT,
  NEWS_LIMIT_MIN,
  NEWS_LIMIT_MAX,
} from './_shared.js';
import { TEXT } from '../js/ui-text.js';
import { newsPage, ALL_STOCKS } from '../js/news-engine.js';
import { dhakaIsoString } from '../js/market-hours.js';

export default async function handler(req, res) {
  const open = await openRequest(req, res);
  if (!open) return;

  const limit = readWholeNumber(open.params, 'limit', NEWS_LIMIT_DEFAULT);
  if (!limit.ok || limit.value < NEWS_LIMIT_MIN || limit.value > NEWS_LIMIT_MAX) {
    sendError(res, 400, TEXT.api.badLimit);
    return;
  }

  const offset = readWholeNumber(open.params, 'offset', 0);
  if (!offset.ok) {
    sendError(res, 400, TEXT.api.badOffset);
    return;
  }

  const stock = (open.params.get('stock') || '').trim().toUpperCase() || ALL_STOCKS;
  const page = newsPage(
    readNewsTemplates(),
    { stock, start: offset.value, count: limit.value },
    open.nowMs,
  );

  sendJson(res, 200, {
    total: page.total,
    items: page.items.map((item) => ({
      id: item.id,
      stock: item.stock,
      headline: item.headline,
      summary: item.summary,
      time: dhakaIsoString(item.timeMs),
    })),
  });
}
