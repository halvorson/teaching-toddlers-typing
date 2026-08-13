# Feature Landscape

**Domain:** Toddler (2-3yo) keyboard/letter-recognition game — hunt-and-peck physical-key matching
**Researched:** 2026-08-12

## Executive Summary

Two distinct app genres inform this project, and it sits deliberately between them:

1. **"Smash the keyboard" cause-and-effect toys** (tinyfingers.net, BabyBash, Baby Smash!, ToddlerSmash, smashingboard.com) — any key/tap produces a big colorful reaction. No correctness concept at all. Built for ages ~6mo-2.5yo, pure sensory cause-and-effect. Their genius is in the *feedback loop mechanics* (fullscreen, zero setup, instant reaction, no possible "wrong" input) and *parent-protective plumbing* (guided-access hints, hidden parent panel, no accounts).
2. **Letter-recognition / pre-literacy apps** (ABC Kids, TotType, Kids Play Type-to-Learn, TypeTastic Kindergarten) — introduce actual letter-shape-to-key mapping, phonics, tracing. Built for ages ~3-6, closer to structured pre-K curriculum, often paired with voice narration and rewards systems.

This project ("Keyboard Quest") is a hybrid: **it borrows the zero-friction, always-succeed feedback loop of genre 1, but adds the accurate physical key-to-screen-letter matching mechanic of genre 2** — which very few products do well for the 2-3yo band specifically. Most letter-matching products target 3-6 and assume the child can already recognize some letters; most smash toys deliberately avoid any accuracy requirement because it's considered too hard for under-3s. Keyboard Quest's job is to make "correct key = correct letter" forgiving and celebratory enough that it works at the youngest edge of that range, which is the differentiating design challenge — not a new feature to invent, but a tuning problem (see PITFALLS.md-adjacent notes below and ARCHITECTURE.md).

## Table Stakes

