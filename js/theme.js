// Dark, Light or Match my device, on every page.
//
// This is a plain script, not a module, and it is loaded in the <head> of every
// page. It runs before the body is drawn, so the page never flashes the wrong
// colors. Being a plain script it cannot import the storage modules, so the two
// localStorage key names below are repeated here. They must match
// js/account-storage.js (SESSION_KEY) and js/profile-storage.js (PROFILE_KEY_PREFIX).

(function () {
  var SESSION_KEY = 'tradeloom.session';
  var PROFILE_KEY_PREFIX = 'tradeloom.profile.';
  var CHOICES = ['dark', 'light', 'device'];
  var DEFAULT_CHOICE = 'dark';

  var choice = DEFAULT_CHOICE;
  var query = null;

  function lightQuery() {
    if (query === null && window.matchMedia) query = window.matchMedia('(prefers-color-scheme: light)');
    return query;
  }

  function readJson(key) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  // The theme saved for whoever is logged in. With no session, or no saved
  // theme, everyone gets the dark theme.
  function savedChoice() {
    var session = readJson(SESSION_KEY);
    if (!session || typeof session.email !== 'string') return DEFAULT_CHOICE;

    var profile = readJson(PROFILE_KEY_PREFIX + session.email);
    if (!profile || CHOICES.indexOf(profile.theme) === -1) return DEFAULT_CHOICE;
    return profile.theme;
  }

  // "dark" or "light": what Match my device turns into right now.
  function resolve(value) {
    if (value === 'light') return 'light';
    if (value === 'device') {
      var media = lightQuery();
      return media && media.matches ? 'light' : 'dark';
    }
    return 'dark';
  }

  function paint() {
    document.documentElement.setAttribute('data-theme', resolve(choice));
  }

  // Applies a choice right away, with no page reload. Saving it is the
  // profile page's job.
  function apply(value) {
    choice = CHOICES.indexOf(value) === -1 ? DEFAULT_CHOICE : value;
    paint();
    return choice;
  }

  // Reads the saved theme again and applies it. Used after logging in,
  // and after Start over puts the profile back to its start.
  function applySaved() {
    return apply(savedChoice());
  }

  // Match my device follows the device setting while the page is open.
  var media = lightQuery();
  if (media) {
    var onDeviceChange = function () {
      if (choice === 'device') paint();
    };
    if (media.addEventListener) media.addEventListener('change', onDeviceChange);
    else if (media.addListener) media.addListener(onDeviceChange);
  }

  window.TradeloomTheme = {
    CHOICES: CHOICES,
    DEFAULT_CHOICE: DEFAULT_CHOICE,
    apply: apply,
    applySaved: applySaved,
    savedChoice: savedChoice,
    resolve: resolve,
    current: function () {
      return choice;
    },
  };

  applySaved();
})();
