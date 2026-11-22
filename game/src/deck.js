// Deck recipe: 12 distinct cards x2 = 24. Same recipe both sides, seeded shuffle.
import { shuffle } from './random.js';

export const DECK_RECIPE = [
  'cinder-imp', 'ember-warden', 'spark-hound', 'kindled-brute',
  'tide-scout', 'reef-wall', 'wave-rider',
  'sprout-sprite', 'thorn-bear', 'grove-guardian',
  'void-stalker', 'rift-cultist',
];

export const SPELL_RECIPE = [
  'ember-bolt', 'grove-mending', 'wild-growth', 'second-wind',
];

// Full 24: recipe minions x2 would be 24 already; blend spells in by swapping:
// 8 minions x2 (16) + 4 spells x2 (8) = 24. Kept simple and readable.
export const FULL_RECIPE = [
  'cinder-imp', 'ember-warden', 'kindled-brute', 'ash-giant',
  'reef-wall', 'wave-rider', 'thorn-bear', 'grove-guardian',
  'ember-bolt', 'grove-mending', 'wild-growth', 'second-wind',
];

export function buildDeck(rng, copies = 2) {
  const ids = [];
  for (const id of FULL_RECIPE) {
    for (let i = 0; i < copies; i++) ids.push(id);
  }
  return shuffle(ids, rng);
}

export function drawFrom(deck, hand, count, handLimit) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (!deck.length) break;
    const id = deck.pop();
    if (hand.length >= handLimit) continue;
    hand.push(id);
    drawn.push(id);
  }
  return drawn;
}

export function deckSize(deck) {
  return deck.length;
}

export function recipeNames() {
  return FULL_RECIPE.slice();
}
