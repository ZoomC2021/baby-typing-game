/**
 * Baby Smash - A playful keyboard & mouse game for toddlers
 * Inspired by TinyFingers, with sounds!
 */

// --- Settings ---
const CONFIG = {
  celebrationThreshold: 25,
  maxPoolSize: 50,
  mouseTrailInterval: 80,
  sessionMinutes: 5
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

  playAnimalSound(letter) {
    this.init();
    const ctx = this.ctx;
    const animals = {
      A: [220, 440], B: [330, 495], C: [262, 330], D: [294, 370], E: [330, 415],
      F: [349, 440], G: [392, 494], H: [440, 554], I: [494, 622], J: [523, 659],
      K: [587, 740], L: [659, 831], M: [698, 880], N: [784, 988], O: [880, 1109],
      P: [988, 1245], Q: [1047, 1319], R: [1175, 1480], S: [1319, 1661],
      T: [1397, 1760], U: [1568, 1976], V: [1760, 2217], W: [1976, 2489],
      X: [2093, 2637], Y: [2349, 2960], Z: [2637, 3322]
    };
    const freqs = animals[letter?.toUpperCase()] || [400, 600];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    osc.frequency.setValueAtTime(freqs[1], ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2 * this.gain(), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
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
  reduceMotion = document.getElementById('opt-reduce-motion').checked;
  document.body.classList.toggle('reduce-motion', reduceMotion);
  currentTheme = document.getElementById('theme-select').value;
  document.getElementById('intro-overlay').classList.add('hidden');
  SoundEngine.init();
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
  if (isSpecial) SoundEngine.playBoopSound();
  else if (settings.animalMode) SoundEngine.playAnimalSound(e.key);
  else SoundEngine.playKeySound(e.key);

  const rect = document.body.getBoundingClientRect();
  const x = rect.width / 2 + (Math.random() - 0.5) * 200;
  const y = rect.height / 2 + (Math.random() - 0.5) * 200;

  createBubble(x, y, false);
  showKeyLetter(e.key, x, y);
  spawnFloatingLetter(e.key, x, y - 50);

  interactionCount++;
  if (interactionCount % CONFIG.celebrationThreshold === 0) {
    screenShake();
    triggerCelebration();
  }
}

function handleClick(e) {
  if (!gameStarted) {
    startGame();
    return;
  }
  if (parentLocked && e.target.closest('#settings-bar')) return;

  SoundEngine.playClickSound();

  const x = e.clientX;
  const y = e.clientY;

  createBubble(x, y, true);
  createClickRipple(x, y);
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      createBubble(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80, true);
    }, i * 60);
  }

  interactionCount++;
  if (interactionCount % CONFIG.celebrationThreshold === 0) {
    screenShake();
    triggerCelebration();
  }
}

function handleTouch(e) {
  e.preventDefault();
  if (e.touches.length > 0) {
    const t = e.touches[0];
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
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    startGame();
    toggleFullscreen();
  });
  document.getElementById('skip-btn').addEventListener('click', startGame);

  document.getElementById('opt-animal-mode').addEventListener('change', (e) => {
    settings.animalMode = e.target.checked;
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