Features users (toddler + parent) expect. Missing = product feels incomplete or a parent finds it unsafe/useless.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Instant visual+audio reaction to input | Core cause-and-effect loop toddlers this age are wired for; delay >0.5-1s breaks the "magic" | Low | Already required (celebratory animation on match) |
| Big, high-contrast, single focal target | 2-3yo visual processing favors one large clear stimulus over cluttered screens; matches Slay-the-Spire-menu-scale thinking translated to gameplay | Low | Already required (big centered letter/number display) |
| No failure/punitive state | Fear of "wrong" answers causes disengagement and tantrums at this age; positive-reinforcement-only design is standard across all researched toddler apps (positive-discipline literature is consistent on this) | Low | Already required (neutral flicker only, never punitive) |
| Fullscreen, distraction-free play mode | Prevents toddler from accidentally navigating away, closing tab, hitting browser chrome; every reviewed smash-toy app does this (tinyfingers.net's "fewer accidental exits" framing) | Medium | Already required; needs auto-exit safeguard on route change |
| Zero reading required for child-facing UI | Pre-literate audience by definition — any instruction, label, or menu text aimed at the child must be replaced by icon/color/sound | Low | Menu is parent-facing (adult reads "Letters/Numbers/Alphabet"); nothing *inside* gameplay should require reading |
| No accounts, no login, no setup friction | Universal across every toddler app reviewed (tinyfingers.net explicitly markets "no account, no login" as a feature); parents want to hand over a device in <5 seconds | Low | Already decided — static site, no backend |
| Large touch/key targets, forgiving input | Toddler fine motor control is imprecise; apps that require pixel-perfect taps lose this audience fast | Low-Medium | For this project: physical keyboard is inherently "large target" per key, but adjacent-key mis-hits will be common — must not read as failure |
| Muted, non-jarring stimuli (no flashing/strobing) | Startling a toddler breaks trust and can cause parents to abandon the app outright; also a basic epilepsy/sensory-safety consideration | Low | Already required (no full-page flashes, muted palette) |
| Session naturally short / no forced continuation | Attention span at 2yo is ~4-6 min, ~6-8 min at 3yo; app should never demand a "session" length — child should be able to walk away or loop indefinitely without a timer nagging them | Low | No timers/session goals — already implied by "no penalty, keep going" design; do NOT add a countdown or level-gate |
| Optional sound with easy mute | Some households need silence (naps, other kids); sound should enhance but never be mandatory for comprehension | Low | Already required as a Settings toggle |
| Works via physical keyboard input on desktop/laptop | This project is explicitly a *keyboard* game (not touchscreen smash) — must handle keydown reliably, including holding/repeat, modifier keys, and function keys without breaking | Medium | Differentiates from touch-first smash toys; requires deliberate keyboard-event handling design |
| Immediate variety / non-repetition of target | Repeating the same letter twice in a row reads as broken/stuck to a toddler and to a parent watching | Low | Random mode should avoid immediate repeats; Alphabet mode is sequential by design (different mechanic) |

## Differentiators

Features that set this product apart from generic smash toys or generic letter apps. Not expected, but valued — and some are already scoped as Active requirements.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Accurate key-to-letter matching (vs. "any key = reward") | This is the actual pedagogical differentiator vs. tinyfingers.net-style toys — teaches real key/letter association instead of pure cause-and-effect. No competitor reviewed does this cleanly for the 2-3yo band with zero on-screen keyboard hint | Medium | Core value prop of this whole project; the hard part is making "correct" attainable/forgiving enough for a 2-3yo hunting a real keyboard with no visual key map |
| Three distinct modes (Letters / Numbers / Alphabet) | Lets a parent choose curriculum focus; Alphabet-sequential mode is genuinely rare — most competitor apps that teach sequence do it via a fixed "lesson path," not a replayable loop | Medium | Alphabet mode's "bigger celebration on Z then loop to A" is a nice milestone-reward pattern, mirrors Baby Smash's "special animation every 50 interactions" idea but tied to a meaningful curriculum milestone instead of an arbitrary counter |
| Post-hoc statistics (accuracy, LPM, reaction-time histogram) | Table stakes for *parents*, not children — this is the "parent-facing report" pattern seen in TinyFingers' "Smash Report" (key count/duration/chaos level) and typing-tutor apps, but adapted to be pedagogically meaningful (accuracy, reaction time) rather than just a shareable novelty stat | Medium | Explicitly deferred from live HUD to a separate Statistics screen — correct call, keeps gameplay screen clean per attention-span research (rapid extra UI competes with the single focal target) |
| Spoken letter/number on correct match | Reinforces multi-sensory learning (visual + auditory), consistent with "best apps let kids ... hear them" pedagogy finding; also helps a parent in another room know the child is engaged correctly | Low-Medium | Requires either pre-recorded audio clips or Web Speech API `SpeechSynthesis`; optional toggle in Settings |
| Share-link affordance (copy current URL) | Zero-friction way for the target family to spread the app to other parents, mirrors the low-friction "no account" ethos rather than social/account-based sharing | Low | Not a report/leaderboard — just a URL copy, appropriately scoped down vs. TinyFingers' shareable "Smash Report" |
| Alphabet-order milestone celebration (bigger animation at Z) | Rewards *completion of a structured sequence*, a step up in sophistication from smash toys' arbitrary interaction-count milestones (Baby Smash's "every 50 interactions") — ties the reward to something pedagogically real | Low-Medium | Already an Active requirement; keep the "bigger" celebration meaningfully distinct from the per-letter celebration, not just louder |
| Multiple visual themes | TinyFingers differentiates via 5 selectable themes (Space, Underwater, Kawaii, etc.) to sustain novelty over repeat play | Medium-High | Not currently scoped — single dark/pearlescent theme is the decision. Worth flagging as a natural v2 differentiator if repeat-play fatigue becomes a problem, but avoid for MVP (scope discipline) |
| Reaction-time histogram in stats | Genuinely novel among reviewed products — most toddler apps report simple counts, not distributions; useful "geek parent" feature for a technically-minded audience (project is being built by a developer parent) | Medium | Nice differentiator but has no bearing on toddler-facing experience; purely a parent/developer delight feature |

## Anti-Features

