// Rules engine: pure state, no DOM. Turns, ember, play, combat, win check.
import { CONFIG } from './config.js';
import { cardById } from './cards.js';
import { buildDeck, drawFrom } from './deck.js';
import { mulberry32 } from './random.js';

let uidCounter = 1;

export function makeMinion(cardId, owner) {
  const card = cardById(cardId);
  return {
    uid: uidCounter++,
    cardId,
    owner,
    attack: card.attack,
    health: card.health,
    maxHealth: card.health,
    keywords: card.keywords.slice(),
    canAttack: card.keywords.includes('SWIFT'),
    justSummoned: !card.keywords.includes('SWIFT'),
    attacked: false,
  };
}

export function newDuel(seed) {
  uidCounter = 1;
  const rng = mulberry32(seed);
  const playerDeck = buildDeck(rng);
  const foeDeck = buildDeck(rng);
  const state = {
    seed,
    round: 1,
    turn: 'player',
    phase: 'play',
    winner: null,
    log: [],
    stats: { playerDamage: 0, foeDamage: 0, playerPlayed: 0, foePlayed: 0 },
    player: { life: CONFIG.heroLife, maxLife: CONFIG.heroLife, ember: CONFIG.startEmber, maxEmber: CONFIG.startEmber, hand: [], board: [], deck: playerDeck, fatigue: 0, burn: 0 },
    foe: { life: CONFIG.heroLife, maxLife: CONFIG.heroLife, ember: CONFIG.startEmber, maxEmber: CONFIG.startEmber, hand: [], board: [], deck: foeDeck, fatigue: 0, burn: 0 },
  };
  drawFrom(state.player.deck, state.player.hand, CONFIG.openingHand, CONFIG.handLimit);
  drawFrom(state.foe.deck, state.foe.hand, CONFIG.openingHand, CONFIG.handLimit);
  logLine(state, 'Duel begins. You hold the first ember.');
  return state;
}

export function logLine(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log.shift();
}

export function otherSide(side) {
  return side === 'player' ? 'foe' : 'player';
}

export function startTurn(state, side) {
  const p = state[side];
  p.maxEmber = Math.min(CONFIG.maxEmber, p.maxEmber + (state.round > 1 || side === 'foe' ? 0 : 0));
  // Ember growth: +1 max at the start of each of your turns after round 1.
  if (state.round > 1 || side === 'foe') {
    p.maxEmber = Math.min(CONFIG.maxEmber, p.maxEmber + 1);
    if (side === 'player' && state.round === 1) p.maxEmber = CONFIG.startEmber;
  }
  if (side === 'player' && state.round === 1) p.maxEmber = CONFIG.startEmber;
  p.ember = p.maxEmber;
  for (const m of p.board) {
    m.canAttack = true;
    m.justSummoned = false;
    m.attacked = false;
    if (m.keywords.includes('KINDLE')) m.attack += 1;
  }
  // Burn tick at turn start.
  if (p.burn > 0) {
    damageHero(state, side, p.burn, 'burn');
    p.burn = 0;
    logLine(state, side === 'player' ? 'Smoulder burns you.' : 'Smoulder burns the Warden.');
  }
  // Draw 1 (skip on the very first player turn: opening hand already dealt).
  const isFirstPlayerTurn = side === 'player' && state.round === 1 && p.hand.length === CONFIG.openingHand && !state._drewOnce;
  if (!isFirstPlayerTurn) {
    drawCards(state, side, 1);
  } else {
    state._drewOnce = true;
  }
  checkWin(state);
}

export function drawCards(state, side, count) {
  const p = state[side];
  for (let i = 0; i < count; i++) {
    if (!p.deck.length) {
      p.fatigue += 1;
      damageHero(state, side, p.fatigue, 'fatigue');
      logLine(state, side === 'player' ? `Fatigue bites you for ${p.fatigue}.` : `Fatigue bites the Warden for ${p.fatigue}.`);
    } else {
      drawFrom(p.deck, p.hand, 1, CONFIG.handLimit);
    }
  }
  checkWin(state);
}

export function damageHero(state, side, amount, source = 'hit') {
  const p = state[side];
  p.life = Math.max(0, p.life - amount);
  if (side === 'foe') state.stats.playerDamage += amount;
  else state.stats.foeDamage += amount;
  checkWin(state);
}

export function healHero(state, side, amount) {
  const p = state[side];
  p.life = Math.min(p.maxLife, p.life + amount);
}

export function canPlay(state, side, handIndex) {
  const p = state[side];
  const card = cardById(p.hand[handIndex]);
  if (!card) return { ok: false, reason: 'No card' };
  if (state.turn !== side) return { ok: false, reason: 'Not your turn' };
  if (state.winner) return { ok: false, reason: 'Duel over' };
  if (card.cost > p.ember) return { ok: false, reason: 'Not enough ember' };
  if (card.kind === 'minion' && p.board.length >= CONFIG.boardLimit) return { ok: false, reason: 'Board full' };
  return { ok: true, card };
}

