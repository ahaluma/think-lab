# AnkaPlay: what we are building and why

This document describes the ideas behind AnkaPlay (the repository is called `think-lab`) for anyone reviewing the project. The [README](../README.md) explains how the code works; this page explains what it is for. Where this page describes how the app behaves today, it was checked against the code in `public/` (file names are given so you can verify). Where it describes goals, it says so.

## In one paragraph

AnkaPlay is a free learning app for **Vorschulkinder** (about 3 to 6 years) and **Grundschule** children (Klasse 1 to 4) in Hamburg, Germany. Children learn **mathematical concepts**, **critical thinking** and **how to learn** through small games. It runs in the browser on any phone or tablet and can be added to the home screen like an app. It speaks German, English and Nepali, adapts its difficulty to each child's age and performance, and is designed so that what a child learns in one game carries over to new situations.

## Who it is for

- **Vorschulkinder (3 to 6):** counting, comparing amounts, first patterns, shapes, spatial words, order and time, all without reading.
- **Grundschule (6 to 10, some games up to 12):** decomposing numbers, Zehnerfreunde, adding up to 1000, first steps into minus and dividing, harder patterns and number sequences, sorting by hidden rules.
- **Parents:** a separate page (`/eltern/`) to add children, see progress and switch games or harder levels on and off.

## What children learn

**Mathematical concepts.** Amounts and counting, seeing small amounts at a glance (subitizing), the number line, comparing, ordinal numbers, one more and one less, decomposing numbers, Zehnerfreunde, plus up to 1000 with and without carrying, first steps into minus (making groups equal, finding the difference), fair sharing and halving as a first idea of dividing, sizes and weight, shapes, spatial position, patterns and number sequences.

**Critical thinking.** Sorting and classifying (also by rules the child has to discover, and rules that switch mid-task), finding the odd one out, continuing and completing patterns, spotting differences, copying a model from memory and mirrored, ordering events in time, and reasoning without recounting (a hidden group behind a bush or inside a house).

**Learning to learn.** Mistakes are part of the process, not a punishment:

- A wrong answer gets a soft sound and "nochmal", never a buzzer or a lost life.
- After two wrong answers (in typed tasks: more) the game gives a **hint, not the answer**: the repeating part of a pattern is marked, animals line up in pairs, a ten-frame or place-value chart appears, the corners of a shape get dots.
- A wrong tap often says what the child actually chose ("Das ist das zweite Tier."), so the child can correct their own thinking.
- Short rounds of about five tasks end in a reward, so effort is visible and success comes often.
- When a child is stuck (3 wrong in a row), the next task is one level easier so they get a success before trying again.

## Design principles

