// EMBERFALL DUEL — screenshot states.
// ?shot=title|table|win|loss&seed=N renders one frozen, deterministic moment
// of the game with no timers running, so the four submitted screenshots are
// real renders of this exact code — the same table a player would see.

import { newDuel, startTurn, summonMinion } from './state.js';
import { makeRng } from './random.js';

/** Find a card instance of a given definition inside a duelist's hand/deck. */
function findCard(duelist, defId) {
  return duelist.hand.find((held) => held.defId === defId)
    || duelist.deck.find((held) => held.defId === defId)
    || null;
}

let stagedSerial = 0;

/** A staged instance of any pool card, for shots that reach beyond the deck recipe. */
function stagedInstance(defId) {
  stagedSerial += 1;
  return { uid: `shot-${stagedSerial}`, defId };
}

/** Put a named card on a board as if it had been played turns ago. */
function stageMinion(duelist, defId, tweaks) {
  const instance = findCard(duelist, defId) || stagedInstance(defId);
  duelist.hand = duelist.hand.filter((held) => held.uid !== instance.uid);
  duelist.deck = duelist.deck.filter((held) => held.uid !== instance.uid);
  const minion = summonMinion(duelist, instance);
  minion.sick = false;
  if (tweaks?.attack) minion.attack = tweaks.attack;
  if (tweaks?.health) { minion.health = tweaks.health; minion.maxHealth = Math.max(minion.maxHealth, tweaks.health); }
  return minion;
}

/** Force a named card into a hand so the screenshot shows real choices. */
function stageHand(duelist, defIds) {
  for (const defId of defIds) {
    const instance = findCard(duelist, defId) || stagedInstance(defId);
    duelist.deck = duelist.deck.filter((held) => held.uid !== instance.uid);
    if (!duelist.hand.some((held) => held.uid === instance.uid)) duelist.hand.push(instance);
  }
}

/**
 * Build the frozen state for one screenshot.
 *  title — handled by the caller (no duel needed), returns null.
 *  table — a rich mid-duel: both boards full, both hands visible, life spent.
 *  win   — the Warden at 0 life, the victory screen's numbers.
 *  loss  — the player at 0 life, the defeat screen's numbers.
 */
export function shotState(name, seed) {
  if (name === 'title') return null;
  const rng = makeRng(seed);
  const state = newDuel(rng);
  state.phase = 'play';
  startTurn(state, 'player');

  if (name === 'table') {
    state.turn = 6;
    state.player.health = 17;
    state.foe.health = 13;
    state.player.emberMax = 6;
    state.player.ember = 5;
    state.foe.emberMax = 6;
    state.foe.ember = 2;
    state.player.damageDealt = 11;
    state.foe.damageDealt = 7;
    state.player.cardsPlayed = 9;
    stageMinion(state.player, 'ember-knight', { attack: 5 });
    stageMinion(state.player, 'oak-sentinel');
    stageMinion(state.player, 'spark-sprite');
    stageMinion(state.foe, 'tide-warden', { health: 3 });
    stageMinion(state.foe, 'void-revenant');
    stageMinion(state.foe, 'briar-bear');
    stageHand(state.player, ['searing-bolt', 'wild-growth', 'cinder-hound', 'mending-rain']);
    stageHand(state.foe, ['frost-lance', 'shade-imp', 'slow-burn']);
    state.player.hand = state.player.hand.slice(0, 5);
    state.foe.hand = state.foe.hand.slice(0, 4);
    state.log = [
      'You play Ember Knight.',
      'Ashen Warden plays Tide Warden.',
      'Your turn — 5 ember.',
    ];
    return state;
  }

  if (name === 'win') {
    state.turn = 9;
    state.player.health = 8;
    state.foe.health = 0;
    state.player.damageDealt = 24;
    state.player.cardsPlayed = 16;
    state.winner = 'player';
    state.phase = 'over';
    return state;
  }

  if (name === 'loss') {
    state.turn = 8;
    state.player.health = 0;
    state.foe.health = 11;
    state.player.damageDealt = 13;
    state.player.cardsPlayed = 14;
    state.winner = 'foe';
    state.phase = 'over';
    return state;
  }

  return state;
}

/** Every shot name the screenshot script knows how to render. */
export const SHOT_NAMES = ['title', 'table', 'win', 'loss'];

/** The five showcase cards fanned across the title screen. */
export function titleShowcase(seed) {
  const rng = makeRng(seed);
  const state = newDuel(rng);
  const wanted = ['pyre-colossus', 'deep-leviathan', 'elder-treant', 'umbral-titan', 'ember-knight'];
  const found = [];
  for (const defId of wanted) {
    found.push(findCard(state.player, defId) || findCard(state.foe, defId) || stagedInstance(defId));
  }
  return found;
}
