# Think Lab 🧪

Small learning games for young children, in German. Each game is tiny and does one thing well.

- Plain HTML, CSS and JavaScript. **No libraries, no build step, no npm.**
- Mobile first: big buttons, works on any phone or tablet.
- Little or no reading needed: pictures, spoken German (the browser's own voice) and sounds.
- Hosted for free on Cloudflare Pages.

## How the project is laid out

```
think-lab/
├── public/                  ← everything inside here is the website
│   ├── index.html           ← start page (shows one big tile per game)
│   ├── hub.js / hub.css     ← builds the tiles from games.js
│   ├── games.js             ← THE LIST OF GAMES (one line per game)
│   ├── shared/
│   │   ├── base.css         ← colours, buttons, animations for every game
│   │   └── kit.js           ← helpers: say(), sound, celebrate(), shuffle(), store
│   ├── games/
│   │   └── wie-viele/       ← one folder = one game
│   │       ├── index.html
│   │       ├── game.css
│   │       └── game.js
│   ├── _headers             ← security and cache settings for Cloudflare
│   ├── 404.html             ← "page not found"
│   └── favicon.svg, icon-*.png, manifest.webmanifest  ← app icon for the home screen
└── templates/
    └── game/                ← copy this folder to start a new game
```

Rule of thumb: a game only uses its own folder plus `shared/`. Games never import from each other, so you can change or delete one without breaking the others.

## Step 1: Look at it on your computer

You need any small web server, because the pages use JavaScript modules (double-clicking `index.html` will not work). Python is already installed on most Macs and Linux machines:

```sh
cd think-lab/public
python3 -m http.server 8000
```

Open <http://localhost:8000> in your browser. Press `Ctrl+C` in the terminal to stop.

**On your phone:** while the server runs, open `http://<your-computer's-IP>:8000` on a phone in the same Wi-Fi. (Speech and sound need one tap first; that is why each game starts with a big ▶ button.)

## Step 2: Put it online with Cloudflare Pages (free)

You do this once. After that, every change merged into `main` goes live by itself in about a minute.

1. Log in at <https://dash.cloudflare.com> (create a free account if needed).
2. Go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Allow Cloudflare to see your GitHub account and pick the **think-lab** repository.
4. Use these build settings:

   | Setting                | Value                   |
   | ---------------------- | ----------------------- |
   | Production branch      | `main`                  |
   | Framework preset       | `None`                  |
   | Build command          | *(leave empty)*         |
   | Build output directory | `public`                |
   | Root directory         | *(leave empty)*         |

5. Click **Save and Deploy**. Your site will be at `https://think-lab-xxx.pages.dev` (Cloudflare shows the exact name).

Bonus: every pull request also gets its own preview link, so you can try a new game on the phone before it goes live.

On the phone, open the site and choose **"Zum Home-Bildschirm"** (Safari) or **"Zum Startbildschirm hinzufügen"** (Chrome). Think Lab then opens full screen like an app.

## Step 3: Add a new game

1. Pick a short folder name, lowercase with dashes, for example `farben`.
2. Copy the template:
   ```sh
   cp -r templates/game public/games/farben
   ```
3. Add one line to `public/games.js`:
   ```js
   { id: "farben", name: "Farben", icon: "🎨", color: "#e8488a" },
   ```
4. Build the game in `public/games/farben/game.js` and `game.css`. The template already has the home button, the "read again" button and an example of `say()`, `sound` and `celebrate()`.
5. Check it locally (Step 1), then commit on a new branch and open a pull request. Cloudflare posts a preview link on the pull request. Merge it when you are happy.

### The helpers in `shared/kit.js`

| Helper                     | What it does                                                      |
| -------------------------- | ----------------------------------------------------------------- |
| `say("Wie viele?")`        | Reads German text out loud (uses the phone's built-in voice)      |
| `sound.tap()` / `right()` / `wrong()` / `win()` | Short sounds made in the browser, no files      |
| `celebrate()`              | Confetti                                                          |
| `shuffle(list)`, `randInt(1, 5)` | Random order, random number                                 |
| `store.get(key, default)` / `store.set(key, value)` | Remember small things (like a level) on this device |
| `icons.home`, `icons.speaker`, `icons.play`, `icons.again` | Ready-made SVG icons                |
| `NUMBER_WORDS[3]`          | `"drei"`                                                          |

## Guidelines for every game

- **No reading required.** Use pictures and `say()`. Text on screen is for parents.
- **Big targets.** Buttons at least 56 px, play area fits a 320 px wide phone without scrolling sideways.
- **Kind feedback.** Wrong answers get a soft sound and "nochmal", never a buzzer or a lost life.
- **Short rounds.** About five tasks, then a reward.
- **No libraries, no tracking, no external files.** Everything loads from this site, so it is fast and private.

## The games

| Game        | Folder              | For the child                                                                                             |
| ----------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| Wie viele?  | `games/wie-viele/`  | Count the things (tap each one to hear "eins, zwei, drei…"), then tap the right number. Starts with 1–3 and allows one more after each 5 stars, up to 10. |
