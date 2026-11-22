// EMBERFALL DUEL — the rules engine.
// Pure state and transitions: no DOM, no timers. The renderer asks this module
// what is legal, applies moves, and reads back events to animate. The AI uses
// the same functions the player does, so both duelists obey one rulebook.

import { DUEL } from './config.js';
import { buildDeck, defOf, drawMany, drawOne } from './deck.js';
import { needsTarget } from './cards.js';

let minionSerial = 0;

/** One duelist: hero, hand, board, deck and the counters the HUD shows. */
export function makeDuelist(name, rng, owner) {
  return {
    name,
    owner,
    health: DUEL.heroHealth,
    maxHealth: DUEL.heroHealth,
    ember: 0,
    emberMax: 0,
    deck: buildDeck(rng, owner),
    hand: [],
    board: [],
    burnTurns: 0, // remaining Slow Burn ticks waiting on this hero
    burnAmount: 0,
    fatigue: 0,
    damageDealt: 0, // lifetime score the end screens report
    cardsPlayed: 0,
  };
}

/** A fresh duel. The player always takes the first turn. */
export function newDuel(rng) {
  const state = {
    rng,
    turn: 0, // counts full rounds; each side's start increments its own clock
    active: 'player',
    phase: 'title', // title | play | over
    winner: null, // 'player' | 'foe' | 'draw'
    log: [],
    player: makeDuelist('You', rng, 'p'),
    foe: makeDuelist('Ashen Warden', rng, 'f'),
  };
  drawMany(state.player, DUEL.openingHand);
  drawMany(state.foe, DUEL.openingHand);
  return state;
}

/** The duelist object for a side key ('player' | 'foe'). */
export function sideOf(state, side) {
  return side === 'player' ? state.player : state.foe;
}

/** The other side's key. */
export function otherSide(side) {
  return side === 'player' ? 'foe' : 'player';
}

function say(state, line) {
  state.log.push(line);
  if (state.log.length > 40) state.log.shift();
}

/** Summon a minion instance onto a board, ready to render. */
export function summonMinion(duelist, instance) {
  const def = defOf(instance);
  minionSerial += 1;
  const minion = {
    uid: `m${minionSerial}`,
    defId: def.id,
    attack: def.attack,
    health: def.health,
    maxHealth: def.health,
    keywords: [...(def.keywords || [])],
    sick: !def.keywords?.includes('swift'), // summoning sickness unless SWIFT
    attacked: false,
  };
  duelist.board.push(minion);
  return minion;
}

/** Remove dead minions (health <= 0) from both boards. Returns the fallen. */
export function sweepDead(state) {
  const fallen = [];
  for (const duelist of [state.player, state.foe]) {
    duelist.board = duelist.board.filter((minion) => {
      if (minion.health <= 0) {
        fallen.push(minion);
        return false;
      }
      return true;
    });
  }
  return fallen;
}

/** Deal damage to a hero, tracking score and the win condition. */
export function hurtHero(state, side, amount, sourceSide) {
  const duelist = sideOf(state, side);
  duelist.health -= amount;
  if (sourceSide) sideOf(state, sourceSide).damageDealt += amount;
  checkEnd(state);
  return amount;
}

/** Deal damage to one minion. Thorns answers back when the source is a minion. */
export function hurtMinion(state, side, minion, amount, attacker) {
  minion.health -= amount;
  if (attacker && minion.keywords.includes('thorns') && minion.health > 0) {
    attacker.health -= 1;
  }
  sweepDead(state);
}

/** Heal a hero, never above the starting life total. */
export function healHero(state, side, amount) {
  const duelist = sideOf(state, side);
  const before = duelist.health;
  duelist.health = Math.min(duelist.maxHealth, duelist.health + amount);
  return duelist.health - before;
}

/** Set winner/phase when a hero falls. Both falling together is a draw. */
export function checkEnd(state) {
  if (state.phase === 'over') return;
  const playerDown = state.player.health <= 0;
  const foeDown = state.foe.health <= 0;
  if (playerDown && foeDown) {
    state.winner = 'draw';
    state.phase = 'over';
  } else if (foeDown) {
    state.winner = 'player';
    state.phase = 'over';
  } else if (playerDown) {
    state.winner = 'foe';
    state.phase = 'over';
  }
}

