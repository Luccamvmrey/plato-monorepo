# Plato — UI/UX Audit Report

**Date:** 2026-07-27
**Scope:** All 10 routes of `apps/web`
**Method:** Live browser audit (Chrome DevTools MCP) at **390 × 844** (iPhone-class portrait, DPR 3, touch + mobile emulation), plus source review
**Build audited:** branch `develop` @ `1980afe`
**Deliverable:** report only — no code was changed.

> **Update — 2026-07-27, follow-up pass:** the three **P0** issues (§2, §3.1, §3.4) have since
> been fixed and re-verified in the browser. Backlog items 1, 2, 4, 5 and part of 6 are done;
> see §5 for status. Everything else in this report still stands as written.
>
> **Update — 2026-07-29, second follow-up pass:** backlog items **3, 6, 7, 8, 11, 16, 17, 19, 20**
> are now done and verified live at 390 × 844 and 390 × 508, plus the PR double-count from §3.9.
> Remaining open: **9, 10, 12, 13, 14, 15, 18**. Four corrections to this report came out of that pass:
>
> 1. **§3.3 overstated the confirm button.** `.btn-session-confirm` is 52px (`index.css:441-453`),
>    so it always met the 44px guideline. The RPE chips (40px, now 44px) and the kebab (28px) were real.
> 2. **§4.6's "5 dead files" was not a clean delete.** `ActiveSetInputRow.tsx` was still imported for
>    its `SetSubmissionData` *type* by `useActiveExerciseCardLogic.ts:6`. Repointing that one import at
>    the canonical declaration in `useActiveSetInput.ts:3` freed all five.
> 3. **§3.3's comma bug needed more than normalising the parse.** On `type="number"` the browser
>    discards the comma before any handler runs, so `parseFloat(x.replace(",","."))` alone fixes
>    nothing — the inputs had to become `type="text" inputMode="decimal"` as well.
> 4. **§3.4's PR count is worse than "counted twice."** It counted *rows*, and `scanForRecords` writes
>    one WEIGHT + one VOLUME row per exercise. Now counts distinct exercises. Also: **all eight**
>    muscle-badge families fail AA in light mode (§4.3 named two), and the inactive nav label is
>    marginal at ~4.2:1 — item 14 is bigger than it looks.
>
> Two things the audit's own §2.5 fix did not cover, found by re-measuring:
>
> - **`useKeepFocusedFieldVisible` bailed whenever the focused field itself was visible**, which left
>   the RPE row and confirm button under the fold on a 508px viewport even with the chrome hidden. It
>   now judges and moves the whole `[data-keyboard-anchor]` group, not just the field. Measured before:
>   RPE y 551–595, confirm y 611–663 in a 508px viewport. After: 348–392 and 408–460.
> - **You cannot `focus()` a disabled input.** The set inputs carry `disabled={isPending || wasSubmitted}`,
>   so refocusing the next set's weight field from the set-change effect silently no-ops — focus lands on
>   `<body>`, exactly the symptom §3.3 reported. The refocus has to wait for `wasSubmitted` to flip back
>   to false, in its own effect.
>
> **Update — 2026-07-30, third follow-up pass:** items **12, 13, 14** are done, plus the
> §3.9 emoji streak markers and a `prefers-reduced-motion` guard. Remaining open:
> **9, 10, 15, 18**.
>
> **Update — 2026-07-30, fourth follow-up pass:** the last four backlog items —
> **9, 10, 15, 18** — are done, plus the §3.1 clear-on-change, the §3.8 empty charts and
> back-button label, and `<ErrorBoundary>` on the editor/summary/analytics routes.
> **The backlog is now closed.** Three corrections to this report came out of it:
>
> 1. **§3.6 put "Ver Arquivados" in `WorkoutListHeader.tsx:16`.** It is in
>    `WorkoutListPage.tsx:50-58`. The header's own offender was the "Novo treino"
>    button (32px, `size="icon"` with no override) — a different element entirely.
> 2. **§3.2 said the sheet close button reads English "Close".** It already read
>    **"Fechar"**; a prior pass had localised it. Only the 28px size was still true.
> 3. **§4.4's "`NewExerciseSheet.tsx:107` mounts its overlay outside the sheet portal"
>    was stale** — item 13 had already replaced it with an in-sheet `Spinner`.
>
> Four things found by measuring rather than reading, none of which the audit named:
>
> - **`.tap-target`'s `position: relative` broke the sheet's close button.** Plato's
>   hand-written utilities live *outside* `@layer`, and unlayered CSS beats every layer
>   regardless of specificity — so `position: relative` overrode Tailwind's `absolute`
>   and moved the button to `left: -12px`, off-screen. The class no longer declares
>   `position`; call sites pass `relative` themselves.
> - **`overflow-x-auto` clips the 44px pseudo-element.** When one axis is not `visible`,
>   the other computes to `auto` — so the muscle-chip row and the selected-chip row were
>   both cutting the `::after` down to the badge's own 20px. Measured: a probe 16px above
>   a chip missed it. Both rows needed `py-3`.
> - **The sheet's X close button was unreachable even before any of this** —
>   `elementFromPoint` at its centre returned the header's `<h2>`. It needed `z-10`.
> - **`<input>` cannot use `.tap-target` at all.** Replaced elements do not render
>   `::after`, so the editor's sets/reps fields had to grow for real (`size-11`).
>
> One thing worth recording about the picker (item 15): **virtualisation was not needed.**
> The cost was recomputation, not DOM — the hook re-filtered ~100 rows *and*
> `SheetExerciseList` re-grouped 14 × N on every keystroke, both unmemoised. `useMemo` +
> `useDeferredValue` + a `Set` for selection + a `memo`'d row covers it with no new
> dependency, and keeps the grouped-by-muscle headings that windowing would complicate.
>
> **§4.3's light-mode contrast numbers were wrong in both directions.** Measured properly
> (canvas rasterisation of `oklch()` → sRGB, sanity-checked at 21:1), the real picture was:
>
> | Pair | §4.3 said | Measured | Now |
> |---|---|---|---|
> | chest / shoulders / triceps badge | fails (3.27) | **3.27 ❌** | 4.67 |
> | biceps / forearms badge | not mentioned | **3.79 ❌** | 4.66 |
> | core badge | not mentioned | **3.96 ❌** | 4.61 |
> | neck badge | not mentioned | **4.44 ❌** | 4.63 |
> | back / lower-back / traps badge | implied failing | 4.79 ✅ already passed | 4.79 |
> | quads / hams / glutes / calves badge | implied failing | 5.17 ✅ already passed | 5.17 |
> | active nav label (`--primary` on bg) | fails (3.8) | **3.80 ❌** | 5.43 |
> | inactive nav label (`--muted-foreground`) | "marginal" | 5.51 ✅ already passed | 5.51 |
>
> So **7 of 14 badge families failed, not "8 WCAG AA failures" spread as described** — and
> two colour groups the report implicated were already fine. My own batch-2 note claiming
> "all eight families fail" was equally wrong; it repeated an estimate instead of a measurement.
>
> **Two AA failures the audit never found**, both surfaced by sweeping every token pair
> rather than only the ones named:
>
> - **`--primary-foreground` on `--primary` was 3.60:1** — the near-white label on the
>   primary CTA (`Iniciar`, `Salvar Treino`, the summary button). The main call-to-action
>   in the app failed AA in light mode. One `--primary` change fixed this *and* the nav
>   label: L 0.60 → 0.51 gives 5.14:1 and 5.43:1.
> - **`--success` was 3.58:1 as text and 3.31:1 behind `--success-foreground`** —
>   `text-success` is real text in three places (password-strength label, export
>   confirmation, the 10px "último realizado" badge). L 0.60 → 0.515 gives 5.01:1 / 4.64:1.
>
> Also worth recording: `--muscle-core-bg` was hue **85** while `--muscle-core` was hue
> **75**, and `--ring` was commented "segue primary" but had drifted from it.
>
> One correction worth recording: hiding the fixed chrome was **not sufficient on its own**.
> It freed the space but nothing moved the focused field into it, and dropping the bottom
> padding shortened the scroll range, which pushed the focused field *further* down. A
> focused editor field still measured y 539–571 in a 508px viewport after that first fix.
> A second change (`useKeepFocusedFieldVisible`) was needed. **Keyboard-occlusion fixes must
> be verified deep in a list, not on the first field** — the first field passes either way.

