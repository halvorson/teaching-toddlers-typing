# Teaching Toddlers Typing

A dark, pearlescent-themed typing game for toddlers learning to associate letters on a
physical keyboard with what's shown on screen. One big target letter sits center-screen;
the child hunts and pecks the matching physical key, and a muted celebratory animation
plays before a new letter appears.

**Play it live:** https://halvorson.github.io/teaching-toddlers-typing/

## How it works

- A random uppercase letter (A-Z) renders full-screen the instant the page loads.
- Press the physical key matching the on-screen letter to advance to a new letter and
  trigger a small confetti burst plus a glow pulse.
- A non-matching key press produces only a brief, muted container flicker — never a
  penalty, never a "wrong" cue. The target letter itself never moves.
- No accounts, no backend, no data collection. The site is fully static.

## Development

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

## Deployment

Every push to `main` rebuilds and redeploys automatically via GitHub Actions to GitHub
Pages — there is no separate staging step.

## Known limitations

- **US-QWERTY keyboards only.** Key matching uses the physical key position
  (`KeyboardEvent.code`), not the printed label, so on QWERTZ (German/Swiss/Austrian) or
  AZERTY (French) layouts the physically-labeled key a child presses may not match the
  on-screen letter (e.g. Y/Z are swapped on QWERTZ). This is a deliberate MVP scope cut —
  layout-aware remapping is a candidate for a later phase.
