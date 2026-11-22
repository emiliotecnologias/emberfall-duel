// Feel: WebAudio-synthesized sounds, sparks, floating numbers, ember rain.
let ctx = null;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  const ac = ensureAudio();
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(t); osc.stop(t + dur + 0.02);
}

function noiseBurst(dur = 0.12, vol = 0.14) {
  const ac = ensureAudio();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(); src.buffer = buf;
  const gain = ac.createGain(); gain.gain.value = vol;
  const filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900;
  src.connect(filt); filt.connect(gain); gain.connect(ac.destination);
  src.start();
}

export const sfx = {
  deal() { tone(520, 0.07, 'triangle', 0.08); },
  play() { tone(440, 0.09, 'triangle', 0.1); tone(660, 0.08, 'triangle', 0.07, 0.05); },
  summon() { tone(330, 0.12, 'sawtooth', 0.06); tone(495, 0.12, 'sawtooth', 0.05, 0.06); },
  hit() { noiseBurst(0.14, 0.16); tone(140, 0.14, 'square', 0.08); },
  hurt() { tone(220, 0.18, 'square', 0.1); tone(165, 0.2, 'square', 0.08, 0.08); },
  heal() { tone(523, 0.12, 'sine', 0.09); tone(784, 0.16, 'sine', 0.08, 0.08); },
  buff() { tone(392, 0.1, 'triangle', 0.09); tone(587, 0.14, 'triangle', 0.08, 0.07); },
  burn() { noiseBurst(0.3, 0.08); tone(196, 0.25, 'sawtooth', 0.05); },
  turn() { tone(659, 0.1, 'sine', 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, i * 0.12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.24, 'sine', 0.1, i * 0.13)); },
  error() { tone(180, 0.12, 'square', 0.07); },
};

export function floatNumber(stage, x, y, text, cls = '') {
  const el = document.createElement('div');
  el.className = 'float-num ' + cls;
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  stage.appendChild(el);
  setTimeout(() => el.remove(), 950);
  return el;
}

export function sparks(stage, x, y, n = 10, color = '#ffb199') {
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'spark';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.background = color;
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const dist = 24 + Math.random() * 44;
    el.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    el.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
    stage.appendChild(el);
    setTimeout(() => el.remove(), 620);
  }
}

export function emberRain(stage, n = 36) {
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'ember-drop';
    el.style.left = Math.random() * 1240 + 10 + 'px';
    el.style.animationDelay = (Math.random() * 1.4) + 's';
    el.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
    stage.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }
}

export function shakeEl(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 420);
}

export function flashEl(el) {
  if (!el) return;
  el.style.transition = 'filter 0.15s';
  el.style.filter = 'brightness(1.7)';
  setTimeout(() => { el.style.filter = ''; }, 180);
}
