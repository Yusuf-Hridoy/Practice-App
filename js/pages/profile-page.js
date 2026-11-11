// Profile page: photo, details form, sectors, email choices, account ID and theme.

import { TEXT, problemsMessage } from '../ui-text.js';
import { TEST_IDS } from '../test-ids.js';
import { requireSession } from '../app-session.js';
import { renderTopMenu } from '../top-menu.js';
import {
  readProfile,
  changeProfile,
  SECTORS,
  COUNTRIES,
} from '../profile-storage.js';
import {
  checkPhotoFiles,
  checkProfileForm,
  checkDisplayName,
  checkBirthDate,
  initialsFrom,
  maxBirthDate,
} from '../profile-rules.js';

let session = null;
let profile = null;
let menu = null;
let dirty = false;

const EMAIL_FIELDS = [
  { key: 'alerts', label: TEXT.profile.emailAlerts, testId: TEST_IDS.emailAlerts },
  { key: 'summary', label: TEXT.profile.emailSummary, testId: TEST_IDS.emailSummary },
  { key: 'news', label: TEXT.profile.emailNews, testId: TEST_IDS.emailNews },
];

const THEME_FIELDS = [
  { value: 'dark', label: TEXT.profile.themeDark, testId: TEST_IDS.themeDark },
  { value: 'light', label: TEXT.profile.themeLight, testId: TEST_IDS.themeLight },
  { value: 'device', label: TEXT.profile.themeDevice, testId: TEST_IDS.themeDevice },
];

// The three fields that can show an error, in the order they appear on the page.
const ERROR_FIELDS = [
  { name: 'displayName', inputId: TEST_IDS.displayName, errorId: TEST_IDS.displayNameError, describedBy: '' },
  { name: 'birthDate', inputId: TEST_IDS.birthDate, errorId: TEST_IDS.birthDateError, describedBy: '' },
  { name: 'sectors', inputId: TEST_IDS.sectors, errorId: TEST_IDS.sectorsError, describedBy: 'sectors-hint' },
];

