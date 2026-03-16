/**
 * Baby Smash - A playful keyboard & mouse game for toddlers
 * Inspired by TinyFingers, with sounds!
 */

// --- Settings ---
const CONFIG = {
  celebrationThreshold: 25,
  letterAssociationDuration: 2500,
  maxPoolSize: 50,
  mouseTrailInterval: 80,
  sessionMinutes: 5,
  weatherEventThreshold: 50
};

// --- Sound Engine (Web Audio API) ---
const SoundEngine = {
  ctx: null,
  masterGain: null,
  muted: false,
  volume: 1,

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  },

  setVolume(v) {
    this.volume = v / 100;
  },

  setMuted(m) {
    this.muted = m;
  },

  gain() {
    return this.muted ? 0 : this.volume;
  },

  playKeySound(key) {
    this.init();
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.connect(this.masterGain);

    const isSpecial = ['Space', 'Enter', 'Tab', 'Escape'].includes(key);
    const baseFreq = 200 + (key.charCodeAt?.(0) || key.length * 50) % 600;

    const osc = ctx.createOscillator();
    osc.connect(gain);
    osc.type = isSpecial ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25 * this.gain(), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  },

  playBoopSound() {
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2 * this.gain(), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  playClickSound() {
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25 * this.gain(), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  // Helper: create an oscillator with envelope
  _osc(type, freq, startTime, duration, vol) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = type;
    if (typeof freq === 'number') {
      osc.frequency.setValueAtTime(freq, startTime);
    }
    gain.gain.setValueAtTime((vol || 0.2) * this.gain(), startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
    return osc;
  },

  // Helper: create noise burst (for hissing, purring, etc.)
  _noise(startTime, duration, vol) {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    src.connect(gain);
    gain.connect(this.masterGain);
    gain.gain.setValueAtTime((vol || 0.1) * this.gain(), startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    src.start(startTime);
    src.stop(startTime + duration);
  },

  playAnimalSound(letter, animalOverride) {
    this.init();
    const L = letter?.toUpperCase();
    if (this.gain() === 0) return;

    // Try real audio file first, fall back to synthesized
    if (AnimalAudioPlayer.play(L, animalOverride)) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    // For C with rotation: use cow synth when animal is Cow
    const synth = (L === 'C' && animalOverride?.word === 'Cow')
      ? ANIMAL_SOUNDS.C_COW
      : ANIMAL_SOUNDS[L];
    if (synth) {
      synth.call(this, ctx, t, this.gain());
    } else {
      this._osc('sine', 800, t, 0.15, 0.15);
      this._osc('sine', 1000, t + 0.08, 0.1, 0.1);
    }
  }
};

// --- Rotating Animals (alternate between options per keypress) ---
const ROTATING_ANIMALS = {
  C: [
    { emoji: '🐱', word: 'Cat', src: 'sounds/cat.mp3' },
    { emoji: '🐄', word: 'Cow', src: 'sounds/cow.mp3' }
  ]
};
let rotationIndex = { C: 0 };

// --- Animal Sound Definitions (Web Audio synthesis) ---
// Each letter maps to an animal with a recognizable synthesized sound
const ANIMAL_SOUND_ANIMALS = {
  A: { emoji: '🐵', word: 'Ape' },
  B: { emoji: '🐻', word: 'Bear' },
  C: { emoji: '🐱', word: 'Cat' },
  D: { emoji: '🐕', word: 'Dog' },
  E: { emoji: '🐘', word: 'Elephant' },
  F: { emoji: '🐸', word: 'Frog' },
  G: { emoji: '🐐', word: 'Goat' },
  H: { emoji: '🐴', word: 'Horse' },
  I: { emoji: '🦗', word: 'Insect' },
  J: { emoji: '🐦', word: 'Jay' },
  K: { emoji: '🐨', word: 'Koala' },
  L: { emoji: '🦁', word: 'Lion' },
  M: { emoji: '🐒', word: 'Monkey' },
  N: { emoji: '🦉', word: 'Nightingale' },
  O: { emoji: '🦉', word: 'Owl' },
  P: { emoji: '🐷', word: 'Pig' },
  Q: { emoji: '🦆', word: 'Quack Duck' },
  R: { emoji: '🐓', word: 'Rooster' },
  S: { emoji: '🐍', word: 'Snake' },
  T: { emoji: '🐅', word: 'Tiger' },
  U: { emoji: '🦄', word: 'Unicorn' },
  V: { emoji: '🦅', word: 'Vulture' },
  W: { emoji: '🐺', word: 'Wolf' },
  X: { emoji: '🐂', word: 'Ox' },
  Y: { emoji: '🦬', word: 'Yak' },
  Z: { emoji: '🦓', word: 'Zebra' }
};

// --- Real Animal Audio Files ---
// Drop .mp3 files into sounds/ folder matching these names
const ANIMAL_AUDIO_FILES = {
  A: 'sounds/ape.mp3',
  B: 'sounds/bear.mp3',
  C: 'sounds/cat.mp3', // also cow.mp3 via ROTATING_ANIMALS
  D: 'sounds/dog.mp3',
  E: 'sounds/elephant.mp3',
  F: 'sounds/dog.mp3', // fallback to dog
  G: 'sounds/goat.mp3',
  H: 'sounds/horse.mp3',
  I: 'sounds/insect.mp3',
  J: 'sounds/duck.mp3', // fallback to duck (jay)
  K: 'sounds/cat.mp3', // fallback to cat (koala)
  L: 'sounds/lion.mp3',
  M: 'sounds/monkey.mp3',
  N: 'sounds/owl.mp3', // fallback to owl (nightingale)
  O: 'sounds/owl.mp3',
  P: 'sounds/pig.mp3',
  Q: 'sounds/duck.mp3',
  R: 'sounds/rooster.mp3',
  S: 'sounds/snake.mp3',
  T: 'sounds/tiger.mp3',
  U: 'sounds/horse.mp3', // fallback to horse (unicorn)
  V: 'sounds/duck.mp3', // fallback to duck (vulture)
  W: 'sounds/wolf.mp3',
  X: 'sounds/cow.mp3', // fallback to cow (ox)
  Y: 'sounds/goat.mp3', // fallback to goat (yak)
  Z: 'sounds/snake.mp3' // fallback to snake (zebra)
};

const AnimalAudioPlayer = {
  cache: {},
  loaded: {},

  preload() {
    for (const [letter, src] of Object.entries(ANIMAL_AUDIO_FILES)) {
      if (ROTATING_ANIMALS[letter]) continue;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;
      audio.addEventListener('canplaythrough', () => { this.loaded[letter] = true; }, { once: true });
      audio.addEventListener('error', () => { this.loaded[letter] = false; });
      this.cache[letter] = audio;
    }
    // Preload alternates for rotating letters (e.g. C = cat/cow)
    for (const [letter, options] of Object.entries(ROTATING_ANIMALS)) {
      this.cache[letter] = {};
      options.forEach((opt, i) => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = opt.src;
        const key = opt.src;
        audio.addEventListener('canplaythrough', () => {
          this.loaded[letter] = (this.loaded[letter] || 0) + 1;
        }, { once: true });
        audio.addEventListener('error', () => {});
        this.cache[letter][key] = audio;
      });
    }
  },

  // Volume multiplier relative to master (keeps animal sounds quieter than speech)
  volumeScale: 0.4,

  play(letter, animalOverride) {
    const L = letter?.toUpperCase();
    if (animalOverride?.src && ROTATING_ANIMALS[L]) {
      const cache = this.cache[L];
      if (cache && cache[animalOverride.src]) {
        const audio = cache[animalOverride.src];
        audio.volume = SoundEngine.gain() * this.volumeScale;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return true;
      }
    }
    if (!this.loaded[L]) return false;
    const audio = this.cache[L];
    if (typeof audio?.play !== 'function') return false;
    audio.volume = SoundEngine.gain() * this.volumeScale;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return true;
  }
};

// --- Synthesized Animal Sounds (fallback) ---
const ANIMAL_SOUNDS = {
  // Ape: oo-oo-ah-ah hooting
  A(ctx, t) {
    this._osc('sine', 300, t, 0.15, 0.2);
    this._osc('sine', 300, t + 0.2, 0.15, 0.2);
    const o = this._osc('sine', 500, t + 0.4, 0.15, 0.25);
    this._osc('sine', 500, t + 0.6, 0.15, 0.25);
  },
  // Bear: deep growl with vibrato
  B(ctx, t) {
    const o = this._osc('sawtooth', 80, t, 0.6, 0.2);
    o.frequency.setValueAtTime(80, t);
    o.frequency.linearRampToValueAtTime(90, t + 0.1);
    o.frequency.linearRampToValueAtTime(70, t + 0.2);
    o.frequency.linearRampToValueAtTime(85, t + 0.3);
    o.frequency.linearRampToValueAtTime(60, t + 0.6);
  },
  // Cat: meow — rising then falling
  C(ctx, t) {
    const o = this._osc('sine', 500, t, 0.5, 0.2);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.5);
    this._osc('sine', 1000, t, 0.4, 0.05);
  },
  // Cow: moo — low and long (used for C rotation fallback)
  C_COW(ctx, t) {
    const o = this._osc('sine', 120, t, 0.8, 0.25);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.2);
    o.frequency.exponentialRampToValueAtTime(130, t + 0.5);
    o.frequency.exponentialRampToValueAtTime(100, t + 0.8);
    this._osc('sine', 240, t, 0.6, 0.08);
  },
  // Dog: bark — sharp attack
  D(ctx, t) {
    const o = this._osc('square', 300, t, 0.15, 0.2);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    this._osc('square', 350, t + 0.2, 0.12, 0.15);
    this._noise(t, 0.08, 0.15);
  },
  // Elephant: trumpet — low to high
  E(ctx, t) {
    const o = this._osc('sawtooth', 150, t, 0.7, 0.2);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.2);
    o.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.7);
  },
  // Frog: ribbit — two quick blips
  F(ctx, t) {
    const o1 = this._osc('sine', 400, t, 0.12, 0.2);
    o1.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    const o2 = this._osc('sine', 350, t + 0.15, 0.12, 0.15);
    o2.frequency.exponentialRampToValueAtTime(180, t + 0.27);
  },
  // Goat: bleating "baa"
  G(ctx, t) {
    const o = this._osc('sawtooth', 250, t, 0.5, 0.2);
    o.frequency.exponentialRampToValueAtTime(350, t + 0.1);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.25);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    this._osc('sine', 500, t, 0.4, 0.06);
  },
  // Horse: neigh — rising whinny
  H(ctx, t) {
    const o = this._osc('sawtooth', 300, t, 0.6, 0.15);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.6);
  },
  // Insect (Cricket): chirping
  I(ctx, t) {
    for (let i = 0; i < 6; i++) {
      this._osc('square', 4000, t + i * 0.1, 0.04, 0.08);
      this._osc('square', 4500, t + i * 0.1 + 0.04, 0.04, 0.06);
    }
  },
  // Jay (bird): sharp chirp
  J(ctx, t) {
    const o = this._osc('sine', 2000, t, 0.15, 0.15);
    o.frequency.exponentialRampToValueAtTime(3000, t + 0.05);
    o.frequency.exponentialRampToValueAtTime(1500, t + 0.15);
    this._osc('sine', 2500, t + 0.18, 0.1, 0.1);
  },
  // Koala: nasal grunt
  K(ctx, t) {
    const o = this._osc('sawtooth', 120, t, 0.4, 0.15);
    o.frequency.linearRampToValueAtTime(100, t + 0.2);
    o.frequency.linearRampToValueAtTime(130, t + 0.4);
    this._noise(t + 0.05, 0.2, 0.05);
  },
  // Lion: roar — big sawtooth
  L(ctx, t) {
    const o = this._osc('sawtooth', 100, t, 0.8, 0.25);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.5);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.8);
    this._noise(t, 0.6, 0.08);
  },
  // Monkey: ooo-ooo-ooo — chattering screech
  M(ctx, t) {
    for (let i = 0; i < 3; i++) {
      const o = this._osc('sawtooth', 600 + i * 100, t + i * 0.12, 0.15, 0.15);
      o.frequency.exponentialRampToValueAtTime(800, t + i * 0.12 + 0.08);
      o.frequency.exponentialRampToValueAtTime(500, t + i * 0.12 + 0.15);
    }
  },
  // Nightingale: melodic trill
  N(ctx, t) {
    const notes = [1200, 1500, 1800, 1500, 1200, 1600];
    notes.forEach((f, i) => {
      this._osc('sine', f, t + i * 0.08, 0.08, 0.12);
    });
  },
  // Owl: hoo-hoo
  O(ctx, t) {
    const o1 = this._osc('sine', 350, t, 0.3, 0.2);
    o1.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    const o2 = this._osc('sine', 300, t + 0.4, 0.35, 0.18);
    o2.frequency.exponentialRampToValueAtTime(250, t + 0.75);
  },
  // Pig: oink — nasal squeal
  P(ctx, t) {
    const o = this._osc('sawtooth', 300, t, 0.2, 0.15);
    o.frequency.exponentialRampToValueAtTime(500, t + 0.1);
    o.frequency.exponentialRampToValueAtTime(250, t + 0.2);
    this._osc('sawtooth', 350, t + 0.25, 0.15, 0.12);
  },
  // Quack Duck: quack quack
  Q(ctx, t) {
    const q = (start) => {
      const o = this._osc('square', 500, start, 0.12, 0.15);
      o.frequency.exponentialRampToValueAtTime(300, start + 0.12);
    };
    q(t);
    q(t + 0.18);
  },
  // Rooster: cock-a-doodle — rising
  R(ctx, t) {
    const o = this._osc('sawtooth', 400, t, 0.6, 0.2);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(1000, t + 0.3);
    o.frequency.setValueAtTime(1000, t + 0.35);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.6);
  },
  // Snake: hiss — filtered noise
  S(ctx, t) {
    this._noise(t, 0.6, 0.12);
  },
  // Tiger: growl-roar
  T(ctx, t) {
    const o = this._osc('sawtooth', 90, t, 0.5, 0.2);
    o.frequency.linearRampToValueAtTime(110, t + 0.1);
    o.frequency.linearRampToValueAtTime(80, t + 0.2);
    o.frequency.linearRampToValueAtTime(100, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.5);
    this._noise(t, 0.4, 0.06);
  },
  // Unicorn: magical sparkle tone
  U(ctx, t) {
    this._osc('sine', 800, t, 0.3, 0.1);
    this._osc('sine', 1200, t + 0.05, 0.25, 0.1);
    this._osc('sine', 1600, t + 0.1, 0.2, 0.08);
    this._osc('sine', 2000, t + 0.15, 0.15, 0.06);
  },
  // Vulture: screech
  V(ctx, t) {
    const o = this._osc('sawtooth', 1500, t, 0.3, 0.12);
    o.frequency.exponentialRampToValueAtTime(2500, t + 0.1);
    o.frequency.exponentialRampToValueAtTime(1000, t + 0.3);
    this._noise(t, 0.15, 0.06);
  },
  // Wolf: howl — rising and sustaining
  W(ctx, t) {
    const o = this._osc('sine', 200, t, 0.8, 0.2);
    o.frequency.exponentialRampToValueAtTime(500, t + 0.3);
    o.frequency.setValueAtTime(500, t + 0.5);
    o.frequency.exponentialRampToValueAtTime(450, t + 0.8);
    this._osc('sine', 400, t + 0.1, 0.5, 0.06);
  },
  // Ox: deep bellow
  X(ctx, t) {
    const o = this._osc('sawtooth', 100, t, 0.5, 0.2);
    o.frequency.exponentialRampToValueAtTime(130, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.5);
  },
  // Yak: snorting grunt
  Y(ctx, t) {
    this._osc('sawtooth', 110, t, 0.2, 0.15);
    this._noise(t + 0.05, 0.15, 0.1);
    this._osc('sawtooth', 95, t + 0.25, 0.2, 0.12);
  },
  // Zebra: bark-like bray
  Z(ctx, t) {
    const o = this._osc('square', 250, t, 0.15, 0.15);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    this._osc('square', 300, t + 0.2, 0.12, 0.12);
  }
};

