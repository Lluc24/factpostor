// Runtime photo loading via the Wikipedia REST API (free-licensed Wikimedia Commons images).
// No images are stored in this repo; everything is fetched live and cached in localStorage.
// Gracefully falls back to a placeholder if offline or if an article/image can't be found.

import type { WikiImageResult } from './types.js';
import type { FactpostorImagesApi } from './dom-types.js';

const WIKI_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const CACHE_PREFIX = 'fp_img_v1_';
const memoryCache: Record<string, WikiImageResult | null> = {};

interface WikiSummaryResponse {
    type?: string;
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
}

function wikiUrlFor(title: string): string {
    return WIKI_SUMMARY_BASE + encodeURIComponent(title.replace(/ /g, '_'));
}

async function fetchWikiImage(wikiTitle: string | null | undefined): Promise<WikiImageResult | null> {
    if (!wikiTitle) return null;
    if (Object.prototype.hasOwnProperty.call(memoryCache, wikiTitle)) {
        return memoryCache[wikiTitle] ?? null;
    }

    const storageKey = CACHE_PREFIX + wikiTitle;
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
            const parsed: WikiImageResult | null = stored === '' ? null : JSON.parse(stored);
            memoryCache[wikiTitle] = parsed;
            return parsed;
        }
    } catch {
        // localStorage unavailable (private browsing, etc.) — just skip caching
    }

    let result: WikiImageResult | null = null;
    try {
        const res = await fetch(wikiUrlFor(wikiTitle));
        if (res.ok) {
            const data: WikiSummaryResponse = await res.json();
            const imageUrl = data.thumbnail?.source || data.originalimage?.source || null;
            if (imageUrl) {
                const pageUrl = data.content_urls?.desktop?.page ||
                    ('https://en.wikipedia.org/wiki/' + encodeURIComponent(wikiTitle.replace(/ /g, '_')));
                result = { imageUrl, pageUrl };
            }
        }
    } catch {
        // Offline or blocked — fall through to null (placeholder shown instead)
    }

    memoryCache[wikiTitle] = result;
    try {
        localStorage.setItem(storageKey, result ? JSON.stringify(result) : '');
    } catch {
        // ignore quota/availability errors
    }
    return result;
}

// Builds a self-contained "photo card" DOM element that loads asynchronously
// and falls back to a placeholder icon if no image is available.
function createPhotoElement(
    wikiTitle: string | null | undefined,
    altText: string | null | undefined,
    viewSourceText: string | null | undefined,
    unavailableText: string | null | undefined
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo-card';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'photo-img-wrap loading';
    wrapper.appendChild(imgWrap);

    fetchWikiImage(wikiTitle).then((result) => {
        imgWrap.classList.remove('loading');

        if (result && result.imageUrl) {
            const img = document.createElement('img');
            img.src = result.imageUrl;
            img.alt = altText || '';
            img.loading = 'lazy';
            img.onerror = () => {
                imgWrap.innerHTML = '🖼️';
                imgWrap.classList.add('photo-fallback');
            };
            imgWrap.appendChild(img);

            const link = document.createElement('a');
            link.className = 'photo-source-link';
            link.href = result.pageUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = viewSourceText || 'View source';
            wrapper.appendChild(link);
        } else {
            imgWrap.textContent = '🖼️';
            imgWrap.classList.add('photo-fallback');

            const label = document.createElement('div');
            label.className = 'photo-unavailable-label';
            label.textContent = unavailableText || 'Photo unavailable';
            wrapper.appendChild(label);
        }
    });

    return wrapper;
}

const FactpostorImages: FactpostorImagesApi = { fetchWikiImage, createPhotoElement };
window.FactpostorImages = FactpostorImages;
