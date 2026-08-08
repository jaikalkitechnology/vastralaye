# animation.md — Vastralaye Motion System

> **Status: ✅ IMPLEMENTED** — a single, calm motion language across the storefront, per
> `design.md` §7: *"quiet motion — no bouncy springs, no looping decoration, respect reduced motion."*

The goal is that motion **guides the eye and confirms actions** — it never performs. Everything
below runs on Framer Motion (already installed) or plain CSS transitions.

---

## 1. The core primitive — `<Reveal>` (scroll entrance)

`src/components/motion/Reveal.tsx` — one reusable component powers every scroll animation:

- **Effect:** fade in + gentle 18px rise, 0.55s, custom ease-out curve `cubic-bezier(0.22, 0.61, 0.36, 1)` — soft landing, zero bounce.
- **Trigger:** `whileInView`, fired **once** when ~15% of the block enters the viewport (with a -40px bottom margin so it starts just before the block is fully visible).
- **Stagger:** pass `delay={i * 0.05–0.12}` on siblings — used for cards, banners and tiles so groups cascade instead of popping in together.
- **Accessibility:** uses `useReducedMotion()` — visitors with *prefers-reduced-motion* get a plain, instant `<div>` (and the CSS ken-burns is also disabled for them in `index.css`).

```tsx
import Reveal from '@/components/motion/Reveal';

<Reveal>…section header…</Reveal>
<Reveal delay={i * 0.08}>…card…</Reveal>          // staggered sibling
<Reveal y={12} className="grid …">…</Reveal>      // subtler rise, wrapper styling
```

## 2. Where it's applied (homepage, top → bottom)

| Section | Animation |
|---|---|
| Hero (`HeroSection`) | Already animated: slide **crossfade** (0.8s), copy fade+rise per slide, slow **Ken Burns** zoom (7s) on the arch image, line-dot indicators |
| USP strip | Single soft reveal (`y=12`) |
| Shop by Category | Header reveals, then the arch-card row follows (+0.1s) |
| Editorial banners (`PromoSection`) | The two banners cascade (0.12s apart) |
| Product carousels (`FeaturedProducts`) | Card hover states (image swap/scale, quick-add slide) carry the motion; section uses its own transitions |
| Reels row (`ReelsSection`) | Header reveals, slider row follows (+0.1s); row itself scrolls with `scroll-smooth` snap |
| Brand story | Arch image reveals first, copy column follows (+0.12s) |
| Testimonials | Header, then quote cards cascade (0.08s apart, equal-height) |
| Instagram grid | Header, then tiles ripple in (0.05s apart) |
| Newsletter band | Single reveal |

## 3. Micro-interactions already in the system (CSS transitions)

| Element | Motion |
|---|---|
| Product card | Hover: second image **crossfade** + 1.04 scale (500ms); **quick-add bar** slides up (200ms); wishlist heart fills maroon |
| Category / banner / Instagram imagery | Hover scale 1.05 (500–700ms) + gold ring / scrim fades |
| Buttons & links | Color-only transitions (maroon → terracotta, gold underlines) — no movement |
| Reels row | Smooth paged scrolling, snap alignment; arrows fade at row ends |
| Reel viewer | Backdrop blur-in; side previews brighten on hover (40% → 75%) |
| Sticky PDP reel | Slides up/away with scroll direction (300ms), steps aside at the reels section |
| Mega menu / drawers / dialogs | Fade + drop from shadcn/Radix defaults (150–200ms) |
| Global loader | Spinning gold ring + maroon diamond on ivory veil |

## 4. Rules (from design.md §7 — keep it this way)

- **Do:** fade + small rise for entrances; stagger ≤ 0.12s; ease-out only; animate opacity/transform only (GPU-friendly, no layout thrash); fire once per element.
- **Don't:** bouncy springs, parallax, looping/pulsing decoration, hover-translate of whole cards, entrance animations longer than ~0.6s, re-triggering reveals on every scroll.
- **Always:** respect `prefers-reduced-motion` (Reveal handles it; add the same guard to any new CSS animation).

## 5. Extending it

- Any new section: wrap the header in `<Reveal>` and the content in `<Reveal delay={0.1}>` — that's the whole recipe.
- Grids/lists: `delay={i * 0.05}` (tiles) to `i * 0.12` (large cards); cap visible stagger at ~8 items.
- Don't wrap containers that hold `position: fixed` children (viewers/lightboxes) — a mid-animation transform would re-anchor them; keep those outside the Reveal (as done in `ReelsSection`).

## Files

| File | Role |
|---|---|
| `src/components/motion/Reveal.tsx` | New — the scroll-reveal primitive |
| `UspStrip` / `CategorySection` / `PromoSection` / `ReelsSection` / `home/BrandStory` / `home/Testimonials` / `home/InstagramGrid` / `home/NewsletterBand` | Reveal applied (visual wrappers only — zero logic changes) |
| `src/index.css` | Ken-burns keyframes + reduced-motion guard (pre-existing) |

Verified: all touched files type-clean, production build passes.
