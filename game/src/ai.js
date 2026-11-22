// EMBERFALL DUEL — the Ashen Warden, an opponent you can read and counter.
// The Warden plays by visible rules, not hidden dice: it develops its board,
// removes your biggest threat when it can, guards when it is behind, and goes
// for the hero when the way is clear. `intent()` announces its plan in plain
// words before its turn, so every loss teaches you what to play next time.

import { WARDEN_TAUNTS } from './config.js';
import { attackTargets, attackWith, boardThreat, otherSide, playCard, playProblem, readyAttackers, sideOf } from './state.js';
import { defOf } from './deck.js';
import { needsTarget } from './cards.js';

/** How much a minion is worth keeping alive: body plus keyword value. */
export function minionValue(minion) {
  let value = minion.attack * 2 + minion.health;
  if (minion.keywords.includes('guard')) value += 3;
  if (minion.keywords.includes('swift')) value += 2;
  if (minion.keywords.includes('thorns')) value += 2;
  if (minion.keywords.includes('kindle')) value += 2;
  return value;
}

/** The strongest minion on a board, or null. */
export function biggestThreat(duelist) {
  let best = null;
  for (const minion of duelist.board) {
    if (!best || minionValue(minion) > minionValue(best)) best = minion;
  }
  return best;
}

/**
 * The Warden's announced plan for its coming turn, in one readable line.
 * Computed from public information only: its hand, both boards, both heroes.
 */
export function intent(state) {
  const foe = state.foe;
  const you = state.player;
  const threat = boardThreat(foe);
  const playable = foe.hand.filter((held) => !playProblem({ ...state, active: 'foe' }, 'foe', held));
  const finisher = playable.find((held) => {
    const def = defOf(held);
    return def.kind === 'spell' && def.effect.kind === 'damage' && def.effect.amount >= you.health;
  });
  if (finisher) return `The Warden holds lethal — ${defOf(finisher).name} ends you. Heal or end it now!`;
  if (threat >= you.health && foe.board.length > 0) {
    return `The Warden's board threatens ${threat} — enough to finish you. Play a GUARD or clear it!`;
  }
  const guard = playable.find((held) => defOf(held).keywords?.includes('guard'));
  if (foe.health <= 10 && guard) return `Wounded, the Warden will hide behind ${defOf(guard).name}. Save your removal.`;
  const big = playable
    .filter((held) => defOf(held).kind === 'minion')
    .sort((a, b) => defOf(b).cost - defOf(a).cost)[0];
  if (big) return `The Warden is saving ember for ${defOf(big).name} (${defOf(big).attack}/${defOf(big).health}). Keep an answer ready.`;
  if (threat > 0) return `The Warden will swing for ${threat} next turn. Trade or race — your call.`;
  return WARDEN_TAUNTS[state.turn % WARDEN_TAUNTS.length];
}

/** Pick the Warden's target for a damage spell: kill the biggest threat, else the hero. */
function spellTarget(state, side, def) {
  const foeSide = otherSide(side);
  const foe = sideOf(state, foeSide);
  const threat = biggestThreat(foe);
  if (threat && def.effect.amount >= threat.health) return { side: foeSide, uid: threat.uid };
  if (def.effect.amount >= foe.health) return { side: foeSide, uid: null };
  if (threat && def.effect.amount >= 4) return { side: foeSide, uid: threat.uid };
  return { side: foeSide, uid: null };
}

/** Play one card for the Warden if a sensible play exists. Returns events or null. */
function playOneCard(state) {
  const foe = state.foe;
  const you = state.player;
  const playable = foe.hand.filter((held) => !playProblem(state, 'foe', held));
  if (playable.length === 0) return null;
  // Heal when hurt and holding the rain.
  const rain = playable.find((held) => defOf(held).effect?.kind === 'heal');
  if (rain && foe.health <= foe.maxHealth - 5) return playCard(state, 'foe', rain, null);
  // Burn the hero when ahead on board.
  const burn = playable.find((held) => defOf(held).effect?.kind === 'burn');
  if (burn && boardThreat(foe) >= boardThreat(you)) return playCard(state, 'foe', burn, null);
  // Sweep a wide enemy board.
  const sweep = playable.find((held) => defOf(held).effect?.kind === 'damageAll');
  if (sweep && you.board.length >= 3) return playCard(state, 'foe', sweep, null);
  // Biggest minion first, then spells, then card draw.
  const minions = playable.filter((held) => defOf(held).kind === 'minion')
    .sort((a, b) => defOf(b).cost - defOf(a).cost);
  if (minions.length > 0) return playCard(state, 'foe', minions[0], null);
  const buff = playable.find((held) => defOf(held).effect?.kind === 'buff');
  if (buff && foe.board.length > 0) {
    const ally = biggestThreat(foe);
    return playCard(state, 'foe', buff, { side: 'foe', uid: ally.uid });
  }
  const damage = playable.find((held) => defOf(held).effect?.kind === 'damage');
  if (damage) return playCard(state, 'foe', damage, spellTarget(state, 'foe', defOf(damage)));
  const draw = playable.find((held) => defOf(held).effect?.kind === 'draw');
  if (draw) return playCard(state, 'foe', draw, null);
  return null;
}

/** Make one attack for the Warden: favourable trades first, then the hero. */
function attackOnce(state) {
  const attackers = readyAttackers(state, 'foe');
  if (attackers.length === 0) return null;
  const attacker = attackers.sort((a, b) => b.attack - a.attack)[0];
  const targets = attackTargets(state, 'foe');
  const hero = targets.find((t) => t.uid === null);
  const minionTargets = targets.filter((t) => t.uid !== null);
  // Lethal on the hero beats everything.
  if (hero && attacker.attack >= state.player.health) {
    return attackWith(state, 'foe', attacker.uid, hero);
  }
  // Take a trade that kills and survives.
  for (const target of minionTargets) {
    const defender = state.player.board.find((m) => m.uid === target.uid);
    if (defender && attacker.attack >= defender.health && defender.attack < attacker.health) {
      return attackWith(state, 'foe', attacker.uid, target);
    }
  }
  // Guards must be answered even at a loss.
  if (!hero && minionTargets.length > 0) {
    const weakest = minionTargets
      .map((t) => state.player.board.find((m) => m.uid === t.uid))
      .filter(Boolean)
      .sort((a, b) => a.health - b.health)[0];
    if (weakest) return attackWith(state, 'foe', attacker.uid, { side: 'player', uid: weakest.uid });
  }
  // Otherwise race: hit the hero, unless a huge threat must die.
  const threat = biggestThreat(state.player);
  if (hero && threat && threat.attack >= 5 && attacker.attack >= threat.health) {
    return attackWith(state, 'foe', attacker.uid, { side: 'player', uid: threat.uid });
  }
  if (hero) return attackWith(state, 'foe', attacker.uid, hero);
  return null;
}

/**
 * The Warden's whole turn as a list of steps, one visible action per step, so
 * the renderer can animate them one at a time with pauses between.
 */
export function planFoeTurn(state) {
  const steps = [];
  let guard = 0;
  while (guard < 24 && state.phase === 'play') {
    guard += 1;
    const played = playOneCard(state);
    if (played) {
      steps.push(played);
      continue;
    }
    const swung = attackOnce(state);
    if (swung) {
      steps.push(swung);
      continue;
    }
    break;
  }
  return steps;
}

/** True when a card in hand wants a target the Warden must choose (for tests). */
export function foeNeedsTarget(instance) {
  return needsTarget(defOf(instance));
}