---

## 1. Executive summary

Plato's visual design is genuinely good. The dark theme is well-tokenised, typography is consistent, the history and summary screens are clear, and dark mode passes WCAG AA contrast with **zero failures** on the screens measured. The problems are not aesthetic — they are **spatial and interactive**, and they concentrate exactly where you said they do: creating a workout and logging a session.

The five things that matter:

| # | Finding | Severity |
|---|---|---|
| 1 | **The on-screen keyboard makes the logging screen unusable.** With the keyboard open, 169px of the remaining 508px viewport (33%) is fixed chrome. The RPE selector and the "Confirmar set" button both sit *behind* it — unreachable without dismissing the keyboard first. | **P0** |
| 2 | **The workout summary's primary CTA is physically unclickable.** "Concluir e Voltar" is covered by the nav bar. A hit-test at its centre returns the nav bar, not the button. | **P0** |
| 3 | **Pressing Enter in the editor submits the form instead of advancing fields** — and the resulting validation error renders 44px *below the fold* with no `role="alert"`, so nothing appears to happen at all. | **P0** |
| 4 | **There is no keyboard-driven flow anywhere.** No `onKeyDown` handler exists in the entire `apps/web/src`. No `enterKeyHint`, no programmatic focus, no `<form>` around the logging inputs. Every field transition costs a tap, and the keyboard closes between every one. | **P1** |
| 5 | **The app has no keyboard/safe-area awareness at all.** Zero uses of `env(safe-area-inset-*)`, no `visualViewport` listener, `h-screen`/`100vh` instead of `dvh`. | **P1** |

The single highest-leverage fix is **#1 + #5 together**: make the bottom chrome keyboard-aware. That one change fixes the logging screen, the editor, and the summary CTA simultaneously.

---

## 2. The keyboard problem

This is the centrepiece, so it gets its own section.

### 2.1 Root cause: three stacked layers of bottom chrome

