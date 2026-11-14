// News page: made-up headlines, 10 at a time, with filters and "Read more".
// The list only ever grows. Items already on the page are never rebuilt.

import { TEXT, newsCountText } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { href } from '../app-links.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import {
  loadNewsTemplates,
  newsPage,
  findNews,
  newsTimeText,
  newsTagText,
  NEWS_PAGE_SIZE,
  ALL_STOCKS,
  MARKET_TAG,
} from '../news-engine.js';

// How long the "Loading more news…" line shows before the next 10 arrive.
const LOAD_WAIT_MS = 1000;
const BACK_TO_TOP_AFTER_PX = 600;

let session = null;
let templates = [];
let symbols = [];

let activeStock = ALL_STOCKS;
let shownCount = 0;
let total = 0;
let loading = false;
let loadTimer = null;
let observer = null;

function pick(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

function listNode() {
  return document.getElementById('news-list');
}

function shellHtml() {
  return `
    <div class="wrap stack">
      <h1 id="news-heading" tabindex="-1">${TEXT.news.title}</h1>
      <p class="muted">${TEXT.news.intro}</p>

      <div class="row" role="group" aria-label="${TEXT.news.filtersLabel}" id="news-filters"></div>

      <p class="muted small" data-testid="${TEST_IDS.newsCount}"></p>

      <div class="news-list" id="news-list"></div>

      <p class="muted" role="status" data-testid="${TEST_IDS.newsLoading}" hidden>${TEXT.news.loading}</p>
      <p class="muted" data-testid="${TEST_IDS.newsEnd}" hidden>${TEXT.news.end}</p>

      <div id="news-sentinel" aria-hidden="true"></div>

      <div>
        <button type="button" class="btn back-to-top" data-testid="${TEST_IDS.newsBackToTop}" hidden>
          ${TEXT.news.backToTop}
        </button>
      </div>
    </div>
  `;
}

// --- the filters ---

function filterChoices() {
  return [{ value: ALL_STOCKS, label: TEXT.news.filterAll }]
    .concat(symbols.map((symbol) => ({ value: symbol, label: symbol })))
    .concat([{ value: MARKET_TAG, label: TEXT.news.filterMarket }]);
}

function drawFilters() {
  const host = document.getElementById('news-filters');
  if (host.children.length === 0) {
    host.innerHTML = filterChoices()
      .map(
        (choice) => `
          <button type="button" class="chip" data-testid="${TEST_IDS.newsFilter}"
                  data-stock="${choice.value}" aria-pressed="false">${choice.label}</button>
        `,
      )
      .join('');

    for (const button of host.querySelectorAll(`[data-testid="${TEST_IDS.newsFilter}"]`)) {
      button.addEventListener('click', () => setStock(button.getAttribute('data-stock'), true));
    }
  }

  for (const button of host.querySelectorAll(`[data-testid="${TEST_IDS.newsFilter}"]`)) {
    const on = button.getAttribute('data-stock') === activeStock;
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

// --- one headline ---

function itemHtml(item) {
  return `
    <article class="news-item" data-testid="${TEST_IDS.newsItem}" data-id="${item.id}" data-stock="${item.stock}">
      <span class="news-tag">${newsTagText(item.stock)}</span>
      <h2 class="news-item-headline" data-testid="${TEST_IDS.newsHeadline}" tabindex="-1">${item.headline}</h2>
      <p class="muted small" data-testid="${TEST_IDS.newsTime}">${newsTimeText(item.timeMs)}</p>
      <p class="news-summary" id="news-summary-${item.id}" data-testid="${TEST_IDS.newsSummary}" hidden>${item.summary}</p>
      <div>
        <button type="button" class="btn btn-small" data-testid="${TEST_IDS.newsReadMore}"
                aria-expanded="false" aria-controls="news-summary-${item.id}">${TEXT.news.readMore}</button>
      </div>
    </article>
  `;
}

function openItem(article, open) {
  const summary = article.querySelector(`[data-testid="${TEST_IDS.newsSummary}"]`);
  const button = article.querySelector(`[data-testid="${TEST_IDS.newsReadMore}"]`);
  summary.hidden = !open;
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  button.textContent = open ? TEXT.news.showLess : TEXT.news.readMore;
}

// New items are added to the end. The ones already there are left alone.
function appendItems(items) {
  const list = listNode();
  for (const item of items) {
    const holder = document.createElement('div');
    holder.innerHTML = itemHtml(item);
    const article = holder.firstElementChild;
    article
      .querySelector(`[data-testid="${TEST_IDS.newsReadMore}"]`)
      .addEventListener('click', (event) => {
        const open = event.currentTarget.getAttribute('aria-expanded') !== 'true';
        openItem(article, open);
      });
    list.append(article);
  }
}

// --- loading more ---

function drawCount() {
  pick(TEST_IDS.newsCount).textContent = newsCountText(shownCount, total);
}

function drawEnd() {
  const done = shownCount >= total;
  pick(TEST_IDS.newsEnd).hidden = !done;
}

function addNextPage() {
  const page = newsPage(templates, { stock: activeStock, start: shownCount, count: NEWS_PAGE_SIZE });
  total = page.total;
  appendItems(page.items);
  shownCount += page.items.length;

  pick(TEST_IDS.newsLoading).hidden = true;
  loading = false;
  loadTimer = null;

  drawCount();
  drawEnd();

  // Watching the marker again asks the browser whether it is still in view,
  // so a long screen keeps filling as someone scrolls.
  if (shownCount < total) watchSentinel();
}

function loadMore(wait) {
  if (loading || shownCount >= total) return;
  loading = true;

  if (!wait) {
    addNextPage();
    return;
  }

  pick(TEST_IDS.newsLoading).hidden = false;
  // setTimeout, so Playwright's Clock API can move it forward.
  loadTimer = window.setTimeout(addNextPage, LOAD_WAIT_MS);
}

function stopLoading() {
  if (loadTimer !== null) {
    window.clearTimeout(loadTimer);
    loadTimer = null;
  }
  loading = false;
  pick(TEST_IDS.newsLoading).hidden = true;
}

function watchSentinel() {
  const sentinel = document.getElementById('news-sentinel');
  if (observer === null) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) loadMore(true);
      }
    });
  }
  observer.unobserve(sentinel);
  observer.observe(sentinel);
}