function pick(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

// --- drawing the page ---

function countryOptionsHtml() {
  const first = `<option value="">${TEXT.profile.chooseCountry}</option>`;
  return first + COUNTRIES.map((country) => `<option value="${country}">${country}</option>`).join('');
}

function sectorOptionsHtml() {
  return SECTORS.map((sector) => `<option value="${sector}">${sector}</option>`).join('');
}

function emailCheckHtml(field) {
  return `
    <label class="check-row">
      <input type="checkbox" data-testid="${field.testId}">
      <span>${field.label}</span>
    </label>
  `;
}

function themeRadioHtml(field) {
  return `
    <label class="radio-button">
      <input type="radio" name="theme-choice" value="${field.value}" data-testid="${field.testId}">
      <span>${field.label}</span>
    </label>
  `;
}

function pageHtml(nowMs) {
  return `
    <div class="wrap stack">
      <h1>${TEXT.profile.title}</h1>
      <p class="muted">${TEXT.profile.intro}</p>

      <div class="profile-grid">
        <div class="stack">
          <div class="card stack-sm">
            <h2 class="card-title">${TEXT.profile.photoTitle}</h2>
            <div class="photo-preview" data-testid="${TEST_IDS.photoPreview}"></div>

            <div class="drop-zone" data-testid="${TEST_IDS.photoDropZone}">
              <p>${TEXT.profile.dropHere}</p>
              <div class="field">
                <label for="photo-input">${TEXT.profile.photoLabel}</label>
                <input type="file" id="photo-input" data-testid="${TEST_IDS.photoInput}"
                       accept="image/png,image/jpeg,image/webp" aria-describedby="photo-hint">
              </div>
              <p class="muted small" id="photo-hint">${TEXT.profile.photoHint}</p>
            </div>

            <div>
              <button type="button" class="btn btn-small" data-testid="${TEST_IDS.photoRemove}" hidden>
                ${TEXT.profile.removePhoto}
              </button>
            </div>
            <p class="ok-text" role="status" data-testid="${TEST_IDS.photoMessage}"></p>
          </div>

          <div class="card stack-sm">
            <h2 class="card-title">${TEXT.profile.accountTitle}</h2>
            <div class="label" id="account-id-label">${TEXT.profile.accountIdLabel}</div>
            <div class="account-id" data-testid="${TEST_IDS.accountId}" aria-labelledby="account-id-label"
                 tabindex="-1">${session.user.accountId}</div>
            <div>
              <button type="button" class="btn btn-small" data-testid="${TEST_IDS.copyAccountId}">
                ${TEXT.profile.copyAccountId}
              </button>
            </div>
            <p class="ok-text" role="status" data-testid="${TEST_IDS.copyStatus}"></p>
          </div>

          <div class="card">
            <fieldset class="plain-fieldset">
              <legend>${TEXT.profile.themeLegend}</legend>
              <div class="radio-row">${THEME_FIELDS.map(themeRadioHtml).join('')}</div>
            </fieldset>
          </div>
        </div>

        <div class="card stack-sm">
          <h2 class="card-title">${TEXT.profile.detailsTitle}</h2>
          <form class="stack-sm" data-testid="${TEST_IDS.profileForm}" novalidate>
            <div class="field">
              <label for="display-name-input">${TEXT.profile.displayNameLabel}</label>
              <input type="text" id="display-name-input" autocomplete="name" maxlength="60"
                     data-testid="${TEST_IDS.displayName}">
              <p class="field-error" id="display-name-error" data-testid="${TEST_IDS.displayNameError}"></p>
            </div>

            <div class="field">
              <label for="birth-date-input">${TEXT.profile.birthDateLabel}</label>
              <input type="date" id="birth-date-input" max="${maxBirthDate(nowMs)}"
                     data-testid="${TEST_IDS.birthDate}">
              <p class="field-error" id="birth-date-error" data-testid="${TEST_IDS.birthDateError}"></p>
            </div>

            <div class="field">
              <label for="country-input">${TEXT.profile.countryLabel}</label>
              <select id="country-input" data-testid="${TEST_IDS.country}">${countryOptionsHtml()}</select>
            </div>

            <div class="field">
              <label for="sectors-input">${TEXT.profile.sectorsLabel}</label>
              <select id="sectors-input" multiple size="${SECTORS.length}" data-testid="${TEST_IDS.sectors}"
                      aria-describedby="sectors-hint">${sectorOptionsHtml()}</select>
              <p class="muted small" id="sectors-hint">${TEXT.profile.sectorsHint}</p>
              <p class="field-error" id="sectors-error" data-testid="${TEST_IDS.sectorsError}"></p>
            </div>

            <fieldset class="plain-fieldset">
              <legend>${TEXT.profile.emailsLegend}</legend>
              <label class="check-row">
                <input type="checkbox" data-testid="${TEST_IDS.emailsAll}">
                <span>${TEXT.profile.selectAll}</span>
              </label>
              <div class="check-group">${EMAIL_FIELDS.map(emailCheckHtml).join('')}</div>
            </fieldset>

            <p class="error-text" role="alert" data-testid="${TEST_IDS.formErrorSummary}"></p>

            <div class="row">
              <span class="muted" data-testid="${TEST_IDS.unsavedChanges}" hidden>${TEXT.profile.unsaved}</span>
              <button type="button" class="btn btn-small" data-testid="${TEST_IDS.undoChanges}" hidden>
                ${TEXT.profile.undo}
              </button>
            </div>

            <div>
              <button type="submit" class="btn btn-accent" data-testid="${TEST_IDS.saveChanges}">
                ${TEXT.profile.save}
              </button>
            </div>

            <p class="up ok-text" role="status" data-testid="${TEST_IDS.saveMessage}"></p>
          </form>
        </div>
      </div>
    </div>
  `;
}

// --- the photo ---

function avatarInsideHtml(current) {
  const name = current.displayName.trim() === '' ? session.user.displayName : current.displayName;
  if (current.photoDataUrl) return `<img class="avatar-big" src="${current.photoDataUrl}" alt="">`;
  return `<span class="avatar-initials">${initialsFrom(name)}</span>`;
}

function drawPhoto() {
  pick(TEST_IDS.photoPreview).innerHTML = avatarInsideHtml(profile);
  pick(TEST_IDS.photoRemove).hidden = profile.photoDataUrl === null;
}

function sayPhoto(message, isError) {
  const line = pick(TEST_IDS.photoMessage);
  line.setAttribute('role', isError ? 'alert' : 'status');
  line.className = isError ? 'error-text' : 'ok-text up';
  line.textContent = message;
}

// A good photo is saved on its own, without the Save button.
function savePhoto(dataUrl, message) {
  const written = changeProfile(session.user.email, session.user.profileStart, (fresh) => ({
    ...fresh,
    photoDataUrl: dataUrl,
  }));

  if (!written.ok) {
    sayPhoto(TEXT.profile.photoSaveFailed, true);
    return;
  }

  profile = written.profile;
  drawPhoto();
  menu.setProfile(profile);
  sayPhoto(message, false);
}

function handlePhotoFiles(files) {
  const check = checkPhotoFiles(files);
  if (!check.ok) {
    if (check.error) sayPhoto(check.error, true);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    savePhoto(String(reader.result), TEXT.profile.photoSaved);
  });
  reader.addEventListener('error', () => {
    sayPhoto(TEXT.profile.photoReadFailed, true);
  });
  reader.readAsDataURL(check.file);
}

