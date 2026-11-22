// EMBERFALL DUEL — boot, input and turn flow.
// Wires the rules engine to the renderer: mouse clicks and keyboard picks go
// through the same legal-move checks, the Warden's turn animates one visible
// action at a time, and ?shot= renders frozen states for screenshots.

import { BEATS, BEST_KEY, FIELD } from './config.js';
import { makeRng, seedFromUrl } from './random.js';
import { attackTargets, attackWith, endTurn, newDuel, playCard, playProblem, startTurn } from './state.js';
import { defOf } from './deck.js';
import { needsTarget, targetSide } from './cards.js';
import { planFoeTurn } from './ai.js';
import { renderEnd, renderTable, renderTitle } from './render.js';
import { shotState, titleShowcase } from './shots.js';
import { emberRain, floatNumber, replayClass, sparkBurst, sfx, stagePoint, wakeAudio } from './fx.js';

const stage = document.getElementById('stage');
const fxLayer = document.getElementById('fx-layer');
const statusLine = document.getElementById('status');

let state = null;
let busy = false; // true while the Warden's turn animates
const ui = {
  selectedCard: null, // hand instance uid awaiting a target
  selectedAttacker: null, // board minion uid awaiting a target
  targetMode: null, // 'spell' | 'buff' | 'attack'
  hint: null,
  justSummoned: new Set(),
  dealt: new Set(),
};

/** Scale the fixed 1280x720 stage to fit the window, letterboxed. */
function fitStage() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', fitStage);

/** Announce a line to screen readers and the hint bar. */
function announce(text) {
  statusLine.textContent = text;
  ui.hint = text;
}

/** Persist the best result line shown on end screens. */
function bestLine() {
  try { return window.localStorage.getItem(BEST_KEY); } catch { return null; }
}
function saveBest() {
  try {
    const line = `Won in ${state.turn} rounds with ${Math.max(0, state.player.health)} life left`;
    const previous = bestLine();
    if (!previous || state.winner === 'player') window.localStorage.setItem(BEST_KEY, line);
  } catch { /* private mode: the duel still plays */ }
}

/** Redraw the table (or the end screen when the duel is over). */
function draw() {
  if (!state) return;
  if (state.phase === 'over') {
    renderEnd(stage, state, bestLine());
    if (state.winner === 'player') {
      emberRain(fxLayer);
      sfx.win();
    } else if (state.winner === 'foe') {
      sfx.lose();
    }
    return;
  }
  renderTable(stage, state, ui);
}

/** Floating feedback for one batch of rule events. */
function playEvents(events) {
  for (const event of events) {
    if (event.type === 'play') sfx.play();
    if (event.type === 'summon') { sfx.summon(); ui.justSummoned.add(event.uid); }
    if (event.type === 'draw') sfx.draw();
    if (event.type === 'heal') sfx.heal();
    if (event.type === 'buff') sfx.buff();
    if (event.type === 'burnSet') sfx.burn();
    if (event.type === 'heroHit') {
      sfx.hurt();
      const plate = stage.querySelector(`.hero-plate.side-${event.side}`);
      if (plate) {
        const point = stagePoint(plate, stage);
        floatNumber(fxLayer, point.x, point.y - 30, `-${event.amount}`, 'damage');
        sparkBurst(fxLayer, point.x, point.y, 8);
        replayClass(plate, 'shaken');
      }
    }
    if (event.type === 'minionHit') {
      sfx.hit();
      const token = stage.querySelector(`.minion[data-uid="${event.uid}"]`);
      if (token) {
        const point = stagePoint(token, stage);
        floatNumber(fxLayer, point.x, point.y - 24, `-${event.amount}`, 'damage');
        replayClass(token, 'shaken');
      }
    }
  }
}

/** Start a fresh duel from the title screen or an end screen. */
function startDuel() {
  wakeAudio();
  const rngSeed = seedFromUrl(window.location.search);
  state = newDuel(makeRng(rngSeed));
  state.phase = 'play';
  ui.selectedCard = null;
  ui.selectedAttacker = null;
  ui.targetMode = null;
  ui.justSummoned.clear();
  ui.dealt = new Set(state.player.hand.map((held) => held.uid));
  startTurn(state, 'player');
  announce('Your turn. Play a card, attack with ready minions, then end the turn.');
  draw();
  sfx.deal();
}

/** Clear any half-made selection. */
function clearSelection() {
  ui.selectedCard = null;
  ui.selectedAttacker = null;
  ui.targetMode = null;
}

/** Try to play the selected hand card, with or without a target. */
function commitCard(target) {
  const instance = state.player.hand.find((held) => held.uid === ui.selectedCard);
  if (!instance) return;
  try {
    const events = playCard(state, 'player', instance, target);
    clearSelection();
    draw();
    playEvents(events);
    if (state.phase === 'over') saveBest();
    draw();
  } catch (error) {
    sfx.error();
    announce(error.message);
    draw();
  }
}

/** Try to attack with the selected minion. */
function commitAttack(target) {
  try {
    const events = attackWith(state, 'player', ui.selectedAttacker, target);
    clearSelection();
    draw();
    playEvents(events);
    if (state.phase === 'over') saveBest();
    draw();
  } catch (error) {
    sfx.error();
    announce(error.message);
    draw();
  }
}

