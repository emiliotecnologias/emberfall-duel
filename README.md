# EMBERFALL DUEL

[![make.fun bounty](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=emberfall-duel)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/emiliotecnologias/emberfall-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=emberfall-duel)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/emiliotecnologias/emberfall-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=emberfall-duel)

An original card battler for the make.fun bounty **best-card-game-20261122-1826** ("Make the best card game", $50 shared by the 10 best entries). You are the Ember Keeper; across the table sits the Ashen Warden, an AI whose plan you can read in its intent banner every turn. Bring the Warden from 24 life to 0 before the ash takes you.

Everything is original: names, flavour text, suits, art (CSS + glyphs), and WebAudio-synthesized sounds. No network requests, no libraries, no build step — plain static files that play offline in a desktop browser.

## How to run

Serve the `game/` folder with any static server and open it in Chrome:

```sh
python3 -m http.server 8123 --directory game
# open http://localhost:8123
```

Add `?seed=1` to replay the same duel. Screenshot modes: `?shot=title|table|win|loss&seed=1` render frozen deterministic states.

To hand the entry in (writes `out/dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How to play

- Both heroes start at **24 life**. **Ember** (energy) starts at 1, grows +1 max per turn to 8, and refills each turn.
- Opening hand 4, draw 1 per turn, hand limit 7, board limit 5 minions per side. Empty-deck draws deal growing **fatigue** damage.
- Four suits, told apart by colour + shape + glyph, never text alone: **▲ Flame** (red), **≈ Tide** (blue), **❦ Grove** (green), **◆ Void** (purple).
- ~27 original cards: minions with **GUARD** (must be attacked first), **SWIFT** (attacks at once), **THORNS** (1 back to attacker), **KINDLE** (+1 attack each turn), and spells — damage any target, sweep all enemy minions, heal your hero, draw, buff a minion +2/+2, burn the enemy hero over 2 turns.
- Deck: 12 distinct cards ×2 = 24, same recipe both sides, seeded shuffle (mulberry32).
- Combat: minions are summoning-sick unless SWIFT; minions trade damage both ways; GUARD blocks hero attacks.
- The Warden announces its intent in plain words (lethal warning, board threat, saving for a big minion, guard when hurt), plays its biggest minions, heals when hurt, sweeps wide boards, takes favourable trades, and goes lethal first — its turn animates step by step.
- **Controls:** click a card then its target; click a ready minion then its victim; double-click to go face. Keyboard: **1–7** pick a hand card, **Space** ends turn, **Esc** cancels.

## Source layout

| File | Job |
|---|---|
| `game/index.html` | Shell: `#stage`, `#fx-layer`, `#status`, module script |
| `game/src/style.css` | All styling and animations |
| `game/src/config.js` | Tuning numbers, suits, palette, beats |
| `game/src/random.js` | Seeded RNG (mulberry32), shuffle, `?seed=` parsing |
| `game/src/cards.js` | Card pool data + helpers |
| `game/src/deck.js` | Deck recipe, build, draw |
| `game/src/state.js` | Rules engine: turns, play, attacks, win check (pure, no DOM) |
| `game/src/ai.js` | Intent banner + Warden turn planning |
| `game/src/render.js` | DOM rendering: cards, minions, hero plates, screens |
| `game/src/fx.js` | WebAudio sfx, sparks, floating numbers, ember rain |
| `game/src/shots.js` | Frozen screenshot states |
| `game/src/main.js` | Boot, input, turn flow |
| `main.ts` | Node 22 hand-in: copies `game/` + `screenshots/`, writes `dossier.json` |

## Screenshots

`screenshots/1-table.jpg` (cover: mid-duel table), `2-title.jpg`, `3-win.jpg`, `4-loss.jpg` — real renders of this code via `?shot=` modes at 1280×720.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Emilio Tecnologías.