function wirePhoto() {
  const input = pick(TEST_IDS.photoInput);
  const zone = pick(TEST_IDS.photoDropZone);

  input.addEventListener('change', () => {
    handlePhotoFiles(input.files);
    input.value = ''; // So picking the same file again still counts as a change.
  });

  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('drop-zone-over');
  });

  zone.addEventListener('dragleave', (event) => {
    // Moving onto something inside the zone is still inside the zone.
    if (zone.contains(event.relatedTarget)) return;
    zone.classList.remove('drop-zone-over');
  });

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('drop-zone-over');
    handlePhotoFiles(event.dataTransfer ? event.dataTransfer.files : []);
  });

  pick(TEST_IDS.photoRemove).addEventListener('click', () => {
    savePhoto(null, TEXT.profile.photoRemoved);
  });
}

// --- the account ID ---

function selectAccountId() {
  const box = pick(TEST_IDS.accountId);
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(box);
  selection.removeAllRanges();
  selection.addRange(range);
}

function wireCopy() {
  const button = pick(TEST_IDS.copyAccountId);
  const status = pick(TEST_IDS.copyStatus);
  let backTimer = null;

  button.addEventListener('click', async () => {
    status.textContent = '';
    status.className = 'ok-text up';

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(session.user.accountId);
    } catch (error) {
      status.className = 'error-text';
      status.textContent = TEXT.profile.copyFailed;
      selectAccountId();
      return;
    }

    button.textContent = TEXT.profile.copied;
    status.textContent = TEXT.profile.copyDone;
    if (backTimer) window.clearTimeout(backTimer);
    backTimer = window.setTimeout(() => {
      button.textContent = TEXT.profile.copyAccountId;
      backTimer = null;
    }, 2000);
  });
}

// --- the theme ---

function drawTheme() {
  for (const field of THEME_FIELDS) pick(field.testId).checked = field.value === profile.theme;
}

function wireTheme() {
  for (const field of THEME_FIELDS) {
    pick(field.testId).addEventListener('change', (event) => {
      if (!event.target.checked) return;

      // Applied first, so the page changes even when saving is refused.
      window.TradeloomTheme.apply(field.value);
      const written = changeProfile(session.user.email, session.user.profileStart, (fresh) => ({
        ...fresh,
        theme: field.value,
      }));
      if (written.ok) profile = written.profile;
    });
  }
}

// --- the details form ---

// Sectors always come back in the order they are listed, so two equal
// picks always look equal.
function inOptionOrder(list) {
  return SECTORS.filter((sector) => list.includes(sector));
}

function savedState() {
  return {
    displayName: profile.displayName,
    birthDate: profile.birthDate,
    country: profile.country,
    sectors: inOptionOrder(profile.sectors),
    emails: { ...profile.emails },
  };
}

function formState() {
  const sectors = [...pick(TEST_IDS.sectors).selectedOptions].map((option) => option.value);
  const emails = {};
  for (const field of EMAIL_FIELDS) emails[field.key] = pick(field.testId).checked;

  return {
    displayName: pick(TEST_IDS.displayName).value,
    birthDate: pick(TEST_IDS.birthDate).value,
    country: pick(TEST_IDS.country).value,
    sectors: inOptionOrder(sectors),
    emails,
  };
}

function putSavedValuesInForm() {
  pick(TEST_IDS.displayName).value = profile.displayName;
  pick(TEST_IDS.birthDate).value = profile.birthDate;
  pick(TEST_IDS.country).value = COUNTRIES.includes(profile.country) ? profile.country : '';

  for (const option of pick(TEST_IDS.sectors).options) {
    option.selected = profile.sectors.includes(option.value);
  }
  for (const field of EMAIL_FIELDS) pick(field.testId).checked = profile.emails[field.key] === true;

  drawSelectAll();
}

function drawSelectAll() {
  const boxes = EMAIL_FIELDS.map((field) => pick(field.testId));
  const on = boxes.filter((box) => box.checked).length;
  const all = pick(TEST_IDS.emailsAll);
  all.checked = on === boxes.length;
  all.indeterminate = on > 0 && on < boxes.length;
}

