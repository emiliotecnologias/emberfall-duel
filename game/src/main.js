// Boot, input and turn flow. Wires state + AI + render + fx together.
import { CONFIG, BEATS } from './config.js';
import { cardById, needsTarget } from './cards.js';
import { newDuel, playCard, attack, endTurn, canPlay } from './state.js';
import { nextFoeAction, applyFoeAction } from './ai.js';
import { renderTitle, renderTable, renderEnd } from './render.js';
import { sfx, ensureAudio, emberRain, shakeEl } from './fx.js';
import { seedFromUrl, shotFromUrl } from './random.js';
import { shotState, isShotMode } from './shots.js';

const stage = document.getElementById('stage');
const status = document.getElementById('status');
let state = null;
let ui = { selectedCard: -1, selectedMinion: null, targeting: false, targetingSpell: false, busy: false, hint: '' };

function fitStage() {
  const scale = Math.min(window.innerWidth / CONFIG.stageW, window.innerHeight / CONFIG.stageH);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', fitStage);

function setStatus(text) { if (status) status.textContent = text; }

function draw() {
  if (!state) return;
  if (state.winner === 'player') { renderEnd(stage, state, true, startDuel); return; }
  if (state.winner === 'foe') { renderEnd(stage, state, false, startDuel); return; }
  renderTable(stage, state, ui, handlers);
}

function clearSelection() {
  ui.selectedCard = -1; ui.selectedMinion = null; ui.targeting = false; ui.targetingSpell = false;
}

function afterAction(events) {
  for (const ev of events || []) {
    if (ev.type === 'summon') sfx.summon();
    else if (ev.type === 'damage-hero' || ev.type === 'trade') sfx.hit();
    else if (ev.type === 'heal') sfx.heal();
    else if (ev.type === 'buff') sfx.buff();
    else if (ev.type === 'burn' || ev.type === 'sweep') sfx.burn();
    else sfx.play();
  }
  draw();
  if (state.winner === 'player') { sfx.win(); emberRain(stage, 36); setStatus('Victory!'); }
  if (state.winner === 'foe') { sfx.lose(); setStatus('Defeat.'); }
}

function onHandCard(index) {
  ensureAudio();
  if (state.turn !== 'player' || ui.busy) return;
  const card = cardById(state.player.hand[index]);
  if (!card) return;
  const check = canPlay(state, 'player', index);
  if (!check.ok) { sfx.error(); ui.hint = check.reason + '. Pick another card.'; draw(); return; }
  if (needsTarget(card)) {
    ui.selectedCard = index; ui.selectedMinion = null;
    ui.targeting = card.effect === 'damage-any';
    ui.targetingSpell = card.effect === 'buff';
    ui.hint = card.effect === 'buff' ? 'Choose a friendly minion to buff (+2/+2). Esc cancels.' : 'Choose a target: click a minion, or the hero plate area via a minion. Esc cancels.';
    sfx.deal(); draw(); return;
  }
  const res = playCard(state, 'player', index, null);
  clearSelection();
  ui.hint = '';
  afterAction(res.events);
}

function onPlayerMinion(uid) {
  ensureAudio();
  if (ui.targetingSpell && ui.selectedCard >= 0) {
    const res = playCard(state, 'player', ui.selectedCard, { type: 'minion', side: 'player', uid });
    clearSelection(); ui.hint = ''; afterAction(res.events); return;
  }
  if (ui.targeting && ui.selectedCard >= 0) {
    const res = playCard(state, 'player', ui.selectedCard, { type: 'minion', side: 'player', uid });
    clearSelection(); ui.hint = ''; afterAction(res.events); return;
  }
  const m = state.player.board.find((x) => x.uid === uid);
  if (!m) return;
  if (!m.canAttack || m.attacked) { ui.hint = cardById(m.cardId).name + ' is not ready yet.'; draw(); return; }
  ui.selectedMinion = uid; ui.selectedCard = -1; ui.targeting = true;
  ui.hint = 'Attack with ' + cardById(m.cardId).name + ': click an enemy minion (GUARD first) — or click again to go face if no GUARD.';
  draw();
}

function onFoeMinion(uid) {
  ensureAudio();
  if (ui.selectedCard >= 0 && ui.targeting) {
    const res = playCard(state, 'player', ui.selectedCard, { type: 'minion', side: 'foe', uid });
    clearSelection(); ui.hint = ''; afterAction(res.events); return;
  }
  if (ui.selectedMinion) {
    const res = attack(state, 'player', ui.selectedMinion, { type: 'minion', side: 'foe', uid });
    if (!res.ok) { sfx.error(); ui.hint = res.reason + '.'; draw(); return; }
    clearSelection(); ui.hint = ''; afterAction(res.events); return;
  }
}

function onEndTurn() {
  ensureAudio();
  if (state.turn !== 'player' || ui.busy || state.winner) return;
  clearSelection(); ui.hint = '';
  sfx.turn();
  endTurn(state);
  draw();
  runFoeTurn();
}

async function runFoeTurn() {
  ui.busy = true;
  draw();
  await sleep(BEATS.aiThinkMs);
  let guard = 0;
  while (!state.winner && guard < 24) {
    const action = nextFoeAction(state);
    if (!action) break;
    const res = applyFoeAction(state, action);
    afterAction(res.events);
    shakeEl(stage.querySelector('.table-screen'));
    await sleep(BEATS.aiStepMs);
    guard++;
  }
  ui.busy = false;
  if (!state.winner) {
    endTurn(state);
    sfx.turn();
    setStatus('Your turn — round ' + state.round);
  }
  draw();
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function duelSeedLabel() {
  return 'Seed ' + (state ? state.seed : '?');
}

const handlers = { onHandCard, onPlayerMinion, onFoeMinion, onEndTurn };

function startDuel() {
  ensureAudio();
  state = newDuel(seedFromUrl());
  clearSelection(); ui.busy = false; ui.hint = '';
  setStatus('Duel started — your turn.');
  sfx.deal();
  draw();
}

document.addEventListener('keydown', (e) => {
  if (!state) return;
  if (e.key === 'Escape') { clearSelection(); ui.hint = ''; draw(); return; }
  if (e.code === 'Space') { e.preventDefault(); onEndTurn(); return; }
  const n = Number.parseInt(e.key, 10);
  if (n >= 1 && n <= 7) onHandCard(n - 1);
});

// Face-attack helper: double-click foe hero plate area goes face.
stage.addEventListener('dblclick', () => {
  if (state && ui.selectedMinion) {
    const res = attack(state, 'player', ui.selectedMinion, { type: 'hero', side: 'foe' });
    if (!res.ok) { sfx.error(); ui.hint = res.reason + '.'; draw(); return; }
    clearSelection(); ui.hint = ''; afterAction(res.events);
  }
  if (state && ui.selectedCard >= 0 && ui.targeting) {
    const res = playCard(state, 'player', ui.selectedCard, { type: 'hero', side: 'foe' });
    clearSelection(); ui.hint = ''; afterAction(res.events);
  }
});

fitStage();
const shot = shotFromUrl();
if (isShotMode(shot)) {
  if (shot === 'title') {
    renderTitle(stage, startDuel);
    setStatus('Screenshot: title');
  } else {
    state = shotState(shot, seedFromUrl());
    if (shot === 'table') { draw(); setStatus('Screenshot: table'); }
    else if (shot === 'win') { renderEnd(stage, state, true, startDuel); setStatus('Screenshot: win'); }
    else { renderEnd(stage, state, false, startDuel); setStatus('Screenshot: loss'); }
  }
} else {
  renderTitle(stage, startDuel);
  setStatus('EMBERFALL DUEL ready');
}
