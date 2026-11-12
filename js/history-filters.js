// The wallet history filters and pages, and the same state in the URL.
// Nothing here touches the DOM, so the rules can be checked on their own.

import { dhakaDateKey } from './market-hours.js';

export const PAGE_SIZE = 10;
export const TYPE_VALUES = Object.freeze(['all', 'buy', 'sell', 'add']);
export const DEFAULT_STATE = Object.freeze({ type: 'all', from: '', to: '', page: 1 });

// "2026-11-09" and a real day in the calendar.
export function isDateText(value) {
  const text = String(value === undefined || value === null ? '' : value);
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(text)) return false;
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

// Anything the app doesn't understand quietly becomes the default.
export function cleanState(raw) {
  const type = TYPE_VALUES.includes(raw.type) ? raw.type : DEFAULT_STATE.type;
  const from = isDateText(raw.from) ? raw.from : DEFAULT_STATE.from;
  const to = isDateText(raw.to) ? raw.to : DEFAULT_STATE.to;
  const page = /^[0-9]+$/.test(String(raw.page || '')) && Number(raw.page) >= 1 ? Number(raw.page) : DEFAULT_STATE.page;
  return { type, from, to, page };
}

export function readState(search) {
  const query = new URLSearchParams(search === undefined ? window.location.search : search);
  return cleanState({
    type: query.get('type'),
    from: query.get('from'),
    to: query.get('to'),
    page: query.get('page'),
  });
}

// Only the parts that are not the default go in the URL.
export function stateParams(state) {
  return {
    type: state.type === DEFAULT_STATE.type ? '' : state.type,
    from: state.from,
    to: state.to,
    page: state.page > 1 ? String(state.page) : '',
  };
}

export function datesBackwards(state) {
  return state.from !== '' && state.to !== '' && state.from > state.to;
}

// The Dhaka day a history row happened on, as "2026-11-09".
export function dayOfEntry(entry) {
  const ms = typeof entry.time === 'number' ? entry.time : Date.parse(entry.time);
  return Number.isNaN(ms) ? '' : dhakaDateKey(ms);
}

// Newest first, like the table. Both dates count as inside the range.
export function filterRows(history, state) {
  return history
    .slice()
    .reverse()
    .filter((entry) => {
      if (state.type !== 'all' && entry.type !== state.type) return false;
      const day = dayOfEntry(entry);
      if (state.from !== '' && day < state.from) return false;
      if (state.to !== '' && day > state.to) return false;
      return true;
    });
}

export function pageCount(total) {
  return total <= PAGE_SIZE ? 1 : Math.ceil(total / PAGE_SIZE);
}

// One page of rows, plus everything the page controls need to say.
export function pageOf(rows, page) {
  const pages = pageCount(rows.length);
  const safePage = page >= 1 && page <= pages ? page : DEFAULT_STATE.page;
  const firstIndex = (safePage - 1) * PAGE_SIZE;
  const shown = rows.slice(firstIndex, firstIndex + PAGE_SIZE);
  return {
    rows: shown,
    page: safePage,
    pages,
    total: rows.length,
    start: rows.length === 0 ? 0 : firstIndex + 1,
    end: firstIndex + shown.length,
  };
}