/** Every legal target for a targeted spell, as { side, uid|null } (uid null = hero). */
export function legalTargets(state, side, card) {
  const targets = [];
  if (card.effect.kind === 'buff') {
    for (const minion of sideOf(state, side).board) targets.push({ side, uid: minion.uid });
    return targets;
  }
  for (const key of ['player', 'foe']) {
    targets.push({ side: key, uid: null });
    for (const minion of sideOf(state, key).board) targets.push({ side: key, uid: minion.uid });
  }
  return targets;
}

/** Why a card cannot be played right now, or null when it can. */
export function playProblem(state, side, instance) {
  const duelist = sideOf(state, side);
  const def = defOf(instance);
  if (state.phase !== 'play') return 'The duel is not running.';
  if (state.active !== side) return 'It is not your turn.';
  if (def.cost > duelist.ember) return `Needs ${def.cost} ember — you have ${duelist.ember}.`;
  if (def.kind === 'minion' && duelist.board.length >= DUEL.boardLimit) return 'Your board is full.';
  if (def.kind === 'spell' && def.effect.kind === 'buff' && duelist.board.length === 0) {
    return 'No friendly minion to strengthen.';
  }
  return null;
}

/**
 * Play a card from hand. `target` is { side, uid } for targeted spells.
 * Returns a list of animation events; throws when the play is illegal.
 */
export function playCard(state, side, instance, target) {
  const problem = playProblem(state, side, instance);
  if (problem) throw new Error(problem);
  const duelist = sideOf(state, side);
  const foe = sideOf(state, otherSide(side));
  const def = defOf(instance);
  const events = [];
  duelist.ember -= def.cost;
  duelist.cardsPlayed += 1;
  duelist.hand = duelist.hand.filter((held) => held.uid !== instance.uid);
  say(state, `${duelist.name} plays ${def.name}.`);
  events.push({ type: 'play', side, defId: def.id });

  if (def.kind === 'minion') {
    const minion = summonMinion(duelist, instance);
    events.push({ type: 'summon', side, uid: minion.uid });
    return events;
  }

  const effect = def.effect;
  if (effect.kind === 'damage') {
    if (!target) throw new Error(`${def.name} needs a target.`);
    if (target.uid === null) {
      hurtHero(state, target.side, effect.amount, side);
      events.push({ type: 'heroHit', side: target.side, amount: effect.amount });
    } else {
      const victim = sideOf(state, target.side).board.find((m) => m.uid === target.uid);
      if (!victim) throw new Error('That minion is gone.');
      hurtMinion(state, target.side, victim, effect.amount, null);
      events.push({ type: 'minionHit', side: target.side, uid: victim.uid, amount: effect.amount });
    }
  } else if (effect.kind === 'damageAll') {
    for (const victim of [...foe.board]) {
      hurtMinion(state, otherSide(side), victim, effect.amount, null);
      events.push({ type: 'minionHit', side: otherSide(side), uid: victim.uid, amount: effect.amount });
    }
  } else if (effect.kind === 'heal') {
    const healed = healHero(state, side, effect.amount);
    events.push({ type: 'heal', side, amount: healed });
  } else if (effect.kind === 'draw') {
    for (const event of drawMany(duelist, effect.amount)) {
      if (event.type === 'fatigue') hurtHero(state, side, event.amount, null);
      events.push({ type: 'draw', side, event });
    }
  } else if (effect.kind === 'buff') {
    if (!target || target.uid === null) throw new Error(`${def.name} needs a friendly minion.`);
    const ally = duelist.board.find((m) => m.uid === target.uid);
    if (!ally) throw new Error('That minion is gone.');
    ally.attack += effect.attack;
    ally.health += effect.health;
    ally.maxHealth += effect.health;
    events.push({ type: 'buff', side, uid: ally.uid });
  } else if (effect.kind === 'burn') {
    foe.burnTurns = 2;
    foe.burnAmount = effect.amount;
    events.push({ type: 'burnSet', side: otherSide(side), amount: effect.amount });
  }
  sweepDead(state);
  checkEnd(state);
  return events;
}

/** Minions that may attack this turn: awake, not yet swung. */
export function readyAttackers(state, side) {
  return sideOf(state, side).board.filter((m) => !m.sick && !m.attacked && m.attack > 0);
}

