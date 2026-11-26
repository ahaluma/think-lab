# AnkaPlay

Small number and logic games for young children („अङ्क“ / *anka* = number), in German, English and Nepali. Each game is tiny and does one thing well.

**What we are building and why:** see [docs/VISION.md](docs/VISION.md) (learning goals, design principles, how difficulty adapts, open questions for reviewers).

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
| **Level**    | The parameters that make a game easier or harder, in the game's `levels.js`. Each level has a fixed `id`, the `age` it is made for and a `label` for parents. The level follows the child by itself (`shared/adapt.js`). | `{ id: "bis-3", age: 3, max: 3 }` … |

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
│   │   ├── progress.js      ← progress report saved on this device, one per child
│   │   ├── profiles.js      ← children on this device (name, age, animal)
│   │   ├── fit.js           ← which games and start levels fit a child's age
│   │   ├── gen.js           ← task generators: random kit, seeds (?seed=7), no repeats
│   │   ├── rechnen.js       ← arithmetic tasks for Plus (later Minus): numbers, answer choices, column sums
│   │   ├── numpad.js        ← number pad for typed answers (children from 8, parents can switch it)
│   │   ├── things.js        ← the 34 animals and things that number games count and compare
│   │   ├── store.js         ← safe localStorage
│   │   └── lang/de.js       ← words every page needs (numbers, praise, names of the things)
│   ├── games/
│   │   └── wie-viele/       ← one folder = one game (flat: the category is in catalog.js)
│   │       ├── index.html
│   │       ├── game.css
│   │       ├── game.js      ← the game, no texts
│   │       ├── levels.js    ← its levels: id, age, label, parameters
│   │       ├── tasks.js     ← task(level, r): makes one task as plain data (shared/gen.js)
│   │       └── lang/de.js   ← every sentence of this game
│   ├── eltern/              ← parents' page: the progress report
│   ├── datenschutz/         ← privacy policy (DE/EN/NE); your contact details go in contact.js
│   ├── _headers             ← security and cache settings for Cloudflare
│   ├── 404.html             ← "page not found"
│   └── favicon.svg, icon-*.png, manifest.webmanifest  ← the AnkaPlay logo and home-screen icon
├── tools/
│   └── check-tasks.mjs      ← optional: node tools/check-tasks.mjs checks every game's tasks.js
├── templates/
│   └── game/                ← copy this folder to start a new game
└── wrangler.jsonc           ← Cloudflare settings: serve public/ as a website
```

Rule of thumb: a game only uses its own folder plus `shared/`. Games never import from each other, so you can change or delete one without breaking the others. Games sit flat in `games/` (not `games/rechnen/plus/`), so a game keeps its address even if you move it to another category.

## The new world (`public/welt/`)

A second way into AnkaPlay is growing next to the games: `/welt/`. The start page has a door to it
("Neu: die Welt entdecken"), the games stay as they are.

The idea: a **grid of ideas and perspectives**. Every mathematical idea can be played in five
perspectives, each with a fixed symbol: see 👁️, make ✋, explore 🔍, use 🔑, check ✅. The map is a
piece of nature with six places. A place with something to play is awake, the others sleep.
Three places are awake:

| Place | Idea | See 👁️ | Make ✋ | Explore 🔍 | Use 🔑 | Check ✅ |
| --- | --- | --- | --- | --- | --- | --- |
| Meadow and stream | `zahl`: a number says how many | flowers at a glance | pick n flowers | the missing stepping stone | where are more? | the owl has counted |
| Burrow and pond | `teile`: numbers are made of numbers | animals hide in the burrow | split on two leaves | the hollow tree | a hidden part | the owl adds |
| Forest | `muster`: a row goes on, because one piece comes again and again | what comes next? | lay the next things | which piece comes again? | the same row with other things | the owl laid a row: find the wrong thing |

**Three number ranges: up to 5, 10 and 20** (`ranges` in `frame/ideas.js`). A child starts by age
(`frame/record.js`): under 6 up to 5, at 6 up to 10, from 7 up to 20. After a round the three faces
move the range up or down; a range the child chose to go down to stays. Up to 10 the answer buttons
show the digit and that many dots. Up to 20 they show only the digit, the dots stay on the sign of the
whole and in the hint. More than ten pictures are drawn smaller, still five in a row. In the range up
to 20 the stepping stones also go in steps of two.

The forest has no numbers: every answer is a picture. Its three ranges are the length of the piece
that repeats: two things (🍄🌰), three (🍄🌰🌰) or four (🍄🌰🍄🍂). A wrong answer is never the same
row started at another place (`sameWay` in `ideas/muster/tasks.js`), because that would be right too.
It holds the idea of the old game "Muster-Kette".

The meadow holds the ideas of the old games "Blitzblick", "Wie viele?", "Zahlenzug" and "Wo sind
mehr?", the forest the idea of "Muster-Kette". These five games have **moved**: in `catalog.js` they
carry `moved: "<idea>"` and are no longer on the start page (`shared/fit.js`). Their folders stay, and
parents can switch each one back on per child on `/eltern/`.

**The parents' report** (`/eltern/`) shows the world first: one card per place with the range the
child plays in, the rounds, and for each of the five perspectives new / played / understood and how
many of the last tasks were right at the first try (`record.report(kid)` in `frame/record.js`). The
chart of the last 14 days counts answers from the games and from the world together (`daily` in the
world record). "Fortschritt löschen" clears both.

```
public/welt/
├── index.html, map.js     ← the map
├── welt.css               ← all styles of the new world
├── frame/                 ← the same for every idea
│   ├── ideas.js           ← the grid: perspectives, thinking cards, places, ideas
│   ├── record.js          ← what the child can do, per idea, perspective and number range
│   ├── voice.js           ← every sentence is spoken (if on) and always shown as text
│   └── parts.js           ← building blocks of the boards: pictures, the number sign, number buttons
├── ideas/<idea>/          ← one idea: zahl (the meadow), teile (the burrow)
│   ├── tasks.js           ← the tasks of the five perspectives (data only)
│   └── boards.js          ← how each perspective looks and reacts
├── spiel/                 ← one round: tasks, one surprise from another perspective, a thinking card
├── sichern/               ← for parents: save everything to a file, load it again
└── lang/                  ← de, en, ne
public/sw.js               ← keeps copies of the files, so the app works without a connection
```

**To add an idea:** add it to `IDEAS` and wake its place in `frame/ideas.js`, write
`ideas/<id>/tasks.js` (`task`, `check`) and `ideas/<id>/boards.js` (`BOARDS` with the five
perspectives), put its texts under its id in the three files of `lang/`, give the place its flower
spots in `map.js`, and list the two new files in `public/sw.js`. A round is `/welt/spiel/?i=<id>&p=sehen`.

**How children learn, and what follows for every board** (keep to this when you add an idea):

- **From the thing to the picture to the number** (Bruner; "concrete, pictorial, abstract"). The child
  first moves or sees real things, then pictures and dots, and only at the end bare digits.
- **Help that fades** (Vygotsky, scaffolding). The first round of a perspective shows more: in "see"
  the animals stay visible in the burrow. From the second round on they hide.
- **Show, do not tell** (little to hold in the head). The story of a task happens on screen in steps,
  with one short sentence per step. Short, everyday words; no school words.
- **The picture is true to the world.** Apples fall down, so the tree is above and the grass below.
- **Whole and parts, in rows of five.** Dots and things are laid out so that 5 and 10 are seen at a glance.
- **A wrong answer explains, it does not punish.** It says what the child did; the hint shows the structure.
- **Coming back counts.** An idea counts as understood only when it works on two different days.

A round has no points, no clock and no streak. After a round a flower grows on the map and the
child says how it felt (easy, just right, hard). `node tools/check-welt.mjs` checks the tasks.

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

Parents add children on `/eltern/` (name, age, animal; `shared/profiles.js`, key `thinklab:profiles`). The start page asks "Wer spielt?" when there are several children, and every game shows the child's animal and name top left (`homeButton()` from `kit.js`, tap = back to "Wer spielt?"). Without children the games still work and progress goes to a guest entry. Progress saved before profiles existed becomes the first child, without a name, until the parents add one.

**Games that fit the age** (`shared/fit.js`). Every game in `catalog.js` has `ages: [from, to]`. A child sees the games for their age; games for younger children stay visible 2 more years (`EASY_GRACE`). Parents can switch any game on or off per child on `/eltern/`. The age is saved with the day it was entered and grows by one every year after that, so no birthday is stored. The first time a child plays a game, it starts at the highest level whose `age` is at least 2 years below the child's age (`START_BELOW`): generous on purpose, the child moves up quickly from there.

Every game reports to `shared/progress.js`, which saves on this device only, one report per child (localStorage key `thinklab:progress:<child id>`). Nothing is sent anywhere.

- `progress.answer(id, true / false)` after every answer.
Games don't call it directly. They use `shared/adapt.js`, which saves through progress.js and moves the level:

- `const play = adapt.player(ID, LEVELS)` once; `level = play.level` when a task starts.
- `play.answer(true / false)` after every answer, `play.solved()` when a task is done (one star), `play.round()` after a finished round (5 stars).

**The level follows the child** (`shared/adapt.js`, all numbers at the top of the file):

1. Placement: in the first 2 rounds of a game, 3 tasks right the first time in a row → one level up at once.
2. After every round: 4–5 of 5 right the first time → up; 2 or fewer → down; 3 → stay.
3. Always: 3 wrong answers in a row → the next task is one level easier.

Per child and game it keeps the level id, the last 10 tasks (right the first time or not) and today's counts.

Progress saves the level's `id`, so levels can be added or reordered later without moving a child to a different level. Never rename a level id.

Parents open it with the "Eltern" button (an adult and a child) on the start page (`/eltern/`): the last 14 days, and for every category → skill → game the level with its label, rounds, share of right answers and the last day played, and a switch per game: does this child see it? "Fortschritt löschen" clears it.

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
   { id: "plus-aepfel", ages: [5, 8], skill: "rechnen/plus", name: { de: "Plus", en: "Plus" }, icon: "➕", color: "#12a564" },
   ```
   A new skill or category is one more entry in `CATEGORIES` in the same file.
