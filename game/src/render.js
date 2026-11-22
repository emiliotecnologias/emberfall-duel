// EMBERFALL DUEL — the renderer.
// Builds the whole table as DOM inside a fixed 1280x720 stage: title screen,
// both heroes with life totals, both hands, both boards, the ember track, the
// Warden's intent banner, the duel log, and the win/loss screens. Cards are
// told apart by suit colour, shape and glyph — never by text alone — and stay
// legible when the screenshot shrinks to a thumbnail.

import { KEYWORDS, SUITS } from './config.js';
import { defOf } from './deck.js';
import { intent } from './ai.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The cost gem every card wears in its top-left corner. */
function costGem(cost) {
  const gem = el('div', 'cost-gem', String(cost));
  gem.title = `Costs ${cost} ember`;
  return gem;
}

/** Attack/health badges: sword chip bottom-left, heart chip bottom-right. */
function statBadges(attack, health, hurt) {
  const wrap = el('div', 'stat-badges');
  const atk = el('div', 'badge atk', `⚔ ${attack}`);
  const hp = el('div', `badge hp${hurt ? ' hurt' : ''}`, `♥ ${health}`);
  wrap.append(atk, hp);
  return wrap;
}

/** Keyword chips (GUARD / SWIFT / THORNS / KINDLE) under a card's name. */
function keywordChips(keywords) {
  const wrap = el('div', 'keyword-chips');
  for (const keyword of keywords || []) {
    wrap.append(el('span', `chip kw-${keyword}`, KEYWORDS[keyword] || keyword));
  }
  return wrap;
}

/**
 * One full card face. `size` is 'hand' | 'mini'; `state` carries selection,
 * affordability and the keyboard number printed on hand cards.
 */
export function cardFace(instance, size, state) {
  const def = defOf(instance);
  const suit = SUITS[def.suit];
  const card = el('div', `card suit-${def.suit} size-${size}`);
  card.dataset.uid = instance.uid;
  card.style.setProperty('--suit', suit.color);
  card.style.setProperty('--suit-deep', suit.deep);
  if (state?.selected) card.classList.add('selected');
  if (state?.unaffordable) card.classList.add('unaffordable');
  if (state?.dealt) card.classList.add('dealt');

  const head = el('div', 'card-head');
  head.append(costGem(def.cost));
  head.append(el('div', 'card-name', def.name));
  head.append(el('div', 'suit-glyph', suit.glyph));
  card.append(head);
  card.append(el('div', 'card-kind', def.kind === 'minion' ? 'MINION' : 'SPELL'));
  card.append(keywordChips(def.keywords));
  card.append(el('div', 'card-art', suit.glyph));
  card.append(el('div', 'card-text', def.text));
  if (def.kind === 'minion') card.append(statBadges(def.attack, def.health, false));
  if (state?.keyNumber) card.append(el('div', 'key-number', String(state.keyNumber)));
  return card;
}

/** A minion standing on the board, with live stats and readiness glow. */
export function minionToken(minion, side, state) {
  const def = { name: minionName(minion), suit: minionSuit(minion) };
  const suit = SUITS[def.suit];
  const token = el('div', `minion suit-${def.suit} side-${side}`);
  token.dataset.uid = minion.uid;
  token.style.setProperty('--suit', suit.color);
  token.style.setProperty('--suit-deep', suit.deep);
  if (minion.sick) token.classList.add('sick');
  if (state?.ready) token.classList.add('ready');
  if (state?.selected) token.classList.add('selected');
  if (state?.targetable) token.classList.add('targetable');
  if (state?.summoned) token.classList.add('summoned');
  token.append(el('div', 'minion-glyph', suit.glyph));
  token.append(el('div', 'minion-name', def.name));
  token.append(keywordChips(minion.keywords));
  token.append(statBadges(minion.attack, minion.health, minion.health < minion.maxHealth));
  if (minion.sick) token.append(el('div', 'sick-tag', 'waking…'));
  return token;
}

// Minion tokens carry only live stats; name and suit come from the definition.
import { cardById } from './cards.js';
function minionName(minion) { return cardById(minion.defId).name; }
function minionSuit(minion) { return cardById(minion.defId).suit; }

