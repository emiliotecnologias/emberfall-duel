// Frozen deterministic screenshot states: ?shot=title|table|win|loss&seed=1
import { newDuel, makeMinion, logLine } from './state.js';

export function shotState(kind, seed = 1) {
  if (kind === 'title') return null;
  const state = newDuel(seed);
  if (kind === 'table') {
    state.round = 6;
    state.turn = 'player';
    state.player.life = 17;
    state.foe.life = 14;
    state.player.maxEmber = 6; state.player.ember = 4;
    state.foe.maxEmber = 6; state.foe.ember = 3;
    state.player.hand = ['ember-bolt', 'wild-growth', 'kindled-brute', 'grove-mending', 'second-wind'];
    state.foe.hand = ['ashen-wave', 'null-horror', 'void-lance', 'elder-oak'];
    state.player.board = [
      ready(makeMinion('ember-warden', 'player'), 2, 2),
      ready(makeMinion('thorn-bear', 'player'), 2, 3),
      ready(makeMinion('wave-rider', 'player'), 3, 3),
    ];
    state.foe.board = [
      ready(makeMinion('reef-wall', 'foe'), 1, 4),
      ready(makeMinion('rift-cultist', 'foe'), 4, 3),
      ready(makeMinion('spark-hound', 'foe'), 3, 1),
    ];
    state.player.deck = state.player.deck.slice(0, 9);
    state.foe.deck = state.foe.deck.slice(0, 10);
    state.log = [
      'Warden plays Reef Wall (1/6).',
      'You play Thorn Bear (2/4).',
      'Wave Rider trades with Spark Hound.',
      'Your turn — 4 ember ready. Warden at 14 life.',
    ];
    state.stats = { playerDamage: 10, foeDamage: 7, playerPlayed: 7, foePlayed: 6 };
    return state;
  }
  if (kind === 'win') {
    state.round = 9;
    state.player.life = 11;
    state.foe.life = 0;
    state.winner = 'player';
    state.stats = { playerDamage: 26, foeDamage: 13, playerPlayed: 14, foePlayed: 12 };
    logLine(state, 'Final blow lands. Victory!');
    return state;
  }
  if (kind === 'loss') {
    state.round = 8;
    state.player.life = 0;
    state.foe.life = 9;
    state.winner = 'foe';
    state.stats = { playerDamage: 15, foeDamage: 24, playerPlayed: 11, foePlayed: 13 };
    logLine(state, 'The Warden strikes last. Defeat.');
    return state;
  }
  return state;
}

function ready(minion, attack, health) {
  minion.attack = attack;
  minion.health = health;
  minion.maxHealth = Math.max(health, minion.maxHealth);
  minion.canAttack = true;
  minion.justSummoned = false;
  minion.attacked = false;
  return minion;
}

export function isShotMode(kind) {
  return ['title', 'table', 'win', 'loss'].includes(kind);
}

export function shotKinds() {
  return ['title', 'table', 'win', 'loss'];
}