4. In `game.js`, set `ID` to the folder name. Write the levels in `levels.js` (id, age, label, parameters) and the game's `ages` in `catalog.js`. Put every sentence in `lang/de.js`, `lang/en.js` and `lang/ne.js`. Write numbers on screen with `num(n)`.
5. Check it locally (Step 1), then commit on a new branch and open a pull request. Cloudflare posts a preview link on the pull request (if branch builds are on). Merge it when you are happy.

### The helpers in `shared/`

| Helper                     | What it does                                                      |
| -------------------------- | ----------------------------------------------------------------- |
| `say(T.question)`          | Reads text out loud in the device's language (built-in voice). From 8 years (or when the parents switch it off on `/eltern/`) it shows the text under the top bar instead; the 🔊 button (`id="speak"`) still reads aloud |
| `sound.tap()` / `right()` / `wrong()` / `win()` | Short sounds made in the browser, no files      |
| `celebrate()`              | Confetti                                                          |
| `shuffle(list)`, `pick(list)`, `randInt(1, 5)` | Random order, random item, random number        |
| `store.get(key, default)` / `store.set(key, value)` | Remember small things on this device     |
| `icons.home`, `icons.speaker`, `icons.play`, `icons.again`, `icons.chart` | Ready-made SVG icons |
| `T.numbers[3]`             | `"drei"` / `"three"` (from `shared/lang/`)                         |
| `oneOf(T.praise)`, `oneOf(T.oops)` | A different praise (`"Toll!"`, `"Juhu!"` …) or soft hint (`"Fast!"`, `"Ups!"` …) each time, never twice in a row |
| `things(T)` (`shared/things.js`) | The 34 animals and things with icon and names in the current language |
| `T.amount(n, thing, T.numbers[n])` | `"drei Elefanten"`, `"one elephant"`, `"तीनवटा हात्ती"` |

