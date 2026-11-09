// Rules page. Open to everyone, logged in or not.

import { TEXT } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { optionalSession } from '../app-session.js';
import { renderTopMenu, renderLoggedOutMenu } from '../top-menu.js';

function ruleCardHtml(card) {
  return `
    <div class="card stack-sm" data-testid="${TEST_IDS.rulesCard}" data-rule="${card.key}">
      <h2>${card.title}</h2>
      <p class="muted">${card.body}</p>
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
        <div class="dialog-row">
          <span><code>${TEXT.rules.switchName}</code></span>
          <span class="muted">${TEXT.rules.switchBody}</span>
        </div>
        <p class="muted small">${TEXT.rules.switchesNote}</p>
      </div>
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
