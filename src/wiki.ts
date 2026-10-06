import type { WikiImageResult } from './types.js';

// Pure helpers for the Wikipedia photo loader. No DOM, fetch or localStorage,
// so they can be tested.

export interface WikiSummaryResponse {
    type?: string;
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
}

// 'found'   - an image exists
// 'missing' - Wikipedia answered and has no usable image (safe to cache)
// 'error'   - network failure, rate limit or server error (never cache)
export type WikiLookup =
    | { status: 'found'; result: WikiImageResult }
    | { status: 'missing' }
    | { status: 'error' };

export function isHttpsUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}

export function wikiPageUrl(title: string): string {
    return 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_'));
}

export function parseWikiSummary(data: WikiSummaryResponse | null | undefined, wikiTitle: string): WikiLookup {
    const candidates = [data?.thumbnail?.source, data?.originalimage?.source];
    const imageUrl = candidates.find(isHttpsUrl);
    if (!imageUrl) return { status: 'missing' };
    const page = data?.content_urls?.desktop?.page;
    return { status: 'found', result: { imageUrl, pageUrl: isHttpsUrl(page) ? page : wikiPageUrl(wikiTitle) } };
}

// 404 means the article does not exist: a stable answer. Other non-OK codes
// (429, 5xx) are temporary.
export function lookupFromStatus(httpStatus: number): WikiLookup {
    return httpStatus === 404 ? { status: 'missing' } : { status: 'error' };
}

// Reads a localStorage value. '' is a cached "no image". Anything corrupt or
// pointing at a non-https URL counts as a cache miss (undefined) so it gets refetched.
export function parseCachedEntry(stored: string | null): WikiImageResult | null | undefined {
    if (stored === null) return undefined;
    if (stored === '') return null;
    try {
        const parsed = JSON.parse(stored) as Partial<WikiImageResult> | null;
        if (parsed && isHttpsUrl(parsed.imageUrl) && isHttpsUrl(parsed.pageUrl)) {
            return { imageUrl: parsed.imageUrl, pageUrl: parsed.pageUrl };
        }
    } catch {
        // fall through
    }
    return undefined;
}
