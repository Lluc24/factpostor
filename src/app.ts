import type {
    CategoryInfo,
    Difficulty,
    FactItem,
    GameMode,
    GameState,
    ImpostorCountSetting,
    NamedWikiItem,
    Role,
    RoundContent
} from './types.js';

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
}

// Game State
let gameState: GameState = {
    mode: 'facts',
    difficulty: 'blind',
    players: [],
    impostorCount: 'auto',
    roundData: null,
    currentPlayerIndex: 0
};

// Screen Management
function showScreen(screenId: string): void {
    document.querySelectorAll('.screen').forEach((screen) => {
        screen.classList.remove('active');
    });
    byId(screenId).classList.add('active');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    applyStaticTranslations();
    updateLangButtons();
});

function initializeEventListeners(): void {
    // Language switcher
    document.querySelectorAll<HTMLElement>('.lang-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            window.FactpostorI18n.setLang(btn.dataset.lang!);
            applyStaticTranslations();
            updateLangButtons();
        });
    });

    // Mode selection
    document.querySelectorAll<HTMLElement>('.mode-card').forEach((card) => {
        card.addEventListener('click', () => selectMode(card.dataset.mode as GameMode));
    });

    // Difficulty selection
    document.querySelectorAll<HTMLElement>('.difficulty-card').forEach((card) => {
        card.addEventListener('click', () => selectDifficulty(card.dataset.difficulty as Difficulty));
    });

    // Home screen
    byId('add-player-btn').addEventListener('click', addPlayer);
    byId<HTMLInputElement>('player-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    byId('start-game-btn').addEventListener('click', startGame);

    // How to Play modal
    byId('how-to-play-btn').addEventListener('click', openHowToPlay);
    byId('close-modal-btn').addEventListener('click', closeHowToPlay);
    byId('close-modal-footer-btn').addEventListener('click', closeHowToPlay);

    byId('how-to-play-modal').addEventListener('click', (e) => {
        if ((e.target as HTMLElement).id === 'how-to-play-modal') {
            closeHowToPlay();
        }
    });

    // Pass screen
    byId('ready-btn').addEventListener('click', showRoleReveal);

    // Role reveal screen
    byId('show-role-btn').addEventListener('click', revealRole);
    byId('done-reveal-btn').addEventListener('click', nextPlayerOrProceed);

    // Game ready screen
    byId('reveal-results-btn').addEventListener('click', showResults);

    // Results screen
    byId('new-round-btn').addEventListener('click', startGame);
    byId('new-game-btn').addEventListener('click', resetGame);
}

// i18n helpers applied across the static DOM
function applyStaticTranslations(): void {
    const i18n = window.FactpostorI18n;
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        el.textContent = i18n.t(el.getAttribute('data-i18n')!);
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
        el.innerHTML = i18n.t(el.getAttribute('data-i18n-html')!);
    });
    document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
        el.placeholder = i18n.t(el.getAttribute('data-i18n-placeholder')!);
    });
}

function updateLangButtons(): void {
    const current = window.FactpostorI18n.getLang();
    document.querySelectorAll<HTMLElement>('.lang-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lang === current);
    });
}

// Mode / Difficulty selection
function selectMode(mode: GameMode): void {
    gameState.mode = mode;
    document.querySelectorAll<HTMLElement>('.mode-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.mode === mode);
    });
    byId('difficulty-section').classList.toggle('hidden', mode === 'facts');
}

function selectDifficulty(difficulty: Difficulty): void {
    gameState.difficulty = difficulty;
    document.querySelectorAll<HTMLElement>('.difficulty-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.difficulty === difficulty);
    });
}

// Player Management
function addPlayer(): void {
    const input = byId<HTMLInputElement>('player-input');
    const playerName = input.value.trim();

    if (playerName && !gameState.players.includes(playerName)) {
        gameState.players.push(playerName);
        updatePlayerList();
        input.value = '';
        updateStartButton();
    }
}

