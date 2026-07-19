# PurInstinct — Design & Implementation Authority

This file is the permanent source of truth for how PurInstinct looks, feels and
is built. Read it before making any UI change. When a decision conflicts with an
existing screen, this document wins — the presentation layer is disposable, the
workflow and data are not.

---

## 1. Product identity

PurInstinct is a **premium live sports competition platform** — real athletes, live
arena events, six competition zones, real-time scoring across many station tablets.

It must feel: **athletic, cinematic, precise, fast, credible, clear under pressure.**

It must **not** feel like: a generic SaaS dashboard, a Vite starter, an internal
admin tool, a template, a student project, or a basic scorekeeper.

Reference feeling: premium sports broadcasting × professional event operations ×
high-performance athlete tracking. Never gamer/cyberpunk/UFC-cage aesthetics.

---

## 2. Brand rules

- **Base:** near-black `#0A0A0A` (`--pi-bg`). Surfaces are restrained neutral grays
  (`--pi-surface-1/2/3`), never blue- or purple-tinted.
- **Signature accent:** neon lime `#B8E020` (`--pi-lime`). **Spend it deliberately.**
  Lime = primary action, active/selected state, live indicators, scores, brand moments.
  It must never be the fill of more than one primary action per screen.
- **Typography color:** strong white `#FFFFFF` primary; `--pi-text-2/3/4` for the
  descending hierarchy. Build hierarchy with scale/weight/space, not boxes.
- **Zone colors are functional, not decorative.** Each of the 6 zones
  (`src/config/zones.js`) owns an accent used for instant recognition. Keep them.
  They are a secondary layer inside a lime-framed, black shell.
- **Status colors** (`--pi-live` red, `--pi-ok`, `--pi-warn`, `--pi-danger`) are only
  ever used to communicate state, and always paired with a label/icon/shape —
  never color alone.
- **Geometry:** sharp. Signature move = the broadcast cut-corner (`--pi-cut`, via
  `.pi-panel--hero` / `.pi-btn--cut`). Restrained radii otherwise.

---

## 3. Prohibited patterns

- generic glassmorphism; blur as decoration (blur only signals dismissible surfaces)
- purple/blue SaaS gradients; soft pastels
- identical rounded cards everywhere; excessive pills; excessive shadows/glow
- random neon or decorative effects without function
- default HTML controls or Vite starter styling
- inconsistent spacing / random hard-coded colors (use tokens)
- weak mobile adaptations; giant monolithic components
- more than one lime primary action per screen
- ambient/constant animation; motion on every card

---

## 4. Design system