// --- Letter-to-Word Association (vocabulary & letter recognition) ---
const LETTER_ASSOCIATIONS = {
  A: { emoji: '🍎', word: 'Apple' },
  B: { emoji: '🏀', word: 'Ball' },
  C: { emoji: '🐱', word: 'Cat' },
  D: { emoji: '🐕', word: 'Dog' },
  E: { emoji: '🐘', word: 'Elephant' },
  F: { emoji: '🐟', word: 'Fish' },
  G: { emoji: '🍇', word: 'Grapes' },
  H: { emoji: '🏠', word: 'House' },
  I: { emoji: '🍦', word: 'Ice cream' },
  J: { emoji: '🧃', word: 'Juice' },
  K: { emoji: '🪁', word: 'Kite' },
  L: { emoji: '🦁', word: 'Lion' },
  M: { emoji: '🌙', word: 'Moon' },
  N: { emoji: '🪺', word: 'Nest' },
  O: { emoji: '🍊', word: 'Orange' },
  P: { emoji: '🐧', word: 'Penguin' },
  Q: { emoji: '👑', word: 'Queen' },
  R: { emoji: '🌈', word: 'Rainbow' },
  S: { emoji: '☀️', word: 'Sun' },
  T: { emoji: '🚂', word: 'Train' },
  U: { emoji: '☂️', word: 'Umbrella' },
  V: { emoji: '🎻', word: 'Violin' },
  W: { emoji: '🍉', word: 'Watermelon' },
  X: { emoji: '🎵', word: 'Xylophone' },
  Y: { emoji: '🪀', word: 'Yo-yo' },
  Z: { emoji: '🦓', word: 'Zebra' }
};

