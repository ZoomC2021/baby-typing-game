# AGENTS.md — Baby Smash

## Project Overview

Baby Smash is a browser game for toddlers. Kids smash the keyboard, click the mouse, or tap the screen and get colorful visual + audio feedback. It is a **zero-dependency** project — pure HTML, CSS, and vanilla JavaScript only. Do not introduce any frameworks, bundlers, or npm packages.

## Architecture

Single-page app with three files:

- **`index.html`** — Markup for the intro overlay, game area, settings bar, phrase bar, and celebration container.
- **`styles.css`** — All styling, animations, color themes, and reduced-motion overrides.
- **`game.js`** — All game logic in a single file, organized into clearly labeled sections:
  - `SoundEngine` — Web Audio API synthesis (key sounds, boop, click, animal sounds).
  - `AnimalAudioPlayer` — Preloads and plays real `.mp3` files from `sounds/`, with synthesized fallbacks.
  - `ROTATING_ANIMALS` / `ANIMAL_SOUNDS` — Per-letter animal definitions and synthesized sound functions.
  - `LETTER_ASSOCIATIONS` / `NUMBER_ASSOCIATIONS` — Letter→word and digit→word mappings shown on key press.
  - `SpeechEngine` — Web Speech API wrapper (speaks letters/words aloud, prefers female English voice).
  - `Pool` — DOM element pool for bubbles and floating letters to reduce GC pressure.
  - Visual effect functions (`createBubble`, `createSparkle`, `createClickRipple`, `showKeyLetter`, `spawnFloatingLetter`, `showLetterAssociation`, `showNumberAssociation`, `triggerCelebration`, `screenShake`).
  - Event handlers (`handleKeyDown`, `handleClick`, `handleTouch`, `handleMouseMove`).
  - Game state and init (`startGame`, `startSessionTimer`, `DOMContentLoaded` listener).

Supporting files:

- **`sounds/`** — Animal sound `.mp3` files (ape, bear, cat, cow, dog, etc.). Not all letters have audio files; missing ones fall back to Web Audio synthesis.
- **`sw.js`** — Service worker for offline/PWA caching.
- **`manifest.json`** — PWA manifest.
- **`Makefile`** — `make serve` runs `npx serve . -p 3333`.

## Code Conventions

- No build step, no transpilation — code must run directly in modern browsers.
- All JavaScript is in `game.js` as top-level objects, functions, and constants (no modules, no classes).
- Use `const` / `let`; avoid `var`.
- CSS uses `clamp()` for responsive sizing, CSS custom properties for animation parameters (`--tx`, `--ty`, `--dx`, `--dy`), and `data-theme` attributes for color themes.
- The `body.reduce-motion` class gates decorative animations while keeping interactive feedback visible.
- DOM elements are pooled via the `Pool` object — always return elements to the pool instead of creating new ones for bubbles and floating letters.

## Key Design Constraints

- **Target audience is toddlers.** All keyboard keys (except F5/F11/F12) are captured via `preventDefault()`. Do not add interactions that require precise motor skills.
- **No external network requests at runtime.** All assets are local. The service worker caches everything for offline use.
- **Performance matters.** Long play sessions with rapid key mashing must stay smooth. Use the DOM pool, limit particle counts, and avoid layout thrashing.
- **Accessibility.** The "Reduce motion" option is checked by default. Respect it in any new animations.

## Running Locally

```
make serve
# or: npx serve . -p 3333
```

Open http://localhost:3333. Alternatively, open `index.html` directly (PWA features require a server).

## Adding Animal Sounds

1. Drop an `.mp3` file into `sounds/` (e.g., `sounds/frog.mp3`).
2. Ensure `ANIMAL_AUDIO_FILES` in `game.js` maps the letter to the file path.
3. The `AnimalAudioPlayer` will preload it; if the file is missing or fails to load, the synthesized fallback in `ANIMAL_SOUNDS` plays automatically.
