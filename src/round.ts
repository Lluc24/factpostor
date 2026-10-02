import type {
    Difficulty,
    FactItem,
    GameMode,
    ImpostorCountSetting,
    NamedWikiItem,
    RoundData
} from './types.js';

// Pure round-setup logic. No DOM and no globals, so it can be tested.
// Every random choice goes through an Rng (a function returning [0, 1)).

export type Rng = () => number;

export function randomInt(rng: Rng, maxExclusive: number): number {
    return Math.floor(rng() * maxExclusive);
}

// Fisher-Yates. The old `sort(() => Math.random() - 0.5)` is not uniform:
// some permutations come out far more often than others.
export function shuffled<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = randomInt(rng, i + 1);
        [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
}

export function computeImpostorCount(
    playerCount: number,
    setting: ImpostorCountSetting,
    rng: Rng = Math.random
): number {
    if (setting === 'auto') {
        if (playerCount <= 4) return 1;
        if (playerCount <= 7) return randomInt(rng, 2) + 1; // 1-2
        return randomInt(rng, 2) + 2; // 2-3
    }
    return Math.min(parseInt(setting, 10), Math.max(1, playerCount - 2));
}

export interface RoundInput {
    mode: GameMode;
    difficulty: Difficulty;
    players: readonly string[];
    impostorCount: ImpostorCountSetting;
    facts: readonly FactItem[];
    deck: readonly NamedWikiItem[] | null;
}

export function buildRound(input: RoundInput, rng: Rng = Math.random): RoundData {
    const { players } = input;
    const count = computeImpostorCount(players.length, input.impostorCount, rng);
    const order = shuffled(players, rng);
    const impostors = order.slice(0, count);
    const citizens = order.slice(count);

    const round: RoundData = {
        roles: {},
        content: {},
        impostors,
        secret: null,
        startingPlayer: players[randomInt(rng, players.length)]!
    };

    if (input.mode === 'facts') {
        const facts = shuffled(input.facts, rng);
        citizens.forEach((player, index) => {
            round.roles[player] = 'citizen';
            round.content[player] = { type: 'fact', fact: facts[index % facts.length]! };
        });
        impostors.forEach((player) => {
            round.roles[player] = 'impostor';
            round.content[player] = { type: 'blind' };
        });
        return round;
    }

    const deck = input.deck!;
    const secret = deck[randomInt(rng, deck.length)]!;
    round.secret = secret;

    citizens.forEach((player) => {
        round.roles[player] = 'citizen';
        round.content[player] = { type: 'secret', item: secret };
    });

    let related: NamedWikiItem | null = null;
    if (input.difficulty === 'related') {
        const sameCategory = deck.filter((i) => i.category === secret.category && i.id !== secret.id);
        const pool = sameCategory.length ? sameCategory : deck.filter((i) => i.id !== secret.id);
        related = pool[randomInt(rng, pool.length)]!;
    }

    impostors.forEach((player) => {
        round.roles[player] = 'impostor';
        if (input.difficulty === 'category') {
            round.content[player] = { type: 'category', category: secret.category };
        } else if (related) {
            round.content[player] = { type: 'related', item: related };
        } else {
            round.content[player] = { type: 'blind' };
        }
    });
    return round;
}
