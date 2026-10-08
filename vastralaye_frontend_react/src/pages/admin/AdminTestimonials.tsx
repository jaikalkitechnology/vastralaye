import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Quote, Star, Trash2, Pencil, RefreshCw, X, ImagePlus } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';

interface TestimonialRow {
  id: number;
  quote: string;
  customer_name: string;
  city?: string | null;
  rating: number;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = { quote: '', customer_name: '', city: '', rating: 5, sort_order: 0, is_active: true };

/**
 * Admin › Testimonials — manage the homepage customer quotes, with an
 * optional customer photo. Storefront reads GET /fronted/testimonials.
 */
const AdminTestimonials = () => {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/testimonials');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast({ title: 'Failed to load testimonials' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const set = (key: keyof typeof emptyForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (t: TestimonialRow) => {
    setEditingId(t.id);
    setForm({
      quote: t.quote,
      customer_name: t.customer_name,
      city: t.city || '',
      rating: Math.round(t.rating || 5),
      sort_order: t.sort_order || 0,
      is_active: t.is_active,
    });
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quote.trim()) return toast({ title: 'Quote is required' });
    if (!form.customer_name.trim()) return toast({ title: 'Customer name is required' });

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (imageFile) fd.append('image_file', imageFile);

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/testimonials/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Testimonial updated' });
      } else {
        await api.post('/admin/testimonials', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Testimonial added' });
      }
      resetForm();
      fetchItems();
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: TestimonialRow) => {
    try {
      await api.patch(`/admin/testimonials/${t.id}/toggle`);
      setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_active: !x.is_active } : x)));
    } catch {
      toast({ title: 'Failed to update testimonial' });
    }
  };

  const deleteItem = async (t: TestimonialRow) => {
    if (!window.confirm(`Delete testimonial from "${t.customer_name}"?`)) return;
    try {
      await api.delete(`/admin/testimonials/${t.id}`);
      setItems((prev) => prev.filter((x) => x.id !== t.id));
      if (editingId === t.id) resetForm();
      toast({ title: 'Testimonial deleted' });
    } catch {
      toast({ title: 'Failed to delete testimonial' });
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
            <Quote className="h-6 w-6 text-maroon" /> Testimonials
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer quotes shown on the homepage "Loved by Our Customers" section.
          </p>
        </div>
        <Button variant="outline" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">
              {editingId ? `Edit Testimonial #${editingId}` : 'Add Testimonial'}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs text-muted-foreground hover:text-espresso inline-flex items-center gap-1">
                <X className="h-3.5 w-3.5" /> Cancel edit
              </button>
            )}
          </div>

          <div>
            <label className={labelCls}>Quote *</label>
            <textarea className={`${inputCls} min-h-[90px]`} value={form.quote} onChange={(e) => set('quote', e.target.value)} placeholder="The chanderi suit set is even prettier in person…" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className={labelCls}>Customer name *</label>
              <input className={inputCls} value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="Ananya S." />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Jaipur" />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-label={`${n} stars`} onClick={() => set('rating', n)}>
                  <Star className={`h-6 w-6 ${n <= form.rating ? 'text-gold fill-gold' : 'text-sand fill-sand'}`} />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2">{form.rating} / 5</span>
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Customer photo (optional)</label>
            <label htmlFor="testimonial-image" className="flex items-center gap-3 border border-dashed border-sand rounded-md bg-ivory px-4 py-3 cursor-pointer hover:border-gold transition-colors">
              <ImagePlus className="h-5 w-5 text-maroon" strokeWidth={1.5} />
              <span className="text-sm text-espresso truncate">
                {imageFile ? imageFile.name : editingId ? 'Choose new photo (optional)' : 'Choose photo'}
              </span>
            </label>
            <input
              id="testimonial-image"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 items-end">
            <div>
              <label className={labelCls}>Sort order</label>
              <input type="number" className={inputCls} value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value) || 0)} />
            </div>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer pb-2.5">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="accent-[#992534]" />
              Show on homepage
            </label>
          </div>

          <Button type="submit" disabled={saving} className="w-full mt-5">
            {saving ? 'Saving…' : editingId ? 'Update Testimonial' : 'Add Testimonial'}
          </Button>
        </form>

        {/* List */}
        <div>
          {loading ? (
            <AdminLoading label="testimonials" compact />
          ) : items.length === 0 ? (
            <div className="border border-dashed border-border rounded-md bg-white text-center py-16 px-6">
              <Quote className="h-10 w-10 mx-auto text-muted-foreground mb-3" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground">
                No testimonials yet — the homepage shows the built-in quotes until you add one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((t) => (
                <div key={t.id} className="bg-white border border-border rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(t.rating) ? 'text-gold fill-gold' : 'text-sand fill-sand'}`} />
                      ))}
                    </span>
                    <span className={`ml-auto text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-700/10 text-green-800' : 'bg-espresso/5 text-muted-foreground'}`}>
                      {t.is_active ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <p className="font-serif italic text-sm text-espresso leading-relaxed line-clamp-3">“{t.quote}”</p>
                  <div className="flex items-center gap-2.5 mt-3">
                    {t.image_url ? (
                      <img src={mediaUrl(t.image_url)} alt={t.customer_name} className="w-8 h-8 rounded-full object-cover border border-border" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-blush text-maroon font-serif text-sm flex items-center justify-center border border-border">
                        {t.customer_name.charAt(0)}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                      {[t.customer_name, t.city].filter(Boolean).join(' · ')}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button type="button" onClick={() => toggleActive(t)} className="text-[10px] font-semibold uppercase tracking-[0.08em] text-maroon hover:underline">
                        {t.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" aria-label="Edit testimonial" onClick={() => startEdit(t)} className="w-7 h-7 border border-border rounded-sm inline-flex items-center justify-center text-muted-foreground hover:text-espresso">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label="Delete testimonial" onClick={() => deleteItem(t)} className="w-7 h-7 border border-sale/40 rounded-sm inline-flex items-center justify-center text-sale">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTestimonials;