function removePlayer(playerName: string): void {
    gameState.players = gameState.players.filter((p) => p !== playerName);
    updatePlayerList();
    updateStartButton();
}

function updatePlayerList(): void {
    const list = byId('player-list');
    list.innerHTML = '';

    gameState.players.forEach((player) => {
        const item = document.createElement('div');
        item.className = 'player-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = player;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-player-btn';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => removePlayer(player));

        item.appendChild(nameSpan);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });
}

function updateStartButton(): void {
    const btn = byId<HTMLButtonElement>('start-game-btn');
    btn.disabled = gameState.players.length < 3;
}

// Deck helpers
function getDeckForMode(mode: GameMode): NamedWikiItem[] | null {
    if (mode === 'classic') return window.CLASSIC_WORDS;
    if (mode === 'famous') return window.FAMOUS_PEOPLE;
    return null;
}

function getCategoriesForMode(mode: GameMode): Record<string, CategoryInfo> | null {
    if (mode === 'classic') return window.CATEGORIES.classic;
    if (mode === 'famous') return window.CATEGORIES.famous;
    return null;
}

function shuffled<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function computeImpostorCount(playerCount: number, setting: ImpostorCountSetting): number {
    if (setting === 'auto') {
        if (playerCount <= 4) return 1;
        if (playerCount <= 7) return Math.floor(Math.random() * 2) + 1; // 1-2
        return Math.floor(Math.random() * 2) + 2; // 2-3
    }
    return Math.min(parseInt(setting, 10), Math.max(1, playerCount - 2));
}

// Game Setup
function startGame(): void {
    gameState.impostorCount = byId<HTMLSelectElement>('impostor-count').value as ImpostorCountSetting;

    const impostorCount = computeImpostorCount(gameState.players.length, gameState.impostorCount);

    const shuffledPlayers = shuffled(gameState.players);
    const impostors = shuffledPlayers.slice(0, impostorCount);
    const citizens = shuffledPlayers.slice(impostorCount);

    gameState.roundData = {
        roles: {},
        content: {},
        impostors,
        secret: null,
        startingPlayer: gameState.players[Math.floor(Math.random() * gameState.players.length)]!
    };

    if (gameState.mode === 'facts') {
        setupFactsRound(citizens, impostors);
    } else {
        setupSharedSecretRound(citizens, impostors);
    }

    gameState.currentPlayerIndex = 0;
    showPassScreen();
}

function setupFactsRound(citizens: string[], impostors: string[]): void {
    const roundData = gameState.roundData!;
    const facts: FactItem[] = shuffled(window.FACTS_DATA);

    citizens.forEach((player, index) => {
        roundData.roles[player] = 'citizen';
        roundData.content[player] = { type: 'fact', fact: facts[index % facts.length]! };
    });

    impostors.forEach((player) => {
        roundData.roles[player] = 'impostor';
        roundData.content[player] = { type: 'blind' };
    });
}

function setupSharedSecretRound(citizens: string[], impostors: string[]): void {
    const roundData = gameState.roundData!;
    const deck = getDeckForMode(gameState.mode)!;
    const secretItem = deck[Math.floor(Math.random() * deck.length)]!;
    roundData.secret = secretItem;

    citizens.forEach((player) => {
        roundData.roles[player] = 'citizen';
        roundData.content[player] = { type: 'secret', item: secretItem };
    });

    let relatedItem: NamedWikiItem | null = null;
    if (gameState.difficulty === 'related') {
        const sameCategory = deck.filter((i) => i.category === secretItem.category && i.id !== secretItem.id);
        const pool = sameCategory.length ? sameCategory : deck.filter((i) => i.id !== secretItem.id);
        relatedItem = pool[Math.floor(Math.random() * pool.length)]!;
    }

    impostors.forEach((player) => {
        roundData.roles[player] = 'impostor';
        if (gameState.difficulty === 'category') {
            roundData.content[player] = { type: 'category', category: secretItem.category };
        } else if (gameState.difficulty === 'related') {
            roundData.content[player] = { type: 'related', item: relatedItem! };
        } else {
            roundData.content[player] = { type: 'blind' };
        }
    });
}

