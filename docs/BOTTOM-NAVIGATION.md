# Mobile bottom navigation

The primary navigation below `md`: a floating pill with five cells, the gestures it owns, and the search sheet its centre cell opens. The build specification it was written against is [MOBILE-NAV-SPEC.md](./MOBILE-NAV-SPEC.md); this document records what shipped and why the load-bearing parts are the way they are.

## Why it exists

Below `md` every primary destination used to live behind the hamburger sidebar. Nielsen Norman Group measured hidden-only navigation at 57% usage against 86% for visible plus hidden, with content discoverability over 20% worse and mobile task completion 15% slower. The winning condition was visible **and** hidden together, so the bar carries the five destinations that matter most and the sidebar keeps carrying everything else unchanged. There is deliberately no "Više" tab: the sidebar is the overflow.

## The cells

Left to right. **This order must never change once shipped** — a tab set whose shape shifts between sessions cannot build muscle memory.

| #   | Label     | Route             | Notes                                        |
| --- | --------- | ----------------- | -------------------------------------------- |
| 1   | Karta     | `/map`            | coming soon, public                          |
| 2   | Praćenje  | `/watchlist`      | carries the notification badge               |
| 3   | Proizvodi | `/products`       | raised centre cell, toggles the search sheet |
| 4   | Popisi    | `/shopping-lists` | carries the list completion ring             |
| 5   | Kartice   | `/digital-cards`  | coming soon                                  |

The two unshipped teasers sit on the outer edges on purpose: the arrangement stays symmetric with search dead centre, and the least useful cells take the hardest thumb positions. **Standing risk:** two of five cells being teasers means 40% of the bar is inert for most users. If those features stay unshipped for long, the bar starts reading as vaporware.

Items come from `src/constants/navigation.ts`, the same registry the header and sidebar read, so a label, icon, route or coming-soon flag is never defined twice. `src/components/custom/bottom-nav/bottom-nav-cells.ts` adds only what the registry cannot carry: the hold targets, the indicator kind and the raised centre.

## Key files

| Path                                                    | Responsibility                                   |
| ------------------------------------------------------- | ------------------------------------------------ |
| `components/custom/bottom-nav/bottom-nav.tsx`           | The landmark, the pill, activation branching     |
| `components/custom/bottom-nav/bottom-nav-cell.tsx`      | One cell and all five of its states              |
| `components/custom/bottom-nav/bottom-nav-indicator.tsx` | The sliding active disc                          |
| `components/custom/bottom-nav/use-bar-pointer.ts`       | Tap, scrub and hold on one captured pointer      |
| `components/custom/bottom-nav/use-bottom-nav-state.ts`  | Route match, held disc index, lock, live counts  |
| `components/custom/bottom-nav/resolve-hold-target.ts`   | The single answer to what a hold does            |
| `hooks/use-long-press-timer.ts`                         | The shared gate, ring fill and drain             |
| `components/custom/bottom-sheet/bottom-sheet.tsx`       | Every sheet's geometry, layer and modality       |
| `components/custom/search-sheet/`                       | The sheet the centre cell opens, and its filters |
| `constants/gestures.ts`                                 | Every hold timing and threshold, in one place    |

## Geometry and the spacing trap

**This project overrides `--spacing` to `0.2rem` against Tailwind's `0.25rem`, so every spacing utility renders 20% smaller than it reads.** A nominal `p-4` is 12.8px, not 16px.

The bar and the shared sheet therefore express **no** dimension through the spacing scale. All of it is explicit, in `globals.css`:

- `--bottom-nav-h`, `--bottom-nav-gap`, `--bottom-nav-safe` compose `--bottom-nav-total`, the bar's full height.
- `--sheet-bottom-clearance` is where every sheet ends, derived from that total plus a gap. From `md` up it collapses to a plain inset, and **that media query is the only place sheet geometry branches on breakpoint**, which is what lets the shared surface hardcode one padding and be right at both sizes.

The page reserves the bar's space on the **shell wrapper in `app/layout.tsx`, not on `<main>`**: the footer renders after main and is pushed down, so main's bottom padding would sit above it and the bar would cover the footer regardless.

