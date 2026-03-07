# Baby Smash 🎹🖱️

A playful browser game for toddlers—let them smash the keyboard and mouse! Inspired by [TinyFingers](https://tinyfingers.net/), with **sounds** and colorful visual feedback.

## Features

### Interaction
- **Keyboard**: Every key press creates bubbles, shows the letter, and plays a sound (pitch varies by key)
- **Mouse**: Every click spawns colorful bubbles and plays a satisfying "plink"
- **Touch**: Full touch support for tablets and phones
- **Mouse trails**: Sparkles follow the cursor as you move

### Sounds
- **Key sounds**: Pitch varies by key; special keys (Space, Enter, Tab, Escape) play a deeper "boop"
- **Animal mode**: Each letter plays a unique two-tone sound (A–Z)
- **Volume control**: Slider and mute button for parents

### Visuals
- **Shapes**: Bubbles, stars, and hearts
- **Color themes**: Rainbow, Ocean, Forest, Sunset, Space
- **Celebration**: Confetti and screen shake every 25 interactions
- **Reduce motion**: Accessibility option to minimize animations

### Parent Controls
- **Parent lock**: Hide Skip button; unlock with Ctrl+Shift+L
- **Session timer**: 5-minute play session
- **Fullscreen**: F11 or button for immersive mode

### Technical
- **PWA**: Add to home screen on mobile; works offline
- **DOM pooling**: Efficient memory use during long play sessions
- **No external dependencies**: Pure HTML, CSS, and JavaScript

## How to Run

```bash
make serve
# or: npx serve . -p 3333
```

Then open http://localhost:3333

Or open `index.html` directly in a browser (some features like PWA require a server).

## Browser Support

Works in Chrome, Firefox, Safari, and Edge. Requires Web Audio API support.

## License

AGPL-3.0 (see LICENSE)