function onBeforeUnload(event) {
  event.preventDefault();
  event.returnValue = '';
}

function setDirty(next) {
  dirty = next;
  pick(TEST_IDS.unsavedChanges).hidden = !dirty;
  pick(TEST_IDS.undoChanges).hidden = !dirty;

  if (dirty) window.addEventListener('beforeunload', onBeforeUnload);
  else window.removeEventListener('beforeunload', onBeforeUnload);
}

function refreshDirty() {
  setDirty(JSON.stringify(formState()) !== JSON.stringify(savedState()));
}

function showFieldError(field, message) {
  const input = pick(field.inputId);
  const errorLine = pick(field.errorId);

  errorLine.textContent = message || '';
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `${field.describedBy} ${field.errorId}`.trim());
  } else {
    input.removeAttribute('aria-invalid');
    if (field.describedBy) input.setAttribute('aria-describedby', field.describedBy);
    else input.removeAttribute('aria-describedby');
  }
}

function clearFormErrors() {
  for (const field of ERROR_FIELDS) showFieldError(field, '');
  pick(TEST_IDS.formErrorSummary).textContent = '';
}

function saveForm() {
  const message = pick(TEST_IDS.saveMessage);
  message.textContent = '';

  const state = formState();
  const checked = checkProfileForm(state);
  for (const field of ERROR_FIELDS) showFieldError(field, checked.errors[field.name]);

  if (!checked.ok) {
    pick(TEST_IDS.formErrorSummary).textContent = problemsMessage(checked.count);
    pick(ERROR_FIELDS.find((field) => field.name === checked.order[0]).inputId).focus();
    return;
  }

  pick(TEST_IDS.formErrorSummary).textContent = '';

  // The saved profile is read again first, so a second tab cannot be overwritten.
  // The photo and the theme are never touched by this form.
  const written = changeProfile(session.user.email, session.user.profileStart, (fresh) => ({
    ...fresh,
    displayName: checked.values.displayName,
    birthDate: checked.values.birthDate,
    country: checked.values.country,
    sectors: checked.values.sectors,
    emails: { ...state.emails },
  }));

  if (!written.ok) {
    pick(TEST_IDS.formErrorSummary).textContent = TEXT.profile.saveFailed;
    return;
  }

  profile = written.profile;
  putSavedValuesInForm();
  setDirty(false);
  menu.setProfile(profile);
  message.textContent = TEXT.profile.saved;
}

function undoChanges() {
  clearFormErrors();
  pick(TEST_IDS.saveMessage).textContent = '';
  putSavedValuesInForm();
  setDirty(false);
}

function wireForm() {
  const form = pick(TEST_IDS.profileForm);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveForm();
  });

  form.addEventListener('input', refreshDirty);
  form.addEventListener('change', refreshDirty);

  // The name and the date of birth are also checked when the person leaves the field.
  pick(TEST_IDS.displayName).addEventListener('blur', () => {
    const result = checkDisplayName(pick(TEST_IDS.displayName).value);
    showFieldError(ERROR_FIELDS[0], result.ok ? '' : result.error);
  });

  pick(TEST_IDS.birthDate).addEventListener('blur', () => {
    const result = checkBirthDate(pick(TEST_IDS.birthDate).value);
    showFieldError(ERROR_FIELDS[1], result.ok ? '' : result.error);
  });

  const all = pick(TEST_IDS.emailsAll);
  all.addEventListener('change', () => {
    // The three boxes have not changed yet, so they still say what was ticked
    // before the click. Fully ticked turns them all off, anything else turns them all on.
    const boxes = EMAIL_FIELDS.map((field) => pick(field.testId));
    const wasFull = boxes.every((box) => box.checked);
    for (const box of boxes) box.checked = !wasFull;
    drawSelectAll();
    refreshDirty();
  });

  for (const field of EMAIL_FIELDS) {
    pick(field.testId).addEventListener('change', drawSelectAll);
  }

  pick(TEST_IDS.undoChanges).addEventListener('click', undoChanges);
}

// --- start ---

async function start() {
  session = await requireSession();
  if (!session) return;

  profile = readProfile(session.user.email, session.user.profileStart);

  document.getElementById('page').innerHTML = pageHtml(Date.now());
  menu = renderTopMenu({ page: 'profile', user: session.user, account: session.account });

  drawPhoto();
  drawTheme();
  putSavedValuesInForm();
  setDirty(false);

  wirePhoto();
  wireCopy();
  wireTheme();
  wireForm();
}

start();