// --- Shape Recognition (triangle, circle, square) ---
// Triggered by non-alphabet/numbers: [ ] ; keys, or clicks, or shape buttons
const SHAPE_DEFINITIONS = {
  circle: { name: 'Circle', class: 'bubble' },
  square: { name: 'Square', class: 'shape-square' },
  triangle: { name: 'Triangle', class: 'shape-triangle' }
};
const SHAPE_KEYS = { '[': 'square', ']': 'circle', ';': 'triangle' };
const SHAPE_LIST = ['circle', 'square', 'triangle'];

// --- Number Recognition (0-9) ---
const NUMBER_ASSOCIATIONS = {
  '0': { emoji: '🥚', word: 'Zero' },
  '1': { emoji: '🍎', word: 'One' },
  '2': { emoji: '🏀', word: 'Two' },
  '3': { emoji: '🐱', word: 'Three' },
  '4': { emoji: '🚗', word: 'Four' },
  '5': { emoji: '✋', word: 'Five' },
  '6': { emoji: '🐝', word: 'Six' },
  '7': { emoji: '🌈', word: 'Seven' },
  '8': { emoji: '🕷️', word: 'Eight' },
  '9': { emoji: '🎾', word: 'Nine' }
};

// --- Speech Engine (Web Speech API) ---
const SpeechEngine = {
  enabled: true,
  lastSpoke: 0,
  minInterval: 300,
  _femaleVoice: null,
  _voicesLoaded: false,

  _loadFemaleVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    this._voicesLoaded = true;
    // Prefer English female voices
    const femaleKeywords = ['female', 'woman', 'zira', 'hazel', 'susan', 'samantha', 'karen', 'victoria', 'fiona', 'moira', 'tessa', 'allison', 'ava', 'jenny'];
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    this._femaleVoice =
      enVoices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k))) ||
      enVoices.find(v => v.name.toLowerCase().includes('female')) ||
      enVoices[0] || voices[0];
  },

  speak(text) {
    if (!this.enabled || SoundEngine.muted) return;
    const now = Date.now();
    if (now - this.lastSpoke < this.minInterval) return;
    this.lastSpoke = now;
    if (!this._voicesLoaded) this._loadFemaleVoice();
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (this._femaleVoice) utterance.voice = this._femaleVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = SoundEngine.volume;
    speechSynthesis.speak(utterance);
  },

  speakKey(key, animalOverride) {
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      const upper = key.toUpperCase();
      if (settings.animalMode) {
        const animal = animalOverride || ANIMAL_SOUND_ANIMALS[upper];
        if (animal) {
          this.speak(upper + ' is for ' + animal.word);
          return;
        }
      }
      this.speak(upper);
    } else if (key.length === 1 && /[0-9]/.test(key)) {
      this.speak(key);
    } else if (SHAPE_KEYS[key]) {
      this.speak(SHAPE_DEFINITIONS[SHAPE_KEYS[key]].name);
    }
  },

  speakShape(shapeId) {
    const def = SHAPE_DEFINITIONS[shapeId];
    if (def) this.speak(def.name);
  }
};

