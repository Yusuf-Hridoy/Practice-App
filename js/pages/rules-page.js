// Rules page. Open to everyone, logged in or not.

import { TEXT } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { optionalSession } from '../app-session.js';
import { renderTopMenu, renderLoggedOutMenu } from '../top-menu.js';
import { href } from '../app-links.js';

function ruleCardHtml(card) {
  return `
    <div class="card stack-sm" data-testid="${TEST_IDS.rulesCard}" data-rule="${card.key}">
      <h2>${card.title}</h2>
      <p class="muted">${card.body}</p>
    </div>
  `;
}

function switchRowHtml(row) {
  return `
        <div class="dialog-row">
          <span><code>${row.name}</code></span>
          <span class="muted">${row.body}</span>
        </div>
  `;
}

function pageHtml() {
  return `
    <div class="wrap stack">
      <h1>${TEXT.rules.title}</h1>
      <p class="muted">${TEXT.rules.intro}</p>

      <div class="grid-3">
        ${TEXT.rules.cards.map(ruleCardHtml).join('')}
      </div>

      <div class="card stack-sm" data-testid="${TEST_IDS.rulesCard}" data-rule="test-switches">
        <h2>${TEXT.rules.switchesTitle}</h2>
        ${TEXT.rules.switchList.map(switchRowHtml).join('')}
        <p class="muted small">${TEXT.rules.switchesNote}</p>
        <p>
          <a class="btn btn-small" data-testid="${TEST_IDS.rulesSwitchesLink}" href="${href('switches')}">
            ${TEXT.rules.switchesLink}
          </a>
        </p>
      </div>

      <p class="muted small">
        <a data-testid="${TEST_IDS.versionLink}" href="${href('changelog')}">${TEXT.changelog.versionLabel}</a>
      </p>
    </div>
  `;
}

async function start() {
  const session = await optionalSession();
  document.getElementById('page').innerHTML = pageHtml();

  if (session) renderTopMenu({ page: 'rules', user: session.user, account: session.account });
  else renderLoggedOutMenu();
}

start();
