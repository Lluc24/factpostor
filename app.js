// Game State
let gameState = {
    mode: 'facts', // 'facts' | 'classic' | 'famous'
    difficulty: 'blind', // 'blind' | 'category' | 'related' (classic/famous only)
    players: [],
    impostorCount: 'auto',
    roundData: null,
    currentPlayerIndex: 0
};

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    applyStaticTranslations();
    updateLangButtons();
});

function initializeEventListeners() {
    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            FactpostorI18n.setLang(btn.dataset.lang);
            applyStaticTranslations();
            updateLangButtons();
        });
    });

    // Mode selection
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => selectMode(card.dataset.mode));
    });

    // Difficulty selection
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', () => selectDifficulty(card.dataset.difficulty));
    });

    // Home screen
    document.getElementById('add-player-btn').addEventListener('click', addPlayer);
    document.getElementById('player-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    document.getElementById('start-game-btn').addEventListener('click', startGame);

    // How to Play modal
    document.getElementById('how-to-play-btn').addEventListener('click', openHowToPlay);
    document.getElementById('close-modal-btn').addEventListener('click', closeHowToPlay);
    document.getElementById('close-modal-footer-btn').addEventListener('click', closeHowToPlay);

    document.getElementById('how-to-play-modal').addEventListener('click', (e) => {
        if (e.target.id === 'how-to-play-modal') {
            closeHowToPlay();
        }
    });

    // Pass screen
    document.getElementById('ready-btn').addEventListener('click', showRoleReveal);

    // Role reveal screen
    document.getElementById('show-role-btn').addEventListener('click', revealRole);
    document.getElementById('done-reveal-btn').addEventListener('click', nextPlayerOrProceed);

    // Game ready screen
    document.getElementById('reveal-results-btn').addEventListener('click', showResults);

    // Results screen
    document.getElementById('new-round-btn').addEventListener('click', startGame);
    document.getElementById('new-game-btn').addEventListener('click', resetGame);
}

// i18n helpers applied across the static DOM
function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = FactpostorI18n.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = FactpostorI18n.t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = FactpostorI18n.t(el.getAttribute('data-i18n-placeholder'));
    });
}

function updateLangButtons() {
    const current = FactpostorI18n.getLang();
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === current);
    });
}

// Mode / Difficulty selection
function selectMode(mode) {
    gameState.mode = mode;
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.toggle('active', card.dataset.mode === mode);
    });
    document.getElementById('difficulty-section').classList.toggle('hidden', mode === 'facts');
}

function selectDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.classList.toggle('active', card.dataset.difficulty === difficulty);
    });
}

// Player Management
function addPlayer() {
    const input = document.getElementById('player-input');
    const playerName = input.value.trim();

    if (playerName && !gameState.players.includes(playerName)) {
        gameState.players.push(playerName);
        updatePlayerList();
        input.value = '';
        updateStartButton();
    }
}

function removePlayer(playerName) {
    gameState.players = gameState.players.filter(p => p !== playerName);
    updatePlayerList();
    updateStartButton();
}

function updatePlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';

    gameState.players.forEach(player => {
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

function updateStartButton() {
    const btn = document.getElementById('start-game-btn');
    btn.disabled = gameState.players.length < 3;
}

// Deck helpers
function getDeckForMode(mode) {
    if (mode === 'classic') return window.CLASSIC_WORDS;
    if (mode === 'famous') return window.FAMOUS_PEOPLE;
    return null;
}

function getCategoriesForMode(mode) {
    if (mode === 'classic') return window.CATEGORIES.classic;
    if (mode === 'famous') return window.CATEGORIES.famous;
    return null;
}

function shuffled(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function computeImpostorCount(playerCount, setting) {
    if (setting === 'auto') {
        if (playerCount <= 4) return 1;
        if (playerCount <= 7) return Math.floor(Math.random() * 2) + 1; // 1-2
        return Math.floor(Math.random() * 2) + 2; // 2-3
    }
    return Math.min(parseInt(setting, 10), Math.max(1, playerCount - 2));
}

// Game Setup
function startGame() {
    gameState.impostorCount = document.getElementById('impostor-count').value;

    const impostorCount = computeImpostorCount(gameState.players.length, gameState.impostorCount);

    const shuffledPlayers = shuffled(gameState.players);
    const impostors = shuffledPlayers.slice(0, impostorCount);
    const citizens = shuffledPlayers.slice(impostorCount);

    gameState.roundData = {
        roles: {},
        content: {},
        impostors,
        secret: null
    };

    if (gameState.mode === 'facts') {
        setupFactsRound(citizens, impostors);
    } else {
        setupSharedSecretRound(citizens, impostors);
    }

    gameState.currentPlayerIndex = 0;
    showPassScreen();
}

function setupFactsRound(citizens, impostors) {
    const facts = shuffled(window.FACTS_DATA);

    citizens.forEach((player, index) => {
        gameState.roundData.roles[player] = 'citizen';
        gameState.roundData.content[player] = { type: 'fact', fact: facts[index % facts.length] };
    });

    impostors.forEach(player => {
        gameState.roundData.roles[player] = 'impostor';
        gameState.roundData.content[player] = { type: 'blind' };
    });
}

function setupSharedSecretRound(citizens, impostors) {
    const deck = getDeckForMode(gameState.mode);
    const secretItem = deck[Math.floor(Math.random() * deck.length)];
    gameState.roundData.secret = secretItem;

    citizens.forEach(player => {
        gameState.roundData.roles[player] = 'citizen';
        gameState.roundData.content[player] = { type: 'secret', item: secretItem };
    });

    let relatedItem = null;
    if (gameState.difficulty === 'related') {
        const sameCategory = deck.filter(i => i.category === secretItem.category && i.id !== secretItem.id);
        const pool = sameCategory.length ? sameCategory : deck.filter(i => i.id !== secretItem.id);
        relatedItem = pool[Math.floor(Math.random() * pool.length)];
    }

    impostors.forEach(player => {
        gameState.roundData.roles[player] = 'impostor';
        if (gameState.difficulty === 'category') {
            gameState.roundData.content[player] = { type: 'category', category: secretItem.category };
        } else if (gameState.difficulty === 'related') {
            gameState.roundData.content[player] = { type: 'related', item: relatedItem };
        } else {
            gameState.roundData.content[player] = { type: 'blind' };
        }
    });
}

// Role Reveal Flow
function showPassScreen() {
    if (gameState.currentPlayerIndex >= gameState.players.length) {
        showGameReadyScreen();
        return;
    }

    const playerName = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('next-player-name').textContent = playerName;
    showScreen('pass-screen');
}

function showGameReadyScreen() {
    showScreen('game-ready-screen');
    ['facts', 'classic', 'famous'].forEach(mode => {
        document.getElementById(`instructions-${mode}`).classList.toggle('hidden', mode !== gameState.mode);
    });
}

function showRoleReveal() {
    showScreen('reveal-screen');
    document.getElementById('tap-to-reveal').style.display = 'block';
    document.getElementById('role-content').classList.add('hidden');
}

function roleBadgeKey(role) {
    if (role === 'citizen') return 'roleCitizen';
    return gameState.mode === 'facts' ? 'roleFactpostor' : 'roleImpostor';
}

function revealRole() {
    const playerName = gameState.players[gameState.currentPlayerIndex];
    const role = gameState.roundData.roles[playerName];
    const content = gameState.roundData.content[playerName];

    document.getElementById('tap-to-reveal').style.display = 'none';
    const roleContent = document.getElementById('role-content');
    roleContent.classList.remove('hidden');

    document.getElementById('player-current-name').textContent = playerName;

    const roleBadge = document.getElementById('role-badge');
    roleBadge.className = `role-badge ${role === 'citizen' ? 'citizen' : 'factpostor'}`;
    roleBadge.textContent = FactpostorI18n.t(roleBadgeKey(role));

    renderRoundContent(document.getElementById('fact-display'), content, role);
}

// Builds the DOM for whatever a given player is allowed to see this round.
function renderRoundContent(container, content, role) {
    container.innerHTML = '';
    container.style.display = 'block';

    const i18n = FactpostorI18n;
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
        const cat = getCategoriesForMode(gameState.mode)[content.category];
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

function nextPlayerOrProceed() {
    gameState.currentPlayerIndex++;
    showPassScreen();
}

// Results
function showResults() {
    showScreen('results-screen');

    const secretBanner = document.getElementById('secret-reveal-banner');
    const secretContent = document.getElementById('secret-reveal-content');
    secretContent.innerHTML = '';

    if (gameState.mode !== 'facts' && gameState.roundData.secret) {
        secretBanner.classList.remove('hidden');
        const name = document.createElement('div');
        name.className = 'secret-word';
        name.textContent = FactpostorI18n.localize(gameState.roundData.secret.name);
        secretContent.appendChild(name);
        secretContent.appendChild(window.FactpostorImages.createPhotoElement(
            gameState.roundData.secret.wikiTitle,
            FactpostorI18n.localize(gameState.roundData.secret.name),
            FactpostorI18n.t('viewOnWikipedia'),
            FactpostorI18n.t('imageLoadFailed')
        ));
    } else {
        secretBanner.classList.add('hidden');
    }

    const allRolesList = document.getElementById('all-roles-list');
    allRolesList.innerHTML = '';

    gameState.players.forEach(player => {
        const role = gameState.roundData.roles[player];
        const content = gameState.roundData.content[player];

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
        badge.textContent = FactpostorI18n.t(roleBadgeKey(role));

        header.appendChild(nameSpan);
        header.appendChild(badge);
        info.appendChild(header);

        const hint = document.createElement('div');
        hint.className = 'fact-display';
        hint.style.margin = '0';
        hint.style.fontSize = '0.95rem';
        let showHint = true;

        if (content.type === 'fact') {
            hint.textContent = FactpostorI18n.localize(content.fact.text);
        } else if (content.type === 'category') {
            const cat = getCategoriesForMode(gameState.mode)[content.category];
            hint.textContent = `${FactpostorI18n.t('categoryHintLabel')} ${cat.icon} ${FactpostorI18n.localize(cat.name)}`;
        } else if (content.type === 'related') {
            hint.textContent = `${FactpostorI18n.t('relatedHintLabel')} ${FactpostorI18n.localize(content.item.name)}`;
        } else {
            showHint = false;
        }

        if (showHint) info.appendChild(hint);

        item.appendChild(info);
        allRolesList.appendChild(item);
    });
}

function resetGame() {
    gameState = {
        mode: 'facts',
        difficulty: 'blind',
        players: [],
        impostorCount: 'auto',
        roundData: null,
        currentPlayerIndex: 0
    };

    document.getElementById('player-input').value = '';
    document.getElementById('impostor-count').value = 'auto';
    updatePlayerList();
    updateStartButton();
    selectMode('facts');
    selectDifficulty('blind');

    showScreen('home-screen');
}

// How to Play Modal
function openHowToPlay() {
    document.getElementById('how-to-play-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHowToPlay() {
    document.getElementById('how-to-play-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}