Plato reserves the bottom of the screen three times over:

| Layer | Where | Height |
|---|---|---|
| Global nav bar, `fixed bottom-0`, `z-50` | `core/components/NavBar.tsx:11` | **92px** |
| Session action bar, `fixed bottom-[92px]` | `.../active-workout/components/ActiveWorkoutActions.tsx:19` | **77px** |
| Hard-coded padding: `pb-[84px]` + `mb-[96px]` + page-level `pb-[320px]` | `core/layout/Layout.tsx:6-7`, `pages/ActiveWorkoutPage.tsx:70` | 180–500px |

**Measured on the live active-workout screen:** 169px of permanently fixed bottom chrome — **20% of a 844px viewport before the keyboard even opens.**

On the *empty* editor, the gap between the "Salvar Treino" button and the nav bar measured **164px of pure dead space** — 19% of the screen showing nothing (`04-editor-empty-deadspace-390x844.png`).

### 2.2 What happens when the keyboard opens

`index.html:5` sets `interactive-widget=resizes-content`, so on Android the layout viewport shrinks to ~508px. The two fixed bars simply reflow to the bottom of the *shrunken* viewport — they do not get out of the way.

Measured with the weight field focused, viewport at 508px (`11-active-workout-keyboard-390x508.png`):

```
viewport height ............ 508px
action bar ................. y 339 → 416
nav bar .................... y 416 → 508
fixed chrome ............... 169px  (33% of remaining viewport)
usable content height ...... 339px

RPE selector ............... y 366 → 406   ❌ behind the action bar
"Confirmar set" button ..... y 422 → 474   ❌ behind action bar + nav bar
```

**Verdict: the two controls you need to finish logging a set are both unreachable while the keyboard is open.** To confirm a set the user must dismiss the keyboard, scroll, tap RPE, then tap Confirm — then tap the weight field again for the next set, because focus drops to `<body>` after every confirmation (verified: `activeElementAfterConfirm: "BODY"`).

For a 20-set session that is roughly **7 interactions per set** where 3 would do.

### 2.3 The same failure in the editor

With the keyboard open on the editor (`07-editor-keyboard-open-390x508.png`), only **1 of 6 exercise rows** is fully visible, and the nav bar still eats 18% of the remaining space.

I also reproduced a focused field being pushed under the keyboard: a reps input at y 539–571 in a 508px viewport — **fully invisible, with `scrollY` unchanged** (`08-editor-focused-field-hidden-390x508.png`). Nothing in the app scrolls it back.

### 2.4 Why nothing recovers

Verified live in the running app:

- `window.visualViewport` exists but **the app registers no listener** on it.
- **`env(safe-area-inset-*)`: zero occurrences** in any stylesheet. Combined with a viewport meta that lacks `viewport-fit=cover`, insets would resolve to `0px` even if they were used — so on a notched iPhone in standalone PWA mode the 92px nav bar sits partly under the home indicator.
- Layout uses `h-screen` (`100vh`), not `dvh`/`svh` — `App.tsx:27`, `Layout.tsx:6`. The only `dvh` in the codebase is the exercise sheet.
- The only scroll-into-view logic is a fixed `setTimeout(..., 300)` on the weight and reps fields (`ActiveExerciseCard.tsx:57-61`) — and it is **not** wired to the bar-weight input or the note textarea.

### 2.5 Recommended fix

1. **Hide the nav bar whenever a text input is focused.** It is pure noise mid-set. A `visualViewport` resize listener setting a `--kb-open` flag is ~15 lines and fixes the worst of it.
2. **Anchor the bottom chrome to `visualViewport.height`** rather than the layout viewport, or move the session action bar into normal flow at the end of the document.
3. Replace `h-screen`/`100vh` with `100dvh`, add `viewport-fit=cover` to the viewport meta, and pad the nav bar with `env(safe-area-inset-bottom)`.
4. Collapse the triple bottom padding (`pb-[84px]` + `mb-[96px]` + `pb-[320px]`) into a single token derived from the actual nav height.

---

## 3. Screen-by-screen findings

### 3.1 Workout Editor — `/workout-editor/:id` **(deep audit)**

