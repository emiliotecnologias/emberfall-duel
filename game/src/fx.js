// EMBERFALL DUEL — feel: sound and motion.
// Every sound is synthesized with WebAudio (no files, no network), and every
// motion is a CSS class the renderer toggles. Nothing here touches the rules;
// it only makes a dealt hand land with weight and a win land with a flourish.

let audioCtx = null;

/** Create the audio context on the first user gesture (browser policy). */
export function wakeAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

/** One short synthesized tone with a soft envelope. */
function tone(freq, seconds, type, gain, when = 0) {
  const ctx = wakeAudio();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

/** A papery swish for dealing and drawing: filtered noise, very short. */
function swish(when = 0) {
  const ctx = wakeAudio();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const length = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  const amp = ctx.createGain();
  amp.gain.value = 0.12;
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start(start);
}

/** The sound vocabulary, one function per game moment. */
export const sfx = {
  deal() { swish(); },
  draw() { swish(); tone(520, 0.08, 'sine', 0.05); },
  play() { tone(300, 0.12, 'triangle', 0.12); tone(450, 0.1, 'triangle', 0.08, 0.05); },
  summon() { tone(180, 0.18, 'sawtooth', 0.06); tone(360, 0.14, 'triangle', 0.1, 0.04); },
  hit() { tone(120, 0.16, 'square', 0.1); swish(0.02); },
  hurt() { tone(90, 0.25, 'sawtooth', 0.12); },
  heal() { tone(523, 0.16, 'sine', 0.08); tone(659, 0.16, 'sine', 0.08, 0.08); tone(784, 0.22, 'sine', 0.08, 0.16); },
  buff() { tone(392, 0.12, 'triangle', 0.09); tone(587, 0.18, 'triangle', 0.09, 0.07); },
  burn() { tone(220, 0.3, 'sawtooth', 0.07); tone(185, 0.3, 'sawtooth', 0.06, 0.1); },
  turn() { tone(440, 0.1, 'sine', 0.06); },
  error() { tone(160, 0.14, 'square', 0.07); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.11, i * 0.12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.34, 'triangle', 0.1, i * 0.14)); },
};

/** Restart a CSS animation on an element by toggling its class. */
export function replayClass(element, className) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth; // reflow so the animation can start again
  element.classList.add(className);
}

/** A floating number that rises and fades over a board position. */
export function floatNumber(layer, x, y, text, className) {
  const node = document.createElement('div');
  node.className = `float-num ${className}`;
  node.textContent = text;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  layer.appendChild(node);
  window.setTimeout(() => node.remove(), 950);
}

/** A burst of ember sparks at a point, for hits and the winning blow. */
export function sparkBurst(layer, x, y, count = 10) {
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 26 + Math.random() * 44;
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * dist - 18}px`);
    layer.appendChild(spark);
    window.setTimeout(() => spark.remove(), 700);
  }
}

/** Falling ember confetti for the victory screen. */
export function emberRain(layer, count = 46) {
  for (let i = 0; i < count; i += 1) {
    const drop = document.createElement('div');
    drop.className = 'ember-drop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDelay = `${Math.random() * 1.6}s`;
    drop.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    const size = 4 + Math.random() * 7;
    drop.style.width = `${size}px`;
    drop.style.height = `${size}px`;
    layer.appendChild(drop);
  }
}

/** A soft green rise of motes over a healed hero. */
export function healMotes(layer, x, y, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const mote = document.createElement('div');
    mote.className = 'spark heal-mote';
    mote.style.left = `${x - 30 + Math.random() * 60}px`;
    mote.style.top = `${y + 16}px`;
    mote.style.setProperty('--dx', `${-8 + Math.random() * 16}px`);
    mote.style.setProperty('--dy', `${-46 - Math.random() * 30}px`);
    layer.appendChild(mote);
    window.setTimeout(() => mote.remove(), 800);
  }
}

/** Centre point of an element inside the scaled stage, for float numbers. */
export function stagePoint(element, stage) {
  const rect = element.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const scale = stageRect.width / 1280;
  return {
    x: (rect.left + rect.width / 2 - stageRect.left) / scale,
    y: (rect.top + rect.height / 2 - stageRect.top) / scale,
  };
}