### Tasks come from a generator (`shared/gen.js`)

Where a game has tasks (rounds), one function makes each task, so every round is different. The game file only draws what it gets.

- `games/<id>/tasks.js` exports `task(level, r)`: it returns one task as **plain data** (numbers, ids, places; no DOM, no texts). `level` is the object from `levels.js`, so the level's parameters decide how hard it is. `r` is the random kit (`r.int(1, 5)`, `r.pick(list)`, `r.shuffle(list)`, `r.sample(list, n)`, `r.chance(0.3)`): use it instead of `Math.random`, `randInt` or `shuffle` from `kit.js`.
- It may also export `check(task, level)`, which returns a list of problems (empty = fine).
- `game.js` makes one generator and asks it for each task:
  ```js
  const nextTask = gen.generator(task, { avoid: { thing: 3, count: 1 } }); // not the same thing as in the last 3 tasks, not the same number as last time
  const t = nextTask(LEVELS[play.level]);
  ```
- **Testing:** open a game with `?seed=7` in the address (`/games/wie-viele/?seed=7`) and it deals the same tasks every time (at the same level). Without a seed every game is different. `node tools/check-tasks.mjs` (optional, nothing to install) makes 2000 tasks per level of every game with a `tasks.js`, runs `check()` on them and shows how many different tasks each level has.