| Sev | Finding | Where |
|---|---|---|
| **P0** | **Enter submits the form instead of advancing to the next field.** Typing `4` in the sets field and pressing Enter fired a submit and produced "Defina as séries e repetições para todos os exercícios." — while the user was still filling the *first* field. On mobile the return/Go key does the same. | `WorkoutEditorForm.tsx:14` + `WorkoutEditorActions.tsx:14,21` (`form={formId}` re-associates the outside button) |
| **P0** | **That validation error is invisible.** Measured at y 888 in an 844px viewport — **44px below the fold**, with `role=null` and `aria-live=null`. Focus is not moved to the offending field. From the user's seat, pressing Enter does nothing whatsoever. | `WorkoutEditorPage.tsx:52-54` |
| **P1** | **Save button is not sticky** and sits below a long list — measured at y 856 (below the fold) with 6 exercises. With the keyboard open it is in the occluded band. | `WorkoutEditorActions.tsx`, plain flow child |
| **P1** | **Every added exercise starts at `0 / 0`** — i.e. in the exact state submit-validation rejects. 6 exercises = **12 fields the user must fill by hand**, with no bulk-set, no defaults, no steppers. | `workout-editor.store.ts` `addExercises` |
| **P1** | Sets/reps inputs are **40 × 32px** — well under the 44px touch guideline, and only 8px apart. | `ExerciseItem.tsx:55,68` |
| **P2** | Error is only cleared on the *next blur*, not on change — so a corrected field keeps showing red while you type. | `useWorkoutEditorLogic.ts:56-62` |
| **P2** | No Cancel/discard path when editing an existing workout (the X is replaced by a delete button). | `WorkoutInfo.tsx:32-39` |
| **P2** | Description textarea (`min-h-[100px]`) plus its label consumes ~250px above the exercise list for an optional field, pushing the actual content below the fold. | `WorkoutInfo.tsx:65-72` |
| **P2** | The exercise delete button has **no accessible name** — announced as an unnamed button. | `ExerciseItem.tsx:73` |
| **P2** | 1500ms hard-coded delay on "Salvo!" before navigating. | `useWorkoutEditorLogic.ts:93-96` |

**Fix priority:** intercept Enter → move focus to the next field (`enterKeyHint="next"` on sets, `"done"` on the last reps); make the save bar sticky and keyboard-aware; seed new exercises with sensible defaults (e.g. 3 × 10) instead of 0/0; move the exercises error next to the offending row with `role="alert"`.

---

### 3.2 Exercise picker sheet — inside the editor

| Sev | Finding | Where |
|---|---|---|
| **P1** | **The search field is auto-focused on open**, so the keyboard fires immediately and covers the list the user came to browse. (Verified: `activeElement` is the search input on open.) | Radix autofocus + `ExerciseSearchBar.tsx` |
| **P1** | **No virtualisation.** All **103 rows** mount at once — a 5101px scroll region inside a 451px window (11× the visible area), re-filtered on every keystroke with no `useMemo` or debounce. | `SheetExerciseList.tsx:16-22`, `useNewExerciseSheet.ts:29-34` |
| **P1** | **Muscle chips and exercise rows are non-focusable `<span>`/`<div>`s** — they appear in the a11y tree as bare `StaticText`. The entire picker is unreachable by keyboard and unusable with a screen reader. | `MuscleGroupFilter.tsx:16-39`, `SheetExerciseList.tsx` |
| **P2** | ✅ **DONE — and the symptom here was wrong.** The claim was that selection chips "scroll away with the list". They never rendered at all: the chip row is `flex gap-2 overflow-x-auto`, and `overflow-x-auto` makes it a scroll container whose *automatic minimum size is 0* rather than content-based. As a flex sibling of the 88-row list inside a `flex flex-col`, it was shrunk to `height: 0` — the chips were in the DOM at 20px, overflowing a zero-height parent. Visible in `05-exercise-sheet-selected-390x844.png`: the band above "PEITO" is empty even with 6 selected. Fixed with `shrink-0`. This one was inferred from the code rather than checked on screen. | `SelectedExercisesList.tsx:14` |
| **P2** | Zero-result searches render a **completely blank area** — no "nenhum resultado" state. | `SheetExerciseList.tsx:27` |
| **P2** | "Cancelar" / Esc / overlay-click do not reset sheet state — selections and filters persist into the next open. | `NewExerciseSheet.tsx:47`, `useNewExerciseSheet.ts:41-46` |
| **P2** | Disabled button label renders **"Adicionar  exercício"** (double space, singular). Verified in the live DOM. | `NewExerciseSheet.tsx:101-102` |
| **P2** | Close button label is English **"Close"** in an otherwise pt-BR UI, and is 28 × 28px. | `sheet.tsx:74-78` |

**Fix priority:** don't autofocus search on mobile (or open the sheet at 60% height so the list stays visible); make rows and chips real `<button>`s; add an empty state; reset state on every close.

---

### 3.3 Active Workout / logging — `/active-workout/:id` **(deep audit)**

Covered in §2. Additional findings:

| Sev | Finding | Where |
|---|---|---|
| **P1** | **Focus is lost after every confirmed set** (`activeElement` → `BODY`), so the keyboard closes and the next set starts with a fresh tap. | `useActiveSetInput.ts:33-42` |
| **P1** | **RPE is a row of `<button>`s, not an input** — tapping one necessarily blurs the numeric field and dismisses the keyboard. This is structural, not incidental. | `RpeSelector.tsx` |
| **P1** | **Comma decimals are silently destroyed.** The app is `lang="pt-BR"` (comma is the decimal separator) and `inputMode="decimal"` surfaces a comma key — but on `type="number"` I verified `"82,5"` yields an **empty DOM value**. And `parseFloat("82,5")` would give `82`. Either way the half-kilo is lost with no error. Real risk for 82,5kg-style loads. | `ActiveExerciseCard.tsx:130-158`, `useActiveSetInput.ts:44-62` |
| **P2** | RPE offers only **6–10**. Values 1–5 and half-steps are unreachable, though the parser clamps to 1–10. | `RpeSelector.tsx` |
| **P2** | RPE and reps are **never reset between sets** — they carry over from the previous set. Convenient usually, silently wrong occasionally. | `useActiveSetInput.ts:33-42` |
| **P2** | The note textarea is `text-[13px]` — **below the 16px iOS threshold, so focusing it zooms the page.** The two main inputs are correctly 22px. | `ActiveExerciseCard.tsx:195` |
| **P2** | RPE chips are 40px tall; the kebab menu ≈28 × 28px — both under 44px. | `RpeSelector.tsx:21`, `ActiveExerciseCard.tsx:92` |
| **P2** | Note text writes to `localStorage` on **every keystroke** (persisted Zustand). | `active-workout.store.ts:107-114` |