Features to explicitly NOT build for this product.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Ads / in-app purchases | Universally flagged as a red flag in every toddler-app best-practice source reviewed; breaks trust, introduces external links a toddler could tap into, monetization is irrelevant to a single-family shareable app | Nothing — static site, no ad SDKs, no purchase flow |
| User accounts / login / cloud sync | Adds friction incompatible with "hand the device to a toddler in 5 seconds"; also a privacy liability for child data (COPPA-adjacent concerns even for a hobby project) | Already correctly out of scope — local stats only, no backend |
| Timers, countdowns, or session-length pressure | Directly contradicts positive-reinforcement pedagogy and short/variable attention spans; a ticking clock or "level" gate creates artificial pressure toddlers this age cannot process constructively | No timers anywhere in the UI; sessions end when the child/parent closes the app, not when a clock runs out |
| Punitive feedback on incorrect key (buzzers, red X, "try again" text) | Every source on toddler learning-app design and positive-discipline literature agrees punitive/negative feedback increases frustration and disengagement rather than teaching correction | Already correctly scoped as neutral flicker only — reinforce this: silence + gentle flicker, never a jarring "wrong" cue |
| On-screen keyboard diagram/hint overlay | Explicitly out of scope by design — pure hunt-and-peck matches the stated pedagogical goal (physical keyboard familiarity) rather than "find the highlighted key" | Keep the challenge in the physical hunt; if this proves too hard for the youngest end of 2-3yo, address via *forgiveness* (accepting near-miss physical rows) rather than adding a visual hint, to preserve the core mechanic |
| Text-based instructions, tutorials, onboarding copy for the child | Audience is pre-literate by definition; any child-facing text is functionally invisible/useless to them | Parent-facing menu text is fine (parent operates the menu); gameplay screen should communicate entirely via image/color/sound |
| Leaderboards, multiplayer, social competition | Irrelevant and developmentally inappropriate for 2-3yo (no concept of competition yet); also reintroduces account/backend complexity this project deliberately avoids | Share-link (copy URL) is the correct, minimal alternative already scoped |
| Complex settings/configuration surface | Parents want quick setup, not a control panel; toddler apps that over-expose settings (theme picker, difficulty sliders, multiple game rules) add cognitive load disproportionate to project scope | Keep Settings to sound toggle + stats management, as already scoped; resist adding more knobs without a clear need |
| Multi-digit numbers or advanced curriculum content | 2-3yo pre-literacy/pre-numeracy developmental stage — single-digit recognition and letter-shape recognition are already at the edge of appropriate difficulty; multi-digit numbers, words, or phonics-blending are a different (older) cognitive stage | Already correctly deferred; revisit only if targeting an older sibling age range in a future milestone |
| Aggressive analytics / fingerprinting / tracking | Inconsistent with a private single-family tool and with general child-app privacy norms (TinyFingers explicitly markets minimal, anonymous analytics as a selling point) | If any analytics are added later, keep them minimal/anonymous and clearly disclosed — not a priority for this milestone |
| Rapid scene changes, autoplay video, flashing stimuli | Research is explicit that fast-paced, high-stimulus screen content works against sustained attention development, the opposite of what a teaching tool should do | Muted, single-focal-point animations only — consistent with the already-decided "dark, pearlescent, muted" visual language |

## Feature Dependencies

```
Big centered target display (table stakes)
  → Correct-match detection (keydown listener mapped to target)
      → Celebration animation/sound (table stakes)
          → New target selection (no-immediate-repeat logic)
      → Stats recording (reaction time, correct count) → Statistics screen (differentiator)
  → Incorrect-match handling (neutral flicker, no penalty) (table stakes)

Game mode selection (Letters / Numbers / Alphabet)
  → Letters/Numbers: random target generator (no-repeat constraint)
  → Alphabet: sequential A→Z generator
      → Z-completion detection → bigger celebration → loop back to A

Fullscreen auto-enter/exit (table stakes)
  → Triggered by Play action / route change (needs to wrap all three modes consistently)

Settings screen
  → Sound toggle (affects celebration audio + optional spoken letter)
  → Stats collection toggle / reset (affects Statistics screen data source)

Statistics screen (differentiator)
  → Depends on: per-session stats being recorded during gameplay (even though not shown live)
  → Depends on: local persistence layer (browser storage) surviving across sessions

Share-link affordance
  → Independent — just copies current URL, no dependency on game state
```

## MVP Recommendation

Prioritize (in this order, matching the dependency chain above):

