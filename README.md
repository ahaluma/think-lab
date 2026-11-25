# AnkaPlay

Small number and logic games for young children („अङ्क“ / *anka* = number), in German, English and Nepali. Each game is tiny and does one thing well.

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
│   │   ├── things.js        ← the 34 animals and things that number games count and compare
│   │   ├── store.js         ← safe localStorage
│   │   └── lang/de.js       ← words every page needs (numbers, praise, names of the things)
│   ├── games/
│   │   └── wie-viele/       ← one folder = one game (flat: the category is in catalog.js)
│   │       ├── index.html
│   │       ├── game.css
│   │       ├── game.js      ← the game and its LEVELS, no texts
│   │       └── lang/de.js   ← every sentence of this game
│   ├── eltern/              ← parents' page: the progress report
│   ├── datenschutz/         ← privacy policy (DE/EN/NE); your contact details go in contact.js
│   ├── _headers             ← security and cache settings for Cloudflare
│   ├── 404.html             ← "page not found"
│   └── favicon.svg, icon-*.png, manifest.webmanifest  ← the AnkaPlay logo and home-screen icon
├── templates/
│   └── game/                ← copy this folder to start a new game
└── wrangler.jsonc           ← Cloudflare settings: serve public/ as a website
```

Rule of thumb: a game only uses its own folder plus `shared/`. Games never import from each other, so you can change or delete one without breaking the others. Games sit flat in `games/` (not `games/rechnen/plus/`), so a game keeps its address even if you move it to another category.

## Languages

Every page speaks German, English and Nepali (नेपाली). The start page has flag buttons; the choice is saved on the device and the read-aloud voice switches with it. Without a choice, the phone's language is used, otherwise German.

- **No text in `game.js`.** Every sentence lives in `lang/de.js`, `lang/en.js` and `lang/ne.js` next to it. Sentences with changing parts are small functions, because each language has its own grammar (`ein Apfel`, `zwei Äpfel`).
- Words every page needs (numbers up to 20, praise, button labels) are in `public/shared/lang/de.js`, `en.js` and `ne.js`.
- Names in `catalog.js` are written per language: `name: { de: "Wie viele?", en: "How many?" }`.
- A page loads its texts with `const T = await texts(import.meta.url);`. If a sentence is missing in a language, the German one is used.
- In HTML, `data-t="key"` fills the text and `data-t-label="key"` fills the `aria-label`.

**Nepali:** numbers on screen use Devanagari digits (३) via `num(n)` (the `digits` in `LANGS`) from `i18n.js`. Many phones have no Nepali voice; then a Hindi voice reads the text (`fallbackVoices` in `LANGS`). On Android you can add the Nepali voice under Settings → Text-to-speech → Google → Install voice data → नेपाली.

**To add a language** (for example French):

1. In `public/shared/i18n.js`, add a line to `LANGS`: `fr: { name: "Français", flag: "🇫🇷", voice: "fr-FR" }`.
2. Copy every `lang/de.js` to `lang/fr.js` and translate it (shared, every game, `eltern/`).
3. Add `fr: "…"` next to every `de: "…"` in `catalog.js`.

## Progress report

Every game reports to `shared/progress.js`, which saves on this device only (localStorage key `thinklab:progress`). Nothing is sent anywhere.

- `progress.answer(id, true / false)` after every answer.
- `progress.round(id, newLevel, LEVELS.length)` after a finished round (5 stars).
- `progress.level(id)` gives the level to start with.

Parents open it with the chart button on the start page (`/eltern/`): the last 14 days, and for every category → skill → game the level, rounds, share of right answers and the last day played. "Fortschritt löschen" clears it.

## Privacy

AnkaPlay loads nothing from other servers: no analytics, no cookies, no ads, no fonts or libraries from a CDN. The only data stored is the progress in the browser's localStorage on the device. The privacy policy at `/datenschutz/` explains this in German (binding), English and Nepali.

**Before going public:** put your name, postal address and e-mail (phone optional) in `public/datenschutz/contact.js`. While they are empty, the "Verantwortlicher" section is hidden. Also make sure Cloudflare Web Analytics is switched off for this site in the Cloudflare dashboard. The policy is a careful template, not legal advice.

If you ever add something that sends data elsewhere (analytics, a font from Google, a video), update the policy in the same pull request.

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

On the phone, open the site and choose **"Zum Home-Bildschirm"** (Safari) or **"Zum Startbildschirm hinzufügen"** (Chrome). AnkaPlay then opens full screen like an app.

## Step 3: Add a new game

1. Pick a short folder name, lowercase with dashes, for example `plus-aepfel`.
2. Copy the template:
   ```sh
   cp -r templates/game public/games/plus-aepfel
   ```
3. Add one line to `GAMES` in `public/catalog.js`, with the skill it trains:
   ```js
   { id: "plus-aepfel", skill: "rechnen/plus", name: { de: "Plus", en: "Plus" }, icon: "➕", color: "#12a564" },
   ```
   A new skill or category is one more entry in `CATEGORIES` in the same file.
4. In `game.js`, set `ID` to the folder name and write the `LEVELS`. Put every sentence in `lang/de.js`, `lang/en.js` and `lang/ne.js`. Write numbers on screen with `num(n)`.
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
| `T.numbers[3]`             | `"drei"` / `"three"` (from `shared/lang/`)                         |
| `oneOf(T.praise)`, `oneOf(T.oops)` | A different praise (`"Toll!"`, `"Juhu!"` …) or soft hint (`"Fast!"`, `"Ups!"` …) each time, never twice in a row |
| `things(T)` (`shared/things.js`) | The 34 animals and things with icon and names in the current language |
| `T.amount(n, thing, T.numbers[n])` | `"drei Elefanten"`, `"one elephant"`, `"तीनवटा हात्ती"` |

## Guidelines for every game

- **No reading required.** Use pictures and `say()`. Text on screen is for parents.
- **Big targets.** Buttons at least 56 px, play area fits a 320 px wide phone without scrolling sideways.
- **Kind feedback.** Wrong answers get a soft sound and "nochmal", never a buzzer or a lost life.
- **Short rounds.** About five tasks, then a reward.
- **No libraries, no tracking, no external files.** Everything loads from this site, so it is fast and private.

## The games

| Game        | Folder              | Skill            | For the child                                                                                             |
| ----------- | ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| Wie viele?  | `games/wie-viele/`  | `zahlen/zaehlen` | Count the things (tap each one to hear "eins, zwei, drei…"), then tap the right number. 34 things to count (apples, elephants, unicorns, kangaroos, sharks, pandas…). Starts with 1–3 and allows one more after each 5 stars, up to 10. |
| Wo sind mehr? | `games/wo-sind-mehr/` | `zahlen/vergleichen` | Two groups of the same animal: tap the one with more. Levels go from big differences (5 vs 2) to close ones (7 vs 6), then add a "the same" button, then sometimes ask "where are fewer?". After the answer both groups show their number. |
| Blitzblick | `games/blitzblick/` | `zahlen/simultan` | A picture flashes up for a moment and hides: how many were there? Trains seeing small amounts at a glance (subitizing). Every round shows other animals, fruit or things. Levels: dice patterns 1–6 (2 s down to 1 s), then random places, then 5 + x in a 2 × 5 frame. Tap the card to see it again; a wrong answer shows it once more. |
| Zahlenzug | `games/zahlenzug/` | `zahlen/reihe` | A train with numbered wagons. Find the missing wagon, say which number comes after or before, or hang the mixed-up wagons on in order (each one is read out). Levels: 1–4, 1–5, after/before up to 10, trains starting anywhere up to 10, after/before up to 20. The train drives off after each right answer. |
| Wer kommt dazu? | `games/wer-kommt-dazu/` | `rechnen/dazu-weg` | Animals on a meadow; one hops in or runs away: how many are there now? Trains one more / one less without plus or minus signs. Levels: animals stay visible, then they hide behind a bush first (think, don't recount; after two wrong answers the bush opens), then two animals at once, up to 10. |