**Fix priority:** the §2.5 chrome fix; then chain focus weight → reps → confirm with `enterKeyHint`; normalise `,` → `.` on input; raise the note textarea to 16px.

---

### 3.4 Workout Summary — `/workout-summary/:id`

| Sev | Finding | Where |
|---|---|---|
| **P0** | **The primary CTA is unclickable.** The summary's action bar is `fixed bottom-0` with `z-index: auto`; the nav bar is `fixed bottom-0` with `z-index: 50`. They occupy the same band (755–844 vs 752–844). `document.elementFromPoint()` at the button's centre returns **the nav bar**, and the button is invisible on screen (`14-summary-cta-covered-by-navbar-390x844.png`). The user's only escape is the nav bar itself. | `WorkoutSummaryPage.tsx:75` |
| **P2** | Every exercise generates a PR on the first-ever session, so the banner reads "6 novos recordes!" — technically true, rhetorically cheap. Consider suppressing PRs on a user's first session per exercise. | `SummaryPRBanner.tsx` |

**Fix priority:** this is a two-line fix (raise the CTA's z-index above the nav, or hide the nav on this route) and it unblocks the end of every workout.

---

### 3.5 Login & Signup — `/`, `/signup`

| Sev | Finding | Where |
|---|---|---|
| **P1** | **Signup clips at both ends with the keyboard open.** With validation errors + the strength meter visible, the card grows to 555px in a 508px viewport. Because the page is `h-screen` + `items-center justify-center` with no scroll container, max scroll is only 24px — so **the top of the card ("Bem-vindo ao Plato!") is permanently unreachable**, the classic centred-flex overflow trap (`20-signup-clipped-keyboard-390x508.png`). Login alone fits. | `SignupPage.tsx:8`, `SignupCard.tsx:24` |
| **P1** | **No `autoComplete` on any auth field.** No `autoComplete="email"` / `"current-password"` / `"new-password"`, no `enterKeyHint`, no `inputMode`. Password managers and iOS AutoFill will not offer to fill or save credentials. Cheapest high-value fix in the whole report. | `LoginForm.tsx:22-43`, `SignupForm.tsx:26-61` |
| **P2** | **Signing up does not sign you in** — you are bounced to the login screen to retype the credentials you just chose. Verified live. | `useSignupLogic.ts` |
| **P2** | Cards are `w-[75%]`, wasting ~25% of an already narrow 390px screen. | `LoginCard.tsx:23`, `SignupCard.tsx:24` |
| **P2** | Password visibility toggle has **no `aria-label`**; its icon is ~16px inside a 44px field. | `LoginForm.tsx:44-50` |
| **P2** | Errors are plain `<p>` with no `role="alert"` / `aria-invalid` / `aria-describedby`. | `LoginForm.tsx:30,52` |

**Fix priority:** add `autoComplete` + `enterKeyHint`; make the auth pages scrollable (`min-h-dvh` + `justify-start` with vertical padding, not `justify-center`); log the user in after signup.

---

### 3.6 Workout List — `/workouts`

| Sev | Finding | Where |
|---|---|---|
| **P1** | **Every interactive element is under 44px.** Measured live: "Ver Arquivados" **83 × 18px** (an 18px-tall tap target), "Novo treino" 32 × 32, archive/edit 36 × 36, "Iniciar" 88 × 36. | `WorkoutListHeader.tsx:16`, `WorkoutListItem.tsx:96,105` |
| **P2** | The "ÚLTIMO REALIZADO" badge is wide enough at 390px to force the workout title to wrap onto two lines. | `WorkoutListItem.tsx` |
| **P2** | Each card mounts its own `useActiveSession()` query hook — one instance per card. | `useWorkoutListItemLogic.ts` |

---

### 3.7 History — `/history`

Cleanest screen in the app; no significant issues found. Card hierarchy, metric grouping and PR badges all read well at 390px (`15-history-390x844.png`).

| Sev | Finding | Where |
|---|---|---|
| **P2** | Empty state uses `min-h-[calc(100vh-220px)]`; `100vh` overshoots the visible mobile viewport, pushing content under the nav bar. | `HistoryPage.tsx:73` |

---

### 3.8 Exercise Analytics — `/exercise-analytics/:id`

| Sev | Finding | Where |
|---|---|---|
| **P2** | Two chart cards each reserve **~180px** to display a single line of text — "Complete mais 2 sessões para ver a evolução", repeated verbatim in both. ~360px of near-empty space on a first-time screen (`16-exercise-analytics-390x844.png`). Collapse empty charts to a compact placeholder. | `ExerciseAnalyticsPage.tsx` |
| **P2** | Back button is icon-only with **no `aria-label`**. | `ExerciseAnalyticsPage.tsx:39-45,79-85` |

---

### 3.9 Profile — `/profile`

| Sev | Finding | Where |
|---|---|---|
| **P2** | ✅ **DONE** — The weekday streak markers were literal **⬜ emoji** (U+2B1C), not styled elements. A hard white square is the highest-contrast thing on the screen, so the eye is drawn to the days you *didn't* train. Emoji also ignore the theme and render differently per platform. **Wider than reported:** the same 3-state row existed twice with different visual languages — `StreakCard` with emoji, `StreakWidget.tsx:3-7` with dots hard-coded to `bg-orange-400` (outside the token system) — plus a third `🔥` in `StreakBanner.tsx` on raw `orange-*` classes. All three now share one token-driven `StreakDayMarker`. | `StreakCard.tsx:25-39`, `StreakWidget.tsx`, `StreakBanner.tsx` |
| **P2** | "Excluir conta permanentemente" sits directly below "Encerrar sessão" with no visual separation, though it is confirm-gated. | `GovernanceSettings.tsx` |
| **P2** | "RECORDES (PRS): 12" for 6 exercises — PRs are counted twice (weight + volume), which reads as inflated. | `useUserStats.ts` |

---

### 3.10 Workout Complete — `/workout-complete/:id`

Transient by design: `useWorkoutSession.ts:72` navigates here, then the page auto-advances to the summary once finalisation succeeds. Navigating to it directly with a completed session redirects immediately, so it was only observed in passing during the finish transition — **not audited in depth.**

### 3.11 Unmatched routes

There is **no 404 route**. `<Layout>` sits inside `<Switch>` as a non-`Route` child (`App.tsx:34`), so any unknown URL renders the shell — nav bar and empty content — with no message.

---

## 4. Cross-cutting findings

### 4.1 Accessibility: the automated score is misleading

**Lighthouse reports Accessibility 100/100** on `/workouts` (mobile, snapshot mode; the only failures were `robots-txt` and `llms-txt`). That number should not be trusted here — manual inspection of the accessibility tree found substantial problems automated tooling cannot see:

- **The entire nav bar contains zero focusable elements.** All four slots are `<div tabindex="-1">` with an `onClick`, no `role`, no `aria-label`, and `cursor: auto`. The app's primary navigation is completely unreachable by keyboard and invisible to assistive tech as navigation. — `NavBarSlot.tsx:23-26`
- Muscle filter chips and exercise rows in the picker are non-focusable `<span>`s.
- Unnamed icon buttons: exercise delete (`ExerciseItem.tsx:73`), password toggles (`LoginForm.tsx:44`, `SignupForm.tsx:62`), analytics back button.
- Sets/reps inputs are announced as unnamed `spinbutton "0"` — the *placeholder* is doing the job of a label.
- No error uses `role="alert"` / `aria-live`, so validation failures are silent for screen-reader users.
- ✅ **DONE** — No `prefers-reduced-motion` guard on any Framer Motion animation. Now
  `<MotionConfig reducedMotion="user">` at the root of `main.tsx` covers all 17
  framer-importing files including portalled sheets/dialogs, plus an
  `@media (prefers-reduced-motion: reduce)` block in `index.css` for the CSS-only
  animations it can't reach. `animate-spin` is deliberately left running — a frozen
  spinner reads as a hung app. (`index.css` previously contained **no `@media` query at
  all**.) The OS flag itself could not be toggled in the audit environment, so the rule
  is verified as parsed and correctly scoped, not exercised end to end.

### 4.2 Touch targets

Not one measured interactive element in the editor or list flow reaches the 44 × 44px guideline. Worst offenders: "Ver Arquivados" (18px tall), sheet close (28px), drag handle (~28px), sets/reps inputs (40 × 32px), icon buttons (32–36px).

### 4.3 Contrast

- **Dark theme (default): zero failures** across the screens measured. Genuinely well done.
- **Light theme: 8 WCAG AA failures**, including muscle badges at **3.27:1** (11px) and the active nav label at **3.8:1** (14px), both requiring 4.5:1. Light mode is clearly less exercised than dark. — measured on `/workouts`, `18-workouts-light-390x844.png`

### 4.4 Loading states

There are **no skeletons anywhere** in the app. Every load is a full-screen blocking overlay (`loading-overlay.tsx`) at `z-[100]`, which on the editor covers the screen even while saving. `NewExerciseSheet.tsx:107` mounts its overlay *outside* the sheet portal, so it can render full-screen while the sheet is closed.

### 4.5 Theme wiring bug

`components/ui/sonner.tsx:1,6` reads the theme from **`next-themes`**, but the app uses a hand-rolled `ThemeProvider` (`main.tsx:8`) and never mounts a `next-themes` provider. `useTheme()` therefore always returns the default, so toasts are themed independently of the rest of the app. There is also no blocking inline script setting the theme class, so a light flash before hydration is possible.

### 4.6 Dead code

The grid-based set-input implementation is **unreachable at runtime** — verified in the live DOM (2 `.input-workout` elements rendered, **0** grid rows). The rendered component is `ActiveExerciseCard.tsx`. These files are dead:

`ActiveSetInputRow.tsx` · `components/ActiveExerciseLogList.tsx` · `components/ActiveExerciseGridHeader.tsx` · `components/ActiveExerciseCardHeader.tsx` · `SetRowLayout.ts`

Worth deleting — two competing implementations of the most important screen in the app is a maintenance trap. (`SetRowLayout.ts`'s `COMMON_GRID_CLASSES` export is not imported anywhere even by the dead code.)

### 4.7 Minor

- Console warning on every load: `<meta name="apple-mobile-web-app-capable">` is deprecated; add `<meta name="mobile-web-app-capable" content="yes">`. — `index.html:12`
- The editor draft persists to `localStorage` and is only cleared on successful save, so navigating away mid-edit leaves a stale draft that can flash into a *different* workout's editor. — `workout-editor.store.ts:111-119`
- `.no-scrollbar` is used in four components but **is not defined in any stylesheet** — it is a no-op.
- Editor routes are not wrapped in `<ErrorBoundary>`, unlike list/history/profile.

---

## 5. Prioritized fix backlog

Ordered by impact ÷ effort. The top three are small, surgical changes that remove the worst pain.

| # | Fix | Impact | Effort | Files |
|---|---|---|---|---|
| 1 | ✅ **DONE** — Raise the summary CTA above the nav bar | Unblocks the end of every workout | **XS** | `WorkoutSummaryPage.tsx` |
| 2 | ✅ **DONE** — Hide the nav bar while any text input is focused | Recovers 169px mid-set; fixes logging *and* editor at once | **S** | `useKeyboardOpen.ts`, `NavBar.tsx`, `Layout.tsx`, `ActiveWorkoutActions.tsx` |
| 3 | ✅ **DONE** — Add `autoComplete` + `enterKeyHint` to auth fields (plus `aria-label` on the password toggles, `role="alert"` + `aria-invalid`/`aria-describedby` on every field error, `aria-live` on the strength meter) | Enables password managers / AutoFill | **XS** | `LoginForm.tsx`, `SignupForm.tsx`, `InlineErrorBanner.tsx` |
| 4 | ✅ **DONE** — Intercept Enter in the editor → advance focus instead of submitting | Removes a confusing dead-end | **S** | `focus.ts`, `ExerciseItem.tsx`, `WorkoutInfo.tsx` |
| 5 | ✅ **DONE** — Send validation to the offending field + `role="alert"` | Errors stop being invisible | **S** | `WorkoutEditorPage.tsx`, `useWorkoutEditorLogic.ts` |
| 6 | ✅ **DONE** — `viewport-fit=cover` + `mobile-web-app-capable` added; `--safe-bottom` token drives `.h-navbar`/`.pb-navbar`/`.mb-navbar` so the bar height and the space reserved for it can't drift apart; `100vh` → `dvh` on `App.tsx` and `HistoryPage`; auth pages made scrollable. **Also extended `useKeepFocusedFieldVisible`** — see the note below | Systemic keyboard + notch correctness | **M** | `index.html`, `index.css`, `NavBar.tsx`, `Layout.tsx`, `LoginPage.tsx`, `SignupPage.tsx`, `useKeepFocusedFieldVisible.ts` |
| 7 | ✅ **DONE** — Chain focus weight → reps → (bar) → confirm; refocus the next set's weight after confirming; reset `reps`/`rpe` between sets; RPE chips no longer blur the field; note textarea raised to 16px | Cuts ~7 interactions/set to ~3 | **M** | `ActiveExerciseCard.tsx`, `useActiveSetInput.ts`, `RpeSelector.tsx` |
| 8 | ✅ **DONE** — Normalise `,` → `.` in weight input **and** switch the inputs to `type="text"` — see the note below | Prevents silent data loss for pt-BR users | **XS** | `ActiveExerciseCard.tsx`, `useActiveSetInput.ts` |
| 9 | ✅ **DONE** — Nav slots → `<button>` inside `<nav aria-label>` with `aria-current`; muscle chips and selected chips → `<Badge asChild><button aria-pressed>`; exercise rows → `<button aria-pressed>` in a `<ul>/<li>` under an `<h3>` | Restores keyboard + screen-reader access | **S** | `NavBar.tsx`, `NavBarSlot.tsx`, `MuscleGroupFilter.tsx`, `SelectedExercisesList.tsx`, `SheetExerciseList.tsx` |
| 10 | ✅ **DONE** — `.tap-target` expands the hit area to 44px via `::after` without changing the visual size — see the three gotchas in the note above. `RpeSelector` was already 44px | Fewer mistaps, especially mid-set | **S** | `index.css` + 9 call sites |
| 11 | ✅ **DONE** — Seed new exercises with defaults (3 × 10) instead of 0/0 | Removes 12 manual entries per workout | **XS** | `workout-editor.store.ts` |
| 12 | ✅ **DONE** — Make the editor save bar sticky (fixed above the nav bar, hidden while typing, reusing the `ActiveWorkoutActions` idiom) | Always reachable | **S** | `WorkoutEditorActions.tsx`, `index.css` |
| 13 | ✅ **DONE** — Don't autofocus sheet search; add empty state; reset state on *every* dismissal path; sheet's full-screen overlay replaced by an in-sheet loading state | Keyboard stops hijacking the picker | **S** | `NewExerciseSheet.tsx`, `SheetExerciseList.tsx`, `useNewExerciseSheet.ts` |
| 14 | ✅ **DONE** — Fix light-theme contrast. Every pair now ≥4.5:1 in **both** themes, measured by canvas rasterisation. See the correction note below — the failure set was different from what §4.3 reported | WCAG AA in light mode | **S** | `index.css` |
| 15 | ✅ **DONE** — `useMemo` + `useDeferredValue` + `useCallback` in the hook; memoised grouping, a `Set` for selection and a `memo`'d row in the list. **Not virtualised** — see the note above | Smoother search on mid-range phones | **M** | `SheetExerciseList.tsx`, `useNewExerciseSheet.ts` |
| 16 | ✅ **DONE** — Delete the dead grid set-row implementation | Removes a maintenance trap | **XS** | 5 files, §4.6 |
| 17 | ✅ **DONE** — Dropped `next-themes` entirely; Sonner now reads the app's `ThemeProvider` and resolves `"system"` itself | Correct toast theming | **XS** | `sonner.tsx`, `package.json` |
| 18 | ✅ **DONE** — `ui/skeleton.tsx` + 7 page skeletons behind a `PageSkeleton` (`role="status"`) wrapper for the fetch-gated loads; the four mutation-gated sites (list item, login, signup, editor save) moved to button-local state; `loading-overlay.tsx` deleted, it had no consumers left | Less jarring loads | **M** | `loading-overlay.tsx` + 9 call sites |
| 19 | ✅ **DONE** — Add a 404 route | No more blank shell | **XS** | `App.tsx`, `core/pages/NotFoundPage.tsx` |
| 20 | ✅ **DONE** — Log the user in after signup (chained login; the API returns no token on register) | Removes a pointless retype | **XS** | `useAuth.ts` |

---

## 6. Appendix

### 6.1 Method & environment

- Chrome DevTools MCP driving a real Chromium; viewport emulated at **390 × 844, DPR 3, `mobile` + `touch`**.
- Keyboard behaviour reproduced two ways, because the platforms fail differently:
  - **Android/Chrome** — `interactive-widget=resizes-content` shrinks the layout viewport; reproduced by emulating **390 × 508** (844 − 336px keyboard). This is a faithful reproduction, not an approximation.
  - **iOS Safari** — ignores `interactive-widget` and does not shrink the layout viewport; reproduced by measuring element geometry against the bottom 336px occlusion band at full height.
- Contrast computed by rasterising `oklch()` colours through a canvas to sRGB, then applying the WCAG 2.1 relative-luminance formula. Sanity-checked (white-on-black = 21:1) before any result was recorded.
- Test data created through the real UI: user `auditor.uiux@plato.test`, one 6-exercise workout, one completed 20-set session. Database already contained 88 seeded exercises; **no re-seed was performed**.
- Stack: API `:8080`, Vite `:5173`, `npm run dev`.

### 6.2 Verification status

Every finding above was either **measured in the live browser** or cites a `file:line` that was read directly. Two items are explicitly scoped:

- **`/workout-complete/:id`** — transient screen, observed only in passing (§3.10). Not audited in depth.
- **iOS-specific behaviour** — inferred from documented iOS Safari viewport semantics plus measured geometry, not from a physical iOS device.

One earlier contrast pass produced invalid results (the script could not parse `oklch()` and returned 1.0 for everything); it was discarded and rerun with canvas-based conversion. Only the corrected numbers appear in this report.

### 6.3 Screenshot index — `docs/uiux-audit/`

| File | Shows |
|---|---|
| `01-signup-390x844.png` | Signup, `w-[75%]` card |
| `02-workouts-empty-390x844.png` | Empty workout list |
| `04-editor-empty-deadspace-390x844.png` | **164px dead space** below Save |
| `05-exercise-sheet-selected-390x844.png` | Picker with 6 selected |
| `06-editor-filled-390x844.png` | 6 exercises, all `0/0` |
| `07-editor-keyboard-open-390x508.png` | **Keyboard open — 1 of 6 rows visible** |
| `08-editor-focused-field-hidden-390x508.png` | Focused field under the keyboard |
| `09-workouts-list-390x844.png` | Populated list (dark) |
| `10-active-workout-390x844.png` | Logging screen, full height |
| `11-active-workout-keyboard-390x508.png` | **RPE + Confirmar unreachable** |
| `12-active-workout-all-complete-390x844.png` | All sets complete |
| `13-workout-summary-390x844.png` | Summary, full page |
| `14-summary-cta-covered-by-navbar-390x844.png` | **CTA invisible behind nav bar** |
| `15-history-390x844.png` | History |
| `16-exercise-analytics-390x844.png` | Analytics empty charts |
| `17-profile-390x844.png` | Profile, full page |
| `18-workouts-light-390x844.png` | Light theme |
| `19-login-keyboard-390x508.png` | Login with keyboard (fits) |
| `20-signup-clipped-keyboard-390x508.png` | **Signup clipped at both ends** |
