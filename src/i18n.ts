// Lightweight i18n helper. Reads translation strings from window.I18N_STRINGS
// (generated into js/data.bundle.js from data/i18n.json by scripts/build-data.ts).

import type { Lang, LocalizedString } from './types.js';
import type { FactpostorI18nApi } from './dom-types.js';

const SUPPORTED: readonly Lang[] = ['en', 'es', 'ca'];
const STORAGE_KEY = 'fp_lang';

function isSupportedLang(value: string): value is Lang {
    return (SUPPORTED as readonly string[]).includes(value);
}

function detectDefaultLang(): Lang {
    const nav = (navigator.language || 'en').toLowerCase();
    if (nav.startsWith('ca')) return 'ca';
    if (nav.startsWith('es')) return 'es';
    return 'en';
}

let currentLang: Lang = detectDefaultLang();
try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLang(stored)) currentLang = stored;
} catch {
    // ignore
}

function setLang(lang: string): void {
    if (!isSupportedLang(lang)) return;
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
}

function getLang(): Lang {
    return currentLang;
}

// Looks up a UI string by key from window.I18N_STRINGS, falling back to English then the key itself.
function t(key: string): string {
    const entry = window.I18N_STRINGS && window.I18N_STRINGS[key];
    if (!entry) return key;
    return entry[currentLang] || entry.en || key;
}

// Picks the current-language value out of a {en, es, ca} localized field.
function localize(field: LocalizedString | null | undefined): string {
    if (!field) return '';
    return field[currentLang] || field.en || '';
}

document.documentElement.lang = currentLang;

const FactpostorI18n: FactpostorI18nApi = { setLang, getLang, t, localize, SUPPORTED_LANGS: SUPPORTED };
window.FactpostorI18n = FactpostorI18n;
