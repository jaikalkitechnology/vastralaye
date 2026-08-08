# new_design.md — Reels Experience Enhancements

> **Status: ✅ ALL IMPLEMENTED** — three upgrades to the reels experience:
> **1)** the reels row becomes a slider when more videos exist, **2)** the reel viewer shows
> prev/next video previews with slider navigation, **3)** the product page gets a sticky floating
> reel that follows the shopper on scroll.

---

## 1. Reels row slider (when more videos than fit)

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

---

## 2. Reel viewer — prev/next previews + slider (per marked screenshot)

When a reel is opened, the viewer is now a **carousel**, matching the marked mockup:

- **Side previews (desktop ≥768px):** dimmed 9:16 posters of the **previous and next videos**
  appear on the left/right of the playing reel (40% opacity, brighten on hover, clickable) —
  the Instagram-desktop-style layout from the screenshot.
- **Slider arrows:** round ivory prev/next buttons beside the player on **all** screen sizes;
  each fades out at its end of the list.
- **Position counter** ("2 / 8") on the top-left of the player.
- **Keyboard**: ← / → navigate, Esc closes. Every reel viewed registers a view count.
- Videos re-mount on navigation (keyed by reel id) so uploaded MP4s autoplay and YouTube embeds
  reload correctly; the shoppable product strip updates per reel.

| File | Change |
|---|---|
| `src/components/ReelsSection.tsx` | Viewer refactored from single-reel state to indexed carousel: `activeIndex` + `prevReel`/`nextReel`, side preview buttons, arrow buttons, counter, keyboard handler, keyed player, shared `posterSrc()` (poster → YouTube thumb → video frame) |

## 3. Product page — sticky floating reel (per marked screenshot)

A small floating reel player on the product detail page that **follows the scroll**:

- **Appears** (slides up, bottom-left) once the shopper scrolls down past the gallery (~480px);
  **hides** again when they scroll back up to where the product media is visible.
- Shows the product's **first PDP reel** (poster/autoplaying muted loop for uploads, YouTube
  thumbnail for links); falls back to the product's own `video/video_url` when no reel exists;
  renders nothing when there's no video at all.
- **Tap → expands** to the full-screen player (native video with controls, or embedded YouTube).
- **✕ dismisses** it for that page view. Positioned bottom-left so it never collides with the
  WhatsApp button (bottom-right). Caption shown along the bottom edge.

| File | Change |
|---|---|
| `src/components/StickyReelVideo.tsx` | New component: reel/fallback fetch, scroll-linked visibility, mini player, expanded player, dismiss |
| `src/pages/ProductDetailPage.tsx` | Renders `<StickyReelVideo productId fallbackVideoUrl>` alongside the "Watch It Styled" strip |

---

## Verification

- `tsc --noEmit` — no errors in any changed file.
- `npm run build` — production build passes.
- Zero-regression paths: ≤1 reel → no arrows/previews anywhere; no reels and no product video → no sticky player; small catalogs render exactly as before.
