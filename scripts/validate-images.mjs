#!/usr/bin/env node
// Verifies every wikiTitle referenced by the game's data files resolves to a
// real Wikipedia article with a usable photo, via the same public REST API
// the deployed game uses at runtime:
//   https://en.wikipedia.org/api/rest_v1/page/summary/<title>
//
// This has to run somewhere with real internet access to en.wikipedia.org.
// It is intentionally run in GitHub Actions (see .github/workflows/validate-data.yml)
// rather than expected to pass in every local/sandboxed dev environment.
//
// Usage: node scripts/validate-images.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'data');

function readJson(name) {
    return JSON.parse(readFileSync(join(dataDir, name), 'utf-8'));
}

const classicWords = readJson('classic-words.json');
const famousPeople = readJson('famous-people.json');
const facts = readJson('facts.json');
const categories = readJson('categories.json');

// Collect every (source, wikiTitle) pair we need to check.
const checks = [];
for (const item of classicWords) checks.push({ source: `classic-words:${item.id}`, title: item.wikiTitle });
for (const item of famousPeople) checks.push({ source: `famous-people:${item.id}`, title: item.wikiTitle });
for (const item of facts) checks.push({ source: `facts:${item.id}`, title: item.subject });
for (const [modeName, cats] of Object.entries(categories)) {
    for (const [catId, cat] of Object.entries(cats)) {
        checks.push({ source: `categories.${modeName}:${catId}`, title: cat.wikiTitle });
    }
}

const USER_AGENT = 'Factpostor-DataValidator/1.0 (https://github.com/Lluc24/factpostor; party-game data QA script)';
const CONCURRENCY = 3;
const MAX_RETRIES = 5;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkOne({ source, title }) {
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_'));

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });

            if (res.status === 429) {
                const retryAfter = Number(res.headers.get('retry-after')) || 0;
                const backoffMs = Math.max(retryAfter * 1000, 500 * 2 ** attempt);
                await sleep(backoffMs);
                continue; // retry
            }
            if (res.status === 404) {
                return { source, title, level: 'ERROR', reason: 'Article not found (404)' };
            }
            if (!res.ok) {
                return { source, title, level: 'ERROR', reason: `HTTP ${res.status}` };
            }
            const data = await res.json();
            if (data.type === 'disambiguation') {
                return { source, title, level: 'ERROR', reason: 'Resolves to a disambiguation page' };
            }
            const hasImage = !!(data.thumbnail && data.thumbnail.source) || !!(data.originalimage && data.originalimage.source);
            if (!hasImage) {
                return { source, title, level: 'WARN', reason: 'Article exists but has no lead image' };
            }
            return null;
        } catch (e) {
            if (attempt === MAX_RETRIES) {
                return { source, title, level: 'ERROR', reason: `Fetch failed: ${e.message}` };
            }
            await sleep(500 * 2 ** attempt);
        }
    }

    return { source, title, level: 'ERROR', reason: 'Repeatedly rate-limited (429) after retries' };
}

async function runPool(items, worker, concurrency) {
    const results = [];
    let index = 0;
    async function next() {
        while (index < items.length) {
            const i = index++;
            results[i] = await worker(items[i]);
            await sleep(120); // stay well under Wikimedia's anonymous rate limits
        }
    }
    await Promise.all(Array.from({ length: concurrency }, next));
    return results;
}

console.log(`Checking ${checks.length} Wikipedia titles (concurrency ${CONCURRENCY})...`);
const results = (await runPool(checks, checkOne, CONCURRENCY)).filter(Boolean);

const errors = results.filter(r => r.level === 'ERROR');
const warnings = results.filter(r => r.level === 'WARN');

if (warnings.length) {
    console.log(`\n--- ${warnings.length} WARNING(S) (article exists, no image — fallback UI will show) ---`);
    for (const w of warnings) console.log(`  [WARN] ${w.source} -> "${w.title}": ${w.reason}`);
}

if (errors.length) {
    console.log(`\n--- ${errors.length} ERROR(S) (bad/missing article — must fix) ---`);
    for (const e of errors) console.log(`  [ERROR] ${e.source} -> "${e.title}": ${e.reason}`);
    console.log(`\nFAILED: ${errors.length} broken wikiTitle reference(s) found.`);
    process.exit(1);
}

console.log(`\nOK: all ${checks.length} wikiTitle references resolve to real articles (${warnings.length} without images).`);
