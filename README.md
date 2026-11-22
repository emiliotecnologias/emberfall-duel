# EMBERFALL DUEL — an original card game

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/emiliotecnologias/emberfall-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/emiliotecnologias/emberfall-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**EMBERFALL DUEL** is a complete, original card battler that runs in a desktop
browser from static files — no build step, no network requests, no assets.
Built for make.fun's **"Make the best card game"** bounty
(`best-card-game-20261122-1826`).

You duel the **Ashen Warden**: 24 life each, ember that grows every turn, and a
24-card deck across four suits — **Flame ▲**, **Tide ≈**, **Grove ❦** and
**Void ◆** — each told apart by colour, shape and glyph. The Warden announces
its plan on the intent banner every turn, so every loss teaches you the counter.

Everything is original: the suits, cards, names, art (CSS + glyphs) and sounds
(WebAudio synthesis) were created for this entry. **Zero network requests at
runtime.**

## Run it

Open `game/index.html` in a desktop browser (Chrome recommended) and press
**ENTER THE DUEL**. If your browser blocks module scripts from `file://`, serve
the folder instead:

```sh
cd game && python3 -m http.server 8080   # then open http://localhost:8080
```

Add `?seed=7` to replay the exact same duel; `?shot=title|table|win|loss`
renders the frozen moments used for the submitted screenshots.

## How to play

- **Ember** is energy: it grows by 1 each turn (max 8) and refills. Cards cost
  ember — the gold gem in the corner.
- **Minions** (⚔ attack / ♥ health) fight on a 5-wide board. They wake the turn
  after they arrive unless they carry **SWIFT**. **GUARD** must be attacked
  first, **THORNS** bites back, **KINDLE** grows +1 attack every turn.
- **Spells** burn, heal, draw, buff and sweep the board.
- Click a card (or press **1–7**), then click its target. Click a glowing
  minion to attack. **Space** or the **END TURN** button passes the turn.
- Reduce the Warden to 0 life before it reduces you. Watch the intent banner:
  it tells you the Warden's next move in plain words.

## Source layout

| File | Job |
|---|---|
| `game/index.html` | The page shell: stage, fx layer, status line |
| `game/src/config.js` | Every tuning number, colour and label |
| `game/src/random.js` | Seeded RNG (mulberry32), shuffle, `?seed=` |
| `game/src/cards.js` | The 27-card pool: suits, costs, keywords, effects |
| `game/src/deck.js` | The 24-card deck recipe, building and drawing |
| `game/src/state.js` | The rules engine: turns, combat, spells, win/loss |
| `game/src/ai.js` | The Ashen Warden: readable intent + turn planning |
| `game/src/render.js` | The DOM table: heroes, hands, boards, screens |
| `game/src/fx.js` | WebAudio sounds, sparks, float numbers, ember rain |
| `game/src/shots.js` | Frozen screenshot states (`?shot=`) |
| `game/src/main.js` | Boot, mouse/keyboard input, turn flow |
| `game/src/style.css` | The felt table, card frames, animations |
| `main.ts` | make.fun runner: copies `game/` + `screenshots/`, writes `dossier.json` |
| `vendor/makefun-game.ts` | The kit's dossier library, copied unchanged |

## Screenshots

The four submitted screenshots are real renders of this code in headless
Chrome (`?shot=table|title|win|loss&seed=1`): the mid-duel table with both
hands and both boards, the title screen, the victory screen and the defeat
screen. Re-render them any time with the same URLs.

## License

MIT — see `LICENSE`.