// Role Reveal Flow
function showPassScreen(): void {
    if (gameState.currentPlayerIndex >= gameState.players.length) {
        showGameReadyScreen();
        return;
    }

    const playerName = gameState.players[gameState.currentPlayerIndex]!;
    byId('next-player-name').textContent = playerName;
    showScreen('pass-screen');
}

function showGameReadyScreen(): void {
    showScreen('game-ready-screen');
    (['facts', 'classic', 'famous'] as const).forEach((mode) => {
        byId(`instructions-${mode}`).classList.toggle('hidden', mode !== gameState.mode);
    });
    byId('starting-player-name').textContent = gameState.roundData!.startingPlayer;
}

function showRoleReveal(): void {
    showScreen('reveal-screen');
    byId('tap-to-reveal').style.display = 'block';
    byId('role-content').classList.add('hidden');
}

function roleBadgeKey(role: Role): string {
    if (role === 'citizen') return 'roleCitizen';
    return gameState.mode === 'facts' ? 'roleFactpostor' : 'roleImpostor';
}

function revealRole(): void {
    const playerName = gameState.players[gameState.currentPlayerIndex]!;
    const roundData = gameState.roundData!;
    const role = roundData.roles[playerName]!;
    const content = roundData.content[playerName]!;

    byId('tap-to-reveal').style.display = 'none';
    const roleContent = byId('role-content');
    roleContent.classList.remove('hidden');

    byId('player-current-name').textContent = playerName;

    const roleBadge = byId('role-badge');
    roleBadge.className = `role-badge ${role === 'citizen' ? 'citizen' : 'factpostor'}`;
    roleBadge.textContent = window.FactpostorI18n.t(roleBadgeKey(role));

    renderRoundContent(byId('fact-display'), content);
}

// Builds the DOM for whatever a given player is allowed to see this round.
function renderRoundContent(container: HTMLElement, content: RoundContent): void {
    container.innerHTML = '';
    container.style.display = 'block';

    const i18n = window.FactpostorI18n;
    const viewSourceText = i18n.t('viewOnWikipedia');
    const unavailableText = i18n.t('imageLoadFailed');

    if (content.type === 'blind') {
        const msgKey = gameState.mode === 'facts' ? 'factpostorBlindMessage' : 'classicBlindMessage';
        const msg = document.createElement('div');
        msg.className = 'blind-message';
        msg.textContent = i18n.t(msgKey);
        container.appendChild(msg);
        return;
    }

    if (content.type === 'fact') {
        const text = document.createElement('div');
        text.className = 'fact-text';
        text.textContent = i18n.localize(content.fact.text);
        container.appendChild(text);
        container.appendChild(window.FactpostorImages.createPhotoElement(
            content.fact.subject, i18n.localize(content.fact.text), viewSourceText, unavailableText
        ));
        return;
    }

    if (content.type === 'secret') {
        const name = document.createElement('div');
        name.className = 'secret-word';
        name.textContent = i18n.localize(content.item.name);
        container.appendChild(name);
        container.appendChild(window.FactpostorImages.createPhotoElement(
            content.item.wikiTitle, i18n.localize(content.item.name), viewSourceText, unavailableText
        ));
        return;
    }

    if (content.type === 'category') {
        const cat = getCategoriesForMode(gameState.mode)![content.category]!;
        const label = document.createElement('div');
        label.className = 'hint-label';
        label.textContent = i18n.t('categoryHintLabel');
        container.appendChild(label);

        const name = document.createElement('div');
        name.className = 'secret-word';
        name.textContent = `${cat.icon} ${i18n.localize(cat.name)}`;
        container.appendChild(name);

        container.appendChild(window.FactpostorImages.createPhotoElement(
            cat.wikiTitle, i18n.localize(cat.name), viewSourceText, unavailableText
        ));
        return;
    }

    if (content.type === 'related') {
        const label = document.createElement('div');
        label.className = 'hint-label';
        label.textContent = i18n.t('relatedHintLabel');
        container.appendChild(label);

        const name = document.createElement('div');
        name.className = 'secret-word';
        name.textContent = i18n.localize(content.item.name);
        container.appendChild(name);

        container.appendChild(window.FactpostorImages.createPhotoElement(
            content.item.wikiTitle, i18n.localize(content.item.name), viewSourceText, unavailableText
        ));
        return;
    }
}