// --- Color Themes ---
const THEMES = {
  rainbow: ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#a855f7', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'],
  ocean: ['#0ea5e9', '#06b6d4', '#22d3ee', '#67e8f9', '#7dd3fc', '#38bdf8', '#0c4a6e', '#0369a1', '#0284c7', '#0e7490'],
  forest: ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#15803d', '#166534', '#84cc16', '#65a30d', '#a3e635', '#22c55e'],
  sunset: ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#dc2626', '#f87171', '#fbbf24', '#fcd34d', '#f59e0b', '#ef4444'],
  space: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#8b5cf6', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#f0abfc']
};

let currentTheme = 'rainbow';

function randomColor() {
  const colors = THEMES[currentTheme] || THEMES.rainbow;
  return colors[Math.floor(Math.random() * colors.length)];
}

// --- DOM Pool ---
const Pool = {
  bubbles: [],
  letters: [],
  sparkles: [],

  getBubble() {
    return this.bubbles.pop() || document.createElement('div');
  },

  returnBubble(el) {
    el.className = '';
    el.style.cssText = '';
    el.remove();
    if (this.bubbles.length < CONFIG.maxPoolSize) this.bubbles.push(el);
  },

  getLetter() {
    return this.letters.pop() || document.createElement('div');
  },

  returnLetter(el) {
    el.className = '';
    el.style.cssText = '';
    el.textContent = '';
    el.remove();
    if (this.letters.length < CONFIG.maxPoolSize) this.letters.push(el);
  }
};

