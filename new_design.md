# new_design.md — Reels Slider Enhancement

> **Status: ✅ IMPLEMENTED** — the shoppable reels row is now a slider wherever more videos exist
> than fit on screen. Applies to both placements automatically: the homepage **"Vastralaye in
> Motion"** row and the product-page **"Watch It Styled"** strip (shared `ReelsSection` component).

---

## Behavior spec

| Situation | What the user sees |
|---|---|
| Reels fit in the row | Plain row, no arrows — nothing changes |
| More reels than fit (desktop/tablet ≥768px) | Round white **arrow buttons** appear overlaying the left/right edges; clicking pages the row by ~85% of its width with smooth scrolling |
| At the start / end of the row | The corresponding arrow hides (left arrow hidden at start, right arrow hidden at end) |
| Mobile | Natural swipe with **scroll-snap** (cards snap into place); arrows stay hidden — touch is the slider |
| Any count | **All** published reels render (fetch limit raised 12 → 20) instead of the previous cap of 5 |

## Design details

- Arrows: 40px round white buttons, 1px `border-border`, soft shadow, espresso chevron → **maroon on hover** — the "minimal round-bordered arrow buttons" pattern from `design.md` §5.5.
- Positioned at the vertical center of the video posters (not the product strips), overlapping the row edges by 12px.
- Row: `snap-x snap-mandatory` + `scroll-smooth`, native scrollbar hidden on all engines.
- Card widths per breakpoint: 56% (phone) → 46% → 36% (small tablet) → exactly **3 per view** at `md` → exactly **5 per view** at `lg` (`calc((100% − gaps) / n)` so cards align flush with the section grid).
- Arrow visibility is computed from live scroll position (`scroll` + `resize` listeners), so it stays correct on window resizes and after new reels load.

## Files changed

| File | Change |
|---|---|
| `src/components/ReelsSection.tsx` | Slider wrapper (`relative` + scroll container ref), left/right arrow buttons with edge-aware visibility, `slide()` paging, snap/smooth/hidden-scrollbar row, per-breakpoint exact card widths, removed the 5-card cap, fetch `limit: 20` |

No backend changes required (the public reels endpoint already supported `limit` up to 50).

## Verification

- `tsc --noEmit` — no errors in the changed file.
- `npm run build` — production build passes.
- With ≤3 reels on desktop the section renders exactly as before (no arrows) — zero regression for small catalogs.
