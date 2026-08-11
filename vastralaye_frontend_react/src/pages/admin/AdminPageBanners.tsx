import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import { toast } from '@/components/ui/use-toast';
import { ImageIcon, Trash2, UploadCloud } from 'lucide-react';

/**
 * Page Banners — one image + title + subtitle per catalogue page
 * (All Products / All Categories / New Arrivals / Bestsellers).
 * Rendered inside Admin → Banner Control below the hero slides.
 * PUT /admin/page-banners/{page} upserts; the storefront `PageBanner`
 * component reads GET /fronted/page-banners.
 */

const PAGES = [
  { key: 'products', label: 'All Products', route: '/products' },
  { key: 'categories', label: 'All Categories', route: '/categories' },
  { key: 'new_arrivals', label: 'New Arrivals', route: '/new-arrivals' },
  { key: 'best_sellers', label: 'Bestsellers', route: '/best-sellers' },
] as const;

interface Draft {
  title: string;
  subtitle: string;
  is_active: boolean;
  full_bleed: boolean;
  image_url: string | null;
  file: File | null;
  preview: string | null;
  saving: boolean;
}

const emptyDraft = (): Draft => ({
  title: '',
  subtitle: '',
  is_active: true,
  full_bleed: false,
  image_url: null,
  file: null,
  preview: null,
  saving: false,
});

const AdminPageBanners = () => {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    Object.fromEntries(PAGES.map((p) => [p.key, emptyDraft()]))
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

  return (
    <div className="mt-10">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-medium text-espresso">Page Banners</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          One banner per catalogue page — image plus optional heading &amp; tagline.
          Pages without a banner fall back to the first hero slide, then the paisley band.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {PAGES.map((p) => {
          const d = drafts[p.key];
          const shown = d.preview || (d.image_url ? mediaUrl(d.image_url) : null);
          return (
            <div key={p.key} className="rounded-sm border border-border bg-white">
              {/* Card head */}
              <div className="flex items-center justify-between border-b border-border bg-ivory px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium text-espresso">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">{p.route}</p>
                </div>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.is_active}
                    onChange={(e) => patchDraft(p.key, { is_active: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[#C99A45]"
                  />
                  Active
                </label>
              </div>

              {/* Image */}
              <div className="relative aspect-[16/5] bg-sand overflow-hidden">
                {shown ? (
                  <img
                    src={shown}
                    alt=""
                    className={`absolute inset-0 h-full w-full ${
                      d.full_bleed ? 'object-contain' : 'object-cover'
                    }`}
                  />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-[11px] uppercase tracking-[0.12em]">No image yet</span>
                  </span>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-3 p-4">
                <label className="flex items-start gap-2.5 rounded-sm border border-border bg-ivory px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.full_bleed}
                    onChange={(e) => patchDraft(p.key, { full_bleed: e.target.checked })}
                    className="mt-[3px] h-3.5 w-3.5 accent-[#C99A45]"
                  />
                  <span>
                    <span className="block text-[12.5px] font-medium text-espresso">
                      Full-width artwork
                    </span>
                    <span className="block text-[11px] text-muted-foreground leading-relaxed">
                      For a ready-made banner that already has its own text and
                      background. Shows the image whole, at its own shape — no dark
                      wash and no heading printed over it.
                    </span>
                  </span>
                </label>

                <input
                  value={d.title}
                  onChange={(e) => patchDraft(p.key, { title: e.target.value })}
                  placeholder={`Heading (default: ${p.label})`}
                  maxLength={160}
                  className="w-full h-10 rounded-sm border border-border bg-white px-3 text-[13.5px] text-espresso placeholder:text-muted-foreground focus:outline-none focus:border-maroon"
                />
                <input
                  value={d.subtitle}
                  onChange={(e) => patchDraft(p.key, { subtitle: e.target.value })}
                  placeholder="Tagline under the heading (optional)"
                  maxLength={255}
                  disabled={d.full_bleed}
                  className="w-full h-10 rounded-sm border border-border bg-white px-3 text-[13.5px] text-espresso placeholder:text-muted-foreground focus:outline-none focus:border-maroon disabled:bg-ivory disabled:text-muted-foreground"
                />
                {d.full_bleed && (
                  <p className="text-[11px] text-muted-foreground -mt-1">
                    With full-width artwork the heading is kept for search engines and
                    screen readers only, and the tagline is not shown.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    ref={(el) => (fileInputs.current[p.key] = el)}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => pickFile(p.key, e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputs.current[p.key]?.click()}
                    className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso hover:border-maroon hover:text-maroon transition-colors"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    {d.image_url || d.preview ? 'Change image' : 'Upload image'}
                  </button>
                  {(d.image_url || d.preview) && (
                    <button
                      type="button"
                      onClick={() =>
                        d.preview
                          ? patchDraft(p.key, { file: null, preview: null })
                          : save(p.key, true)
                      }
                      className="inline-flex items-center gap-1.5 rounded-sm border border-sale/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sale hover:bg-sale/5 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={d.saving}
                    onClick={() => save(p.key)}
                    className="ml-auto rounded-sm bg-maroon px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory hover:bg-terracotta transition-colors disabled:opacity-60"
                  >
                    {d.saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPageBanners;
