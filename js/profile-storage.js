// Reads, writes and resets each user's profile in localStorage.
// Bad or missing data is replaced with the user's profileStart. It never crashes.
// Writing can fail when the browser's storage is full, so every write says
// whether it worked instead of throwing.

export const PROFILE_KEY_PREFIX = 'tradeloom.profile.';
export const MAX_PHOTO_BYTES = 1048576;
export const MAX_SECTORS = 3;

export const SECTORS = Object.freeze([
  'Energy',
  'Robotics',
  'Food',
  'Health',
  'Finance',
  'Games',
  'Farming',
  'Transport',
]);

export const COUNTRIES = Object.freeze([
  'Bangladesh',
  'Estonia',
  'Germany',
  'India',
  'Netherlands',
  'Poland',
  'Portugal',
  'United States',
  'Other',
]);

export const THEMES = Object.freeze(['dark', 'light', 'device']);
export const EMAIL_KEYS = Object.freeze(['alerts', 'summary', 'news']);

const memoryStore = new Map();

function readRaw(key) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? (memoryStore.has(key) ? memoryStore.get(key) : null) : value;
  } catch (error) {
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  }
}

// Returns false when the browser refused to save, for example when storage is full.
function writeRaw(key, value) {
  try {
    window.localStorage.setItem(key, value);
    memoryStore.set(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

export function profileKey(email) {
  return `${PROFILE_KEY_PREFIX}${email}`;
}

// --- checking saved data ---

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidEmails(emails) {
  if (!isPlainObject(emails)) return false;
  return EMAIL_KEYS.every((key) => typeof emails[key] === 'boolean');
}

function isValidSectors(sectors) {
  if (!Array.isArray(sectors)) return false;
  if (sectors.length > MAX_SECTORS) return false;
  if (new Set(sectors).size !== sectors.length) return false;
  return sectors.every((sector) => SECTORS.includes(sector));
}

export function isValidProfile(profile) {
  if (!isPlainObject(profile)) return false;
  if (profile.photoDataUrl !== null && typeof profile.photoDataUrl !== 'string') return false;
  if (typeof profile.displayName !== 'string') return false;
  if (typeof profile.birthDate !== 'string') return false;
  if (typeof profile.country !== 'string') return false;
  if (profile.country !== '' && !COUNTRIES.includes(profile.country)) return false;
  if (!isValidSectors(profile.sectors)) return false;
  if (!isValidEmails(profile.emails)) return false;
  if (!THEMES.includes(profile.theme)) return false;
  return true;
}

export function copyProfileStart(profileStart) {
  const start = profileStart || {
    photoDataUrl: null,
    displayName: '',
    birthDate: '',
    country: '',
    sectors: [],
    emails: { alerts: false, summary: false, news: false },
    theme: 'dark',
  };
  return JSON.parse(JSON.stringify(start));
}

// --- reading and writing ---

export function writeProfile(email, profile) {
  const ok = writeRaw(profileKey(email), JSON.stringify(profile));
  return ok ? { ok: true, profile } : { ok: false, profile };
}

export function resetProfile(email, profileStart) {
  return writeProfile(email, copyProfileStart(profileStart)).profile;
}

export function readProfile(email, profileStart) {
  const raw = readRaw(profileKey(email));
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isValidProfile(parsed)) return parsed;
    } catch (error) {
      // Bad JSON. Fall through to the start block.
    }
  }
  return resetProfile(email, profileStart);
}

// Every change reads the saved profile again first, so a second tab cannot be
// overwritten. The change function is given the fresh copy and returns the new one.
export function changeProfile(email, profileStart, change) {
  const fresh = readProfile(email, profileStart);
  const next = change(fresh);
  return writeProfile(email, next);
}
