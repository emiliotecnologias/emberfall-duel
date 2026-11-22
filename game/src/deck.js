// EMBERFALL DUEL — deck building and drawing.
// Both duelists fight with the same 24-card deck recipe (two copies of twelve
// distinct cards across all four suits), shuffled by the seeded generator, so
// the duel is fair and a seed replays it exactly.

import { DUEL } from './config.js';
import { CARD_POOL, cardById } from './cards.js';
import { shuffle } from './random.js';

/** The twelve distinct cards each deck carries twice: a curve from 1 to 8 ember. */
export const DECK_RECIPE = [
  'spark-sprite', 'seedling-scout', 'cinder-hound', 'searing-bolt',
  'mending-rain', 'tide-warden', 'slow-burn', 'ember-knight',
  'oak-sentinel', 'wildfire', 'elder-treant', 'deep-leviathan',
];

/** Build one shuffled deck: 24 card instances with unique instance ids. */
export function buildDeck(rng, owner) {
  const cards = [];
  let serial = 0;
  for (const id of DECK_RECIPE) {
    for (let copy = 0; copy < 2; copy += 1) {
      serial += 1;
      cards.push({ uid: `${owner}-${serial}`, defId: id });
    }
  }
  return shuffle(rng, cards).slice(0, DUEL.deckSize);
}

/** The definition behind a card instance. */
export function defOf(instance) {
  return cardById(instance.defId);
}

/**
 * Draw one card for a duelist. Returns an event describing what happened:
 * { type: 'draw', card } | { type: 'burn', card } | { type: 'fatigue', amount }.
 * The caller applies the event to the state and animates it.
 */
export function drawOne(duelist) {
  if (duelist.deck.length === 0) {
    duelist.fatigue += 1;
    return { type: 'fatigue', amount: DUEL.fatigueStart + duelist.fatigue - 1 };
  }
  const card = duelist.deck.pop();
  if (duelist.hand.length >= DUEL.handLimit) return { type: 'burn', card };
  duelist.hand.push(card);
  return { type: 'draw', card };
}

/** Draw several cards, collecting every event in order. */
export function drawMany(duelist, count) {
  const events = [];
  for (let i = 0; i < count; i += 1) events.push(drawOne(duelist));
  return events;
}

/** Sanity: every recipe id must exist in the pool. Returns missing ids. */
export function recipeProblems() {
  const known = new Set(CARD_POOL.map((card) => card.id));
  return DECK_RECIPE.filter((id) => !known.has(id));
}

/** The deck's ember curve as a label, e.g. "1×8 · 2×8 · 3×6 …" for the README/tests. */
export function curveLabel() {
  const counts = new Map();
  for (const id of DECK_RECIPE) {
    const cost = cardById(id).cost;
    counts.set(cost, (counts.get(cost) || 0) + 2);
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([cost, n]) => `${cost}×${n}`).join(' · ');
}
