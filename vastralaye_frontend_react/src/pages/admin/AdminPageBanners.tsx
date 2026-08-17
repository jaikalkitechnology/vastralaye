import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import { toast } from '@/components/ui/use-toast';
import { ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import { isLightColor, overlayDefaults, overlayGradient } from '@/components/PageBanner';

/**
 * Banner backgrounds — the homepage hero background plus one image +
 * title + subtitle per catalogue page (All Products / All Categories /
 * New Arrivals / Bestsellers). Rendered inside Admin → Banner Control
 * below the hero slides. PUT /admin/page-banners/{page} upserts; the
 * storefront reads GET /fronted/page-banners.
 */

/** The homepage hero background: image + wash only, no heading fields. */
const HOME_HERO = { key: 'home_hero', label: 'Homepage hero background', route: '/' } as const;

const PAGES = [
  { key: 'products', label: 'All Products', route: '/products' },
  { key: 'categories', label: 'All Categories', route: '/categories' },
  { key: 'new_arrivals', label: 'New Arrivals', route: '/new-arrivals' },
  { key: 'best_sellers', label: 'Bestsellers', route: '/best-sellers' },
  { key: 'contact', label: 'Contact Us', route: '/contact-us' },
] as const;

const ALL_SLOTS = [HOME_HERO, ...PAGES];

/** Brand-palette shortcuts for a dark wash under ivory headings. */
const OVERLAY_PRESETS = [
  { hex: '#2B1B12', label: 'Espresso' },
  { hex: '#7A1F2B', label: 'Maroon' },
  { hex: '#B85C38', label: 'Terracotta' },
  { hex: '#8A6414', label: 'Deep gold' },
  { hex: '#000000', label: 'Black' },
] as const;

/** The hero prints espresso copy, so its shortcuts lead with the light tints. */
const HERO_OVERLAY_PRESETS = [
  { hex: '#FAF6F0', label: 'Ivory' },
  { hex: '#F6E8E4', label: 'Blush' },
  { hex: '#EFE7DB', label: 'Sand' },
  { hex: '#2B1B12', label: 'Espresso' },
  { hex: '#7A1F2B', label: 'Maroon' },
] as const;

interface Draft {
  title: string;
  subtitle: string;
  is_active: boolean;
  full_bleed: boolean;
  overlay_color: string;
  overlay_opacity: number;
  image_url: string | null;
  file: File | null;
  preview: string | null;
  saving: boolean;
}

const emptyDraft = (key: string): Draft => {
  const { color, opacity } = overlayDefaults(key);
  return {
    title: '',
    subtitle: '',
    is_active: true,
    full_bleed: false,
    overlay_color: color,
    overlay_opacity: opacity,
    image_url: null,
    file: null,
    preview: null,
    saving: false,
  };
};

const AdminPageBanners = () => {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    Object.fromEntries(ALL_SLOTS.map((p) => [p.key, emptyDraft(p.key)]))
  );
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const patchDraft = (key: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/admin/page-banners');
        if (cancelled || !Array.isArray(res.data)) return;
        setDrafts((prev) => {
          const next = { ...prev };
          for (const b of res.data as any[]) {
            if (b?.page && next[b.page]) {
              next[b.page] = {
                ...next[b.page],
                title: b.title || '',
                subtitle: b.subtitle || '',
                is_active: b.is_active !== false,
                full_bleed: b.full_bleed === true,
                overlay_color: b.overlay_color || overlayDefaults(b.page).color,
                overlay_opacity:
                  typeof b.overlay_opacity === 'number'
                    ? b.overlay_opacity
                    : overlayDefaults(b.page).opacity,
                image_url: b.image_url || null,
              };
            }
          }
          return next;
        });
      } catch {
        /* table may be empty on first run — fine */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickFile = (key: string, file: File | null) => {
    if (!file) return;
    patchDraft(key, { file, preview: URL.createObjectURL(file) });
  };

  const save = async (key: string, removeImage = false) => {
    const d = drafts[key];
    patchDraft(key, { saving: true });
    try {
      const fd = new FormData();
      fd.append('title', d.title);
      fd.append('subtitle', d.subtitle);
      fd.append('is_active', String(d.is_active));
      fd.append('full_bleed', String(d.full_bleed));
      fd.append('overlay_color', d.overlay_color);
      fd.append('overlay_opacity', String(d.overlay_opacity));
      if (removeImage) fd.append('remove_image', 'true');
      if (!removeImage && d.file) fd.append('image_file', d.file);

      const res = await api.put(`/admin/page-banners/${key}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const saved: any = res.data || {};
      patchDraft(key, {
        saving: false,
        file: null,
        preview: null,
        image_url: saved.image_url || null,
        title: saved.title || '',
        subtitle: saved.subtitle || '',
        is_active: saved.is_active !== false,
        full_bleed: saved.full_bleed === true,
        overlay_color: saved.overlay_color || overlayDefaults(key).color,
        overlay_opacity:
          typeof saved.overlay_opacity === 'number'
            ? saved.overlay_opacity
            : overlayDefaults(key).opacity,
      });
      toast({ title: 'Page banner saved' });
    } catch (err: any) {
      patchDraft(key, { saving: false });
      toast({
        title: 'Could not save banner',
        description: err?.response?.data?.detail || 'Please try again.',
      });
    }
  };

  /** One slot card. `isHero` drops the heading fields and previews the hero. */
  const renderCard = (
    slot: { key: string; label: string; route: string },
    isHero: boolean
  ) => {
    const d = drafts[slot.key];
    const shown = d.preview || (d.image_url ? mediaUrl(d.image_url) : null);
    /* The hex field is free text, so keep swatch/preview on a valid value
       while the admin is still typing. */
    const safeColor = /^#[0-9a-fA-F]{6}$/.test(d.overlay_color)
      ? d.overlay_color
      : overlayDefaults(slot.key).color;
    /* With no hero image the storefront keeps its blush→sand gradient. */
    const heroUnstyled = isHero && !shown;
    const light = heroUnstyled || isLightColor(safeColor);
    const previewText = light ? 'text-espresso' : 'text-ivory';
    const previewAccent = light ? 'text-maroon' : 'text-gold';

    return (
      <div key={slot.key} className="rounded-sm border border-border bg-white">
        {/* Card head */}
        <div className="flex items-center justify-between border-b border-border bg-ivory px-4 py-3">
          <div>
            <p className="text-[14px] font-medium text-espresso">{slot.label}</p>
            <p className="text-[11px] text-muted-foreground">{slot.route}</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => patchDraft(slot.key, { is_active: e.target.checked })}
              className="h-3.5 w-3.5 accent-[#C99A45]"
            />
            Active
          </label>
        </div>

        {/* Live preview of the storefront */}
        <div
          className={`relative overflow-hidden ${isHero ? 'aspect-[16/7]' : 'aspect-[16/5]'} ${
            heroUnstyled ? 'bg-gradient-to-r from-blush via-ivory to-sand' : ''
          }`}
          style={
            heroUnstyled
              ? undefined
              : { backgroundColor: d.full_bleed ? '#EFE7DB' : safeColor }
          }
        >
          {shown && (
            <img
              src={shown}
              alt=""
              className={`absolute inset-0 h-full w-full ${
                d.full_bleed ? 'object-contain' : 'object-cover'
              }`}
            />
          )}
          {!d.full_bleed && shown && (
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundImage: overlayGradient(safeColor, d.overlay_opacity) }}
            />
          )}

          {isHero ? (
            <div className="absolute inset-0 flex items-center gap-4 px-5">
              <div className="flex-1">
                <span className="block text-[7px] font-semibold uppercase tracking-[0.3em] text-gold">
                  The Festive Edit
                </span>
                <span className={`mt-1 block font-serif text-[17px] leading-tight ${previewText}`}>
                  Woven for the
                </span>
                <span
                  className={`block font-serif text-[17px] italic leading-tight ${previewAccent}`}
                >
                  Festive Season
                </span>
                <span className="mt-2 inline-block rounded-sm bg-maroon px-3 py-1 text-[7px] font-semibold uppercase tracking-[0.16em] text-ivory">
                  Shop now
                </span>
              </div>
              <div
                aria-hidden
                className="h-[74%] w-[62px] rounded-t-full border border-gold bg-ivory/25"
              />
            </div>
          ) : (
            !d.full_bleed && (
              <div className="absolute inset-0 flex flex-col justify-center px-4">
                <span className="text-[8px] uppercase tracking-[0.16em] text-ivory/55">
                  Home · {slot.label}
                </span>
                <span className="mt-0.5 font-serif text-[16px] leading-tight text-ivory">
                  {d.title || slot.label}
                </span>
                <span aria-hidden className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-px w-6 bg-gold/60" />
                  <span className="h-[5px] w-[5px] rotate-45 border border-gold" />
                  <span className="h-px w-6 bg-gold/60" />
                </span>
              </div>
            )
          )}

          {!shown && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-sm bg-black/35 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-ivory/80">
              <ImageIcon className="h-3 w-3" /> No image
            </span>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-3 p-4">
          {!isHero && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-sm border border-border bg-ivory px-3 py-2.5">
              <input
                type="checkbox"
                checked={d.full_bleed}
                onChange={(e) => patchDraft(slot.key, { full_bleed: e.target.checked })}
                className="mt-[3px] h-3.5 w-3.5 accent-[#C99A45]"
              />
              <span>
                <span className="block text-[12.5px] font-medium text-espresso">
                  Full-width artwork
                </span>
                <span className="block text-[11px] leading-relaxed text-muted-foreground">
                  For a ready-made banner that already has its own text and background.
                  Shows the image whole, at its own shape — no dark wash and no heading
                  printed over it.
                </span>
              </span>
            </label>
          )}

          {!d.full_bleed && (
            <div className="space-y-2.5 rounded-sm border border-border p-3">
              <p className="text-[12.5px] font-medium text-espresso">Overlay colour</p>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={safeColor}
                  onChange={(e) =>
                    patchDraft(slot.key, { overlay_color: e.target.value.toUpperCase() })
                  }
                  aria-label="Overlay colour"
                  className="h-9 w-12 cursor-pointer rounded-sm border border-border bg-white p-1"
                />
                <input
                  type="text"
                  value={d.overlay_color}
                  onChange={(e) =>
                    patchDraft(slot.key, { overlay_color: e.target.value.toUpperCase() })
                  }
                  maxLength={7}
                  spellCheck={false}
                  aria-label="Overlay colour hex"
                  className="h-9 w-[104px] rounded-sm border border-border bg-white px-2.5 font-mono text-[12.5px] uppercase text-espresso focus:border-maroon focus:outline-none"
                />
                <div className="ml-auto flex items-center gap-1.5">
                  {(isHero ? HERO_OVERLAY_PRESETS : OVERLAY_PRESETS).map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => patchDraft(slot.key, { overlay_color: c.hex })}
                      style={{ backgroundColor: c.hex }}
                      className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
                        safeColor === c.hex
                          ? 'border-espresso ring-1 ring-espresso ring-offset-1'
                          : 'border-border'
                      }`}
                    >
                      <span className="sr-only">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Strength</span>
                  <span className="font-medium text-espresso">{d.overlay_opacity}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={d.overlay_opacity}
                  onChange={(e) =>
                    patchDraft(slot.key, { overlay_opacity: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-[#C99A45]"
                />
              </label>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {isHero
                  ? 'Tints the photo so the hero copy stays readable — drop the strength to let more of the image through. Pick a dark colour and the copy flips to ivory automatically.'
                  : 'Tints the photo so the heading stays readable — drop the strength to let more of the image through. With no image uploaded, this is the band colour.'}
              </p>
            </div>
          )}

          {!isHero && (
            <>
              <input
                value={d.title}
                onChange={(e) => patchDraft(slot.key, { title: e.target.value })}
                placeholder={`Heading (default: ${slot.label})`}
                maxLength={160}
                className="h-10 w-full rounded-sm border border-border bg-white px-3 text-[13.5px] text-espresso placeholder:text-muted-foreground focus:border-maroon focus:outline-none"
              />
              <input
                value={d.subtitle}
                onChange={(e) => patchDraft(slot.key, { subtitle: e.target.value })}
                placeholder="Tagline under the heading (optional)"
                maxLength={255}
                disabled={d.full_bleed}
                className="h-10 w-full rounded-sm border border-border bg-white px-3 text-[13.5px] text-espresso placeholder:text-muted-foreground focus:border-maroon focus:outline-none disabled:bg-ivory disabled:text-muted-foreground"
              />
              {d.full_bleed && (
                <p className="-mt-1 text-[11px] text-muted-foreground">
                  With full-width artwork the heading is kept for search engines and screen
                  readers only, and the tagline is not shown.
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              ref={(el) => (fileInputs.current[slot.key] = el)}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickFile(slot.key, e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputs.current[slot.key]?.click()}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso transition-colors hover:border-maroon hover:text-maroon"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {d.image_url || d.preview ? 'Change image' : 'Upload image'}
            </button>
            {(d.image_url || d.preview) && (
              <button
                type="button"
                onClick={() =>
                  d.preview
                    ? patchDraft(slot.key, { file: null, preview: null })
                    : save(slot.key, true)
                }
                className="inline-flex items-center gap-1.5 rounded-sm border border-sale/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sale transition-colors hover:bg-sale/5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
            <button
              type="button"
              disabled={d.saving}
              onClick={() => save(slot.key)}
              className="ml-auto rounded-sm bg-maroon px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-terracotta disabled:opacity-60"
            >
              {d.saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-10">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-medium text-espresso">
          Homepage hero background
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          The photo behind the hero slides above, with the wash laid over it. Leave the
          image empty to keep the plain blush → sand gradient.
        </p>
      </div>

      <div className="max-w-2xl">{renderCard(HOME_HERO, true)}</div>

      <div className="mb-4 mt-10">
        <h2 className="font-serif text-xl font-medium text-espresso">Page Banners</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          One banner per catalogue page — image plus optional heading &amp; tagline. Pages
          without a banner fall back to the first hero slide, then the paisley band.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {PAGES.map((p) => renderCard(p, false))}
      </div>
    </div>
  );
};

export default AdminPageBanners;