/** A hero plate: portrait glyph, name, big life total, deck and hand counts. */
export function heroPlate(duelist, side, state) {
  const plate = el('div', `hero-plate side-${side}`);
  plate.dataset.side = side;
  if (state?.targetable) plate.classList.add('targetable');
  if (state?.active) plate.classList.add('active-turn');
  const face = el('div', 'hero-face', side === 'foe' ? '♜' : '♞');
  const info = el('div', 'hero-info');
  info.append(el('div', 'hero-name', duelist.name));
  const life = el('div', 'hero-life');
  life.append(el('span', 'life-heart', '♥'));
  life.append(el('span', 'life-num', String(Math.max(0, duelist.health))));
  life.append(el('span', 'life-max', `/ ${duelist.maxHealth}`));
  info.append(life);
  const meta = el('div', 'hero-meta', `Deck ${duelist.deck.length} · Hand ${duelist.hand.length}`);
  if (duelist.burnTurns > 0) meta.textContent += ` · BURNING ${duelist.burnAmount}×${duelist.burnTurns}`;
  info.append(meta);
  info.append(lifeBar(duelist));
  plate.append(face, info);
  return plate;
}

/** The ember track: filled pips for energy in hand, hollow for the rest. */
export function emberTrack(duelist) {
  const track = el('div', 'ember-track');
  track.append(el('span', 'ember-label', `EMBER ${duelist.ember}/${duelist.emberMax}`));
  const pips = el('div', 'ember-pips');
  for (let i = 0; i < duelist.emberMax; i += 1) {
    pips.append(el('span', `pip${i < duelist.ember ? ' full' : ''}`));
  }
  track.append(pips);
  return track;
}

/** The Warden's announced plan — the line that makes the opponent readable. */
export function intentBanner(state) {
  const banner = el('div', 'intent-banner');
  banner.append(el('span', 'intent-eye', '👁'));
  banner.append(el('span', 'intent-text', intent(state)));
  return banner;
}

/** A slim life bar under a hero plate's numbers, for at-a-glance reading. */
export function lifeBar(duelist) {
  const bar = el('div', 'life-bar');
  const fill = el('div', 'life-fill');
  const pct = Math.max(0, Math.min(100, (duelist.health / duelist.maxHealth) * 100));
  fill.style.width = `${pct}%`;
  if (pct <= 30) fill.classList.add('low');
  bar.append(fill);
  return bar;
}

/** The last few duel-log lines, newest last. */
export function duelLog(state) {
  const log = el('div', 'duel-log');
  for (const line of state.log.slice(-3)) log.append(el('div', 'log-line', line));
  return log;
}

/**
 * Rebuild the play table from state. `ui` carries the interaction selection:
 * { selectedCard, selectedAttacker, targetMode, justSummoned:Set, dealt:Set }.
 * Event wiring lives in main.js via data attributes and delegation.
 */
export function renderTable(root, state, ui) {
  root.innerHTML = '';
  const table = el('div', 'table');

  // Foe row: hero plate, foe hand face-up (small), foe ember.
  const foeRow = el('div', 'row foe-row');
  foeRow.append(heroPlate(state.foe, 'foe', {
    targetable: ui.targetMode === 'attack' || ui.targetMode === 'spell',
    active: state.active === 'foe',
  }));
  const foeHand = el('div', 'foe-hand');
  state.foe.hand.forEach((held) => foeHand.append(cardFace(held, 'mini', {})));
  if (state.foe.hand.length === 0) foeHand.append(el('div', 'empty-hand', 'no cards'));
  foeRow.append(foeHand);
  foeRow.append(emberTrack(state.foe));
  table.append(foeRow);

  // Foe board.
  const foeBoard = el('div', 'board foe-board');
  state.foe.board.forEach((minion) => foeBoard.append(minionToken(minion, 'foe', {
    targetable: ui.targetMode === 'attack' || ui.targetMode === 'spell',
    summoned: ui.justSummoned?.has(minion.uid),
  })));
  if (state.foe.board.length === 0) foeBoard.append(el('div', 'empty-board', '— the Warden\'s field is empty —'));
  table.append(foeBoard);

  // Middle strip: turn banner, intent, log.
  const middle = el('div', 'middle-strip');
  const turnLabel = state.active === 'player' ? `YOUR TURN · ROUND ${state.turn}` : 'WARDEN\'S TURN';
  middle.append(el('div', `turn-label ${state.active}`, turnLabel));
  middle.append(intentBanner(state));
  middle.append(duelLog(state));
  table.append(middle);

  // Player board.
  const playerBoard = el('div', 'board player-board');
  state.player.board.forEach((minion) => playerBoard.append(minionToken(minion, 'player', {
    ready: state.active === 'player' && !minion.sick && !minion.attacked,
    selected: ui.selectedAttacker === minion.uid,
    targetable: ui.targetMode === 'buff',
    summoned: ui.justSummoned?.has(minion.uid),
  })));
  if (state.player.board.length === 0) playerBoard.append(el('div', 'empty-board', '— play a minion to hold the field —'));
  table.append(playerBoard);

  // Player row: hero plate, hand fan, ember + End Turn.
  const playerRow = el('div', 'row player-row');
  playerRow.append(heroPlate(state.player, 'player', {
    targetable: ui.targetMode === 'spell',
    active: state.active === 'player',
  }));
  const hand = el('div', 'player-hand');
  state.player.hand.forEach((held, index) => {
    const def = defOf(held);
    hand.append(cardFace(held, 'hand', {
      selected: ui.selectedCard === held.uid,
      unaffordable: def.cost > state.player.ember || state.active !== 'player',
      keyNumber: index + 1,
      dealt: ui.dealt?.has(held.uid),
    }));
  });
  if (state.player.hand.length === 0) hand.append(el('div', 'empty-hand', 'no cards — end the turn to draw'));
  playerRow.append(hand);
  const controls = el('div', 'controls');
  controls.append(emberTrack(state.player));
  const endButton = el('button', 'end-turn', 'END TURN ▸');
  endButton.id = 'end-turn';
  endButton.disabled = state.active !== 'player' || state.phase !== 'play';
  controls.append(endButton);
  controls.append(el('div', 'hint-line', ui.hint || 'Click a card, then a target. Keys 1–7 pick a card, Space ends the turn.'));
  playerRow.append(controls);
  table.append(playerRow);

  root.append(table);
}

