// Ashen Warden AI: readable intent + step-by-step turn plan.
import { cardById } from './cards.js';
import { boardPower, canPlay, guardsOn, otherSide, playCard, attack, readyAttackers } from './state.js';

export function foeIntent(state) {
  const foe = state.foe;
  const player = state.player;
  const ready = readyAttackers(state, 'foe');
  const readyPower = ready.reduce((n, m) => n + m.attack, 0);
  const playerGuards = guardsOn(state, 'player');
  const biggestInHand = foe.hand.map((id) => cardById(id)).filter((c) => c && c.kind === 'minion').sort((a, b) => (b.attack + b.health) - (a.attack + a.health))[0];
  const hasSweep = foe.hand.map((id) => cardById(id)).some((c) => c && c.effect === 'damage-all-foe' && c.cost <= foe.ember);
  const hasHeal = foe.hand.map((id) => cardById(id)).some((c) => c && c.effect === 'heal-hero' && c.cost <= foe.ember);
  if (readyPower >= player.life && !playerGuards.length) {
    return { key: 'lethal', text: '⚠ LETHAL — the Warden can finish you this turn. Find a GUARD or a heal!' };
  }
  if (hasSweep && player.board.length >= 3) {
    return { key: 'sweep', text: 'The Warden is eyeing your wide board — expect a sweep.' };
  }
  if (foe.life <= 10 && hasHeal) {
    return { key: 'heal', text: 'The Warden is hurt and will mend before striking.' };
  }
  if (foe.life <= 12 && foe.hand.map((id) => cardById(id)).some((c) => c && c.keywords && c.keywords.includes('GUARD') && c.cost <= foe.ember)) {
    return { key: 'guard', text: 'Hurt and wary — the Warden will raise a GUARD.' };
  }
  if (biggestInHand && biggestInHand.cost > foe.ember) {
    return { key: 'save', text: `The Warden is saving ember for a big minion (${biggestInHand.name}, cost ${biggestInHand.cost}).` };
  }
  if (readyPower >= 6) {
    return { key: 'threat', text: `Board threat: ${readyPower} damage ready to strike. Trade or block.` };
  }
  if (biggestInHand) {
    return { key: 'develop', text: `The Warden will develop the board — biggest first: ${biggestInHand.name}.` };
  }
  return { key: 'poke', text: 'The Warden will poke and trade where it profits.' };
}

export function planFoeTurn(state) {
  // Returns a list of action descriptors; executor applies them one by one.
  // We plan on a live state copy approach: actions are computed lazily by
  // nextFoeAction so trades see fresh boards. This planner just orders intent.
  return foeIntent(state);
}

