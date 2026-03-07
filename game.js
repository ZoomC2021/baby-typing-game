/**
 * Baby Smash - A playful keyboard & mouse game for toddlers
 * Inspired by TinyFingers, with sounds!
 */

// --- Sound Engine (Web Audio API) ---
const SoundEngine = {
  ctx: null,

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  // Play a bouncy "pop" sound for keyboard
  playKeySound() {
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 + Math.random() * 300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  },

  // Play a soft "plink" for mouse clicks
  playClickSound() {
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  // Play a deeper "boop" for special keys
  playBoopSound() {
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }
};

// --- Colors ---
const COLORS = [
  '#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b',
  '#a855f7', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// --- Visual Effects ---
function createBubble(x, y, isClick = false) {
  const particles = document.getElementById('particles');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  const size = isClick ? 30 + Math.random() * 50 : 20 + Math.random() * 40;
  const tx = (Math.random() - 0.5) * 150;
  const ty = -(50 + Math.random() * 100);

  bubble.style.width = size + 'px';
  bubble.style.height = size + 'px';
  bubble.style.left = x + 'px';
  bubble.style.top = y + 'px';
  bubble.style.background = randomColor();
  bubble.style.setProperty('--tx', tx + 'px');
  bubble.style.setProperty('--ty', ty + 'px');

  particles.appendChild(bubble);
  setTimeout(() => bubble.remove(), 2000);
}

function showKeyLetter(key, x, y) {
  const display = document.getElementById('key-display');
  const keyName = key.length === 1 ? key.toUpperCase() : key;
  display.textContent = keyName;
  display.style.color = randomColor();
  display.classList.add('visible');

  clearTimeout(display._hideTimer);
  display._hideTimer = setTimeout(() => {
    display.classList.remove('visible');
  }, 400);
}

function spawnFloatingLetter(key, x, y) {
  const particles = document.getElementById('particles');
  const letter = document.createElement('div');
  letter.className = 'key-letter';
  letter.textContent = key.length === 1 ? key.toUpperCase() : key;
  letter.style.left = x + 'px';
  letter.style.top = y + 'px';
  letter.style.color = randomColor();

  particles.appendChild(letter);
  setTimeout(() => letter.remove(), 1500);
}

// --- Game State ---
let gameStarted = false;
let lastKeyTime = 0;

function startGame() {
  gameStarted = true;
  document.getElementById('intro-overlay').classList.add('hidden');
  // Unlock audio on first user interaction
  SoundEngine.init();
}

// --- Event Handlers ---
function handleKeyDown(e) {
  if (!gameStarted) {
    startGame();
    return;
  }

  // Prevent default for most keys (avoid typing in inputs, etc.)
  if (!['F5', 'F11', 'F12'].includes(e.key)) {
    e.preventDefault();
  }

  const now = Date.now();
  if (now - lastKeyTime < 50) return; // Debounce
  lastKeyTime = now;

  SoundEngine.playKeySound();

  const rect = document.body.getBoundingClientRect();
  const x = rect.width / 2 + (Math.random() - 0.5) * 200;
  const y = rect.height / 2 + (Math.random() - 0.5) * 200;

  createBubble(x, y, false);
  showKeyLetter(e.key, x, y);
  spawnFloatingLetter(e.key, x, y - 50);
}

function handleClick(e) {
  if (!gameStarted) {
    startGame();
    return;
  }

  SoundEngine.playClickSound();

  const x = e.clientX;
  const y = e.clientY;

  createBubble(x, y, true);

  // Spawn multiple bubbles for extra fun
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;
      createBubble(x + offsetX, y + offsetY, true);
    }, i * 80);
  }
}

function handleMouseMove(e) {
  // Optional: subtle feedback on mouse move (throttled)
  if (!gameStarted) return;
  // Could add trailing particles on move - keeping it simple for now
}

// --- Fullscreen ---
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    startGame();
    toggleFullscreen();
  });
  document.getElementById('skip-btn').addEventListener('click', startGame);

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', handleClick);

  // Unlock Web Audio on first interaction (browser policy)
  const unlockAudio = () => {
    SoundEngine.init();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
});