// --- Shape types ---
const SHAPES = ['circle', 'star', 'heart'];

function getShapeClass() {
  return Math.random() < 0.2 ? (Math.random() < 0.5 ? 'shape-star' : 'shape-heart') : 'bubble';
}

// --- Visual Effects ---
function createBubble(x, y, isClick = false) {
  const particles = document.getElementById('particles');
  const bubble = Pool.getBubble();
  bubble.className = getShapeClass();

  const size = isClick ? 30 + Math.random() * 50 : 20 + Math.random() * 40;
  const tx = (Math.random() - 0.5) * 150;
  const ty = -(50 + Math.random() * 100);

  bubble.style.width = size + 'px';
  bubble.style.height = size + 'px';
  bubble.style.left = (x - size / 2) + 'px';
  bubble.style.top = (y - size / 2) + 'px';
  bubble.style.background = randomColor();
  bubble.style.setProperty('--tx', tx + 'px');
  bubble.style.setProperty('--ty', ty + 'px');

  particles.appendChild(bubble);
  setTimeout(() => Pool.returnBubble(bubble), 2000);
}

function createSparkle(x, y) {
  const particles = document.getElementById('particles');
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = x + 'px';
  sparkle.style.top = y + 'px';
  sparkle.style.background = randomColor();
  particles.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 800);
}

function createClickRipple(x, y) {
  const particles = document.getElementById('particles');
  const ripple = document.createElement('div');
  ripple.className = 'click-ripple';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.style.borderColor = randomColor();
  particles.appendChild(ripple);
  setTimeout(() => ripple.remove(), 800);
}

function createShape(shapeId, x, y, isClick = false) {
  const def = SHAPE_DEFINITIONS[shapeId];
  if (!def) return;
  const particles = document.getElementById('particles');
  const el = Pool.getBubble();
  el.className = def.class;

  const size = isClick ? 40 + Math.random() * 60 : 30 + Math.random() * 50;
  const tx = (Math.random() - 0.5) * 150;
  const ty = -(50 + Math.random() * 100);

  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = (x - size / 2) + 'px';
  el.style.top = (y - size / 2) + 'px';
  el.style.background = randomColor();
  el.style.setProperty('--tx', tx + 'px');
  el.style.setProperty('--ty', ty + 'px');

  particles.appendChild(el);
  setTimeout(() => Pool.returnBubble(el), 2000);
}