export function nextFoeAction(state) {
  const foe = state.foe;
  const player = state.player;
  if (state.winner) return null;
  // 1) Lethal: send everything face if it kills (respecting GUARD).
  const ready = readyAttackers(state, 'foe').sort((a, b) => b.attack - a.attack);
  const playerGuards = guardsOn(state, 'player');
  const facePower = ready.reduce((n, m) => n + m.attack, 0);
  if (!playerGuards.length && facePower >= player.life && ready.length) {
    return { kind: 'attack', uid: ready[0].uid, target: { type: 'hero', side: 'player' } };
  }
  // 2) Heal when hurt.
  if (foe.life <= 10) {
    const idx = foe.hand.findIndex((id) => { const c = cardById(id); return c && c.effect === 'heal-hero' && c.cost <= foe.ember; });
    if (idx >= 0) return { kind: 'play', handIndex: idx, target: null };
  }
  // 3) Sweep a wide board.
  if (player.board.length >= 3) {
    const idx = foe.hand.findIndex((id) => { const c = cardById(id); return c && c.effect === 'damage-all-foe' && c.cost <= foe.ember; });
    if (idx >= 0) return { kind: 'play', handIndex: idx, target: null };
  }
  // 4) Play biggest affordable minion (GUARD first when hurt).
  const playable = foe.hand.map((id, i) => ({ i, c: cardById(id) })).filter((x) => x.c && x.c.kind === 'minion' && canPlay(state, 'foe', x.i).ok);
  if (playable.length) {
    playable.sort((a, b) => {
      const ga = a.c.keywords.includes('GUARD') && foe.life <= 12 ? 5 : 0;
      const gb = b.c.keywords.includes('GUARD') && foe.life <= 12 ? 5 : 0;
      return (b.c.attack + b.c.health + gb) - (a.c.attack + a.c.health + ga);
    });
    return { kind: 'play', handIndex: playable[0].i, target: null };
  }
  // 5) Buff biggest friendly minion.
  if (foe.board.length) {
    const idx = foe.hand.findIndex((id) => { const c = cardById(id); return c && c.effect === 'buff' && c.cost <= foe.ember; });
    if (idx >= 0) {
      const best = foe.board.slice().sort((a, b) => b.attack - a.attack)[0];
      return { kind: 'play', handIndex: idx, target: { type: 'minion', side: 'foe', uid: best.uid } };
    }
  }
  // 6) Removal: damage-any on biggest player minion, else face if close.
  const boltIdx = foe.hand.findIndex((id) => { const c = cardById(id); return c && c.effect === 'damage-any' && c.cost <= foe.ember; });
  if (boltIdx >= 0) {
    const c = cardById(foe.hand[boltIdx]);
    const killable = player.board.filter((m) => m.health <= c.amount).sort((a, b) => b.attack - a.attack)[0];
    if (killable) return { kind: 'play', handIndex: boltIdx, target: { type: 'minion', side: 'player', uid: killable.uid } };
    if (player.life <= c.amount + facePower) return { kind: 'play', handIndex: boltIdx, target: { type: 'hero', side: 'player' } };
  }
  // 7) Draw spells.
  const drawIdx = foe.hand.findIndex((id) => { const c = cardById(id); return c && c.effect === 'draw' && c.cost <= foe.ember; });
  if (drawIdx >= 0 && foe.hand.length <= 5) return { kind: 'play', handIndex: drawIdx, target: null };
  // 8) Burn hero when ahead.
  const burnIdx = foe.hand.findIndex((id) => { const c = cardById(id); return c && c.effect === 'burn-hero' && c.cost <= foe.ember; });
  if (burnIdx >= 0) return { kind: 'play', handIndex: burnIdx, target: null };
  // 9) Attacks: favourable trades first, else face (GUARD respected by engine).
  if (ready.length) {
    const atk = ready[0];
    if (playerGuards.length) {
      const g = playerGuards.slice().sort((a, b) => a.health - b.health)[0];
      return { kind: 'attack', uid: atk.uid, target: { type: 'minion', side: 'player', uid: g.uid } };
    }
    const favourable = player.board.filter((m) => atk.attack >= m.health && m.attack < atk.health).sort((a, b) => b.attack - a.attack)[0];
    if (favourable) return { kind: 'attack', uid: atk.uid, target: { type: 'minion', side: 'player', uid: favourable.uid } };
    const bigThreat = player.board.filter((m) => m.attack >= 4).sort((a, b) => b.attack - a.attack)[0];
    if (bigThreat && atk.attack >= 2) return { kind: 'attack', uid: atk.uid, target: { type: 'minion', side: 'player', uid: bigThreat.uid } };
    return { kind: 'attack', uid: atk.uid, target: { type: 'hero', side: 'player' } };
  }
  return null;
}

export function applyFoeAction(state, action) {
  if (!action) return { ok: false, events: [] };
  if (action.kind === 'play') return playCard(state, 'foe', action.handIndex, action.target);
  return attack(state, 'foe', action.uid, action.target);
}

export function foeBoardThreat(state) {
  return boardPower(state, 'foe');
}

export function playerBoardThreat(state) {
  return boardPower(state, 'player');
}
