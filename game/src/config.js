// EMBERFALL DUEL — every tuning number, colour and label in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

export const DUEL = {
  heroHealth: 24, // life total each duelist starts with
  openingHand: 4, // cards dealt before the first turn
  handLimit: 7, // cards beyond this are burned on draw
  boardLimit: 5, // minions a side may hold at once
  emberStart: 1, // energy on turn one
  emberMax: 8, // energy never grows past this
  deckSize: 24, // cards per deck
  fatigueStart: 1, // first empty-deck draw hurts this much, then grows
};

/** The four suits. Each is told apart by colour AND shape AND glyph, never by text alone. */
export const SUITS = {
  flame: { name: 'Flame', color: '#ff5a3c', deep: '#7a1d0e', glyph: '▲', shape: 'triangle' },
  tide: { name: 'Tide', color: '#3ca9ff', deep: '#0e3a5e', glyph: '≈', shape: 'wave' },
  grove: { name: 'Grove', color: '#57d977', deep: '#14532d', glyph: '❦', shape: 'leaf' },
  void: { name: 'Void', color: '#b78bff', deep: '#3b1d6e', glyph: '◆', shape: 'diamond' },
};

/** Card kinds and the frame colour each wears. */
export const KINDS = {
  minion: { label: 'MINION', frame: '#2b2118' },
  spell: { label: 'SPELL', frame: '#1d2733' },
};

/** Keywords a minion can carry, with the word the card prints. */
export const KEYWORDS = {
  guard: 'GUARD', // enemies must attack this minion first
  swift: 'SWIFT', // may attack the turn it is played
  thorns: 'THORNS', // attackers take 1 back
  kindle: 'KINDLE', // +1 attack at the start of your turn
};

export const PALETTE = {
  backdrop: '#0d0a08',
  felt: '#1c1410',
  feltEdge: '#2e2016',
  panel: '#241a12',
  panelLine: '#4a3623',
  text: '#f5ead9',
  muted: '#b8a888',
  gold: '#f2c14e',
  ember: '#ff8c42',
  hurt: '#ff4d4d',
  heal: '#6fe08a',
  player: '#3ca9ff',
  foe: '#ff5a3c',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const DISPLAY_FONT = '"Palatino Linotype", "Book Antiqua", Georgia, serif';

/** Where the best result is kept between visits (this browser only). */
export const BEST_KEY = 'emberfall-duel.best';

/** How long each animation beat lasts, in milliseconds. */
export const BEATS = {
  deal: 140, // one card sliding from deck to hand
  play: 260, // a card flying from hand to board
  hit: 320, // a minion lunging and the damage number rising
  turn: 450, // the turn banner sweeping across
  foeStep: 650, // pause between the opponent's visible actions
  endPause: 500, // breath before the win/loss screen settles
};

/** The Warden's voice: lines the intent banner cycles when nothing threatens. */
export const WARDEN_TAUNTS = [
  'The Warden is gathering ember. Strike while its board is empty!',
  'The Warden watches your hand. It always watches.',
  'Ash drifts across the table. The Warden waits for a mistake.',
];