`viewport` in `app/layout.tsx` sets `viewportFit: "cover"` — **without it every `env(safe-area-inset-*)` silently resolves to zero** and the pill sits under the iOS home indicator — and `interactiveWidget: "resizes-content"`, so fixed bottom chrome repositions when the keyboard opens.

## The layer stack

Descending, from `globals.css`. Every value is load-bearing.

| Token                    | Layer | Element                                                                        |
| ------------------------ | ----- | ------------------------------------------------------------------------------ |
| `--z-offline`            | 60    | offline indicator                                                              |
| `--z-overlay`            | 50    | dialogs, popovers, dropdowns, tooltips, selects, and the mobile sidebar drawer |
| `--z-bottom-nav`         | 45    | **the bottom nav**                                                             |
| `--z-bottom-sheet`       | 44    | bottom sheets                                                                  |
| `--z-bottom-sheet-scrim` | 43    | a modal sheet's scrim                                                          |
| `--z-install-banner`     | 41    | the PWA install banner                                                         |
| `--z-scroll-fade`        | 40    | the window scroll fade                                                         |
| `--z-back-to-top`        | 30    | the back-to-top button                                                         |
| `--z-header`             | 20    | the header                                                                     |
| `--z-sidebar`            | 10    | the desktop sidebar                                                            |

A modal sheet's scrim sits **below** the bar by design, so all sheets layer identically and the pill stays visible, dimming through its own translucency. Accepted consequence: the bar is visible but inert under a modal sheet, which was already true under every dialog.

The mobile sidebar drawer stays at 50, deliberately **above** the bar: it is a genuinely modal full-height drawer whose scrim should cover the pill. That is why sheets must not be used for it.

## The interaction model

Tap, horizontal scrub and long press are **one pointer path owned by the bar**, not three handlers per cell. That is what makes them compose: a tap is a zero-distance scrub.

- The cell is resolved from **the cells' own bounding boxes**, never the bar's width over five — the pill has inner padding, so dividing skews every boundary.
- A press starting within 16px of either screen edge is ignored, so the bar never competes with the iOS back-swipe or the home-indicator gesture.
- The capture is released **explicitly** on end, cancel and `lostpointercapture`. Relying on the implicit release left captures outliving their gesture, which showed up as a tap on one tab activating a different one.
- Because the pointer is captured on the pill, the browser's click retargets there, so cells respond only to `event.detail === 0` — the Enter/Space click.
- Every activation branch **except the centre one** dismisses the search sheet first. That covers what a route-change rule cannot: re-tapping the current tab does not change the pathname.

Active state is a pure route-prefix match applied to all five cells, including the centre one. **Whether a cell navigates or opens a sheet is a separate question**; conflating the two once left `/products` with no current-page state and lit the centre cell merely because a sheet had opened.

## Long press

Strictly an accelerator. Every target is also reachable by a visible control, so nothing is gesture-only (WCAG 2.1.1, 2.5.1).

| Timing (`constants/gestures.ts`) | Value | Why                                                         |
| -------------------------------- | ----- | ----------------------------------------------------------- |
| `HOLD_FIRE_MS`                   | 450   | iOS uses 0.5s, Android 400-500ms, react-aria 500ms          |
| `HOLD_GATE_MS`                   | 200   | nothing at all is drawn or scheduled before this            |
| `HOLD_RING_MS`                   | 250   | whatever the gate leaves, so a full ring reads as committed |
| `HOLD_CANCEL_PX`                 | 10    | past this the press is a drag or a scroll                   |

**The gate is a real gate, not a clamp.** This shipped at 120ms first, chosen to sit inside Nielsen's 0.1s "instant" window, and it was wrong: a deliberate tap on a nav cell commonly lasts 150-200ms, so every tap flashed a sliver of ring. The general lesson is that a gesture's feedback threshold has to clear the gesture it distinguishes itself from, not an abstract perception budget.

The ring is the discoverability mechanism and the reason **no coachmark is built**: a press that outlives the gate shows the ring begin to fill, which teaches the gesture while you perform it.

