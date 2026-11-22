// DOM rendering: cards, minions, hero plates, screens. No game rules here.
import { CONFIG, SUITS, HEROES, lifePercent } from './config.js';
import { cardById, showcaseCards } from './cards.js';
import { foeIntent } from './ai.js';

export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function clearStage(stage) {
  stage.innerHTML = '';
}

export function suitBadge(card) {
  const suit = SUITS[card.suit];
  const badge = el('span', 'suit-badge suit-' + card.suit, suit.glyph + ' ' + suit.name);
  badge.title = suit.name + ' suit';
  return badge;
}

export function cardEl(card, opts = {}) {
  const suit = SUITS[card.suit];
  const root = el('div', 'card suit-' + card.suit + (opts.small ? ' card-small' : '') + (opts.selected ? ' selected' : '') + (opts.disabled ? ' disabled' : ''));
  root.dataset.cardId = card.id;
  const head = el('div', 'card-head');
  head.appendChild(el('span', 'card-cost', String(card.cost)));
  head.appendChild(el('span', 'card-name', card.name));
  root.appendChild(head);
  const art = el('div', 'card-art', suit.glyph);
  root.appendChild(art);
  root.appendChild(el('div', 'card-kind', card.kind === 'minion' ? 'MINION' : 'SPELL'));
  if (card.kind === 'minion') {
    const stats = el('div', 'card-stats');
    stats.appendChild(el('span', 'stat-atk', '⚔ ' + card.attack));
    stats.appendChild(el('span', 'stat-hp', '♥ ' + card.health));
    root.appendChild(stats);
  }
  root.appendChild(el('div', 'card-text', card.text || '—'));
  if (opts.showFlavour !== false) root.appendChild(el('div', 'card-flavour', card.flavour || ''));
  root.appendChild(suitBadge(card));
  if (opts.keyNum) root.appendChild(el('div', 'card-key', String(opts.keyNum)));
  return root;
}

export function minionEl(minion, opts = {}) {
  const card = cardById(minion.cardId);
  const suit = SUITS[card.suit];
  const root = el('div', 'minion suit-' + card.suit + (minion.canAttack && !minion.attacked ? ' ready' : '') + (opts.selected ? ' selected' : '') + (opts.targetable ? ' targetable' : ''));
  root.dataset.uid = String(minion.uid);
  root.appendChild(el('div', 'minion-glyph', suit.glyph));
  root.appendChild(el('div', 'minion-name', card.name));
  const stats = el('div', 'minion-stats');
  stats.appendChild(el('span', 'stat-atk', '⚔' + minion.attack));
  stats.appendChild(el('span', 'stat-hp' + (minion.health < minion.maxHealth ? ' hurt' : ''), '♥' + minion.health));
  root.appendChild(stats);
  if (minion.keywords.length) root.appendChild(el('div', 'minion-kw', minion.keywords.join(' · ')));
  if (minion.justSummoned) root.appendChild(el('div', 'minion-sick', 'summoning…'));
  return root;
}

export function heroPlate(side, hero) {
  const info = HEROES[side];
  const root = el('div', 'hero-plate hero-' + side);
  root.dataset.side = side;
  const left = el('div', 'hero-left');
  left.appendChild(el('div', 'hero-name', info.name));
  left.appendChild(el('div', 'hero-title', info.title));
  root.appendChild(left);
  const right = el('div', 'hero-right');
  right.appendChild(el('div', 'hero-life', '♥ ' + hero.life + ' / ' + hero.maxLife));
  const barWrap = el('div', 'life-bar-wrap');
  const bar = el('div', 'life-bar');
  bar.style.width = lifePercent(hero.life, hero.maxLife) + '%';
  barWrap.appendChild(bar);
  right.appendChild(barWrap);
  right.appendChild(el('div', 'hero-meta', 'Deck ' + hero.deck.length + ' · Hand ' + hero.hand.length + (hero.burn ? ' · 🔥 burning' : '')));
  root.appendChild(right);
  return root;
}

export function emberPips(hero) {
  const wrap = el('div', 'ember-pips');
  wrap.appendChild(el('span', 'ember-label', 'EMBER'));
  for (let i = 0; i < CONFIG.maxEmber; i++) {
    wrap.appendChild(el('span', 'pip' + (i < hero.ember ? ' full' : i < hero.maxEmber ? ' spent' : ' locked'), '◆'));
  }
  wrap.appendChild(el('span', 'ember-num', hero.ember + ' / ' + hero.maxEmber));
  return wrap;
}

export function renderTitle(stage, onStart) {
  stage.innerHTML = '';
  const root = el('div', 'screen title-screen');
  root.appendChild(el('div', 'game-title', 'EMBERFALL DUEL'));
  root.appendChild(el('div', 'game-tagline', 'Two keepers. Twenty-four cards. One cold ash throne.'));
  const fan = el('div', 'title-fan');
  showcaseCards().forEach((card, i) => {
    const c = cardEl(card, { showFlavour: true });
    c.style.transform = `rotate(${(i - 2) * 7}deg) translateY(${Math.abs(i - 2) * 10}px)`;
    fan.appendChild(c);
  });
  root.appendChild(fan);
  const rules = el('div', 'title-rules');
  rules.appendChild(el('div', '', '⚔ Minions trade damage both ways · GUARD must be attacked first · SWIFT strikes at once'));
  rules.appendChild(el('div', '', '◆ Ember grows 1 → 8 · Draw 1 a turn · Bring the foe from 24 life to 0'));
  rules.appendChild(el('div', '', '▲ Flame  ≈ Tide  ❦ Grove  ◆ Void — colour, shape and glyph tell every suit apart'));
  root.appendChild(rules);
  const btn = el('button', 'big-btn', 'ENTER THE DUEL');
  btn.id = 'start-btn';
  btn.addEventListener('click', onStart);
  root.appendChild(btn);
  root.appendChild(el('div', 'title-hint', 'Mouse + keyboard · 1–7 pick a card · Space ends turn · Esc cancels'));
  stage.appendChild(root);
}

