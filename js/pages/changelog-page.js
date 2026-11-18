// Changelog. Open to everyone, logged in or not.

import { TEXT } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { optionalSession } from '../app-session.js';
import { renderTopMenu, renderLoggedOutMenu } from '../top-menu.js';

function versionCardHtml(entry) {
  return `
      <div class="card stack-sm" data-testid="${TEST_IDS.changelogVersion}" data-version="${entry.version}">
        <h2 class="card-title">${entry.version} &middot; ${entry.title}</h2>
        <ul class="plain-list">
          ${entry.lines.map((line) => `<li class="muted">${line}</li>`).join('')}
        </ul>
      </div>
  `;
}

function pageHtml() {
  return `
    <div class="wrap stack">
      <h1>${TEXT.changelog.title}</h1>
      <p class="muted">${TEXT.changelog.intro}</p>
      ${TEXT.changelog.versions.map(versionCardHtml).join('')}
    </div>
  `;
}

async function start() {
  const session = await optionalSession();
  document.getElementById('page').innerHTML = pageHtml();

  if (session) renderTopMenu({ page: 'changelog', user: session.user, account: session.account });
  else renderLoggedOutMenu();
}

start();
