import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRound, computeImpostorCount, shuffled, type Rng } from '../src/round.js';
import type { FactItem, NamedWikiItem } from '../src/types.js';

// Small deterministic generator (mulberry32) so tests never flake.
function seeded(seed: number): Rng {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const name = (n: string) => ({ en: n, es: n, ca: n });
const facts: FactItem[] = [1, 2, 3].map((i) => ({ id: `f${i}`, subject: `s${i}`, text: name(`t${i}`) }));
const deck: NamedWikiItem[] = [
    { id: 'a', category: 'x', wikiTitle: 'A', name: name('A') },
    { id: 'b', category: 'x', wikiTitle: 'B', name: name('B') },
    { id: 'c', category: 'y', wikiTitle: 'C', name: name('C') },
    { id: 'd', category: 'z', wikiTitle: 'D', name: name('D') }
];
const players = ['ann', 'bob', 'cat', 'dan', 'eve'];

test('shuffled keeps every element and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffled(input, seeded(1));
    assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(input, [1, 2, 3, 4, 5, 6]);
});

test('shuffled is uniform over all permutations of 3 items', () => {
    const rng = seeded(42);
    const counts = new Map<string, number>();
    const runs = 60000;
    for (let i = 0; i < runs; i++) {
        const key = shuffled(['a', 'b', 'c'], rng).join('');
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    assert.equal(counts.size, 6);
    for (const n of counts.values()) {
        assert.ok(Math.abs(n - runs / 6) < runs * 0.01, `count ${n} too far from ${runs / 6}`);
    }
});

test('computeImpostorCount follows the auto ranges', () => {
    assert.equal(computeImpostorCount(3, 'auto', () => 0.99), 1);
    assert.equal(computeImpostorCount(4, 'auto', () => 0.99), 1);
    assert.equal(computeImpostorCount(5, 'auto', () => 0), 1);
    assert.equal(computeImpostorCount(7, 'auto', () => 0.99), 2);
    assert.equal(computeImpostorCount(8, 'auto', () => 0), 2);
    assert.equal(computeImpostorCount(12, 'auto', () => 0.99), 3);
});

test('computeImpostorCount leaves at least two citizens for fixed settings', () => {
    assert.equal(computeImpostorCount(3, '3'), 1);
    assert.equal(computeImpostorCount(4, '3'), 2);
    assert.equal(computeImpostorCount(6, '2'), 2);
    assert.equal(computeImpostorCount(10, '3'), 3);
});

test('facts round: impostors are blind, citizens get a fact', () => {
    const r = buildRound(
        { mode: 'facts', difficulty: 'blind', players, impostorCount: '2', facts, deck: null },
        seeded(7)
    );
    assert.equal(r.impostors.length, 2);
    assert.equal(r.secret, null);
    assert.ok(players.includes(r.startingPlayer));
    for (const p of players) {
        const isImp = r.impostors.includes(p);
        assert.equal(r.roles[p], isImp ? 'impostor' : 'citizen');
        assert.equal(r.content[p]?.type, isImp ? 'blind' : 'fact');
    }
});

test('facts round reuses facts when there are more citizens than facts', () => {
    const many = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
    const r = buildRound(
        { mode: 'facts', difficulty: 'blind', players: many, impostorCount: '1', facts, deck: null },
        seeded(3)
    );
    assert.equal(Object.values(r.content).filter((c) => c.type === 'fact').length, 7);
});

test('shared-secret round: citizens share one secret, difficulty shapes impostor hint', () => {
    for (const [difficulty, type] of [['blind', 'blind'], ['category', 'category'], ['related', 'related']] as const) {
        const r = buildRound(
            { mode: 'classic', difficulty, players, impostorCount: '1', facts, deck },
            seeded(11)
        );
        const secret = r.secret!;
        assert.ok(secret);
        const [imp] = r.impostors;
        assert.equal(r.content[imp!]?.type, type);
        for (const p of players.filter((x) => x !== imp)) {
            assert.deepEqual(r.content[p], { type: 'secret', item: secret });
        }
        const hint = r.content[imp!]!;
        if (hint.type === 'category') assert.equal(hint.category, secret.category);
        if (hint.type === 'related') assert.notEqual(hint.item.id, secret.id);
    }
});

test('related hint prefers the same category and falls back to the whole deck', () => {
    for (let seed = 0; seed < 50; seed++) {
        const r = buildRound(
            { mode: 'famous', difficulty: 'related', players, impostorCount: '1', facts, deck },
            seeded(seed)
        );
        const hint = r.content[r.impostors[0]!]!;
        assert.equal(hint.type, 'related');
        if (hint.type !== 'related') return;
        assert.notEqual(hint.item.id, r.secret!.id);
        if (r.secret!.category === 'x') assert.equal(hint.item.category, 'x');
    }
});