function showShapeAssociation(shapeId) {
  const def = SHAPE_DEFINITIONS[shapeId];
  if (!def) return;

  const card = document.getElementById('letter-association');
  const letterEl = document.getElementById('letter-assoc-letter');
  const emojiEl = document.getElementById('letter-assoc-emoji');
  const wordEl = document.getElementById('letter-assoc-word');

  letterEl.textContent = '';
  emojiEl.className = 'letter-assoc-emoji shape-assoc';
  emojiEl.dataset.shape = shapeId;
  emojiEl.textContent = '';
  emojiEl.style.background = randomColor();
  wordEl.textContent = def.name;
  card.style.background = `linear-gradient(135deg, ${randomColor()}40, ${randomColor()}80)`;
  card.classList.add('visible');

  clearTimeout(card._hideTimer);
  card._hideTimer = setTimeout(() => {
    card.classList.remove('visible');
    emojiEl.className = 'letter-assoc-emoji';
    emojiEl.style.cssText = '';
    delete emojiEl.dataset.shape;
  }, CONFIG.letterAssociationDuration);
}

function showKeyLetter(key, x, y) {
  const display = document.getElementById('key-display');
  const keyName = key.length === 1 ? key.toUpperCase() : key;
  display.textContent = keyName;
  display.style.color = randomColor();
  display.style.left = x + 'px';
  display.style.top = y + 'px';
  display.style.transform = 'translate(-50%, -50%)';
  display.classList.add('visible');

  clearTimeout(display._hideTimer);
  display._hideTimer = setTimeout(() => display.classList.remove('visible'), 400);
}

function showLetterAssociation(letter, animalOverride) {
  const upper = letter.toUpperCase();
  const assoc = settings.animalMode
    ? (animalOverride || ANIMAL_SOUND_ANIMALS[upper] || LETTER_ASSOCIATIONS[upper])
    : LETTER_ASSOCIATIONS[upper];
  if (!assoc) return;

  const card = document.getElementById('letter-association');
  const letterEl = document.getElementById('letter-assoc-letter');
  const emojiEl = document.getElementById('letter-assoc-emoji');
  const wordEl = document.getElementById('letter-assoc-word');

  letterEl.textContent = upper;
  emojiEl.textContent = assoc.emoji;
  emojiEl.style.cssText = '';
  delete emojiEl.dataset.shape;
  wordEl.textContent = assoc.word;
  card.style.background = `linear-gradient(135deg, ${randomColor()}40, ${randomColor()}80)`;
  card.classList.add('visible');

  clearTimeout(card._hideTimer);
  card._hideTimer = setTimeout(() => card.classList.remove('visible'), CONFIG.letterAssociationDuration);
}

function showNumberAssociation(digit) {
  const assoc = NUMBER_ASSOCIATIONS[digit];
  if (!assoc) return;

  const card = document.getElementById('letter-association');
  const letterEl = document.getElementById('letter-assoc-letter');
  const emojiEl = document.getElementById('letter-assoc-emoji');
  const wordEl = document.getElementById('letter-assoc-word');

  letterEl.textContent = digit;
  emojiEl.textContent = assoc.emoji;
  emojiEl.style.cssText = '';
  delete emojiEl.dataset.shape;
  wordEl.textContent = assoc.word;
  card.style.background = `linear-gradient(135deg, ${randomColor()}40, ${randomColor()}80)`;
  card.classList.add('visible');

  clearTimeout(card._hideTimer);
  card._hideTimer = setTimeout(() => card.classList.remove('visible'), CONFIG.letterAssociationDuration);
}

function spawnFloatingLetter(key, x, y) {
  const particles = document.getElementById('particles');
  const letter = Pool.getLetter();
  letter.className = 'key-letter';
  letter.textContent = key.length === 1 ? key.toUpperCase() : key;
  letter.style.left = x + 'px';
  letter.style.top = y + 'px';
  letter.style.color = randomColor();
  particles.appendChild(letter);
  setTimeout(() => Pool.returnLetter(letter), 1500);
}

// --- Screen Shake ---
function screenShake() {
  const body = document.body;
  body.classList.add('screen-shake');
  setTimeout(() => body.classList.remove('screen-shake'), 400);
}

// --- Celebration ---
function triggerCelebration() {
  const el = document.getElementById('celebration');
  el.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const angle = (Math.random() * 360) * Math.PI / 180;
    const dist = 150 + Math.random() * 200;
    const dx = Math.cos(angle) * dist;
    const dy = -Math.abs(Math.sin(angle) * dist) - 100;
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.top = '50%';
    c.style.background = randomColor();
    c.style.animationDelay = Math.random() * 0.3 + 's';
    c.style.setProperty('--dx', dx + 'px');
    c.style.setProperty('--dy', dy + 'px');
    el.appendChild(c);
  }
  el.classList.add('active');
  setTimeout(() => {
    el.classList.remove('active');
    el.innerHTML = '';
  }, 3000);
}