| Hold           | On `/products/<ean>`       | Elsewhere                 |
| -------------- | -------------------------- | ------------------------- |
| Karta          | store preferences          | store preferences         |
| Praćenje       | watch this product         | nothing                   |
| Proizvodi      | the barcode scanner        | the barcode scanner       |
| Popisi         | add this product to a list | create a new list         |
| Kartice        | create a new digital card  | create a new digital card |
| A product card | its quick-actions sheet    | its quick-actions sheet   |

Two cells change meaning on a product's page. Each declares its own product-scoped target and **one resolver** answers both "what does this hold do" and "does this cell have a hold at all", so the two can never disagree. A locked cell answers no hold whatever it declares.

This was a reversal: per-route gestures were first rejected on the grounds that a gesture meaning different things per route cannot be learned. It was overruled because on a product page both targets are also on-screen buttons, so the hold is a thumb shortcut past a journey rather than a hidden feature. **The learnability cost is real and unmeasured, and it is the first thing to check if the holds go unused.**

Progress is written straight to the element as `--long-press-progress`, so filling the ring never re-renders a subtree. Both the fill and the drain run frame by frame rather than through a CSS transition: the `transition` shorthand is unlayered here and would have overridden the product card's own `transition-shadow`.

**Haptics are a dead end.** The vibration API has never shipped in WebKit and the checkbox-switch workaround was patched in iOS 26.5. The feel comes from motion and timing alone.

## Compaction

Once scrolled, the labels fade and collapse and the pill's background alpha tightens from 50% to 90%, over roughly 40px to 180px of scroll. **It compacts, it never hides** — hiding navigation gives back the task-completion penalty this feature exists to remove.

It is driven by `animation-timeline: scroll(root block)` with no scroll listener, so there is no jank and no hydration behaviour. The three animated custom properties are `@property`-registered, **without which they animate discretely and snap at the halfway point** instead of fading.

Browsers without scroll-driven animations (notably iOS Safari 18 and below) hold the full-size bar. That is the correct fallback and the reason this is CSS-only rather than a listener.

The bar's **outer height never changes** during compaction: the pill's height comes from `--bottom-nav-h`, not from its content, so a collapsing label only redistributes space inside its cell.

## Bottom sheets

One shared surface, `components/custom/bottom-sheet/bottom-sheet.tsx`, owns the layer, the surface, the 85dvh cap, the bottom clearance, the handle gap, the pinned footer, focus and modality. **A call site supplies content, a title, a description and a modality, and nothing else** — no layer, no bottom padding, no safe-area value.

Modality is decided by one question: does the page behind change while the sheet is open?

| Sheet                    | Modal | Because                                            |
| ------------------------ | ----- | -------------------------------------------------- |
| Search                   | no    | picking a facet re-filters the list behind it live |
| Product quick actions    | yes   | a launcher; nothing behind it changes              |
| PWA install instructions | yes   | instructions to read and then leave                |

### The non-modal trap

**vaul passes no `modal` prop to Radix's Dialog, so Radix always runs in modal mode**: it puts `aria-hidden` on every sibling and sets `pointer-events: none` on the body. Vaul's compensating `body.style.pointerEvents = "auto"` sits in an effect keyed on `modal`, so it runs at mount and never when the drawer opens.

So "non-modal" buys you no scrim and no scroll lock **and an inert page anyway** — a silent trap, because the page looks live and is not. The fix is in `globals.css`, keyed off a marker the sheet stamps on **itself**:

```css
body:has([data-bottom-sheet="non-modal"][data-state="open"]) {
  pointer-events: auto !important;
}
```

It must be keyed off that marker and not off anything shared with the modal side drawer, which would break the drawer.

Two other traps worth keeping:

- **Never make a sheet's surface pointer-transparent** to protect what is above it. It is unnecessary (the bar sits above and wins hit testing on its own box) and harmful: it leaves every pixel of the sheet's own padding as a hole, exactly where the grab handle is, producing a swipe-to-close that feels unreliable rather than broken.
- **Screen-reader-only styling on a container takes its padding with it**, because it is absolutely positioned. Mark the _text_, never the header row, or the grab handle's clearance vanishes.

## The search sheet