`wie-viele` is the example; `wo-sind-mehr`, `blitzblick`, `zahlenzug`, `wer-kommt-dazu`, `zahlenhaus`, `zehnerfreunde`, `gleich-machen`, `gerecht-teilen`, `wer-ist-erster`, `zahlen-memory`, `muster-kette`, `groessen`, `raumlage`, `reihenfolge`, `sortieren`, `genau-hinschauen` and `formen` use it too. `shared/rechnen.js` is the same idea for the arithmetic games and moves to this pattern when Plus does.

## Guidelines for every game

- **No reading required.** Use pictures and `say()`. Text on screen is for parents. Children from 8 read the `say()` sentences themselves (`profiles.readAloud`), so every game needs the 🔊 button with `id="speak"`.
- **Big targets.** Buttons at least 56 px, play area fits a 320 px wide phone without scrolling sideways.
- **Kind feedback.** Wrong answers get a soft sound and "nochmal", never a buzzer or a lost life.
- **Short rounds.** About five tasks, then a reward.
- **No libraries, no tracking, no external files.** Everything loads from this site, so it is fast and private.

## The games

| Game        | Folder              | Skill            | For the child                                                                                             |
| ----------- | ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| Wie viele?  | `games/wie-viele/`  | `zahlen/zaehlen` | Count the things (tap each one to hear "eins, zwei, drei…"), then tap the right number. 34 things to count (apples, elephants, unicorns, kangaroos, sharks, pandas…). Starts with 1–3 and goes up to 10. |
| Wo sind mehr? | `games/wo-sind-mehr/` | `zahlen/vergleichen` | Two groups of the same animal: tap the one with more. Levels go from big differences (5 vs 2) to close ones (7 vs 6), then add a "the same" button, then sometimes ask "where are fewer?". After the answer both groups show their number. |
| Blitzblick | `games/blitzblick/` | `zahlen/simultan` | A picture flashes up for a moment and hides: how many were there? Trains seeing small amounts at a glance (subitizing). Every round shows other animals, fruit or things. Levels: dice patterns 1–6 (2 s down to 1 s), then random places, then 5 + x in a 2 × 5 frame. Tap the card to see it again; a wrong answer shows it once more. |
| Zahlenzug | `games/zahlenzug/` | `zahlen/reihe` | A train with numbered wagons. Find the missing wagon, say which number comes after or before, or hang the mixed-up wagons on in order (each one is read out). Levels: 1–4, 1–5, after/before up to 10, trains starting anywhere up to 10, after/before up to 20. The train drives off after each right answer. |
| Wer kommt dazu? | `games/wer-kommt-dazu/` | `rechnen/dazu-weg` | Two steps: first count the animals on the meadow, then one hops in or runs away: how many are there now? Trains one more / one less without plus or minus signs. Levels: animals stay visible, then they hide behind a bush first (think, don't recount; after two wrong answers the bush opens), then two animals at once, up to 10. |
| Zahlenhaus | `games/zahlenhaus/` | `rechnen/zerlegen` | Count the animals in front of the house (the house shows 0, the number appears on a meadow sign), then some walk into the house at once. Early levels (house open): how many are in the house? how many are still outside? Later levels (house closed): the child knows the total and sees who is outside: how many are hiding in the house? (first wrong answer: think again; second: the house opens). At the end the total appears in a block next to the house: "Drei und zwei sind zusammen fünf." Levels: 3, 4, 3–5 open; 3–4, 5, 3–6, 6–7, 7–8, 8–10 closed. |
| Zehnerfreunde | `games/zehnerfreunde/` | `rechnen/zerlegen` | How many are missing to 10? A ten-frame (2 × 5 places) with animals: tap how many places are still empty. At the end the missing animals fill the empty places (on green): "Sieben und drei sind zusammen zehn." Levels: one row of 5; 10 with the top row full; any amount; animals mixed up in the frame; frame shown only briefly (tap to look again); only numbers 7 + ? = 10 (after two wrong answers the frame helps); also ? + 3 = 10. |
| Plus | `games/plus/` | `rechnen/plus` | Adding, ages 5–10, 15 levels: pictures to 5 and 10 (🐰🐰🐰 + 🐰🐰); counting on from a bush; numbers only; gaps (3 + ? = 7); above 10 with two ten-frames (8 + 5 = 8 + 2 + 3); gaps above 10; whole tens, then to 100 without and with carrying; whole hundreds, then to 1000 without and with carrying. After two wrong answers pictures, ten-frames or a place-value chart (hundreds plates, tens sticks, ones cubes: 38 + 27 = 50 + 15) help. The numbers come from `shared/rechnen.js`. |
| Gleich machen | `games/gleich-machen/` | `rechnen/minus` | Two meadows, one with more animals: make them equal. A first step towards minus. The child taps animals on the fuller meadow and they hop into their house (tap the house: one comes back), then ✓. Right: both groups jump and the sum shows (7 − 3 = 4): "Drei Hasen gehen nach Hause. Jetzt sind auf beiden Wiesen vier." After two wrong answers the animals line up in pairs, a line joins partners and the ones without a partner glow. Tapping the smaller meadow, too many or too few count as wrong. Levels: up to 5, up to 10; then give the number with pictures (7 − ? = 4: one of three, or the number pad from 8), then numbers only (the pairs help after two wrong answers); then the other way round: "Wie viele müssen dazu?" (tap the house of the smaller meadow, 4 + ? = 7), numbers only, away or more mixed up to 10 and up to 20. |
| Wer ist Erster? | `games/wer-ist-erster/` | `zahlen/ordnung` | Ordinal numbers: the animals queue for ice cream, the one at the ice-cream cart is the first. "Tippe auf das dritte Tier!" Levels: first or last (3–4 animals), first to third, first to fifth (sometimes "the last"), "Das wievielte Tier ist der Löwe?" (one of three answers like "3.", the number pad from 8), "Wer steht direkt vor / hinter dem Löwen?", up to the eighth, counting from the back ("das zweite Tier von hinten"), then all mixed. A wrong tap says what it was ("Das ist das zweite Tier."); after two wrong answers the places 1, 2, 3 … appear under the animals (from the back on "von hinten" tasks). The animal found gets its place in green. |
| Gerecht teilen | `games/gerecht-teilen/` | `rechnen/teilen` | A basket of cookies (apples, carrots …) and 2–4 animal friends with a plate each: share fairly. A first idea of dividing and halving. The child taps a plate and one thing jumps from the basket onto it (tap it on the plate: back into the basket), then ✓. Right: the friends jump, every plate shows its number and the sum appears (6 : 2 = 3): "Jeder bekommt drei Kekse." After two wrong answers every plate shows how many are on it. Levels: 2 friends up to 6 and 10, 3 friends up to 12, 2–4 friends; then one or two are left over and stay in the basket ("Eins bleibt im Korb. Das kann man nicht gerecht teilen."); then halving (5 for 2: the last one is tapped and cut in half, two and a half each, 5 : 2 = 2½); then "Wie viele bekommt jeder?" with pictures (one of three, or the number pad from 8; after two wrong answers the things are dealt out one by one), numbers only up to 20 and up to 50 (times tables). |
| Zahlen-Memory | `games/zahlen-memory/` | `zahlen/erkennen` | Memory with number cards (4) and picture cards (4 apples). Every tapped card is read out. Levels: 3 open pairs up to 3 and 5, then face down with 3–6 pairs up to 10. A wrong pair counts as a mistake only with open cards. One star per board, 3 boards per game. |
| Muster-Kette | `games/muster-kette/` | `logik/muster` | A chain of animals, fruit or flowers repeats a pattern: what comes next? Tap one of three big pictures. Levels: AB (🍎🍌🍎🍌), longer AB, ABB, ABC, AABB, all mixed, then the empty bead moves into the middle: what is missing? After two wrong answers the repeating part is marked. For older children: growing patterns (🍎🍌 / 🍎🍎🍌 / 🍎🍎🍎🍌, one row per step), number sequences (to 20, steps of 2–10 also backwards, to 100), shape and colour at once (🔴🟦🟡…: the shape follows one pattern, the colour another), and a mix of the hard ones. From 9 years, number sequences up to 1000: times sequences (×2, ×3: 5, 10, 20, 40, ?), divided-by sequences (÷2, ÷3: 729, 243, 81, ?), a step that grows each time (+1, +2, +3 …), times and divided by 2–5 with the gap in the middle, square and triangular numbers, Fibonacci (1, 1, 2, 3, 5, 8 … and with other start numbers), primes up to 100, all famous sequences with the gap in the middle, and a mix of all hard number sequences. Number chains: from 8 the child types the number on the number pad (it shows in the empty bead); the hint uses the numbers of the chain ("5 und 8 sind 13", "7 mal 7 ist 49") and comes after 5 wrong tries, the answer after 7. |
| Größen vergleichen | `games/groessen/` | `messen/groessen` | Compare sizes, ages 3–7. Tap the longer pencil, the higher tower, the glass with more water, or on a balance the heavier side (it goes down); later also shorter, lower, less, lighter. Levels: two pencils or towers, also shorter/lower, two glasses, a balance with two animals (an elephant is heavier than a rabbit), three things (the longest, the most water), put three in order by tapping (each gets its number, then they line up), pencils that don't start at one line and towers on hills, small but heavy (a stone and a balloon: the balance tells the truth), wide and narrow glasses (the lower water can be more), four or five in order (also big to small), two balances with three parcels (which is the heaviest of all?), all mixed. After a wrong answer (with only two things: after one) help: dashed lines at the ends, everything moves onto one line or one ground, the water is poured into the same glasses, an arrow shows the side that went down, or the next one to tap wiggles. |
| Sortieren | `games/sortieren/` | `logik/sortieren` | One thing at a time: tap the basket where it belongs. Each basket already holds one example. Levels: animal or fruit, animal or vehicle, red or yellow, red/yellow or green (coloured baskets), big or small animals, all mixed; then "Was passt nicht dazu?": four things, three belong together (kind, colour, then all rules). After the right odd one: "Die anderen sind alle Tiere." Harder levels: 3 baskets (animal/fruit/vehicle, red/yellow/green), tricky things (a blue whale when the animal basket shows a red ladybird and the vehicle basket a blue car: "Die Farbe ist egal!"), 4 baskets (adds flowers, blue), a rule switch (four things sorted by colour, then "Neue Regel!" and the same four by kind), then all of these mixed. For older children: colour and kind at once (4 baskets: red animal, red fruit, yellow animal, yellow fruit), find the rule yourself (each basket shows two examples, nobody says the rule), hidden rules (can it fly? at home in the water or on land? a penguin cannot fly), odd one out with hidden rules, and a mix of the hard ones. |
| Formen | `games/formen/` | `logik/formen` | Circle, triangle, square and rectangle (shapes drawn as SVG, no pictures to load). Find: "Tipp auf den Kreis!" one of three, then of four in other colours and sizes, then turned, long or flat (a triangle on its tip is still a triangle). Build pictures: a house, an ice cream, a rocket, a robot … made of shapes; the gaps are dashed and the next one glows: which shape fits? (small pictures with 2–3 parts, then 4–6 parts). Find all: nine shapes on a board, tap all the triangles. Count: how many circles are in the train? (one of three, or the number pad from 8). Riddles: "Ich habe drei Ecken. Wer bin ich?" Then all of these mixed. After two wrong answers (typing: five) the corners get dots and the game says what makes the shape; when counting only the shapes to count stay bright. |
| Wo ist es? | `games/raumlage/` | `logik/raumlage` | Where things are (Raumlage), ages 3–7. Animals sit around a table with a cloth: "Wer ist unter dem Tisch?" (tap the animal) or one waits at the top: "Setz mich auf den Tisch!" (tap the empty place). Words: auf, unter, neben, vor, hinter (only the head peeks out above the table), then links and rechts from the child's view; animals on a bench: "Wer sitzt zwischen dem Hasen und dem Fuchs?", "links neben dem Bären?"; a shelf with 3 × 3 compartments: "Wer sitzt oben links?", "Setz mich unten in der Mitte!". A wrong animal says where it is ("Der Fuchs ist neben dem Tisch."); after two wrong answers the right place glows, for left and right with the tip "your left hand makes an L". Levels: auf/unter, + neben, put it there, vor/hinter, zwischen, links/rechts, put it left/right, a row of 5, shelf, put it in the shelf, all mixed. |
| Genau hinschauen | `games/genau-hinschauen/` | `logik/hinschauen` | Concentration practice for preschoolers, two kinds of task taking turns (find, copy, find, copy, find). **Find the differences:** two pictures (a little landscape with animals and things) are almost the same; tap what is different on either picture: a thing is missing, another thing, looks the other way, or is smaller. Found ones get a green ring on both pictures and are named ("Die Schnecke schaut in die andere Richtung. Noch zwei Unterschiede."). After two wrong taps the next difference glows. **Copy the shapes:** a model with coloured shapes on top, an empty board below: tap a shape, then a place (tap again to take it away), then ✓. A wrong ✓ gives a hint (too few, too many, look at the places); after two the places that are still different glow; after five the solution shows. Levels: 2 × 2 with 1 difference and one shape; 3 × 3 with 1, 2, 3 differences (also turned around) and 1–3 shapes plus one that is not needed; 4 × 4 (also smaller, 4 colours, stars and hearts); copy from memory (the model is covered after 5 s, tap the cloth to look again); copy mirrored as in a lake (the top row goes to the bottom); 5 × 5 with 5 small differences where a swapped thing is one already in the picture; expert: mirrored from memory. |
| Zuerst und dann | `games/reihenfolge/` | `logik/zeit` | Order and time, ages 3–7. Picture stories lie mixed up (🫘 🌱 🌻, 🥚 🐣 🐥 🐔, ⛄ ☀️ 💧): tap them in order, each one moves up into the next numbered place and is read out. Other tasks: day or night?; put morning, midday, evening and night in order (a different thing to do each time: 🐓, 🍝, 📖, 🦉); when is that? (🥣 → morning, 🛷 → winter); put the seasons in order from a given one ("and then the year starts again"); one picture of a story: what came just before, what comes just after?; days of the week: "Heute ist Dienstag. Welcher Tag ist morgen?" first with the coloured week strip, then also yesterday and without the strip (in Nepali the week starts on Sunday). After two wrong answers the right picture glows. Levels: tag-nacht (3), geschichte-3, tag-ordnen (4), tageszeit, geschichte-4, jahreszeit (5), jahreszeiten-ordnen, vorher-nachher, wochentage (6), wochentage-gestern, alles-gemischt (7). |
