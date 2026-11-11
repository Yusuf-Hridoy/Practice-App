// Every profile check: the photo, the display name, the date of birth and the sectors.
// Nothing here touches the page or storage, so each rule can be checked on its own.
// Dates use Dhaka time, and every function takes an optional nowMs.

import { TEXT } from './ui-text.js';
import { dhakaParts, dhakaDateKey } from './market-hours.js';
import { MAX_PHOTO_BYTES, MAX_SECTORS, SECTORS } from './profile-storage.js';

export const PHOTO_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp']);
export const MIN_BIRTH_DATE = '1900-01-01';
export const MIN_AGE = 18;
export const NAME_PATTERN = /^[A-Za-z0-9 ]{2,30}$/;

// --- photo ---

// files is a FileList or an array. The checks run in this order on purpose.
export function checkPhotoFiles(files) {
  const list = files ? Array.from(files) : [];
  if (list.length > 1) return { ok: false, error: TEXT.profile.oneAtATime };
  if (list.length === 0) return { ok: false, error: null };

  const file = list[0];
  if (!PHOTO_TYPES.includes(file.type)) return { ok: false, error: TEXT.profile.wrongType };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: TEXT.profile.tooBig };
  return { ok: true, file };
}

// --- display name ---

export function checkDisplayName(raw) {
  const value = String(raw === undefined || raw === null ? '' : raw).trim();
  if (!NAME_PATTERN.test(value)) return { ok: false, value, error: TEXT.profile.displayNameError };
  return { ok: true, value, error: null };
}

// Two or more words use the first letter of the first two words.
// One word uses its first two letters. Always uppercase.
export function initialsFrom(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '');
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

// --- date of birth ---

// "YYYY-MM-DD" to { year, month, day }, or null when it is not a real date.
export function parseDateParts(value) {
  const text = String(value || '');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const made = new Date(Date.UTC(year, month - 1, day));
  if (made.getUTCFullYear() !== year || made.getUTCMonth() !== month - 1 || made.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

// The latest date of birth a date input should allow: today in Dhaka.
export function maxBirthDate(nowMs = Date.now()) {
  return dhakaDateKey(nowMs);
}

// Whole years old on today's Dhaka date. Turning 18 today gives 18.
export function ageOnDhakaToday(birthDate, nowMs = Date.now()) {
  const born = parseDateParts(birthDate);
  if (!born) return null;
  const today = dhakaParts(nowMs);

  let age = today.year - born.year;
  if (today.month < born.month || (today.month === born.month && today.day < born.day)) age -= 1;
  return age;
}

// An empty date of birth is allowed.
export function checkBirthDate(value, nowMs = Date.now()) {
  const text = String(value || '').trim();
  if (text === '') return { ok: true, value: '', error: null };

  const born = parseDateParts(text);
  if (!born) return { ok: false, value: text, error: TEXT.profile.birthDateNotReal };
  if (text < MIN_BIRTH_DATE) return { ok: false, value: text, error: TEXT.profile.birthDateNotReal };
  if (text > maxBirthDate(nowMs)) return { ok: false, value: text, error: TEXT.profile.birthDateFuture };
  if (ageOnDhakaToday(text, nowMs) < MIN_AGE) return { ok: false, value: text, error: TEXT.profile.birthDateYoung };
  return { ok: true, value: text, error: null };
}

// --- sectors ---

export function checkSectors(list) {
  const picked = Array.isArray(list) ? list.filter((sector) => SECTORS.includes(sector)) : [];
  if (picked.length > MAX_SECTORS) return { ok: false, value: picked, error: TEXT.profile.sectorsTooMany };
  return { ok: true, value: picked, error: null };
}

// --- the whole form ---

// Returns the cleaned values and, when something is wrong, one message per field
// plus the field order, so the page can focus the first field with a problem.
export function checkProfileForm(form, nowMs = Date.now()) {
  const name = checkDisplayName(form.displayName);
  const birth = checkBirthDate(form.birthDate, nowMs);
  const sectors = checkSectors(form.sectors);

  const errors = {};
  if (!name.ok) errors.displayName = name.error;
  if (!birth.ok) errors.birthDate = birth.error;
  if (!sectors.ok) errors.sectors = sectors.error;

  const order = ['displayName', 'birthDate', 'sectors'].filter((field) => errors[field]);

  return {
    ok: order.length === 0,
    errors,
    order,
    count: order.length,
    values: {
      displayName: name.value,
      birthDate: birth.value,
      country: String(form.country || ''),
      sectors: sectors.value,
    },
  };
}