1. **Big centered target + correct-match detection + celebration feedback loop** — this is the entire core value proposition; nothing else matters if this isn't delightful and instant.
2. **No-penalty incorrect-key handling** — must ship alongside #1, not after; a toddler will hit wrong keys constantly and the very first wrong-key experience needs to already feel safe.
3. **Fullscreen auto-enter/auto-exit** — table stakes for the "hand it to a toddler unsupervised" use case; without it the whole safety/UX premise breaks.
4. **Letters mode** as the first game mode (simplest: random A-Z, no digits) — validate the core loop before adding Numbers/Alphabet variants.
5. **Numbers and Alphabet modes** — same mechanic, different target-generation logic; low incremental complexity once #1-4 work.
6. **Menu with mode selection + Settings (sound toggle)** — needed to reach the modes at all, and sound toggle is cheap once celebration audio exists.
7. **Statistics recording (data layer) before Statistics screen (UI)** — record data from day one even if the screen ships slightly later, since retrofitting stats collection after the fact means losing early usage data.
8. **Statistics screen + Share-link** — polish/differentiator layer once the core loop and modes are proven.

Defer:
- **Multiple visual themes**: Novelty-over-repeat-play is a real concern (per TinyFingers' 5-theme approach) but adds meaningful design/asset burden; validate the single dark/pearlescent theme works first before investing in theme variety.
- **Spoken letter/number audio**: High value but can ship as a fast-follow — the celebration animation alone satisfies the core feedback loop; audio is an enhancement, not a blocker, and can reuse the same trigger point once wired up.
- **Reaction-time histogram**: Nice-to-have visualization layer on top of already-collected data; simple average/count stats can ship first, histogram is a pure UI enhancement with no new data-collection dependency.

## Sources

- [TinyFingers — Toddler Keyboard Smash for Safe Fullscreen Play](https://tinyfingers.net/toddler-keyboard-smash) — MEDIUM confidence (vendor marketing site, but directly named as this project's inspiration and describes concrete UX mechanics: fullscreen handling, parent panel, themes, smash report)
- [TinyFingers — homepage](https://tinyfingers.net/) — MEDIUM confidence
- [TinyFingers — Why Babies Love Keyboards](https://tinyfingers.net/why-babies-love-keyboards) — MEDIUM confidence
- [Baby Smash / mybabywonder.com](https://mybabywonder.com/tools/baby-smash/) — MEDIUM confidence (competitor product page)
- [BabyBash](https://babybash.app/) — MEDIUM confidence (competitor product page)
- [Baby Smash! (original Windows app)](https://www.babysmash.com/) — MEDIUM confidence
- [TotType — Safe keyboard smashing + learning games](https://tottype.com/games) — MEDIUM confidence (closest analog product: combines smash-toy safety with structured letter/key learning games for slightly older kids)
- [SplashLearn — 11 Best Apps for Toddlers](https://www.splashlearn.com/blog/best-apps-for-toddlers/) — MEDIUM confidence (general ed-tech content site)
- [ScreenWiseApp — Letter Recognition Apps: Teaching ABCs or Just Screen Time?](https://screenwiseapp.com/guides/letter-recognition-apps-and-games) — MEDIUM confidence
- [Happiest Baby — Toddler Attention Span](https://www.happiestbaby.com/blogs/toddler/attention-span) — MEDIUM confidence (parenting content site, consistent with broader pediatric guidance cited elsewhere)
- [Blueberry Pediatrics — Screen Time Guidelines Ages 0-5](https://www.blueberrypediatrics.com/health-tips/pediatrician-backed-screen-time-guidelines-for-kids-babies-toddlers-and-preschoolers-ages-0-5) — MEDIUM confidence
- [Child Mind Institute — Can Screen Time Be Educational for Toddlers?](https://childmind.org/article/value-screen-time-toddlers-preschoolers/) — MEDIUM-HIGH confidence (established child-development nonprofit)
- [Brightwheel — How to Teach Letter Recognition in Early Childhood](https://mybrightwheel.com/blog/letter-recognition) — MEDIUM confidence (early-childhood education platform content)
- [Stay at Home Educator — Letter Recognition Milestones](https://stayathomeeducator.com/letter-recognition-milestones/) — MEDIUM confidence
- [PositivePsychology.com — Positive Reinforcement for Kids](https://positivepsychology.com/parenting-positive-reinforcement/) — MEDIUM confidence

**Note on confidence:** No official/authoritative documentation exists for this niche product category (toddler keyboard-smash toys are informal, low-stakes web novelties without formal spec docs). All findings are MEDIUM confidence, cross-checked across multiple independent product pages and parenting/education content sites that converged on the same patterns (instant feedback, no punishment, fullscreen safety, short sessions, multi-sensory reinforcement). No claim here rests on a single source.