Tokens live in **`src/styles/tokens.css`** (CSS variables, the source of truth) with a
JS mirror in **`src/config/tokens.js`** for inline styles that need literal hex
(the `color+"18"` alpha-append pattern can't take `var()`). Keep them in lock-step.

**Type scale** (`--pi-fs-*`): `display` → `score` → `title` → `section` → `card` →
`body` → `label` → `meta`. Do not introduce sizes outside this scale.
- Display family: **Barlow Condensed**, 900 italic — titles, scores, timers, zone
  names, athlete names. Body family: **DM Sans** — everything else. Numerals are
  tabular (`tnum`) so scores/timers never reflow.

**Spacing:** 4-based (`--pi-s1`=4 … `--pi-s16`=64). **Radii:** `--pi-r-xs..lg` + `pill`.
**Cut corner:** `--pi-cut` (12px). **Borders:** 1px hairline `--pi-line`, 2px strong.
**Shadows:** `card`, `float`, `pop`, `--pi-glow-lime`. **Z-index:** ladder
`base<sticky<nav<drawer<overlay<modal<toast<max`. **Motion:** `--pi-dur-fast/base/slow`
+ `--pi-ease-out/in/spring`. **Control heights:** `sm 36 / md 44 / lg 56 / xl 64`
(md = min touch target; xl = primary live actions).

**Layers:** `styles/tokens.css` (vars) → `styles/base.css` (reset, keyframes, focus,
reduced-motion) → `styles/components.css` (primitive classes). All imported via
`src/index.css`.

---

## 5. UI primitives — `src/components/ui/`

Compose from these before hand-rolling. Each carries its states
(default/hover/active/focus/disabled/selected/loading/error):

`Button` (primary·secondary·ghost·danger·outline × sm·md·lg·xl, block, cut, loading) ·
`IconButton` · `Panel` (default·raised·hero, flush) · `Eyebrow` · `Badge` ·
`LiveIndicator` · `Tabs` (arrow-key nav) · `Modal` / `ConfirmModal` (Esc + backdrop,
Cancel-default) · `Field` · `EmptyState` / `LoadingState` / `Skeleton` / `Spinner` ·
`Timer` · `ScoreDisplay` (animated count-up).

Rule: **do not add a new inline-styled control if a primitive covers it.** Extend the
primitive instead.

---

## 6. Responsive rules

Breakpoints: mobile `<600`, tablet `≥600`, desktop `≥1024`, wide `≥1440`.
Validate every screen at **390×844, 768×1024, 1440×900**. Never just shrink desktop.

- **Mobile:** core live action first; secondary info collapses to drawers/progressive
  disclosure; touch targets ≥44px; no tiny score controls; no horizontal overflow;
  no dense desktop tables.
- **Tablet (primary station device):** usable standing/moving; split layouts where the
  live game + queue both matter.
- **Desktop:** deliberate use of space; strong hierarchy; content capped at
  `--pi-w-content`/`--pi-w-wide`, never stretched edge-to-edge without purpose.

---

## 7. Accessibility rules

- Contrast: body text ≥4.5:1, large/UI ≥3:1. Lime-on-black and white-on-black pass.
- Visible focus: 2px lime `:focus-visible` ring (global, in `base.css`). Never remove it.
- Keyboard: all actions reachable; Tabs support arrows; Modal traps Esc.
- Semantics: real `<button>`/`<label>`/`<dialog role>`; form fields labelled via `Field`.
- Reduced motion: respected globally in `base.css`. Any new animation must degrade.
- Status is never color-only — always add label/icon/shape.

---

## 8. Interaction & sports-product rules

- Every important action gives immediate feedback (score change, timer, selection,
  save, reset, status, navigation). Under-pressure usability beats cleverness.
- Destructive actions require `ConfirmModal` (Cancel focused). No accidental live taps.
- Clearly distinguish: live vs inactive · zones · players · scores · timers · game
  status · warnings · completed vs pending actions · errors.
- Important game info must be readable in **under one second**; it must not visually
  compete with secondary controls. Use scale/contrast/position before adding borders.

---

## 9. Level-5 acceptance criteria

Every major screen scores ≥ **4.5 / 5** on: brand identity · hierarchy · usability ·
visual polish · responsiveness · consistency · accessibility · interaction quality.
Anything below is revised before moving on. QA loop = run → screenshot at
mobile/tablet/desktop → critique as a demanding design director → fix → re-score.

---

## 10. Engineering guardrails

- This app is **live in production** (Vercel + Firebase RTDB, real data). Do design work
  on a branch, keep `main` shippable, verify `npm run build` + browser before commit.
- Firebase config comes from `.env` / Vercel env (`VITE_FB_*`); never hard-code secrets.
  Auth is anonymous; RTDB rules require `auth != null`; authorized domains must include
  the deploy domain.
- Preserve business logic (`src/lib/game-logic.js`) and the atomic-write discipline in
  `App.jsx`'s Firebase layer (one `fbUpdate` per action — two stations must never clobber).
- Keep components readable; prefer primitives + tokens over duplicated inline styles.
  `npm run build` green, `npx eslint src` no new errors, `npx vitest run` green.

---

## 11. Migration status (redesign/level-5)

- **Phase 1 — done:** CSS-variable token system, base layer (Vite starter removed),
  `components.css`, `ui/` primitive library, brand palette migrated to `#0A0A0A`/`#B8E020`,
  fonts moved to `index.html`, keyframes globalized. No screen redesigns yet.
- **Phase 2 — done:** `StationView` (live game management) is **the reference screen**.
  Copy its language: broadcast header (zone tile + display-italic name + status +
  arena clock telemetry), `.pi-station-grid` split (action left / context rail right
  at ≥1024, action-first stack on mobile), `.pi-hide-mobile` for secondary context,
  primitives over hand-rolled controls.
- **Phase 3 — in progress.** Done: `KioskView`.
  Done: **`AdminView.jsx` split** — structural only, one file per tab under
  `src/components/admin/tabs/` (`CockpitTab`, `LeaderboardTab`, `StationsTab`,
  `PlayersTab`, `SessionTab`, `SurveyTab`, `CommentsTab`, `WinnersTab`);
  `AdminView.jsx` is now a thin orchestrator (header, tab switcher, dossier
  overlay, winner celebration). No visual redesign of these tabs yet.
  Done: **`PlayerView` redesign** — split into an orchestrator plus
  `src/components/views/player/` (`PlayerHubView`, `PlayerQueueView`,
  `PlayerStatsTab`, `PlayerLeaderboardTab`, `PlayerWinnersTab`), rebuilt in
  StationView's language. Fixed the `cham`/`p` bug in its winners tab and the
  render-time confetti-trigger anti-pattern (moved to `useEffect`) along the way.
  Done: **`LiveLoginView` redesign** — rebuilt in place (single file, no split
  needed) with `ui/` primitives and tokens; `NumPad`/`Wordmark` hoisted to
  module scope. Auth/focused screens (session code, admin/station PIN) use
  `--pi-w-narrow`.
  Remaining, in recommended order:
  1. Admin cockpit + leaderboard + stations + players + session + survey +
     comments + winners tabs (visual redesign — the split only did structure).
     Fix the remaining `cham`/`p` bug in `AdminView`'s winners tab (now
     `src/components/admin/tabs/WinnersTab.jsx`) when redesigning it.
  2. `SessionPanel` / `RosterEditor` / `PlayerDossier` (lowest visibility, last).
  3. `AugmentedLanding` / `AugmentedStation`.

  Also outstanding:
  - `QueueList`, `RulesCard`, `TierBadge`, `Bib` still carry legacy inline styles.
  - Neutral grays (`#0d0f1a`, `#111827`, `#1f2937`, `#374151`, `#9ca3af`, `#4b5563`…)
    are still hard-coded across screens; sweep them onto `--pi-surface-*`/`--pi-text-*`
    as each screen is migrated.
  - Screens still render `<style>{FONTS}</style>` (now an empty string). Delete the
    call sites and the import as you touch each file.
  - Pre-existing bug, untouched: `cham`/`p` are undefined in
    `src/components/admin/tabs/WinnersTab.jsx` (AdminView's winners tab) —
    2 `no-undef` errors. Fix when redesigning that tab (PlayerView's copy of
    this bug is already fixed).
