// EMBERFALL DUEL — tuning numbers and palette. One place for every balance knob.
export const CONFIG = {
  heroLife: 24,
  maxEmber: 8,
  startEmber: 1,
  openingHand: 4,
  handLimit: 7,
  boardLimit: 5,
  deckCopies: 2,
  stageW: 1280,
  stageH: 720,
};

export const SUITS = {
  flame: { id: 'flame', name: 'Flame', glyph: '▲', shape: '▲', color: '#e8442e', dark: '#7a1e10', light: '#ffb199' },
  tide: { id: 'tide', name: 'Tide', glyph: '≈', shape: '≈', color: '#2e7de8', dark: '#123a6e', light: '#a8d4ff' },
  grove: { id: 'grove', name: 'Grove', glyph: '❦', shape: '❦', color: '#2ea86a', dark: '#0f4a2c', light: '#a8ecc4' },
  void: { id: 'void', name: 'Void', glyph: '◆', shape: '◆', color: '#8a3ee8', dark: '#3d1470', light: '#d4a8ff' },
};

export const KEYWORDS = {
  GUARD: 'GUARD — must be attacked first',
  SWIFT: 'SWIFT — attacks at once',
  THORNS: 'THORNS — 1 back to attacker',
  KINDLE: 'KINDLE — +1 attack each turn',
};

export const BEATS = {
  aiStepMs: 620,
  aiThinkMs: 420,
  hitMs: 380,
  floatMs: 900,
};

export const HEROES = {
  player: { name: 'You', title: 'Ember Keeper' },
  foe: { name: 'Ashen Warden', title: 'Keeper of Cold Ash' },
};

export function lifePercent(life, max = CONFIG.heroLife) {
  return Math.max(0, Math.min(100, Math.round((life / max) * 100)));
}

export function suitOf(card) {
  return SUITS[card.suit] || SUITS.flame;
}
