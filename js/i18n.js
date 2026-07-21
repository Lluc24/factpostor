// Lightweight i18n helper. Reads translation strings from window.I18N_STRINGS
// (generated into js/data.bundle.js from data/i18n.json by scripts/build-data.mjs).

(function () {
    const SUPPORTED = ['en', 'es', 'ca'];
    const STORAGE_KEY = 'fp_lang';

    function detectDefaultLang() {
        const nav = (navigator.language || 'en').toLowerCase();
        if (nav.startsWith('ca')) return 'ca';
        if (nav.startsWith('es')) return 'es';
        return 'en';
    }

    let currentLang = detectDefaultLang();
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED.includes(stored)) currentLang = stored;
    } catch (e) {
        // ignore
    }

    function setLang(lang) {
        if (!SUPPORTED.includes(lang)) return;
        currentLang = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
        document.documentElement.lang = lang;
    }

    function getLang() {
        return currentLang;
    }

    // Looks up a UI string by key from window.I18N_STRINGS, falling back to English then the key itself.
    function t(key) {
        const entry = window.I18N_STRINGS && window.I18N_STRINGS[key];
        if (!entry) return key;
        return entry[currentLang] || entry.en || key;
    }

    // Picks the current-language value out of a {en, es, ca} localized field.
    function localize(field) {
        if (!field) return '';
        return field[currentLang] || field.en || '';
    }

    document.documentElement.lang = currentLang;

    window.FactpostorI18n = { setLang, getLang, t, localize, SUPPORTED_LANGS: SUPPORTED };
})();
