// EMBERFALL DUEL — seeded randomness.
// One small deterministic generator drives shuffles and AI tie-breaks, so a
// seed in the address bar (?seed=7) replays the exact same duel every time.
// Screenshot mode leans on this: same seed, same table, same picture.

/** Mulberry32: a tiny 32-bit generator with a full period for its state. */
export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number from min to max, both ends included. */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Fisher-Yates shuffle, in place, driven by the seeded generator. */
export function shuffle(rng, list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const held = list[i];
    list[i] = list[j];
    list[j] = held;
  }
  return list;
}

/** Pick one entry from a list, or null when the list is empty. */
export function pick(rng, list) {
  if (list.length === 0) return null;
  return list[Math.floor(rng() * list.length)];
}

/** True with probability p (0..1), driven by the seeded generator. */
export function chance(rng, p) {
  return rng() < p;
}

/** Read ?seed= from the address bar; fall back to a fresh random seed. */
export function seedFromUrl(search) {
  const params = new URLSearchParams(search || '');
  const raw = params.get('seed');
  if (raw !== null && raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return parsed >>> 0;
  }
  return (Math.random() * 0xffffffff) >>> 0;
}
