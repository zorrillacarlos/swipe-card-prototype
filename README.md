# English Chévere — Swipe Card Prototype

Premium dark-mode conversation starter cards. Swipe, tap, or use the keyboard to browse 36 questions across categories like Travel, Ethics, Career, and more.

## Demo

Open `index.html` directly in a browser — no build step, no dependencies to install.

## Features

- Swipe left / right to advance cards (touch and mouse)
- Go back one card at any time
- Fanned 3-card deck with depth-of-field blur and warm neon border
- Cinematic background with film grain and ambient glow
- Mobile-optimized: reduced motion, touch events, safe-area insets
- Sponsored card slots with custom sponsor branding

## File Structure

```
├── index.html   # HTML shell
├── style.css    # All styles
├── data.js      # CARDS dataset, ICONS SVGs, CUP icon
└── app.js       # Card engine — drag, swipe, goBack, init
```

## Keyboard Shortcuts

| Key             | Action         |
|-----------------|----------------|
| `→` Arrow Right | Next card      |
| `←` Arrow Left  | Next card      |
| `↑` Arrow Up    | Go back        |
| `Backspace`     | Go back        |

## Card Data

Cards live in [`data.js`](data.js) as a plain `CARDS` array. Each entry:

```js
{
  cat: "TRAVEL",          // category label
  icon: "globe",          // icon key (see ICONS map)
  q: "Question text...",  // the question
  sp: null,               // sponsor object { h: "@handle", t: "Tagline" } or null
}
```

Available icons: `person`, `leaf`, `sun`, `split`, `chat`, `globe`, `arrow`, `mind`.

## Dependencies

- [GSAP 3.12](https://greensock.com/gsap/) — loaded via CDN, no install needed
- [Oswald](https://fonts.google.com/specimen/Oswald) — loaded via Google Fonts

## Brand

- Primary color: `#ff791a`
- Background: `#07070a`
- Font: Oswald 400 / 600 / 700