// --- the filter in the URL ---

function urlForStock(value) {
  return href('news', { stock: value === ALL_STOCKS ? '' : value });
}

function stockFromUrl() {
  const wanted = (new URLSearchParams(window.location.search).get('stock') || '').trim().toUpperCase();
  const known = filterChoices().some((choice) => choice.value === wanted);
  return known ? wanted : ALL_STOCKS;
}

function setStock(value, push) {
  activeStock = value;
  stopLoading();
  listNode().innerHTML = '';
  shownCount = 0;
  total = newsPage(templates, { stock: value, start: 0, count: 0 }).total;

  drawFilters();
  drawCount();
  pick(TEST_IDS.newsEnd).hidden = true;
  loadMore(false);

  if (push) {
    const url = urlForStock(value);
    if (url !== window.location.pathname + window.location.search) {
      window.history.pushState({ stock: value }, '', url);
    }
  }
}

// --- one headline opened from a link ---

function focusFromUrl() {
  return (new URLSearchParams(window.location.search).get('focus') || '').trim();
}

// Keeps loading pages, without the wait, until the headline is on the page.
function openFocused(id) {
  if (id === '') return;

  // An id nobody knows, or one the filter leaves out, just leaves the normal
  // list alone. Nothing extra is loaded for it.
  const wanted = findNews(templates, id);
  if (!wanted) return;
  if (activeStock !== ALL_STOCKS && wanted.stock !== activeStock) return;

  let guard = 0;
  let article = listNode().querySelector(`[data-id="${id}"]`);
  while (!article && shownCount < total && guard < 100) {
    loadMore(false);
    article = listNode().querySelector(`[data-id="${id}"]`);
    guard += 1;
  }

  if (!article) return;

  openItem(article, true);
  article.scrollIntoView({ block: 'center' });
  article.querySelector(`[data-testid="${TEST_IDS.newsHeadline}"]`).focus();
}

// --- back to top ---

function wireBackToTop() {
  const button = pick(TEST_IDS.newsBackToTop);

  function draw() {
    button.hidden = window.scrollY <= BACK_TO_TOP_AFTER_PX;
  }

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0 });
    document.getElementById('news-heading').focus();
  });

  window.addEventListener('scroll', draw, { passive: true });
  draw();
}

// --- start ---

async function loadSymbols() {
  try {
    const response = await fetch('/data/stocks.json');
    if (!response.ok) throw new Error('Could not load stocks');
    const stocks = await response.json();
    return stocks.map((stock) => stock.symbol);
  } catch (error) {
    // The headlines already say which stock they belong to.
    const seen = [];
    for (const item of templates) {
      if (item.stock !== MARKET_TAG && !seen.includes(item.stock)) seen.push(item.stock);
    }
    return seen;
  }
}

async function start() {
  session = await requireSession();
  if (!session) return;

  document.getElementById('page').innerHTML = shellHtml();
  renderTopMenu({ page: 'news', user: session.user, account: session.account });

  try {
    templates = await loadNewsTemplates();
  } catch (error) {
    templates = [];
  }
  symbols = await loadSymbols();

  activeStock = stockFromUrl();
  setStock(activeStock, false);
  openFocused(focusFromUrl());
  watchSentinel();
  wireBackToTop();

  window.addEventListener('popstate', () => {
    setStock(stockFromUrl(), false);
    watchSentinel();
  });
}

start();
