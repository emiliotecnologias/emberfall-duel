// EMBERFALL DUEL — the card pool.
// Every name, number and rule below is original to this game. A card is data:
// cost in ember, a suit (colour + shape), and either a body (attack/health)
// with keywords or a spell effect the rules engine knows how to resolve.
//
// Effect kinds the engine understands:
//   damage   — deal N to any one target (hero or minion)
//   damageAll— deal N to every enemy minion
//   heal     — restore N to your hero
//   draw     — draw N cards
//   buff     — give a friendly minion +A/+H
//   burn     — the enemy hero takes N at the start of their next two turns

export const CARD_POOL = [
  // ---- Flame: fast, hot, fragile ----
  { id: 'spark-sprite', name: 'Spark Sprite', suit: 'flame', kind: 'minion', cost: 1, attack: 2, health: 1, keywords: ['swift'], text: 'SWIFT. A living cinder with somewhere to be.' },
  { id: 'cinder-hound', name: 'Cinder Hound', suit: 'flame', kind: 'minion', cost: 2, attack: 3, health: 2, keywords: [], text: 'It fetches firewood. It is the firewood.' },
  { id: 'ember-knight', name: 'Ember Knight', suit: 'flame', kind: 'minion', cost: 4, attack: 4, health: 4, keywords: ['kindle'], text: 'KINDLE. Its blade drinks every dawn.' },
  { id: 'pyre-colossus', name: 'Pyre Colossus', suit: 'flame', kind: 'minion', cost: 7, attack: 7, health: 6, keywords: [], text: 'The bonfire learned to walk.' },
  { id: 'searing-bolt', name: 'Searing Bolt', suit: 'flame', kind: 'spell', cost: 2, effect: { kind: 'damage', amount: 3 }, text: 'Deal 3 damage to any target.' },
  { id: 'wildfire', name: 'Wildfire', suit: 'flame', kind: 'spell', cost: 5, effect: { kind: 'damageAll', amount: 2 }, text: 'Deal 2 damage to every enemy minion.' },
  { id: 'slow-burn', name: 'Slow Burn', suit: 'flame', kind: 'spell', cost: 3, effect: { kind: 'burn', amount: 2 }, text: 'The enemy hero burns for 2 at the start of their next two turns.' },

  // ---- Tide: control, cards, cold patience ----
  { id: 'mist-runner', name: 'Mist Runner', suit: 'tide', kind: 'minion', cost: 1, attack: 1, health: 2, keywords: ['swift'], text: 'SWIFT. Gone before the splash lands.' },
  { id: 'tide-warden', name: 'Tide Warden', suit: 'tide', kind: 'minion', cost: 3, attack: 2, health: 5, keywords: ['guard'], text: 'GUARD. The harbour wall that thinks.' },
  { id: 'storm-herald', name: 'Storm Herald', suit: 'tide', kind: 'minion', cost: 5, attack: 4, health: 5, keywords: ['thorns'], text: 'THORNS. Strike the storm, get struck.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', suit: 'tide', kind: 'minion', cost: 8, attack: 8, health: 8, keywords: ['guard'], text: 'GUARD. The tide always collects.' },
  { id: 'undertow', name: 'Undertow', suit: 'tide', kind: 'spell', cost: 1, effect: { kind: 'draw', amount: 1 }, text: 'Draw a card. The current provides.' },
  { id: 'tidal-insight', name: 'Tidal Insight', suit: 'tide', kind: 'spell', cost: 3, effect: { kind: 'draw', amount: 2 }, text: 'Draw 2 cards.' },
  { id: 'frost-lance', name: 'Frost Lance', suit: 'tide', kind: 'spell', cost: 4, effect: { kind: 'damage', amount: 4 }, text: 'Deal 4 damage to any target.' },

  // ---- Grove: growth, healing, stubborn roots ----
  { id: 'seedling-scout', name: 'Seedling Scout', suit: 'grove', kind: 'minion', cost: 1, attack: 1, health: 3, keywords: [], text: 'Small roots, long memory.' },
  { id: 'briar-bear', name: 'Briar Bear', suit: 'grove', kind: 'minion', cost: 3, attack: 3, health: 4, keywords: ['thorns'], text: 'THORNS. Hug at your own risk.' },
  { id: 'oak-sentinel', name: 'Oak Sentinel', suit: 'grove', kind: 'minion', cost: 4, attack: 3, health: 6, keywords: ['guard'], text: 'GUARD. It has held this gate for centuries.' },
  { id: 'elder-treant', name: 'Elder Treant', suit: 'grove', kind: 'minion', cost: 6, attack: 5, health: 7, keywords: ['kindle'], text: 'KINDLE. Every spring it stands taller.' },
  { id: 'mending-rain', name: 'Mending Rain', suit: 'grove', kind: 'spell', cost: 2, effect: { kind: 'heal', amount: 5 }, text: 'Restore 5 health to your hero.' },
  { id: 'wild-growth', name: 'Wild Growth', suit: 'grove', kind: 'spell', cost: 2, effect: { kind: 'buff', attack: 2, health: 2 }, text: 'Give a friendly minion +2/+2.' },
  { id: 'thorn-volley', name: 'Thorn Volley', suit: 'grove', kind: 'spell', cost: 3, effect: { kind: 'damage', amount: 2 }, text: 'Deal 2 damage to any target. Draw nothing. Apologise to no one.' },

  // ---- Void: strange bargains, heavy shadows ----
  { id: 'shade-imp', name: 'Shade Imp', suit: 'void', kind: 'minion', cost: 2, attack: 2, health: 2, keywords: ['swift'], text: 'SWIFT. It whispers your name backwards.' },
  { id: 'void-revenant', name: 'Void Revenant', suit: 'void', kind: 'minion', cost: 4, attack: 5, health: 3, keywords: [], text: 'It came back wrong, and stronger.' },
  { id: 'umbral-titan', name: 'Umbral Titan', suit: 'void', kind: 'minion', cost: 7, attack: 6, health: 7, keywords: ['thorns'], text: 'THORNS. The dark pushes back.' },
  { id: 'soul-rend', name: 'Soul Rend', suit: 'void', kind: 'spell', cost: 4, effect: { kind: 'damage', amount: 5 }, text: 'Deal 5 damage to any target.' },
  { id: 'dark-bargain', name: 'Dark Bargain', suit: 'void', kind: 'spell', cost: 2, effect: { kind: 'draw', amount: 2 }, text: 'Draw 2 cards. The price comes later.' },
  { id: 'eclipse', name: 'Eclipse', suit: 'void', kind: 'spell', cost: 6, effect: { kind: 'damageAll', amount: 3 }, text: 'Deal 3 damage to every enemy minion.' },
];

const BY_ID = new Map(CARD_POOL.map((card) => [card.id, card]));

/** Look a card definition up by its id. Throws on an unknown id. */
export function cardById(id) {
  const card = BY_ID.get(id);
  if (!card) throw new Error(`unknown card id: ${id}`);
  return card;
}

/** True when the card needs the player to pick a target before it resolves. */
export function needsTarget(card) {
  if (card.kind !== 'spell') return false;
  return card.effect.kind === 'damage' || card.effect.kind === 'buff';
}

/** Which side a targeted spell may aim at: 'any' or 'friendly'. */
export function targetSide(card) {
  if (card.kind === 'spell' && card.effect.kind === 'buff') return 'friendly';
  return 'any';
}

/** A one-line summary of a card for logs and the opponent's intent banner. */
export function cardSummary(card) {
  if (card.kind === 'minion') return `${card.name} ${card.attack}/${card.health}`;
  return card.name;
}

/** Every card of one suit, cheapest first — the title screen groups by this. */
export function cardsOfSuit(suit) {
  return CARD_POOL.filter((card) => card.suit === suit).sort((a, b) => a.cost - b.cost);
}