/** The title screen: name, tagline, a fan of showcase cards, Play button. */
export function renderTitle(root, showcase) {
  root.innerHTML = '';
  const screen = el('div', 'screen title-screen');
  screen.append(el('div', 'title-kicker', 'AN ORIGINAL CARD DUEL'));
  screen.append(el('h1', 'game-title', 'EMBERFALL DUEL'));
  screen.append(el('div', 'title-tagline', 'Out-think the Ashen Warden. Every card is a decision; every suit a weapon.'));
  const fan = el('div', 'title-fan');
  showcase.forEach((instance, index) => {
    const card = cardFace(instance, 'hand', {});
    card.style.setProperty('--fan', String(index - (showcase.length - 1) / 2));
    fan.append(card);
  });
  screen.append(fan);
  const rules = el('div', 'title-rules');
  rules.append(el('div', 'rule-line', '♥ 24 life each · 🔥 ember grows every turn · ⚔ minions trade blows · GUARD must be answered'));
  rules.append(el('div', 'rule-line', '👁 The Warden announces its plan — read it, counter it, burn it down.'));
  screen.append(rules);
  const play = el('button', 'play-button', '▶  ENTER THE DUEL');
  play.id = 'play-button';
  screen.append(play);
  screen.append(el('div', 'title-foot', 'Mouse + keyboard · plays offline · no two duels alike'));
  root.append(screen);
}

/** Win and loss screens with the duel's numbers and a Play Again button. */
export function renderEnd(root, state, best) {
  root.innerHTML = '';
  const won = state.winner === 'player';
  const draw = state.winner === 'draw';
  const screen = el('div', `screen end-screen ${won ? 'won' : draw ? 'draw' : 'lost'}`);
  screen.append(el('div', 'end-kicker', draw ? 'MUTUAL RUIN' : won ? 'VICTORY' : 'DEFEAT'));
  screen.append(el('h1', 'end-title', draw ? 'BOTH FALL' : won ? 'THE WARDEN BURNS' : 'THE ASHES CLAIM YOU'));
  screen.append(el('div', 'end-line', draw
    ? 'Two heroes, one pyre. Shuffle up and settle it.'
    : won
      ? 'The Ashen Warden crumbles. The ember is yours — this time.'
      : 'The Warden read you better. Study its intent banner and strike back.'));
  const stats = el('div', 'end-stats');
  const rows = [
    ['Rounds fought', String(state.turn)],
    ['Damage dealt', String(state.player.damageDealt)],
    ['Cards played', String(state.player.cardsPlayed)],
    ['Your life left', `${Math.max(0, state.player.health)} / ${state.player.maxHealth}`],
    ['Warden life left', `${Math.max(0, state.foe.health)} / ${state.foe.maxHealth}`],
  ];
  if (best) rows.push(['Best result', best]);
  for (const [label, value] of rows) {
    const row = el('div', 'stat-row');
    row.append(el('span', 'stat-label', label));
    row.append(el('span', 'stat-value', value));
    stats.append(row);
  }
  screen.append(stats);
  const again = el('button', 'play-button', '↻  DUEL AGAIN');
  again.id = 'play-button';
  screen.append(again);
  root.append(screen);
}
