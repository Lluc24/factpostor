// Shared domain types for game data (data/*.json, bundled into js/data.bundle.js)
// and in-memory game state. Kept dependency-free so scripts/build-data.ts can
// import it too.

export type Lang = 'en' | 'es' | 'ca';

export interface LocalizedString {
    en: string;
    es: string;
    ca: string;
}

export interface FactItem {
    id: string;
    subject: string;
    text: LocalizedString;
}

// Shape shared by data/classic-words.json and data/famous-people.json entries.
export interface NamedWikiItem {
    id: string;
    category: string;
    wikiTitle: string;
    name: LocalizedString;
}

export interface CategoryInfo {
    icon: string;
    wikiTitle: string;
    name: LocalizedString;
}

export interface CategoriesData {
    classic: Record<string, CategoryInfo>;
    famous: Record<string, CategoryInfo>;
}

export type I18nStrings = Record<string, LocalizedString>;

// Game domain

export type GameMode = 'facts' | 'classic' | 'famous';
export type Difficulty = 'blind' | 'category' | 'related';
export type Role = 'citizen' | 'impostor';
export type ImpostorCountSetting = 'auto' | '1' | '2' | '3';

export type RoundContent =
    | { type: 'blind' }
    | { type: 'fact'; fact: FactItem }
    | { type: 'secret'; item: NamedWikiItem }
    | { type: 'category'; category: string }
    | { type: 'related'; item: NamedWikiItem };

export interface RoundData {
    roles: Record<string, Role>;
    content: Record<string, RoundContent>;
    impostors: string[];
    secret: NamedWikiItem | null;
}

export interface GameState {
    mode: GameMode;
    difficulty: Difficulty;
    players: string[];
    impostorCount: ImpostorCountSetting;
    roundData: RoundData | null;
    currentPlayerIndex: number;
}

export interface WikiImageResult {
    imageUrl: string;
    pageUrl: string;
}
