---
status: testing
phase: 03-sound-audio-settings
source: [03-VERIFICATION.md]
started: 2026-08-14T06:40:00Z
updated: 2026-08-14T06:40:00Z
---

## Current Test

number: 1
name: Chime quality, sync, and extended-session reliability
expected: |
  Every correct key press produces a short, soft, two-note rising chime that lands with the
  confetti and never overpowers it, with no click/tick/pop at either end. Wrong keys are silent.
  A held key produces exactly one chime. After fifty-plus matches the chime is unchanged — not
  silent, distorted, or lagging.
awaiting: user response

## Tests

### 1. Chime quality, sync, and extended-session reliability
expected: Run `npm run dev` at normal volume. Play Letters and hit ten-plus correct keys, deliberately hit several wrong keys, hold one correct key down for two seconds, then keep playing for three-to-four minutes (fifty-plus correct matches) and listen to the last few. Every correct key press produces a short, soft, two-note rising chime landing with the confetti, no click/pop; wrong keys silent; held key = one chime; chime unchanged after 50+ matches.
result: [pending]

### 2. Speech pronunciation, cross-browser, and chime/speech independence
expected: In Chrome, play Letters/Numbers/Alphabet with correct and wrong keys, then hammer 5 correct keys rapidly. Repeat in Safari. Force `speechSynthesis.speak` to throw via DevTools and hit a correct key. Letters/Alphabet speak the letter name; Numbers speaks the English word ("five", not the glyph); wrong keys silent; rapid input never queues/backs up; with speech forced to fail, the chime still plays and the game keeps running with no visible error.
result: [pending]

### 3. Settings screen: two independent toggles, tab order, cross-reload persistence
expected: Open Settings, Tab through both switches, toggle Sound with Space, play a round, return and set both toggles on, hard-reload twice toggling Sound each time. "Reset trail on mistake" (off) above "Sound" (on default), identically styled, tab order Back → trail switch → Sound switch with focus rings. Sound off = correct matches completely silent (confetti/pulse/star trail unaffected). Both switches survive reload independently; flipping one never moves the other.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
