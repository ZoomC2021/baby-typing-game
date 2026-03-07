# Baby Smash 🎹🖱️

A free, browser-based sensory game for toddlers (ages ~1–4). Children smash the keyboard, click the mouse, or tap a touchscreen and receive instant, delightful visual and audio feedback. Every interaction is safe—nearly all keys are captured so the child can't accidentally navigate away or close the browser. Inspired by [TinyFingers](https://tinyfingers.net/).

## Target Users

- **Primary:** Toddlers & infants (1–4 years old) who are exploring cause-and-effect.
- **Secondary:** Parents / caregivers who need a safe, screen-time activity with educational value and parental controls.

## Core Interactions

| Input | Feedback |
|---|---|
| **Keyboard press** | Displays the letter/number in large colorful text, plays a pitched sound, spawns animated bubbles/stars/hearts, shows a letter-to-word association card (e.g., "A is for Apple 🍎") |
| **Mouse click** | Spawns a burst of colorful bubbles + expanding ripple, plays a "plink" sound |
| **Mouse move** | Leaves a trail of sparkles along the cursor path |
| **Touch (tablet/phone)** | Same as mouse click, with full multi-touch support |
| **Phrase buttons** | Four large tap targets ("Hello!", "Bye bye!", "More!", "All done!") speak the phrase aloud via text-to-speech |

## Educational Features

- **Letter recognition:** Every letter press shows the uppercase letter prominently and speaks it aloud.
- **Letter-to-word vocabulary:** Association cards map A→Apple, B→Ball … Z→Zebra with emoji visuals.
- **Number recognition:** Digits 0–9 show word + emoji (e.g., "5" → "Five ✋").
- **Animal mode (optional):** Each letter maps to an animal (A→Ape, B→Bear, … Z→Zebra). Plays a real `.mp3` animal sound (18 animals included) with synthesized Web Audio fallbacks for the rest. Speech says "A is for Ape." Some letters rotate between animals (e.g., C alternates Cat 🐱 / Cow 🐄).
- **Speech engine:** Uses the Web Speech API with a preferred female English voice, speaking letters, words, and phrases aloud.

## Visual System

- **Shapes:** Randomly spawns bubbles (circles), stars, and hearts.
- **5 color themes:** Rainbow (default), Ocean, Forest, Sunset, Space — each with a 10-color palette and matching gradient background.
- **Celebration:** Every 25 interactions triggers a 40-piece confetti explosion + screen shake.
- **Floating letters:** Each key press launches a large floating letter that drifts upward and fades.
- **Animated gradient background** that slowly shifts.

## Audio System

- **Key sounds:** Web Audio API synthesis — pitch varies by key character code; triangle wave for letters, sine wave "boop" for special keys (Space, Enter, Tab, Escape).
- **Click sounds:** Randomized triangle-wave "plink."
- **Animal sounds:** 18 pre-recorded `.mp3` files (ape, bear, cat, cow, dog, duck, elephant, goat, horse, insect, lion, monkey, owl, pig, rooster, snake, tiger, wolf) with synthesized Web Audio fallbacks for all 26 letters.
- **Volume slider + mute toggle** in the settings bar.

## Parental Controls

- **Parent lock:** Toggle 🔓/🔒 button; when locked, hides the "Skip" button and blocks settings-bar clicks. Unlock with `Ctrl+Shift+L`.
- **Session timer:** 5-minute countdown; when it expires, the game returns to the intro screen.
- **Fullscreen mode:** F11 or dedicated button for immersive, distraction-free play.
- **Intro screen options:** Parents configure Animal Mode, Speak Letters, Reduce Motion, and Theme before play starts.

## Accessibility

- **Reduce motion** is **checked by default**. Disables decorative gradient animation and shortens all particle/bubble animations to 0.6s. Sparkles and ripples use simplified fade animations. Interactive feedback (letters appearing, sounds) remains fully functional.

## Key Safety Measures

- All keys except F5/F11/F12 are captured via `preventDefault()` — child cannot type in the address bar, close tabs, or trigger browser shortcuts.
- `user-select: none` and `touch-action: manipulation` prevent text selection and zoom.
- No external links, no ads, no tracking, no analytics.

## Technical Architecture

- **Zero dependencies:** Pure HTML + CSS + vanilla JavaScript. No frameworks, no build step, no npm packages.
- **Single-page app:** `index.html` + `styles.css` + `game.js` (≈1,000 lines).
- **PWA:** Service worker (`sw.js`) + `manifest.json` for offline use and "Add to Home Screen" on mobile.
- **Performance:** DOM element pooling (`Pool` object) for bubbles and floating letters to minimize GC during long mash sessions. 50ms debounce on rapid key presses. Mouse trail throttled to 80ms (160ms in reduce-motion mode).
- **No network requests at runtime.** All assets are local.
- **Browser support:** Chrome, Firefox, Safari, Edge. Requires Web Audio API.

## File Structure

```
index.html          — Single-page markup
styles.css          — All styling, animations, themes, reduced-motion overrides
game.js             — All game logic (~1,000 LOC)
sounds/*.mp3        — 18 animal sound files
sw.js               — Service worker for offline caching
manifest.json       — PWA manifest
Makefile            — `make serve` → npx serve . -p 3333
```

## How to Run

```bash
make serve
# or: npx serve . -p 3333
```

Then open http://localhost:3333. Or open `index.html` directly in a browser (PWA features require a server).

## License

AGPL-3.0 (see [LICENSE](LICENSE))