/** A hand card was clicked: select it, or play it at once if it needs no target. */
function pickCard(uid) {
  if (busy || state.active !== 'player' || state.phase !== 'play') return;
  const instance = state.player.hand.find((held) => held.uid === uid);
  if (!instance) return;
  const problem = playProblem(state, 'player', instance);
  if (problem) {
    sfx.error();
    announce(problem);
    draw();
    return;
  }
  const def = defOf(instance);
  ui.selectedCard = uid;
  ui.selectedAttacker = null;
  if (needsTarget(def)) {
    ui.targetMode = targetSide(def) === 'friendly' ? 'buff' : 'spell';
    announce(ui.targetMode === 'buff'
      ? `${def.name}: click one of your minions to strengthen it.`
      : `${def.name}: click a hero or minion to aim it.`);
    draw();
  } else {
    commitCard(null);
  }
}

/** A board minion or hero was clicked: an attacker pick or a target pick. */
function pickBoard(side, uid) {
  if (busy || state.active !== 'player' || state.phase !== 'play') return;
  if (ui.targetMode === 'attack' && ui.selectedAttacker) {
    commitAttack({ side, uid });
    return;
  }
  if (ui.targetMode === 'spell' && ui.selectedCard) {
    commitCard({ side, uid });
    return;
  }
  if (ui.targetMode === 'buff' && ui.selectedCard && side === 'player' && uid !== null) {
    commitCard({ side, uid });
    return;
  }
  if (side === 'player' && uid !== null) {
    const minion = state.player.board.find((m) => m.uid === uid);
    if (!minion) return;
    if (minion.sick) { announce('That minion just arrived — it wakes next turn.'); draw(); return; }
    if (minion.attacked) { announce('That minion already attacked this turn.'); draw(); return; }
    ui.selectedAttacker = uid;
    ui.selectedCard = null;
    ui.targetMode = 'attack';
    const legal = attackTargets(state, 'player');
    announce(legal.some((t) => t.uid === null)
      ? 'Choose a target: the Warden or one of its minions.'
      : 'A GUARD blocks the way — attack the guard first.');
    draw();
  }
}

/** End the player's turn, then animate the Warden's turn step by step. */
async function finishTurn() {
  if (busy || state.active !== 'player' || state.phase !== 'play') return;
  clearSelection();
  busy = true;
  const foeEvents = endTurn(state);
  sfx.turn();
  draw();
  playEvents(foeEvents);
  draw();
  if (state.phase !== 'over') {
    const steps = planFoeTurn(state);
    for (const step of steps) {
      draw();
      playEvents(step);
      await new Promise((resolve) => window.setTimeout(resolve, BEATS.foeStep));
      if (state.phase === 'over') break;
    }
  }
  if (state.phase === 'over') {
    saveBest();
    busy = false;
    draw();
    return;
  }
  const playerEvents = endTurn(state);
  sfx.turn();
  busy = false;
  announce('Your turn. The Warden\'s intent is on the banner — counter it.');
  draw();
  playEvents(playerEvents);
  draw();
}

/** Mouse: one delegated listener for cards, minions, heroes and buttons. */
stage.addEventListener('click', (event) => {
  wakeAudio();
  const playButton = event.target.closest('#play-button');
  if (playButton) { startDuel(); return; }
  if (event.target.closest('#end-turn')) { finishTurn(); return; }
  if (!state || state.phase !== 'play') return;
  const card = event.target.closest('.player-hand .card');
  if (card) { pickCard(card.dataset.uid); return; }
  const minion = event.target.closest('.minion');
  if (minion) {
    const side = minion.classList.contains('side-foe') ? 'foe' : 'player';
    pickBoard(side, minion.dataset.uid);
    return;
  }
  const hero = event.target.closest('.hero-plate');
  if (hero) { pickBoard(hero.dataset.side, null); return; }
  clearSelection();
  draw();
});

/** Keyboard: 1–7 pick a hand card, Enter confirms, Space ends, Esc cancels. */
window.addEventListener('keydown', (event) => {
  if (!state || state.phase !== 'play' || busy) return;
  if (event.key >= '1' && event.key <= '7') {
    const held = state.player.hand[Number(event.key) - 1];
    if (held) pickCard(held.uid);
  } else if (event.key === ' ' || event.key === 'Enter') {
    if (event.key === ' ') { event.preventDefault(); finishTurn(); }
  } else if (event.key === 'Escape') {
    clearSelection();
    draw();
  }
});

/** Boot: screenshot mode renders one frozen state; otherwise the title screen. */
function boot() {
  fitStage();
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = seedFromUrl(window.location.search);
  if (shot) {
    document.body.classList.add('shot-mode');
    if (shot === 'title') {
      renderTitle(stage, titleShowcase(seed));
    } else {
      state = shotState(shot, seed);
      if (state.phase === 'over') renderEnd(stage, state, null);
      else renderTable(stage, state, ui);
    }
    return;
  }
  renderTitle(stage, titleShowcase(seed));
}

boot();
