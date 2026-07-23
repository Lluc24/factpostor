// Declares the window globals set by js/data.bundle.js (generated from data/*.json
// by scripts/build-data.ts) and by src/i18n.ts / src/images.ts, so app.ts gets
// full type-checking against them without a module-loader/import graph at runtime.

import type { CategoriesData, FactItem, I18nStrings, NamedWikiItem } from './types.js';
import type { FactpostorI18nApi, FactpostorImagesApi } from './dom-types.js';

declare global {
    interface Window {
        I18N_STRINGS: I18nStrings;
        CATEGORIES: CategoriesData;
        CLASSIC_WORDS: NamedWikiItem[];
        FAMOUS_PEOPLE: NamedWikiItem[];
        FACTS_DATA: FactItem[];
        FactpostorI18n: FactpostorI18nApi;
        FactpostorImages: FactpostorImagesApi;
    }
}
