import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { GalleryHorizontal, UploadCloud, Trash2, Pencil, RefreshCw, X } from 'lucide-react';
import AdminPageBanners from './AdminPageBanners';
import AdminHomeSections from './AdminHomeSections';
import AdminLoading from '@/components/admin/AdminLoading';

interface Banner {
  id: number;
  image_url: string;
  overline?: string | null;
  title_line_1: string;
  title_line_2?: string | null;
  description?: string | null;
  cta_primary_label?: string | null;
  cta_primary_link?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_link?: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = {
  overline: '',
  title_line_1: '',
  title_line_2: '',
  description: '',
  cta_primary_label: 'Shop Now',
  cta_primary_link: '/products',
  cta_secondary_label: '',
  cta_secondary_link: '',
  sort_order: 0,
  is_active: true,
};

/**
 * Admin › Banners — manage the homepage hero slides (image + text + CTAs).
 * Storefront reads them via GET /fronted/banners with static fallback.
 */
const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast({ title: 'Failed to load banners' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const set = (key: keyof typeof emptyForm, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      overline: b.overline || '',
      title_line_1: b.title_line_1 || '',
      title_line_2: b.title_line_2 || '',
      description: b.description || '',
      cta_primary_label: b.cta_primary_label || '',
      cta_primary_link: b.cta_primary_link || '',
      cta_secondary_label: b.cta_secondary_label || '',
      cta_secondary_link: b.cta_secondary_link || '',
      sort_order: b.sort_order || 0,
      is_active: b.is_active,
    });
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    /* Every field is optional — only block a slide with nothing to show at all.
       The CTA fields don't count: they're pre-filled, and a hero of nothing but
       a button isn't a slide. */
    const editing = editingId ? banners.find((b) => b.id === editingId) : null;
    const hasImage = Boolean(imageFile) || Boolean(editing?.image_url);
    const hasText = [
      form.overline,
      form.title_line_1,
      form.title_line_2,
      form.description,
    ].some((v) => v.trim());
    if (!hasImage && !hasText) {
      return toast({
        title: 'Nothing to show yet',
        description: 'Every field is optional, but a slide needs an image or some text.',
      });
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (imageFile) fd.append('image_file', imageFile);

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/banners/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Banner updated' });
      } else {
        await api.post('/admin/banners', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Banner created' });
      }
      resetForm();
      fetchBanners();
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: Banner) => {
    try {
      await api.patch(`/admin/banners/${b.id}/toggle`);
      setBanners((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x))
      );
    } catch {
      toast({ title: 'Failed to update banner' });
    }
  };

  const deleteBanner = async (b: Banner) => {
    if (!window.confirm(`Delete banner "${b.title_line_1 || `#${b.id}`}"?`)) return;
    try {
      await api.delete(`/admin/banners/${b.id}`);
      setBanners((prev) => prev.filter((x) => x.id !== b.id));
      if (editingId === b.id) resetForm();
      toast({ title: 'Banner deleted' });
    } catch {
      toast({ title: 'Failed to delete banner' });
    }
  };

  const inputCls =
    'w-full border border-input rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-maroon';
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <GalleryHorizontal className="h-6 w-6 text-maroon" /> Banners
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Homepage hero slides — image, text and buttons.
          </p>
        </div>
        <Button variant="outline" onClick={fetchBanners} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">
              {editingId ? `Edit Banner #${editingId}` : 'Add New Banner'}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs text-muted-foreground hover:text-espresso inline-flex items-center gap-1">
                <X className="h-3.5 w-3.5" /> Cancel edit
              </button>
            )}
          </div>

