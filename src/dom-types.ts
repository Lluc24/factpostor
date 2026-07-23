// API types that reference the DOM lib (HTMLElement). Kept separate from
// types.ts so scripts/*.ts (which run under Node, without the DOM lib) can
// import the plain data types without pulling in browser globals.

import type { Lang, LocalizedString, WikiImageResult } from './types.js';

export interface FactpostorI18nApi {
    setLang(lang: string): void;
    getLang(): Lang;
    t(key: string): string;
    localize(field: LocalizedString | null | undefined): string;
    SUPPORTED_LANGS: readonly Lang[];
}

export interface FactpostorImagesApi {
    fetchWikiImage(wikiTitle: string | null | undefined): Promise<WikiImageResult | null>;
    createPhotoElement(
        wikiTitle: string | null | undefined,
        altText: string | null | undefined,
        viewSourceText: string | null | undefined,
        unavailableText: string | null | undefined
    ): HTMLElement;
}