1. **One game, one concept.** Each game is small, lives in its own folder and teaches one idea well. Several games can train the same skill from different angles.
2. **Little reading needed.** Pictures, spoken prompts (the browser's own voice in the chosen language) and sounds, so children can play before they can read. From age 8 the prompts are shown as text instead of read aloud by default, with a 🔊 button to hear them. Parents can change this per child.
3. **Built for skill transfer.** The same concept appears with different objects and representations: 34 animals and things to count, dots and dice patterns, ten-frames, number cards, place-value charts, and numbers alone. Within a game, levels move from pictures to numbers and from one representation to another, so the child learns the idea, not one picture. Example: "how many are missing to 10" goes from a ten-frame with animals, to a frame shown only briefly, to `7 + ? = 10`.
4. **Adaptive difficulty.** Every game has levels, each made for an age. The level follows the child automatically (see below). Answers change with age too: younger children pick one of three, from 8 they type the answer on a number pad (parents can switch this).
5. **Endless, valid variety.** A task generator makes a new task for every turn, avoids repeating the same thing or number, and can be replayed with a fixed seed. A checker makes 2000 tasks per level of every game and reports invalid ones.
6. **Multilingual and culturally universal.** German, English and Nepali. Content must make sense to children in Germany and in Nepal, in any climate and culture, so scenes avoid things only one place knows (for example, a snowman was replaced by a caterpillar).
7. **Simple, calm and private.** Big buttons, no ads, no accounts, no tracking, no cookies. Nothing is loaded from other servers and progress stays on the device.

## How the difficulty adapts today

Checked against `shared/fit.js` and `shared/adapt.js`. All 19 games use the same rules.

- **Which games a child sees** depends on age: every game has an age range in `catalog.js`. Games for younger children stay visible two more years. Parents can switch any game on or off.
- **Start level:** the first time a child plays a game, it starts at the hardest level made for a child two years younger. This is generous on purpose.
- **Quick placement:** in the first two rounds, three tasks right the first time in a row moves one level up at once, up to the child's age.
- **After every round of five:** 4 or 5 right the first time moves up, 2 or fewer moves down, 3 stays.
- **Levels above the child's age** need more: two good rounds in a row on two different days, and enough practice in the current number range before moving to a bigger one (for example 20 rounds up to 10 before sums go above 10).
- **Ceiling:** at most levels made for children one year older. Parents can open the harder levels.
- **Stuck:** 3 wrong answers in a row make the next task one level easier.

**Not yet:** the start level depends on **age only**, not on skills already learned in other games. Mastering Zehnerfreunde does not yet move Plus forward, for example. Making the start level and game suggestions depend on already learned skills is a goal (see open questions).

## Languages

Every page and every game has German, English and Nepali texts (`lang/de.js`, `lang/en.js`, `lang/ne.js` next to each game). If a sentence is missing in a language, German is used. Nepali shows numbers in Devanagari digits and uses a Hindi voice when the phone has no Nepali voice. In Nepali, the week starts on Sunday. Adding another language means one line in `shared/i18n.js` and translating the language files.

## Curriculum alignment (goal)

The goal is to cover the mathematics of the **Hamburg Bildungsplan** for Vorschule and Grundschule. This has not been checked systematically yet. A rough mapping of the current games to the areas of the German primary maths standards:

| Area | Covered by | Not yet covered |
| --- | --- | --- |
| Zahlen und Operationen | counting, comparing, number order, decomposing, plus to 1000, first minus and dividing | minus with numbers beyond 20, multiplication as its own game, written methods |
| Raum und Form | shapes, spatial position | symmetry as its own topic, nets, 3D shapes |
| Muster und Strukturen | patterns, number sequences | |
| Größen und Messen | comparing length, height, volume and weight; order and time; days of the week | money, clock times, units of measurement |
| Daten, Häufigkeit und Wahrscheinlichkeit | | not covered |

## The games

Since November 2026 most number ideas live in the new world (`/welt/`): counting, seeing at a glance, tens and ones up to 1000 and friends of ten at the meadow and the burrow, and plus, minus, times and divided by at the market. "Wie viele?", "Blitzblick", "Zahlenhaus" and "Plus" were deleted for that. The table lists the games still on the start page or kept for parents to switch back on.

| Game | Concept it teaches | Ages |
| --- | --- | --- |
| Wo sind mehr? | Comparing amounts (more, fewer, the same) | 3–6 |
| Zahlenzug | Number order: before, after, missing number | 3–8 |
| Wer kommt dazu? | One more, one less | 4–6 |
| Zehnerfreunde | Pairs that make 10 | 4–8 |
| Gleich machen | Difference and first minus | 4–8 |
| Gerecht teilen | Fair sharing, halving, first dividing | 4–8 |
| Wer ist Erster? | Ordinal numbers | 4–7 |
| Zahlen-Memory | Matching numbers to amounts | 3–7 |
| Muster-Kette | Patterns and number sequences (up to primes and Fibonacci) | 3–12 |
| Größen vergleichen | Length, height, volume and weight | 3–7 |
| Wo ist es? | Spatial position (auf, unter, neben, zwischen, links, rechts) | 3–7 |
| Zuerst und dann | Order of events, times of day, seasons, days of the week | 3–7 |
| Sortieren | Sorting and classifying, odd one out, hidden and switching rules | 3–12 |
| Genau hinschauen | Concentration: spotting differences, copying a model | 3–8 |
| Formen | Recognising and using shapes | 3–7 |

A "Sprache" category (letters, rhymes) exists in `catalog.js` but has no games yet.

## Technology

Plain HTML, CSS and JavaScript. No libraries, no build step, no npm. Static files served by Cloudflare. Code: <https://github.com/ahaluma/think-lab>. See the README for the layout, the shared helpers and how to add a game.

## Open questions for the reviewer

1. **Curriculum:** do the games cover the Hamburg Bildungsplan for Vorschule and Klasse 1 to 4 well? What are the most important gaps?
2. **Progression:** is the order of levels within each game sound? Are the age labels on the levels realistic?
3. **Adaptation:** are the rules above reasonable? How should already learned skills from other games influence the start level and which games are suggested?
4. **Skill transfer:** where would more variety of representation help most?
5. **Learning to learn:** what is missing? For example, letting children choose a challenge, reflecting on what helped, or a progress view for the child and not only for parents.
6. **Universality:** is anything in the content specific to one culture or climate?