/** Legal attack targets honouring GUARD: guards first, else anything. */
export function attackTargets(state, side) {
  const foeSide = otherSide(side);
  const foe = sideOf(state, foeSide);
  const guards = foe.board.filter((m) => m.keywords.includes('guard'));
  const targets = [];
  if (guards.length > 0) {
    for (const guard of guards) targets.push({ side: foeSide, uid: guard.uid });
    return targets;
  }
  targets.push({ side: foeSide, uid: null });
  for (const minion of foe.board) targets.push({ side: foeSide, uid: minion.uid });
  return targets;
}

/**
 * One minion attacks one target. Minions trade damage both ways; heroes only
 * take it. Returns animation events.
 */
export function attackWith(state, side, attackerUid, target) {
  const duelist = sideOf(state, side);
  const attacker = duelist.board.find((m) => m.uid === attackerUid);
  if (!attacker) throw new Error('That minion is gone.');
  if (attacker.sick) throw new Error('That minion just arrived — it needs a turn to wake.');
  if (attacker.attacked) throw new Error('That minion already attacked this turn.');
  const legal = attackTargets(state, side);
  const allowed = legal.some((t) => t.side === target.side && t.uid === target.uid);
  if (!allowed) throw new Error('A GUARD minion must be attacked first.');
  const events = [{ type: 'lunge', side, uid: attacker.uid, target }];
  attacker.attacked = true;
  if (target.uid === null) {
    hurtHero(state, target.side, attacker.attack, side);
    events.push({ type: 'heroHit', side: target.side, amount: attacker.attack });
    say(state, `${duelist.name}'s minion strikes the hero for ${attacker.attack}.`);
  } else {
    const defender = sideOf(state, target.side).board.find((m) => m.uid === target.uid);
    if (!defender) throw new Error('That minion is gone.');
    const dealt = attacker.attack;
    const taken = defender.attack;
    hurtMinion(state, target.side, defender, dealt, attacker);
    if (attacker.health > 0) hurtMinion(state, side, attacker, taken, null);
    events.push({ type: 'minionHit', side: target.side, uid: defender.uid, amount: dealt });
    events.push({ type: 'minionHit', side, uid: attacker.uid, amount: taken });
    say(state, `Minions trade blows: ${dealt} dealt, ${taken} taken.`);
  }
  sweepDead(state);
  checkEnd(state);
  return events;
}

/**
 * Begin a side's turn: burn ticks, ember grows and refills, KINDLE minions
 * swell, the board wakes, one card is drawn. Returns animation events.
 */
export function startTurn(state, side) {
  const duelist = sideOf(state, side);
  const events = [];
  state.active = side;
  if (side === 'player') state.turn += 1;
  if (duelist.burnTurns > 0) {
    duelist.burnTurns -= 1;
    hurtHero(state, side, duelist.burnAmount, otherSide(side));
    events.push({ type: 'heroHit', side, amount: duelist.burnAmount, burn: true });
    say(state, `${duelist.name} burns for ${duelist.burnAmount}.`);
  }
  duelist.emberMax = Math.min(DUEL.emberMax, duelist.emberMax + 1);
  duelist.ember = duelist.emberMax;
  for (const minion of duelist.board) {
    minion.sick = false;
    minion.attacked = false;
    if (minion.keywords.includes('kindle')) {
      minion.attack += 1;
      events.push({ type: 'buff', side, uid: minion.uid });
    }
  }
  const drawn = drawOne(duelist);
  if (drawn.type === 'fatigue') hurtHero(state, side, drawn.amount, null);
  events.push({ type: 'draw', side, event: drawn });
  say(state, `${duelist.name}'s turn — ${duelist.ember} ember.`);
  checkEnd(state);
  return events;
}

/** Hand the turn over. Returns the next side's start-of-turn events. */
export function endTurn(state) {
  if (state.phase !== 'play') return [];
  return startTurn(state, otherSide(state.active));
}

/** Total attack a board threatens next turn (the AI and the intent banner use it). */
export function boardThreat(duelist) {
  return duelist.board.reduce((sum, m) => sum + m.attack, 0);
}

/** Total health standing on a board — the other half of a board's weight. */
export function boardBulk(duelist) {
  return duelist.board.reduce((sum, m) => sum + m.health, 0);
}

/** True when a side has lethal on board against the enemy hero right now. */
export function hasLethal(state, side) {
  const foe = sideOf(state, otherSide(side));
  const guards = foe.board.some((m) => m.keywords.includes('guard'));
  if (guards) return false;
  const ready = readyAttackers(state, side).reduce((sum, m) => sum + m.attack, 0);
  return ready >= foe.health;
}