Tapping the centre cell opens a compact sheet directly above the bar: the existing search field with its scan button, a Popusti teaser, a Filteri toggle, and a full-width Pretraži pinned in the footer.

The close rule is one line: **close on any pathname change except an exact match on the products list**. Exact, not a prefix — a product's own page has no result set to filter. There is deliberately no second close-on-submit path, because submitting either lands on the products list, where it must stay open, or on a product page, where the pathname rule already closes it.

The centre cell is a toggle, and **that is the only way to close the sheet from the bar**. That is a consequence of it being non-modal, not a choice: the primitives veto outside-press and focus-outside dismissal when non-modal. Useful side effect — the sheet's open state cannot change mid-gesture, so reading it on pointer-up is race-free.

Submit is disabled whenever submitting would change nothing (`utils/search.ts`), and **an empty field counts as unchanged whatever the URL holds**: comparing it flashes the button on for one render between the clear emptying the field and the navigation landing. Every submit surface in the app shares that rule. The rule can only ever answer for the query, never the filters, since filters apply themselves as you pick them.

The footer button associates back with `form=`, so the HTML spec still picks it as the form's default button: Enter in the field submits, and disabling the button also blocks Enter.

## The filters

The sheet carries the products page's four facet controls on every route, and **it is the only filters surface below `md`**. Two surfaces were built first, both from the same four controls, which put a query and the facets narrowing it on separate layers.

- On `/products` a pick amends the URL and the list behind updates live.
- Off it, the pick and whatever is currently typed travel together in **one** navigation, so a half-typed query survives the trip. The facet query is deliberately empty there, which fires no request and stops another page's `q` (the map's is store names) from facetting products.
- Only the products page seeds the pinned stores. A second reader racing it double-appends every parameter, which is what `useProductFilters({ seedPreferred: false })` prevents.
- The expanded state lives above both entry points, so opening and expanding happen in one batch and the sheet never renders at the wrong size for a frame. **Filters always start collapsed**, or the centre cell sometimes opens a tall sheet nobody asked for.

`components/custom/form/multi-select.tsx` had to be fixed first: it derived its emitted set from internal state while displaying from props, so clearing the filters and picking one option brought every cleared option back.

## Accessibility

- A navigation landmark named "Glavna navigacija", since the page has three navigations.
- A landmark wrapping a **list of buttons**. Not `tablist`/`tab`, which are for in-page tab panels and imply roving-tabindex arrow-key navigation.
- Cells are real `<button>`s, **never anchors**: iOS answers a long-pressed anchor with a link preview, a text callout and a drag affordance, and the property that should suppress the callout is unreliable. Crawlability is unaffected because the prerendered header and sidebar already carry these links and must keep carrying them.
- `aria-current="page"` on the active cell is the only thing that conveys "you are here" to a screen reader.
- Active state is the disc plus the tint plus a bold label — three signals, never colour alone.
- Locked cells are genuinely `disabled`, so they leave the tab order and announce as unavailable. **The lock is enforced on the pointer path as well**, because a disabled button does not stop a bar-level handler from resolving its cell.
- The bar is last in the DOM, so keyboard users reach content first.
- Signed out, the three protected cells **still navigate**: the pages explain the feature and offer sign-in, and explaining beats dead-ending.

## Known gaps and future work

- The Praćenje badge reuses the notification count so the bar and header can never disagree. A real "watched products cheaper since your last visit" count is future work.
- Compaction does not run on iOS Safari 18 and below.
- Stacked backdrop blurs (header, bar, sheet) are the classic mid-range Android jank source, and a sheet's blur repaints on every frame of a drag. Untested on real hardware.
- Deferred: stripping the mobile header to brand plus account, deciding what happens to the window scroll fade behind the pill, and an accessory strip above the bar carrying the active list's name and running total.

## Explicitly out of scope

A "Više" overflow tab; PWA-only visibility; an edge-to-edge bar; hiding on scroll; swipe left/right on content to change tabs; swipe up on the bar; dragging a card onto a tab; double tap; shake to scan; sound; adaptive per-section tabs; a peek menu above a held tab; a coachmark. Reasons for each are in [MOBILE-NAV-SPEC.md](./MOBILE-NAV-SPEC.md).
