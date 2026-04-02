// Game State
let gameState = {
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
});

function initializeEventListeners() {
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
    
    // Close modal when clicking outside
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
        item.innerHTML = `
            <span>${player}</span>
            <button class="remove-player-btn" onclick="removePlayer('${player}')">✕</button>
        `;
        list.appendChild(item);
    });
}

function updateStartButton() {
    const btn = document.getElementById('start-game-btn');
    btn.disabled = gameState.players.length < 3;
}

// Game Setup
function startGame() {
    gameState.impostorCount = document.getElementById('impostor-count').value;
    
    // Determine impostor count
    let impostorCount;
    if (gameState.impostorCount === 'auto') {
        if (gameState.players.length <= 4) impostorCount = 1;
        else if (gameState.players.length <= 7) impostorCount = Math.floor(Math.random() * 2) + 1; // 1-2
        else impostorCount = Math.floor(Math.random() * 2) + 2; // 2-3
    } else {
        impostorCount = parseInt(gameState.impostorCount);
    }
    
    // Shuffle and assign roles randomly
    const shuffledPlayers = [...gameState.players].sort(() => Math.random() - 0.5);
    const impostors = shuffledPlayers.slice(0, impostorCount);
    const citizens = shuffledPlayers.slice(impostorCount);
    
    // Get random facts for each citizen (different fact for each)
    const shuffledFacts = [...FACTS].sort(() => Math.random() - 0.5);
    
    gameState.roundData = {
        roles: {},
        facts: {},
        impostors: impostors
    };
    
    // Assign facts to citizens
    citizens.forEach((player, index) => {
        gameState.roundData.roles[player] = 'citizen';
        gameState.roundData.facts[player] = shuffledFacts[index % shuffledFacts.length];
    });
    
    // Mark impostors
    impostors.forEach(player => {
        gameState.roundData.roles[player] = 'factpostor';
        gameState.roundData.facts[player] = null;
    });
    
    gameState.currentPlayerIndex = 0;
    
    showPassScreen();
}

// Role Reveal Flow
function showPassScreen() {
    if (gameState.currentPlayerIndex >= gameState.players.length) {
        showScreen('game-ready-screen');
        return;
    }
    
    const playerName = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('next-player-name').textContent = playerName;
    showScreen('pass-screen');
}

function showRoleReveal() {
    showScreen('reveal-screen');
    // Reset to tap-to-reveal state
    document.getElementById('tap-to-reveal').style.display = 'block';
    document.getElementById('role-content').classList.add('hidden');
}

function revealRole() {
    const playerName = gameState.players[gameState.currentPlayerIndex];
    const role = gameState.roundData.roles[playerName];
    
    document.getElementById('tap-to-reveal').style.display = 'none';
    const roleContent = document.getElementById('role-content');
    roleContent.classList.remove('hidden');
    
    document.getElementById('player-current-name').textContent = playerName;
    
    const roleBadge = document.getElementById('role-badge');
    roleBadge.className = `role-badge ${role}`;
    roleBadge.textContent = role === 'citizen' ? '✓ CITIZEN' : '🎭 FACTPOSTOR';
    
    const factDisplay = document.getElementById('fact-display');
    if (role === 'citizen') {
        factDisplay.textContent = gameState.roundData.facts[playerName];
        factDisplay.style.display = 'block';
    } else {
        factDisplay.innerHTML = '<strong>You are the Factpostor!</strong><br><br>Invent a plausible-sounding fake fact and blend in with the Citizens. Don\'t reveal that you\'re the impostor!';
        factDisplay.style.display = 'block';
    }
}

function nextPlayerOrProceed() {
    gameState.currentPlayerIndex++;
    showPassScreen();
}

// Results
function showResults() {
    showScreen('results-screen');
    
    // Display all roles and facts
    const allRolesList = document.getElementById('all-roles-list');
    allRolesList.innerHTML = '';
    
    gameState.players.forEach(player => {
        const role = gameState.roundData.roles[player];
        const fact = gameState.roundData.facts[player];
        
        const item = document.createElement('div');
        item.className = 'role-list-item';
        
        if (role === 'citizen') {
            item.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span class="player-name" style="font-weight: 600; font-size: 1.1rem;">${player}</span>
                        <span class="role-badge ${role}">✓ CITIZEN</span>
                    </div>
                    <div class="fact-display" style="margin: 0; font-size: 0.95rem;">${fact}</div>
                </div>
            `;
        } else {
            item.innerHTML = `
                <span class="player-name" style="font-weight: 600; font-size: 1.1rem;">${player}</span>
                <span class="role-badge ${role}">🎭 FACTPOSTOR</span>
            `;
        }
        
        allRolesList.appendChild(item);
    });
}

function resetGame() {
    gameState = {
        players: [],
        impostorCount: 'auto',
        roundData: null,
        currentPlayerIndex: 0
    };
    
    document.getElementById('player-input').value = '';
    document.getElementById('impostor-count').value = 'auto';
    updatePlayerList();
    updateStartButton();
    
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