// --- Weather Events (star rain / rainbow sweep at 50 interactions) ---
function triggerStarRain() {
  const container = document.getElementById('weather-effect');
  container.innerHTML = '';
  container.className = 'weather-star-rain';
  const rect = document.body.getBoundingClientRect();
  const starCount = reduceMotion ? 15 : 35;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'weather-star';
    star.style.left = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 1.5 + 's';
    star.style.background = randomColor();
    container.appendChild(star);
  }
  container.classList.add('active');
  setTimeout(() => {
    container.classList.remove('active');
    container.innerHTML = '';
    container.className = '';
  }, reduceMotion ? 1500 : 2500);
}

function triggerRainbowSweep() {
  const container = document.getElementById('weather-effect');
  container.innerHTML = '';
  container.className = 'weather-rainbow-sweep';
  const bar = document.createElement('div');
  bar.className = 'rainbow-sweep-bar';
  container.appendChild(bar);
  container.classList.add('active');
  setTimeout(() => {
    container.classList.remove('active');
    container.innerHTML = '';
    container.className = '';
  }, reduceMotion ? 800 : 1800);
}

function maybeTriggerWeatherEvent() {
  if (interactionCount > 0 && interactionCount % CONFIG.weatherEventThreshold === 0) {
    Math.random() < 0.5 ? triggerStarRain() : triggerRainbowSweep();
  }
}

// --- Game State ---
let gameStarted = false;
let lastKeyTime = 0;
let interactionCount = 0;
let parentLocked = false;
let sessionTimer = null;
let lastMouseTrail = 0;
let reduceMotion = true;

function startGame() {
  gameStarted = true;
  settings.animalMode = document.getElementById('opt-animal-mode').checked;
  SpeechEngine.enabled = document.getElementById('opt-speak-letters').checked;
  reduceMotion = document.getElementById('opt-reduce-motion').checked;
  document.body.classList.toggle('reduce-motion', reduceMotion);
  currentTheme = document.getElementById('theme-select').value;
  document.getElementById('intro-overlay').classList.add('hidden');
  SoundEngine.init();
  AnimalAudioPlayer.preload();
  applyTheme(currentTheme);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

function applyTheme(name) {
  currentTheme = name;
  document.body.setAttribute('data-theme', name);
}

// --- Event Handlers ---
function handleKeyDown(e) {
  if (!gameStarted) {
    startGame();
    return;
  }

  if (parentLocked && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
    parentLocked = false;
    document.getElementById('parent-lock-btn').textContent = '🔓';
    e.preventDefault();
    return;
  }

  if (!['F5', 'F11', 'F12'].includes(e.key)) e.preventDefault();

  const now = Date.now();
  if (now - lastKeyTime < 50) return;
  lastKeyTime = now;

  const isSpecial = ['Space', 'Enter', 'Tab', 'Escape'].includes(e.key);
  const shapeId = SHAPE_KEYS[e.key];
  let animalOverride = null;
  if (settings.animalMode && /^[a-zA-Z]$/.test(e.key)) {
    const upper = e.key.toUpperCase();
    if (ROTATING_ANIMALS[upper]) {
      const rot = ROTATING_ANIMALS[upper];
      const idx = (rotationIndex[upper] ?? 0) % rot.length;
      animalOverride = rot[idx];
      rotationIndex[upper] = (idx + 1) % rot.length;
    }
  }
  if (isSpecial) SoundEngine.playBoopSound();
  else if (shapeId) SoundEngine.playClickSound();
  else if (settings.animalMode) SoundEngine.playAnimalSound(e.key, animalOverride);
  else SoundEngine.playKeySound(e.key);

  SpeechEngine.speakKey(e.key, animalOverride);
  if (shapeId) SpeechEngine.speakShape(shapeId);

  const rect = document.body.getBoundingClientRect();
  const x = rect.width / 2 + (Math.random() - 0.5) * 200;
  const y = rect.height / 2 + (Math.random() - 0.5) * 200;

  if (shapeId) {
    createShape(shapeId, x, y, false);
    showShapeAssociation(shapeId);
  } else {
    createBubble(x, y, false);
    showKeyLetter(e.key, x, y);
    spawnFloatingLetter(e.key, x, y - 50);
    if (/^[a-zA-Z]$/.test(e.key)) {
      showLetterAssociation(e.key, animalOverride);
    } else if (/^[0-9]$/.test(e.key)) {
      showNumberAssociation(e.key);
    }
  }

  interactionCount++;
  if (interactionCount % CONFIG.celebrationThreshold === 0) {
    screenShake();
    triggerCelebration();
  }
  maybeTriggerWeatherEvent();
}

function handleClick(e) {
  if (!gameStarted) {
    startGame();
    return;
  }
  if (parentLocked && e.target.closest('#settings-bar')) return;
  if (e.target.closest('.shape-btn')) return;

  SoundEngine.playClickSound();

  const x = e.clientX;
  const y = e.clientY;

  const shapeId = SHAPE_LIST[Math.floor(Math.random() * SHAPE_LIST.length)];
  createShape(shapeId, x, y, true);
  SpeechEngine.speakShape(shapeId);
  showShapeAssociation(shapeId);

  createClickRipple(x, y);
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      createBubble(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80, true);
    }, i * 60);
  }

  interactionCount++;
  if (interactionCount % CONFIG.celebrationThreshold === 0) {
    screenShake();
    triggerCelebration();
  }
  maybeTriggerWeatherEvent();
}

