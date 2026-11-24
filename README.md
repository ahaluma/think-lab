# Think Lab 🧪

Small learning games for young children, in German (ready for more languages). Each game is tiny and does one thing well.

- Plain HTML, CSS and JavaScript. **No libraries, no build step, no npm.**
- Mobile first: big buttons, works on any phone or tablet.
- Little or no reading needed: pictures, spoken German (the browser's own voice) and sounds.
- Hosted for free as a Cloudflare Worker that only serves static files (`wrangler.jsonc`).

## Words we use

| Word         | Meaning                                                                                         | Example                         |
| ------------ | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| **Category** | A big learning area. One row of tiles on the start page.                                        | `zahlen`, `rechnen`, `sprache`  |
| **Skill**    | One ability inside a category (the "subcategory"). Groups the progress report.                  | `zahlen/zaehlen`, `rechnen/plus` |
| **Game**     | One folder with one game idea. Several small games may train the same skill.                    | `games/wie-viele/`              |
| **Level**    | The parameters that make a game easier or harder, listed in the game's `LEVELS`. After 5 stars the child moves up one level by itself. | `{ max: 3 }`, `{ max: 4 }` … |

Categories, skills and games are all listed in `public/catalog.js`. Levels stay inside each game, because only the game knows what "harder" means.

## How the project is laid out

```
think-lab/
├── public/                  ← everything inside here is the website
│   ├── index.html           ← start page: one row of tiles per category
│   ├── hub.js / hub.css     ← builds the start page from catalog.js
│   ├── catalog.js           ← THE LIST: categories, skills and games (one line per game)
│   ├── shared/
│   │   ├── base.css         ← colours, buttons, animations for every page
│   │   ├── kit.js           ← helpers: say(), sound, celebrate(), shuffle(), pick(), icons
│   │   ├── i18n.js          ← languages: texts(), fill(), local()
│   │   ├── progress.js      ← progress report saved on this device
│   │   ├── store.js         ← safe localStorage
│   │   └── lang/de.js       ← words every page needs (numbers, praise, button labels)
│   ├── games/
│   │   └── wie-viele/       ← one folder = one game (flat: the category is in catalog.js)
│   │       ├── index.html
│   │       ├── game.css
│   │       ├── game.js      ← the game and its LEVELS, no texts
│   │       └── lang/de.js   ← every sentence of this game
│   ├── eltern/              ← parents' page: the progress report
│   ├── _headers             ← security and cache settings for Cloudflare
│   ├── 404.html             ← "page not found"
│   └── favicon.svg, icon-*.png, manifest.webmanifest  ← app icon for the home screen
├── templates/
│   └── game/                ← copy this folder to start a new game
└── wrangler.jsonc           ← Cloudflare settings: serve public/ as a website
```

Rule of thumb: a game only uses its own folder plus `shared/`. Games never import from each other, so you can change or delete one without breaking the others. Games sit flat in `games/` (not `games/rechnen/plus/`), so a game keeps its address even if you move it to another category.

## Languages

Right now everything is German, but every page is built for more languages:

- **No text in `game.js`.** Every sentence lives in `lang/de.js` next to it. Sentences with changing parts are small functions, because each language has its own grammar (`ein Apfel`, `zwei Äpfel`).
- Words every page needs (numbers up to 20, praise, button labels) are in `public/shared/lang/de.js`.
- Names in `catalog.js` are written per language: `name: { de: "Wie viele?" }`.
- A page loads its texts with `const T = await texts(import.meta.url);`. If a sentence is missing in a language, the German one is used.
- In HTML, `data-t="key"` fills the text and `data-t-label="key"` fills the `aria-label`.

**To add a language** (for example English):

1. In `public/shared/i18n.js`, add a line to `LANGS`: `en: { name: "English", flag: "🇬🇧", voice: "en-GB" }`.
2. Copy every `lang/de.js` to `lang/en.js` and translate it (shared, every game, `eltern/`).
3. Add `en: "…"` next to every `de: "…"` in `catalog.js`.

The start page then shows flag buttons. The choice is saved on the device, and the read-aloud voice switches too. Without a choice, the phone's language is used, otherwise German.

## Progress report

Every game reports to `shared/progress.js`, which saves on this device only (localStorage key `thinklab:progress`). Nothing is sent anywhere.

- `progress.answer(id, true / false)` after every answer.
- `progress.round(id, newLevel, LEVELS.length)` after a finished round (5 stars).
- `progress.level(id)` gives the level to start with.

Parents open it with the chart button on the start page (`/eltern/`): the last 14 days, and for every category → skill → game the level, rounds, share of right answers and the last day played. "Fortschritt löschen" clears it.

## Step 1: Look at it on your computer

You need any small web server, because the pages use JavaScript modules (double-clicking `index.html` will not work). Python is already installed on most Macs and Linux machines:

```sh
cd think-lab/public
python3 -m http.server 8000
```

Open <http://localhost:8000> in your browser. Press `Ctrl+C` in the terminal to stop.

**On your phone:** while the server runs, open `http://<your-computer's-IP>:8000` on a phone in the same Wi-Fi. (Speech and sound need one tap first; that is why each game starts with a big ▶ button.)

## Step 2: Put it online with Cloudflare Workers (free)

You do this once. After that, every change merged into `main` goes live by itself in about a minute. The settings live in `wrangler.jsonc`: it tells Cloudflare to serve the `public/` folder as it is. No code runs on the server and there is nothing to build.

1. Log in at <https://dash.cloudflare.com> (create a free account if needed).
2. Go to **Workers & Pages → Create → Import a repository**.
3. Allow Cloudflare to see your GitHub account and pick the **think-lab** repository.
4. Check these settings (Cloudflare fills most of them from `wrangler.jsonc`):

   | Setting         | Value                  |
   | --------------- | ---------------------- |
   | Project name    | `think-lab`            |
   | Build command   | *(leave empty)*        |
   | Deploy command  | `npx wrangler deploy`  |
   | Root directory  | `/`                    |

5. Click **Deploy**. Your site will be at `https://think-lab.<your-name>.workers.dev` (Cloudflare shows the exact address).

Bonus: under **Settings → Build**, turn on builds for non-production branches. Then every pull request gets its own preview link, so you can try a new game on the phone before it goes live.

On the phone, open the site and choose **"Zum Home-Bildschirm"** (Safari) or **"Zum Startbildschirm hinzufügen"** (Chrome). Think Lab then opens full screen like an app.

## Step 3: Add a new game

1. Pick a short folder name, lowercase with dashes, for example `plus-aepfel`.
2. Copy the template:
   ```sh
   cp -r templates/game public/games/plus-aepfel
   ```
3. Add one line to `GAMES` in `public/catalog.js`, with the skill it trains:
   ```js
   { id: "plus-aepfel", skill: "rechnen/plus", name: { de: "Plus" }, icon: "➕", color: "#12a564" },
   ```
   A new skill or category is one more entry in `CATEGORIES` in the same file.
4. In `game.js`, set `ID` to the folder name and write the `LEVELS`. Put every sentence in `lang/de.js`.
5. Check it locally (Step 1), then commit on a new branch and open a pull request. Cloudflare posts a preview link on the pull request (if branch builds are on). Merge it when you are happy.

### The helpers in `shared/`

| Helper                     | What it does                                                      |
| -------------------------- | ----------------------------------------------------------------- |
| `say(T.question)`          | Reads text out loud in the device's language (built-in voice)     |
| `sound.tap()` / `right()` / `wrong()` / `win()` | Short sounds made in the browser, no files      |
| `celebrate()`              | Confetti                                                          |
| `shuffle(list)`, `pick(list)`, `randInt(1, 5)` | Random order, random item, random number        |
| `store.get(key, default)` / `store.set(key, value)` | Remember small things on this device     |
| `icons.home`, `icons.speaker`, `icons.play`, `icons.again`, `icons.chart` | Ready-made SVG icons |
| `T.numbers[3]`             | `"drei"` (from `shared/lang/de.js`)                               |
| `T.praise`                 | `["Super!", "Toll!", …]`, use with `pick()`                       |

## Guidelines for every game

- **No reading required.** Use pictures and `say()`. Text on screen is for parents.
- **Big targets.** Buttons at least 56 px, play area fits a 320 px wide phone without scrolling sideways.
- **Kind feedback.** Wrong answers get a soft sound and "nochmal", never a buzzer or a lost life.
- **Short rounds.** About five tasks, then a reward.
- **No libraries, no tracking, no external files.** Everything loads from this site, so it is fast and private.

## The games

| Game        | Folder              | Skill            | For the child                                                                                             |
| ----------- | ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| Wie viele?  | `games/wie-viele/`  | `zahlen/zaehlen` | Count the things (tap each one to hear "eins, zwei, drei…"), then tap the right number. Starts with 1–3 and allows one more after each 5 stars, up to 10. |
