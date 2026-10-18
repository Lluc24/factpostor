import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isHttpsUrl, lookupFromStatus, parseCachedEntry, parseWikiSummary } from '../src/wiki.js';

const IMG = 'https://upload.wikimedia.org/a.jpg';
const PAGE = 'https://en.wikipedia.org/wiki/Cat';

test('isHttpsUrl only accepts https', () => {
    assert.equal(isHttpsUrl(IMG), true);
    for (const bad of ['http://x.org/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AA', 'nope', '', 5, null, undefined]) {
        assert.equal(isHttpsUrl(bad), false, String(bad));
    }
});

test('parseWikiSummary prefers the thumbnail and uses the desktop page', () => {
    const r = parseWikiSummary(
        { thumbnail: { source: IMG }, originalimage: { source: 'https://x.org/o.jpg' }, content_urls: { desktop: { page: PAGE } } },
        'Cat'
    );
    assert.deepEqual(r, { status: 'found', result: { imageUrl: IMG, pageUrl: PAGE } });
});

test('parseWikiSummary falls back to originalimage and builds the page URL', () => {
    const r = parseWikiSummary({ originalimage: { source: IMG } }, 'Big Cat');
    assert.deepEqual(r, { status: 'found', result: { imageUrl: IMG, pageUrl: 'https://en.wikipedia.org/wiki/Big_Cat' } });
});

test('parseWikiSummary skips unsafe image URLs and replaces an unsafe page URL', () => {
    const r = parseWikiSummary(
        { thumbnail: { source: 'javascript:alert(1)' }, originalimage: { source: IMG }, content_urls: { desktop: { page: 'javascript:x' } } },
        'Cat'
    );
    assert.deepEqual(r, { status: 'found', result: { imageUrl: IMG, pageUrl: 'https://en.wikipedia.org/wiki/Cat' } });
});

test('parseWikiSummary reports missing when there is no usable image', () => {
    assert.deepEqual(parseWikiSummary({}, 'Cat'), { status: 'missing' });
    assert.deepEqual(parseWikiSummary(null, 'Cat'), { status: 'missing' });
    assert.deepEqual(parseWikiSummary({ thumbnail: { source: 'http://x.org/a.jpg' } }, 'Cat'), { status: 'missing' });
});

test('only a 404 counts as a stable "missing"; rate limits and server errors are retried later', () => {
    assert.deepEqual(lookupFromStatus(404), { status: 'missing' });
    for (const code of [429, 500, 502, 503]) assert.deepEqual(lookupFromStatus(code), { status: 'error' }, String(code));
});

test('parseCachedEntry distinguishes miss, cached-empty and hit', () => {
    assert.equal(parseCachedEntry(null), undefined);
    assert.equal(parseCachedEntry(''), null);
    assert.deepEqual(parseCachedEntry(JSON.stringify({ imageUrl: IMG, pageUrl: PAGE })), { imageUrl: IMG, pageUrl: PAGE });
});

test('parseCachedEntry treats corrupt or unsafe entries as a miss', () => {
    for (const bad of ['{', 'null', '{}', JSON.stringify({ imageUrl: IMG }), JSON.stringify({ imageUrl: IMG, pageUrl: 'javascript:x' })]) {
        assert.equal(parseCachedEntry(bad), undefined, bad);
    }
});
