// Original card pool for EMBERFALL DUEL. Minions and spells, four suits.
export const CARD_POOL = [
  { id: 'cinder-imp', name: 'Cinder Imp', suit: 'flame', kind: 'minion', cost: 1, attack: 2, health: 1, keywords: ['SWIFT'], text: 'SWIFT', flavour: 'Quick spark, loud pop.' },
  { id: 'ember-warden', name: 'Ember Warden', suit: 'flame', kind: 'minion', cost: 2, attack: 2, health: 3, keywords: ['GUARD'], text: 'GUARD', flavour: 'Stands where the fire is hottest.' },
  { id: 'spark-hound', name: 'Spark Hound', suit: 'flame', kind: 'minion', cost: 2, attack: 3, health: 2, keywords: [], text: '', flavour: 'Barks in sparks.' },
  { id: 'kindled-brute', name: 'Kindled Brute', suit: 'flame', kind: 'minion', cost: 4, attack: 3, health: 4, keywords: ['KINDLE'], text: 'KINDLE: +1 attack each turn', flavour: 'Angrier every dawn.' },
  { id: 'ash-giant', name: 'Ash Giant', suit: 'flame', kind: 'minion', cost: 6, attack: 6, health: 6, keywords: [], text: '', flavour: 'The mountain that burned first.' },
  { id: 'tide-scout', name: 'Tide Scout', suit: 'tide', kind: 'minion', cost: 1, attack: 1, health: 2, keywords: ['SWIFT'], text: 'SWIFT', flavour: 'Rides the first wave in.' },
  { id: 'reef-wall', name: 'Reef Wall', suit: 'tide', kind: 'minion', cost: 3, attack: 1, health: 6, keywords: ['GUARD'], text: 'GUARD', flavour: 'Old coral, new stubbornness.' },
  { id: 'wave-rider', name: 'Wave Rider', suit: 'tide', kind: 'minion', cost: 3, attack: 3, health: 3, keywords: [], text: '', flavour: 'Never touches dry ground.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', suit: 'tide', kind: 'minion', cost: 7, attack: 7, health: 7, keywords: ['GUARD'], text: 'GUARD', flavour: 'The tide with teeth.' },
  { id: 'sprout-sprite', name: 'Sprout Sprite', suit: 'grove', kind: 'minion', cost: 1, attack: 1, health: 1, keywords: [], text: '', flavour: 'Small leaf, big plans.' },
  { id: 'thorn-bear', name: 'Thorn Bear', suit: 'grove', kind: 'minion', cost: 3, attack: 2, health: 4, keywords: ['THORNS'], text: 'THORNS: 1 back to attacker', flavour: 'Hugs are not advised.' },
  { id: 'grove-guardian', name: 'Grove Guardian', suit: 'grove', kind: 'minion', cost: 4, attack: 3, health: 5, keywords: ['GUARD'], text: 'GUARD', flavour: 'Roots remember every fire.' },
  { id: 'elder-oak', name: 'Elder Oak', suit: 'grove', kind: 'minion', cost: 5, attack: 4, health: 7, keywords: ['THORNS', 'KINDLE'], text: 'THORNS, KINDLE', flavour: 'Older than the ash itself.' },
  { id: 'void-stalker', name: 'Void Stalker', suit: 'void', kind: 'minion', cost: 2, attack: 3, health: 1, keywords: ['SWIFT'], text: 'SWIFT', flavour: 'You see it after it strikes.' },
  { id: 'rift-cultist', name: 'Rift Cultist', suit: 'void', kind: 'minion', cost: 3, attack: 2, health: 3, keywords: ['KINDLE'], text: 'KINDLE: +1 attack each turn', flavour: 'Chants louder each night.' },
  { id: 'null-horror', name: 'Null Horror', suit: 'void', kind: 'minion', cost: 5, attack: 5, health: 4, keywords: [], text: '', flavour: 'A hole shaped like hunger.' },
  { id: 'ember-bolt', name: 'Ember Bolt', suit: 'flame', kind: 'spell', cost: 2, effect: 'damage-any', amount: 3, text: 'Deal 3 damage to any target', flavour: 'One bright argument.' },
  { id: 'cinder-rain', name: 'Cinder Rain', suit: 'flame', kind: 'spell', cost: 4, effect: 'damage-all-foe', amount: 2, text: 'Deal 2 damage to all enemy minions', flavour: 'Weather, weaponised.' },
  { id: 'smoulder', name: 'Smoulder', suit: 'flame', kind: 'spell', cost: 3, effect: 'burn-hero', amount: 2, text: 'Burn enemy hero: 2 now, 2 next turn', flavour: 'Slow fire, sure fire.' },
  { id: 'tide-surge', name: 'Tide Surge', suit: 'tide', kind: 'spell', cost: 2, effect: 'damage-any', amount: 2, text: 'Deal 2 damage to any target', flavour: 'The sea pushes back.' },
  { id: 'second-wind', name: 'Second Wind', suit: 'tide', kind: 'spell', cost: 3, effect: 'draw', amount: 2, text: 'Draw 2 cards', flavour: 'Breathe. Think. Strike.' },
  { id: 'grove-mending', name: 'Grove Mending', suit: 'grove', kind: 'spell', cost: 2, effect: 'heal-hero', amount: 5, text: 'Heal your hero for 5', flavour: 'Green stitches for red wounds.' },
  { id: 'wild-growth', name: 'Wild Growth', suit: 'grove', kind: 'spell', cost: 2, effect: 'buff', amount: 2, text: 'Give a friendly minion +2/+2', flavour: 'Grow fast or fall.' },
  { id: 'void-lance', name: 'Void Lance', suit: 'void', kind: 'spell', cost: 3, effect: 'damage-any', amount: 4, text: 'Deal 4 damage to any target', flavour: 'A spear of nothing.' },
  { id: 'rift-mending', name: 'Rift Mending', suit: 'void', kind: 'spell', cost: 3, effect: 'heal-hero', amount: 4, text: 'Heal your hero for 4', flavour: 'Stitch the tear with shadow.' },
  { id: 'ashen-wave', name: 'Ashen Wave', suit: 'void', kind: 'spell', cost: 5, effect: 'damage-all-foe', amount: 3, text: 'Deal 3 damage to all enemy minions', flavour: 'Ash remembers being fire.' },
  { id: 'spark-study', name: 'Spark Study', suit: 'flame', kind: 'spell', cost: 1, effect: 'draw', amount: 1, text: 'Draw 1 card', flavour: 'One more idea.' },
];

const BY_ID = new Map(CARD_POOL.map((c) => [c.id, c]));

export function cardById(id) {
  return BY_ID.get(id) || null;
}

export function isMinion(card) {
  return card && card.kind === 'minion';
}

export function isSpell(card) {
  return card && card.kind === 'spell';
}

export function needsTarget(card) {
  if (!card) return false;
  return card.effect === 'damage-any' || card.effect === 'buff';
}

export function targetSide(card) {
  if (!card) return 'any';
  if (card.effect === 'buff') return 'friendly';
  return 'any';
}

export function cardPower(card) {
  if (!card) return 0;
  if (card.kind === 'minion') return card.attack + card.health;
  return card.amount || 1;
}

export function showcaseCards() {
  return ['ash-giant', 'deep-leviathan', 'elder-oak', 'ember-bolt', 'null-horror']
    .map((id) => cardById(id)).filter(Boolean);
}

export function cardsBySuit(suit) {
  return CARD_POOL.filter((c) => c.suit === suit);
}
