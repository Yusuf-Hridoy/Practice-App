// The <tradeloom-news> box on the market page.
// Everything it shows lives inside an open shadow root, including its own
// styles. Colors come from the page's CSS variables, which pass through the
// shadow boundary. Playwright's getByTestId reaches into an open shadow root,
// so the test ids inside still work.

import { TEXT } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { href } from '../app-links.js';
import { loadNewsTemplates, newestNews, newsTimeText, newsTagText } from '../news-engine.js';

export const NEWS_BOX_TAG = 'tradeloom-news';
export const NEWS_BOX_KEY_PREFIX = 'tradeloom.newsbox.';
export const NEWS_BOX_COUNT = 3;

export function newsBoxKey(email) {
  return `${NEWS_BOX_KEY_PREFIX}${email}`;
}

// Storage can be blocked. The box still works, it just forgets.
export function readNewsBoxShown(email) {
  try {
    return window.localStorage.getItem(newsBoxKey(email)) !== 'hidden';
  } catch (error) {
    return true;
  }
}

export function writeNewsBoxShown(email, shown) {
  try {
    window.localStorage.setItem(newsBoxKey(email), shown ? 'shown' : 'hidden');
  } catch (error) {
    // Nothing to do. The box keeps working for this page.
  }
}

const STYLE_TEXT = `
  :host {
    display: block;
  }
  .news-box {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    color: var(--text);
    padding: 16px;
    display: grid;
    gap: 12px;
    font-family: inherit;
    font-size: 15px;
    line-height: 1.5;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  button {
    min-height: 36px;
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface-raised);
    color: var(--text);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  button:hover { border-color: var(--accent); }
  button:focus-visible,
  a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  li {
    display: grid;
    gap: 4px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-soft);
  }
  li:last-child { padding-bottom: 0; border-bottom: none; }
  .tag {
    justify-self: start;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .time { color: var(--text-muted); font-size: 13px; }
  .all { font-size: 14px; }
`;

function tagElement(doc, stock) {
  const tag = doc.createElement('span');
  tag.className = 'tag';
  tag.textContent = newsTagText(stock);
  return tag;
}

class NewsBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.items = [];
    this.shown = true;
    this.email = '';
  }

  connectedCallback() {
    if (this.built) return;
    this.built = true;
    this.email = this.getAttribute('email') || '';
    this.shown = readNewsBoxShown(this.email);
    this.build();

    loadNewsTemplates()
      .then((templates) => {
        this.items = newestNews(templates, NEWS_BOX_COUNT);
        this.drawBody();
      })
      .catch(() => {
        // Without the headlines the box stays empty. The page still works.
      });
  }

  build() {
    const style = document.createElement('style');
    style.textContent = STYLE_TEXT;

    const box = document.createElement('section');
    box.className = 'news-box';
    box.setAttribute('data-testid', TEST_IDS.newsBox);

    const head = document.createElement('div');
    head.className = 'head';

    const heading = document.createElement('h2');
    heading.textContent = TEXT.news.boxTitle;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.setAttribute('data-testid', TEST_IDS.newsBoxToggle);
    toggle.addEventListener('click', () => this.setShown(!this.shown));

    head.append(heading, toggle);
    box.append(head);

    this.shadowRoot.append(style, box);
    this.box = box;
    this.toggle = toggle;
    this.drawBody();
  }

  setShown(shown) {
    this.shown = shown;
    writeNewsBoxShown(this.email, shown);
    this.drawBody();
  }

  // When the box is hidden, only the heading and the Show button stay.
  drawBody() {
    this.toggle.textContent = this.shown ? TEXT.news.hide : TEXT.news.show;
    this.toggle.setAttribute('aria-expanded', this.shown ? 'true' : 'false');

    if (this.body) {
      this.body.remove();
      this.body = null;
    }
    if (!this.shown) return;

    const doc = document;
    const body = doc.createElement('div');

    const list = doc.createElement('ul');
    for (const item of this.items) {
      const row = doc.createElement('li');
      row.setAttribute('data-testid', TEST_IDS.newsBoxItem);
      row.setAttribute('data-id', item.id);
      row.setAttribute('data-stock', item.stock);

      const link = doc.createElement('a');
      link.setAttribute('data-testid', TEST_IDS.newsBoxLink);
      link.href = href('news', { focus: item.id });
      link.textContent = item.headline;

      const time = doc.createElement('span');
      time.className = 'time';
      time.textContent = newsTimeText(item.timeMs);

      row.append(tagElement(doc, item.stock), link, time);
      list.append(row);
    }

    const all = doc.createElement('a');
    all.className = 'all';
    all.setAttribute('data-testid', TEST_IDS.newsBoxAll);
    all.href = href('news');
    all.textContent = TEXT.news.seeAll;

    body.append(list, all);
    this.box.append(body);
    this.body = body;
  }
}

if (!customElements.get(NEWS_BOX_TAG)) customElements.define(NEWS_BOX_TAG, NewsBox);

export { NewsBox };