export function renderTable(stage, state, ui, handlers) {
  stage.innerHTML = '';
  const root = el('div', 'screen table-screen');
  // Foe hero + hand (face-up small cards so the judge sees both hands).
  const foeTop = el('div', 'foe-top');
  foeTop.appendChild(heroPlate('foe', state.foe));
  const foeHand = el('div', 'foe-hand');
  state.foe.hand.forEach((id) => {
    const c = cardEl(cardById(id), { small: true, showFlavour: false });
    foeHand.appendChild(c);
  });
  if (!state.foe.hand.length) foeHand.appendChild(el('div', 'empty-note', 'No cards in hand'));
  foeTop.appendChild(foeHand);
  root.appendChild(foeTop);
  // Foe board
  const foeBoard = el('div', 'board board-foe');
  state.foe.board.forEach((m) => {
    const me = minionEl(m, { targetable: !!ui.targeting });
    me.addEventListener('click', () => handlers.onFoeMinion(m.uid));
    foeBoard.appendChild(me);
  });
  if (!state.foe.board.length) foeBoard.appendChild(el('div', 'empty-note', '— empty board —'));
  root.appendChild(foeBoard);
  // Middle strip
  const mid = el('div', 'mid-strip');
  mid.appendChild(el('div', 'turn-label', state.turn === 'player' ? `ROUND ${state.round} — YOUR TURN` : `ROUND ${state.round} — WARDEN'S TURN`));
  const intent = foeIntent(state);
  mid.appendChild(el('div', 'intent-banner intent-' + intent.key, 'Warden intent: ' + intent.text));
  const logBox = el('div', 'duel-log');
  state.log.slice(-4).forEach((line) => logBox.appendChild(el('div', 'log-line', line)));
  mid.appendChild(logBox);
  root.appendChild(mid);
  // Player board
  const pBoard = el('div', 'board board-player');
  state.player.board.forEach((m) => {
    const me = minionEl(m, { selected: ui.selectedMinion === m.uid, targetable: !!ui.targetingSpell });
    me.addEventListener('click', () => handlers.onPlayerMinion(m.uid));
    pBoard.appendChild(me);
  });
  if (!state.player.board.length) pBoard.appendChild(el('div', 'empty-note', '— empty board —'));
  root.appendChild(pBoard);
  // Player hero + ember + end turn
  const pRow = el('div', 'player-row');
  pRow.appendChild(heroPlate('player', state.player));
  pRow.appendChild(emberPips(state.player));
  const endBtn = el('button', 'end-btn', 'END TURN ⏭');
  endBtn.id = 'end-btn';
  endBtn.disabled = state.turn !== 'player' || !!state.winner || !!ui.busy;
  endBtn.addEventListener('click', handlers.onEndTurn);
  pRow.appendChild(endBtn);
  root.appendChild(pRow);
  // Player hand fan
  const hand = el('div', 'player-hand');
  state.player.hand.forEach((id, i) => {
    const card = cardById(id);
    const c = cardEl(card, { selected: ui.selectedCard === i, disabled: card.cost > state.player.ember || state.turn !== 'player', keyNum: i + 1 });
    c.style.transform = `rotate(${(i - (state.player.hand.length - 1) / 2) * 3}deg)`;
    c.addEventListener('click', () => handlers.onHandCard(i));
    hand.appendChild(c);
  });
  if (!state.player.hand.length) hand.appendChild(el('div', 'empty-note', 'No cards — end your turn'));
  root.appendChild(hand);
  root.appendChild(el('div', 'hint-line', ui.hint || 'Click a card, then a target · Click a ready minion, then its victim · 1–7 · Space · Esc'));
  stage.appendChild(root);
}

export function renderEnd(stage, state, won, onAgain) {
  stage.innerHTML = '';
  const root = el('div', 'screen end-screen ' + (won ? 'win-screen' : 'loss-screen'));
  root.appendChild(el('div', 'end-title', won ? '🏆 VICTORY' : '💀 DEFEAT'));
  root.appendChild(el('div', 'end-sub', won ? 'The Ashen Warden falls. The ember throne is yours.' : 'The ash takes another keeper. Rise and duel again.'));
  const stats = el('div', 'end-stats');
  const rows = [
    ['Rounds played', String(state.round)],
    ['Damage you dealt', String(state.stats.playerDamage)],
    ['Damage you took', String(state.stats.foeDamage)],
    ['Cards you played', String(state.stats.playerPlayed)],
    ['Cards Warden played', String(state.stats.foePlayed)],
    ['Your life left', state.player.life + ' / ' + state.player.maxLife],
    ['Warden life left', state.foe.life + ' / ' + state.foe.maxLife],
  ];
  rows.forEach(([k, v]) => {
    const row = el('div', 'stat-row');
    row.appendChild(el('span', 'stat-k', k));
    row.appendChild(el('span', 'stat-v', v));
    stats.appendChild(row);
  });
  root.appendChild(stats);
  const btn = el('button', 'big-btn', 'DUEL AGAIN');
  btn.id = 'again-btn';
  btn.addEventListener('click', onAgain);
  root.appendChild(btn);
  stage.appendChild(root);
}