export function playCard(state, side, handIndex, target = null) {
  const check = canPlay(state, side, handIndex);
  if (!check.ok) return { ok: false, reason: check.reason, events: [] };
  const p = state[side];
  const foeSide = otherSide(side);
  const card = check.card;
  const events = [];
  p.hand.splice(handIndex, 1);
  p.ember -= card.cost;
  if (side === 'player') state.stats.playerPlayed += 1; else state.stats.foePlayed += 1;
  const who = side === 'player' ? 'You play' : 'Warden plays';
  if (card.kind === 'minion') {
    const m = makeMinion(card.id, side);
    p.board.push(m);
    logLine(state, `${who} ${card.name} (${card.attack}/${card.health}).`);
    events.push({ type: 'summon', side, uid: m.uid, cardId: card.id });
    return { ok: true, events };
  }
  // Spells
  logLine(state, `${who} ${card.name}.`);
  if (card.effect === 'damage-any') {
    if (target && target.type === 'hero') {
      damageHero(state, target.side, card.amount);
      events.push({ type: 'damage-hero', side: target.side, amount: card.amount });
    } else if (target && target.type === 'minion') {
      const hit = damageMinion(state, target.side, target.uid, card.amount);
      events.push({ type: 'damage-minion', ...hit });
    } else {
      // No target given: hit enemy hero (AI default).
      damageHero(state, foeSide, card.amount);
      events.push({ type: 'damage-hero', side: foeSide, amount: card.amount });
    }
  } else if (card.effect === 'damage-all-foe') {
    const targets = state[foeSide].board.map((m) => m.uid);
    for (const uid of targets) damageMinion(state, foeSide, uid, card.amount);
    events.push({ type: 'sweep', side: foeSide, amount: card.amount });
  } else if (card.effect === 'heal-hero') {
    healHero(state, side, card.amount);
    events.push({ type: 'heal', side, amount: card.amount });
  } else if (card.effect === 'draw') {
    drawCards(state, side, card.amount);
    events.push({ type: 'draw', side, amount: card.amount });
  } else if (card.effect === 'buff') {
    const m = p.board.find((x) => x.uid === (target && target.uid));
    if (m) {
      m.attack += card.amount; m.health += card.amount; m.maxHealth += card.amount;
      events.push({ type: 'buff', side, uid: m.uid, amount: card.amount });
    }
  } else if (card.effect === 'burn-hero') {
    damageHero(state, foeSide, card.amount);
    state[foeSide].burn = card.amount;
    events.push({ type: 'burn', side: foeSide, amount: card.amount });
  }
  cleanup(state);
  checkWin(state);
  return { ok: true, events };
}

export function damageMinion(state, side, uid, amount) {
  const p = state[side];
  const m = p.board.find((x) => x.uid === uid);
  if (!m) return { side, uid, amount: 0, died: false };
  m.health -= amount;
  return { side, uid, amount, died: m.health <= 0 };
}

export function cleanup(state) {
  for (const side of ['player', 'foe']) {
    state[side].board = state[side].board.filter((m) => m.health > 0);
  }
}

export function guardsOn(state, side) {
  return state[side].board.filter((m) => m.keywords.includes('GUARD') && m.health > 0);
}

export function canAttack(state, side, attackerUid, target) {
  if (state.turn !== side || state.winner) return { ok: false, reason: 'Not your turn' };
  const atk = state[side].board.find((m) => m.uid === attackerUid);
  if (!atk) return { ok: false, reason: 'No attacker' };
  if (!atk.canAttack || atk.attacked) return { ok: false, reason: 'Not ready' };
  const foeSide = otherSide(side);
  const guards = guardsOn(state, foeSide);
  if (target.type === 'hero' && guards.length) return { ok: false, reason: 'A GUARD blocks the hero' };
  if (target.type === 'minion' && guards.length && !guards.some((g) => g.uid === target.uid)) {
    return { ok: false, reason: 'A GUARD must be attacked first' };
  }
  return { ok: true, attacker: atk };
}

export function attack(state, side, attackerUid, target) {
  const check = canAttack(state, side, attackerUid, target);
  if (!check.ok) return { ok: false, reason: check.reason, events: [] };
  const atk = check.attacker;
  const foeSide = otherSide(side);
  const events = [];
  atk.attacked = true;
  atk.canAttack = false;
  if (target.type === 'hero') {
    damageHero(state, foeSide, atk.attack);
    logLine(state, `${side === 'player' ? 'Your' : 'Warden'} ${cardById(atk.cardId).name} hits ${foeSide === 'player' ? 'you' : 'the Warden'} for ${atk.attack}.`);
    events.push({ type: 'damage-hero', side: foeSide, amount: atk.attack });
  } else {
    const def = state[foeSide].board.find((m) => m.uid === target.uid);
    if (!def) return { ok: false, reason: 'No target', events: [] };
    def.health -= atk.attack;
    atk.health -= def.attack;
    if (def.keywords.includes('THORNS')) atk.health -= 1;
    logLine(state, `${cardById(atk.cardId).name} trades with ${cardById(def.cardId).name}.`);
    events.push({ type: 'trade', attackerUid, defenderUid: def.uid, aDmg: atk.attack, dDmg: def.attack });
  }
  cleanup(state);
  checkWin(state);
  return { ok: true, events };
}

export function endTurn(state) {
  if (state.winner) return state;
  if (state.turn === 'player') {
    state.turn = 'foe';
  } else {
    state.turn = 'player';
    state.round += 1;
  }
  startTurn(state, state.turn);
  return state;
}

export function checkWin(state) {
  if (state.foe.life <= 0 && state.player.life <= 0) state.winner = 'player';
  else if (state.foe.life <= 0) state.winner = 'player';
  else if (state.player.life <= 0) state.winner = 'foe';
  return state.winner;
}

export function boardPower(state, side) {
  return state[side].board.reduce((n, m) => n + m.attack, 0);
}

export function readyAttackers(state, side) {
  return state[side].board.filter((m) => m.canAttack && !m.attacked);
}

export function isOver(state) {
  return state.winner !== null;
}