          <label
            htmlFor="banner-image"
            className="block border-2 border-dashed border-sand rounded-md bg-ivory text-center px-4 py-7 cursor-pointer hover:border-gold transition-colors"
          >
            <UploadCloud className="h-7 w-7 mx-auto text-maroon mb-2" strokeWidth={1.5} />
            <span className="block text-sm font-medium text-espresso">
              {imageFile
                ? imageFile.name
                : editingId
                ? 'Choose a new image (optional)'
                : 'Click to choose banner image (optional)'}
            </span>
            <span className="block text-xs text-muted-foreground mt-1">JPG/PNG/WebP · max 8 MB · portrait 3:4 works best</span>
          </label>
          <input
            id="banner-image"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <div className="mt-4">
            <label className={labelCls}>Overline (small gold text)</label>
            <input className={inputCls} value={form.overline} onChange={(e) => set('overline', e.target.value)} placeholder="The Festive Edit '26" />
          </div>
          <div className="mt-4">
            <label className={labelCls}>Title line 1</label>
            <input className={inputCls} value={form.title_line_1} onChange={(e) => set('title_line_1', e.target.value)} placeholder="Woven for the" />
          </div>
          <div className="mt-4">
            <label className={labelCls}>Title line 2 (italic maroon)</label>
            <input className={inputCls} value={form.title_line_2} onChange={(e) => set('title_line_2', e.target.value)} placeholder="Festive Season" />
          </div>
          <div className="mt-4">
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} min-h-[70px]`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Premium sarees, suit sets and more…" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className={labelCls}>Button 1 label</label>
              <input className={inputCls} value={form.cta_primary_label} onChange={(e) => set('cta_primary_label', e.target.value)} placeholder="Shop Now" />
            </div>
            <div>
              <label className={labelCls}>Button 1 link</label>
              <input className={inputCls} value={form.cta_primary_link} onChange={(e) => set('cta_primary_link', e.target.value)} placeholder="/products" />
            </div>
            <div>
              <label className={labelCls}>Button 2 label</label>
              <input className={inputCls} value={form.cta_secondary_label} onChange={(e) => set('cta_secondary_label', e.target.value)} placeholder="New Arrivals" />
            </div>
            <div>
              <label className={labelCls}>Button 2 link</label>
              <input className={inputCls} value={form.cta_secondary_link} onChange={(e) => set('cta_secondary_link', e.target.value)} placeholder="/new-arrivals" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 items-end">
            <div>
              <label className={labelCls}>Sort order</label>
              <input type="number" className={inputCls} value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </div>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer pb-2.5">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-[#992534]" />
              Active on storefront
            </label>
          </div>

          <Button type="submit" disabled={saving} className="w-full mt-5">
            {saving ? 'Saving…' : editingId ? 'Update Banner' : 'Add Banner'}
          </Button>
        </form>

        {/* List */}
        <div>
          {loading ? (
            <AdminLoading label="banners" compact />
          ) : banners.length === 0 ? (
            <div className="border border-dashed border-border rounded-md bg-white text-center py-16 px-6">
              <GalleryHorizontal className="h-10 w-10 mx-auto text-muted-foreground mb-3" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground">
                No banners yet — the homepage shows the built-in slides until you add one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div key={b.id} className="bg-white border border-border rounded-md overflow-hidden">
                  <div className="relative h-40 bg-sand">
                    {b.image_url ? (
                      <img src={mediaUrl(b.image_url)} alt={b.title_line_1 || ''} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                        <GalleryHorizontal className="h-6 w-6" strokeWidth={1.2} />
                        <span className="text-[10px] uppercase tracking-[0.12em]">No image</span>
                      </span>
                    )}
                    <span className={`absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-white/95 ${b.is_active ? 'text-green-700' : 'text-muted-foreground'}`}>
                      {b.is_active ? 'Active' : 'Hidden'}
                    </span>
                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/95 text-muted-foreground">
                      #{b.sort_order}
                    </span>
                  </div>
                  <div className="p-3.5">
                    {b.overline && (
                      <div className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">{b.overline}</div>
                    )}
                    <div className="font-serif text-[15px] text-espresso leading-snug">
                      {b.title_line_1 || b.title_line_2 ? (
                        <>
                          {b.title_line_1}{' '}
                          {b.title_line_2 && <em className="text-maroon">{b.title_line_2}</em>}
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Untitled slide</span>
                      )}
                    </div>
                    {b.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {b.cta_primary_label && (
                        <span className="text-[10px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                          {b.cta_primary_label} → {b.cta_primary_link}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1.5">
                        <button type="button" onClick={() => toggleActive(b)} className="text-[10px] font-semibold uppercase tracking-[0.08em] text-maroon hover:underline">
                          {b.is_active ? 'Hide' : 'Show'}
                        </button>
                        <button type="button" aria-label="Edit banner" onClick={() => startEdit(b)} className="w-7 h-7 border border-border rounded-sm inline-flex items-center justify-center text-muted-foreground hover:text-espresso">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" aria-label="Delete banner" onClick={() => deleteBanner(b)} className="w-7 h-7 border border-sale/40 rounded-sm inline-flex items-center justify-center text-sale">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* The two collection cards + the home story band */}
      <AdminHomeSections />

      {/* Per-page catalogue banners (4 pages: image + text each) */}
      <AdminPageBanners />
    </div>
  );
};

export default AdminBanners;