function nextPlayerOrProceed(): void {
    gameState.currentPlayerIndex++;
    showPassScreen();
}

// Results
function showResults(): void {
    showScreen('results-screen');

    const secretBanner = byId('secret-reveal-banner');
    const secretContent = byId('secret-reveal-content');
    secretContent.innerHTML = '';

    const roundData = gameState.roundData!;

    if (gameState.mode !== 'facts' && roundData.secret) {
        secretBanner.classList.remove('hidden');
        const name = document.createElement('div');
        name.className = 'secret-word';
        name.textContent = window.FactpostorI18n.localize(roundData.secret.name);
        secretContent.appendChild(name);
        secretContent.appendChild(window.FactpostorImages.createPhotoElement(
            roundData.secret.wikiTitle,
            window.FactpostorI18n.localize(roundData.secret.name),
            window.FactpostorI18n.t('viewOnWikipedia'),
            window.FactpostorI18n.t('imageLoadFailed')
        ));
    } else {
        secretBanner.classList.add('hidden');
    }

    const allRolesList = byId('all-roles-list');
    allRolesList.innerHTML = '';

    gameState.players.forEach((player) => {
        const role = roundData.roles[player]!;
        const content = roundData.content[player]!;

        const item = document.createElement('div');
        item.className = 'role-list-item';

        const info = document.createElement('div');
        info.style.flex = '1';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '10px';
        header.style.marginBottom = '8px';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.style.fontWeight = '600';
        nameSpan.style.fontSize = '1.1rem';
        nameSpan.textContent = player;

        const badge = document.createElement('span');
        badge.className = `role-badge ${role === 'citizen' ? 'citizen' : 'factpostor'}`;
        badge.textContent = window.FactpostorI18n.t(roleBadgeKey(role));

        header.appendChild(nameSpan);
        header.appendChild(badge);
        info.appendChild(header);

        const hint = document.createElement('div');
        hint.className = 'fact-display';
        hint.style.margin = '0';
        hint.style.fontSize = '0.95rem';
        let showHint = true;

        if (content.type === 'fact') {
            hint.textContent = window.FactpostorI18n.localize(content.fact.text);
        } else if (content.type === 'category') {
            const cat = getCategoriesForMode(gameState.mode)![content.category]!;
            hint.textContent = `${window.FactpostorI18n.t('categoryHintLabel')} ${cat.icon} ${window.FactpostorI18n.localize(cat.name)}`;
        } else if (content.type === 'related') {
            hint.textContent = `${window.FactpostorI18n.t('relatedHintLabel')} ${window.FactpostorI18n.localize(content.item.name)}`;
        } else {
            showHint = false;
        }

        if (showHint) info.appendChild(hint);

        item.appendChild(info);
        allRolesList.appendChild(item);
    });
}

function resetGame(): void {
    gameState = {
        mode: 'facts',
        difficulty: 'blind',
        players: [],
        impostorCount: 'auto',
        roundData: null,
        currentPlayerIndex: 0
    };

    byId<HTMLInputElement>('player-input').value = '';
    byId<HTMLSelectElement>('impostor-count').value = 'auto';
    updatePlayerList();
    updateStartButton();
    selectMode('facts');
    selectDifficulty('blind');

    showScreen('home-screen');
}

// How to Play Modal
function openHowToPlay(): void {
    byId('how-to-play-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHowToPlay(): void {
    byId('how-to-play-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}