function handleTouch(e) {
  e.preventDefault();
  if (e.touches.length > 0) {
    const t = e.touches[0];
    const target = document.elementFromPoint(t.clientX, t.clientY);
    const phraseBtn = target?.closest('.phrase-btn');
    if (phraseBtn?.dataset.phrase) {
      SpeechEngine.speak(phraseBtn.dataset.phrase);
      return;
    }
    const shapeBtn = target?.closest('.shape-btn');
    if (shapeBtn?.dataset.shape) {
      if (!gameStarted) startGame();
      const shapeId = shapeBtn.dataset.shape;
      if (SHAPE_DEFINITIONS[shapeId]) {
        const rect = document.body.getBoundingClientRect();
        const x = rect.width / 2 + (Math.random() - 0.5) * 150;
        const y = rect.height / 2 + (Math.random() - 0.5) * 150;
        SoundEngine.playClickSound();
        createShape(shapeId, x, y, true);
        SpeechEngine.speakShape(shapeId);
        showShapeAssociation(shapeId);
      }
      return;
    }
    const ev = new MouseEvent('click', { clientX: t.clientX, clientY: t.clientY });
    handleClick(ev);
  }
}

function handleMouseMove(e) {
  if (!gameStarted) return;
  const now = Date.now();
  const interval = reduceMotion ? CONFIG.mouseTrailInterval * 2 : CONFIG.mouseTrailInterval;
  if (now - lastMouseTrail < interval) return;
  lastMouseTrail = now;
  createSparkle(e.clientX, e.clientY);
}

// --- Fullscreen ---
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

// --- Settings ---
const settings = {
  animalMode: false,
  reduceMotion: false
};

function startSessionTimer() {
  if (sessionTimer) clearInterval(sessionTimer);
  const end = Date.now() + CONFIG.sessionMinutes * 60 * 1000;
  sessionTimer = setInterval(() => {
    if (Date.now() >= end) {
      clearInterval(sessionTimer);
      sessionTimer = null;
      document.getElementById('intro-overlay').classList.remove('hidden');
      gameStarted = false;
    }
  }, 1000);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('reduce-motion');
  speechSynthesis.onvoiceschanged = () => SpeechEngine._loadFemaleVoice();
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    startGame();
    toggleFullscreen();
  });
  document.getElementById('skip-btn').addEventListener('click', startGame);

  document.getElementById('opt-animal-mode').addEventListener('change', (e) => {
    settings.animalMode = e.target.checked;
  });
  document.getElementById('opt-speak-letters').addEventListener('change', (e) => {
    SpeechEngine.enabled = e.target.checked;
  });
  document.getElementById('opt-reduce-motion').addEventListener('change', (e) => {
    reduceMotion = e.target.checked;
    document.body.classList.toggle('reduce-motion', reduceMotion);
  });
  document.getElementById('theme-select').addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  document.getElementById('mute-btn').addEventListener('click', () => {
    SoundEngine.setMuted(!SoundEngine.muted);
    document.getElementById('mute-btn').textContent = SoundEngine.muted ? '🔇' : '🔊';
  });
  document.getElementById('volume-slider').addEventListener('input', (e) => {
    SoundEngine.setVolume(Number(e.target.value));
  });
  document.getElementById('parent-lock-btn').addEventListener('click', () => {
    parentLocked = !parentLocked;
    document.getElementById('parent-lock-btn').textContent = parentLocked ? '🔒' : '🔓';
    if (parentLocked) document.getElementById('skip-btn').style.visibility = 'hidden';
    else document.getElementById('skip-btn').style.visibility = '';
  });
  document.getElementById('timer-btn').addEventListener('click', () => {
    startGame();
    startSessionTimer();
  });

  document.getElementById('phrase-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.phrase-btn');
    if (!btn) return;
    const phrase = btn.dataset.phrase;
    if (phrase) SpeechEngine.speak(phrase);
  });

  document.getElementById('shape-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.shape-btn');
    if (!btn) return;
    if (!gameStarted) startGame();
    const shapeId = btn.dataset.shape;
    if (!shapeId || !SHAPE_DEFINITIONS[shapeId]) return;
    const rect = document.body.getBoundingClientRect();
    const x = rect.width / 2 + (Math.random() - 0.5) * 150;
    const y = rect.height / 2 + (Math.random() - 0.5) * 150;
    SoundEngine.playClickSound();
    createShape(shapeId, x, y, true);
    SpeechEngine.speakShape(shapeId);
    showShapeAssociation(shapeId);
  });

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') toggleFullscreen();
  });
  document.addEventListener('click', handleClick);
  document.addEventListener('touchstart', handleTouch, { passive: false });
  document.addEventListener('mousemove', handleMouseMove);

  const unlockAudio = () => {
    SoundEngine.init();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
});
