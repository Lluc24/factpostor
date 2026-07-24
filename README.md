# 🕵️ FACTPOSTOR

A web-based social deduction party game with **three modes**, in **English, Español, and Català**. Players must bluff, deduce, and vote out the impostor(s) hiding among them.

> *"A lie is just a fact that hasn't been believed yet."*

## 🎮 What is Factpostor?

Factpostor is a single-device party game for 3-10 players, playable in three modes:

- **🧠 Facts** — every Citizen gets a different true fact (with a photo). Factpostors get nothing and must invent a believable one on the spot.
- **🎭 Classic Impostor** — every Citizen gets the *same* secret word and photo. The Impostor gets nothing, a category hint, or a related-but-different word, depending on the difficulty you pick.
- **⭐ Famous People** — same as Classic Impostor, but the secret is a real, famous person instead of a word.

Perfect for:
- Party games and social gatherings
- Team building events
- Ice breakers
- Trivia night with a twist

## ✨ Features

- 🌍 **Three Languages**: full English / Español / Català support, switchable any time from the home screen
- 🎲 **Three Game Modes**: Facts, Classic Impostor, Famous People — each with its own item pool
- 🖼️ **Real Photos**: every item is illustrated with a photo fetched live from Wikipedia
- 🎚️ **Adjustable Difficulty** (Classic/Famous modes): Impostor sees nothing, a category hint, or a related decoy item
- 📱 **Single Device**: Pass-and-play on one phone or tablet
- 🔒 **Private Reveals**: Secure role viewing system
- 🎤 **Random Starting Player**: once every role is revealed, the app announces who starts the round — the table decides the rest of the turn order themselves
- 💯 **No Installation, No Build Step to Play**: Works directly in your browser, zero runtime dependencies (the game logic is written in TypeScript and compiled to plain JS ahead of time — see [Development](#-development))
- 📊 **Large Content Library**: ~165 facts, ~150 classic words, ~150 famous people — see [Content Library](#-content-library) below

## 🚀 Quick Start

### Option 1: Open Directly
Simply open `index.html` in any modern web browser:
```bash
cd factpostor
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

### Option 2: Local Server
```bash
python3 -m http.server 8000
# or: npx http-server -p 8000
```
Then open `http://localhost:8000`.

Both options work identically — this is a fully static site with no build step required to *play* it. Photos are fetched live from Wikipedia, so an internet connection is needed to see them; the game itself (roles, text, voting) still works offline, just without photos.

## 📖 How to Play

### Setup
1. One player opens the app, picks a language and a game mode
2. (Classic/Famous modes) Pick a difficulty for the Impostor
3. Enter all player names (3-10 players recommended) and choose the number of Impostors, or leave it on Auto
4. Start the game

### Role Reveal
Pass the device around the table. Each player taps **"Show My Role"** to see their assignment privately, then **"Done"** to hide it and pass the device on. The screen never shows anything sensitive while in transit.

### Gameplay (In-Person)
1. **Declarations**: each player hints at what they know without stating it outright
2. **Discussion**: ask questions, challenge suspicious statements
3. **Vote**: point to whoever you think is an Impostor
4. **Results**: tap "Reveal Results" to see every role and the secret

See [GAME_LOGIC.md](GAME_LOGIC.md) for the full ruleset, scoring, and variants.

## 🖼️ Content Library & Photos

All game content lives in `data/*.json`:

| File | Contents |
|---|---|
| `data/facts.json` | ~165 true facts, each with an English/Spanish/Catalan translation and a Wikipedia subject for its photo |
| `data/classic-words.json` | ~150 everyday words/objects across 11 categories (food, animals, sports, professions, landmarks, technology, transportation, nature, entertainment, objects, buildings) |
| `data/famous-people.json` | ~150 real, famous people across 10 categories (science, history & politics, art & literature, music, film & TV, sports, exploration, business & tech, royalty, activism) |
| `data/categories.json` | Category labels/icons/representative photo for the "category hint" difficulty |
| `data/i18n.json` | All UI strings in English/Spanish/Catalan |

**No photos are stored in this repository.** Every photo is fetched at runtime from Wikipedia's public REST API (`https://en.wikipedia.org/api/rest_v1/page/summary/<title>`), using the free-licensed image on that article's page. This keeps the repo tiny, keeps the content easy to audit/extend, and avoids any copyright issues with hosting third-party photos ourselves. Each photo links back to its Wikipedia source. If an image can't be loaded (offline, or an article has no photo), the game shows a neutral placeholder instead of a broken image.

### Adding more items
1. Edit the relevant file in `data/` (add an object with the same shape as its neighbors — `id`, and either `wikiTitle`/`name` or `subject`/`text`, using the **exact** English Wikipedia article title so the photo lookup works).
2. Regenerate the browser-loadable bundle:
   ```bash
   npm run build:data
   ```
   This merges everything in `data/` into `js/data.bundle.js`, which is what `index.html` actually loads (plain JSON can't be `fetch()`-ed when the page is opened via `file://`, so we bundle it into a script instead).
3. Optionally validate that your new Wikipedia titles actually resolve and have a photo:
   ```bash
   npm run validate-images
   ```
   This calls the live Wikipedia API, so it needs real internet access — it also runs automatically in CI on every push (see `.github/workflows/validate-data.yml`).

## 🌐 Deploying to GitHub Pages

This is a static site, so GitHub Pages can serve it directly with no build step:

1. Push your changes to the `main` branch.
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose `main` and folder `/ (root)`, then **Save**.
5. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

Every future push to `main` automatically updates the live site — there's nothing else to configure.

## 🛠️ Technical Details

### Tech Stack
- **Frontend**: TypeScript (strict mode), compiled ahead of time to plain ES2019 JavaScript with [esbuild](https://esbuild.github.io/) — no frameworks, and no build step or dependencies required to *play* the deployed game
- **Styling**: CSS3 with custom properties
- **Architecture**: Client-side only; the only network calls at runtime are read-only photo lookups against Wikipedia's public API
- **Data**: Plain JSON authored by hand, bundled into a static script by a small typed Node script (only needed when *editing* content, not to play)

### File Structure
```
factpostor/
├── index.html                        # App structure (all screens + modal)
├── app.js                            # Generated from src/app.ts — game engine: modes, difficulty, role assignment, rendering
├── styles.css                        # UI styling and responsive design
├── src/
│   ├── types.ts                      # Shared data/domain types (no DOM dependency)
│   ├── dom-types.ts                  # Browser-facing API types (FactpostorI18n, FactpostorImages)
│   ├── global.d.ts                   # Window global augmentation for the data bundle + helper APIs
│   ├── i18n.ts                       # Translation lookup helper
│   ├── images.ts                     # Live Wikipedia photo fetching + caching + fallback UI
│   └── app.ts                        # Game engine source
├── js/
│   ├── data.bundle.js                # Generated from data/*.json — do not edit directly
│   ├── i18n.js                       # Generated from src/i18n.ts — do not edit directly
│   └── images.js                     # Generated from src/images.ts — do not edit directly
├── data/
│   ├── facts.json                    # Facts mode content
│   ├── classic-words.json            # Classic Impostor mode content
│   ├── famous-people.json            # Famous People mode content
│   ├── categories.json               # Category labels/icons/photos
│   └── i18n.json                     # UI strings (en/es/ca)
├── scripts/
│   ├── build-data.ts                 # data/*.json -> js/data.bundle.js
│   ├── build-app.ts                  # src/*.ts -> js/i18n.js, js/images.js, app.js (via esbuild)
│   └── validate-images.ts            # Checks every Wikipedia title actually resolves
├── tsconfig.json                     # Browser src/ typecheck config (DOM lib)
├── tsconfig.scripts.json             # Node scripts/ typecheck config
├── .github/workflows/validate-data.yml  # CI: typechecks, rebuilds + validates data/app bundles on every push
├── README.md
└── GAME_LOGIC.md                     # Detailed game rules and design
```

### Browser Compatibility
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Customization

CSS custom properties are defined at the top of `styles.css` for easy theming:
```css
:root {
    --primary-color: #3b82f6;
    --secondary-color: #8b5cf6;
    /* ... more variables */
}
```

## 🧪 Development

No build process is required to *play* the game — `index.html` loads plain, pre-built JS (`app.js`, `js/i18n.js`, `js/images.js`, `js/data.bundle.js`), so you can just open it and refresh your browser.

To work on the game logic itself, edit the TypeScript sources under `src/` (game engine, i18n, image loading) or the Node scripts under `scripts/`, then rebuild:

```bash
npm install       # one-time: installs TypeScript, esbuild, tsx
npm run typecheck # type-check src/ and scripts/
npm run build     # data/*.json -> js/data.bundle.js, src/*.ts -> js/i18n.js, js/images.js, app.js
```

Commit the regenerated files in `js/` and `app.js` along with your source changes — CI checks that they're up to date (see `.github/workflows/validate-data.yml`). A build step (`npm run build:data`) is also needed after editing anything under `data/`.

## 🤝 Contributing

Ideas for contributions:
- Add more items to `data/facts.json`, `data/classic-words.json`, or `data/famous-people.json` (see [Adding more items](#adding-more-items))
- Add another language
- Improve mobile responsiveness
- Add a category filter to narrow the item pool before starting
- Implement scoring across multiple rounds
- Add accessibility features

## 📝 License

MIT License - feel free to use, modify, and distribute this game.

## 🎯 Credits

Created as an implementation of the social deduction party game genre, inspired by games like Mafia, Werewolf, and Undercover. Photos courtesy of Wikipedia and the Wikimedia Commons contributors.

## 🔮 Future Enhancements

- [ ] Persistent scoreboard across multiple rounds
- [ ] Category filters within each mode
- [ ] Digital voting interface
- [ ] Timer for each game phase
- [ ] PWA support for offline installation
- [ ] More languages

---

**Ready to play?** Open `index.html` and start your first game!
