# 🕵️ FACTPOSTOR

A web-based social deduction party game where players must distinguish truth from fiction. Citizens defend real facts while Factpostors blend in with believable lies.

> *"A lie is just a fact that hasn't been believed yet."*

## 🎮 What is Factpostor?

Factpostor is a single-device party game for 3-10 players. Each round, players receive either a true fact (Citizens) or nothing at all (Factpostors). The Factpostors must invent plausible fake facts on the spot and blend in with the honest players. After discussion, everyone votes to expose the impostors.

Perfect for:
- Party games and social gatherings
- Team building events
- Ice breakers
- Trivia night with a twist

## ✨ Features

- 🎲 **Random Role Assignment**: Automatic, fair role distribution
- 📱 **Single Device**: Pass-and-play on one phone or tablet
- 🔒 **Private Reveals**: Secure role viewing system
- 🎯 **160+ Curated Facts**: Hand-picked interesting, verifiable facts
- 💯 **No Installation**: Works directly in your browser
- 🌐 **Offline Ready**: No internet connection required after initial load
- 📊 **Multi-Round Support**: Play multiple rounds with persistent player tracking

## 🚀 Quick Start

### Option 1: Open Directly
Simply open `index.html` in any modern web browser:
```bash
# Navigate to the project directory
cd factpostor

# Open in your default browser (macOS)
open index.html

# Or (Linux)
xdg-open index.html

# Or (Windows)
start index.html
```

### Option 2: Local Server
For the best experience, serve via a local HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📖 How to Play

### Setup
1. One player opens the app on their device
2. Enter all player names (3-10 players recommended)
3. Choose number of Factpostors or use auto mode
4. Start the game

### Role Reveal
1. Pass the device around the table
2. Each player taps "Show My Role" to see their assignment privately
3. **Citizens** see a true fact
4. **Factpostors** see only that they're the impostor
5. Tap "Done" to hide and pass to the next player

### Gameplay (In-Person)
1. **Declarations** (2-4 min): Each player hints at their fact without revealing it directly
2. **Discussion** (3-5 min): Ask questions, challenge suspicious statements, form theories
3. **Revelation** (1 min): Each player states their full fact
4. **Vote**: Point to who you think is a Factpostor
5. **Results**: Reveal all roles and facts

### Scoring
- Factpostor eliminated → Citizens +1 each
- Citizen eliminated → Surviving Factpostors +2 each
- Additional bonus points for especially clever play

## 🛠️ Technical Details

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with custom properties
- **Architecture**: Client-side only, no backend required

### File Structure
```
factpostor/
├── index.html          # Main application structure
├── app.js              # Game logic and state management
├── facts.js            # Curated fact database (160+ facts)
├── styles.css          # UI styling and responsive design
├── README.md           # This file
└── GAME_LOGIC.md       # Detailed game rules and design
```

### Browser Compatibility
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### No Dependencies
This project uses zero external dependencies. Everything runs with plain HTML, CSS, and JavaScript.

## 🎨 Customization

### Adding Your Own Facts
Edit `facts.js` and add facts to the `FACTS` array:

```javascript
const FACTS = [
    "Your new interesting fact here.",
    "Another surprising fact.",
    // ... more facts
];
```

**Good facts should be:**
- Verifiable and genuinely true
- Specific (include numbers, names, dates)
- Surprising to most people
- Standalone (no context required)

### Styling
Modify `styles.css` to change colors, fonts, and layout. CSS custom properties are defined at the top for easy theming:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    /* ... more variables */
}
```

## 🧪 Development

### Running Locally
No build process required! Just edit the files and refresh your browser.

### Adding Features
The game state is managed in `app.js` through the `gameState` object:

```javascript
let gameState = {
    players: [],              // Array of player names
    impostorCount: 'auto',    // Number of Factpostors
    roundData: null,          // Current round data
    currentPlayerIndex: 0     // Current player in reveal phase
};
```

## 📚 Documentation

- **[GAME_LOGIC.md](GAME_LOGIC.md)**: Complete game rules, strategy guide, variants, and design philosophy
- **Game Screens**: Home → Pass Screen → Role Reveal → Game Ready → Results

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- Add more curated facts to `facts.js`
- Improve mobile responsiveness
- Add sound effects and animations
- Implement scoring across multiple rounds
- Create themed fact packs
- Add accessibility features

## 📝 License

MIT License - feel free to use, modify, and distribute this game.

## 🎯 Credits

Created as an implementation of the social deduction party game genre, inspired by games like Mafia, Werewolf, and Undercover.

## 🐛 Known Issues

- Voting is currently manual (in-person) - digital voting feature planned
- Score tracking across rounds is basic - enhanced scoreboard planned
- No persistent storage - games reset on page reload

## 🔮 Future Enhancements

- [ ] Persistent scoreboard across multiple rounds
- [ ] Fact categories and themed rounds
- [ ] Digital voting interface
- [ ] Timer for each game phase
- [ ] PWA support for offline installation
- [ ] Difficulty levels (easy/medium/hard facts)
- [ ] Statistics and player analytics
- [ ] Export game history

---

**Ready to play?** Open `index.html` and start your first game!

For detailed rules and strategy tips, see [GAME_LOGIC.md](GAME_LOGIC.md).
