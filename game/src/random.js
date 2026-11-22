// Seeded randomness: mulberry32 so a duel replays from ?seed=.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

export function seedFromUrl() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('seed');
  if (raw === null) return Math.floor(Math.random() * 1000000000);
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 1;
}

export function shotFromUrl() {
  const params = new URLSearchParams(location.search);
  return params.get('shot') || '';
}

export function pick(list, rng) {
  if (!list.length) return null;
  return list[Math.floor(rng() * list.length)];
}

export function seededInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
