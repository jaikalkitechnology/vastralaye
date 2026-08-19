import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { mediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { LayoutGrid, UploadCloud, X } from 'lucide-react';

/**
 * Admin › Banners — "Home sections": the two collection cards under the
 * hero and the craft-story band. One editor per slot, saved with
 * PUT /admin/home-sections/{slot}. Blank fields fall back to the
 * storefront's built-in text and artwork; Visible off hides the section.
 */

interface SectionRow {
  slot: string;
  overline?: string | null;
  title_line_1?: string | null;
  title_line_2?: string | null;
  description?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  stat1_value?: string | null;
  stat1_label?: string | null;
  stat2_value?: string | null;
  stat2_label?: string | null;
  stat3_value?: string | null;
  stat3_label?: string | null;
  image_url?: string | null;
  is_active: boolean;
}

const CARD_TEXT_FIELDS = ['overline', 'title_line_1', 'cta_label', 'cta_link'] as const;
const STORY_TEXT_FIELDS = [
  'overline', 'title_line_1', 'title_line_2', 'description', 'cta_label', 'cta_link',
  'stat1_value', 'stat1_label', 'stat2_value', 'stat2_label', 'stat3_value', 'stat3_label',
] as const;

type FormState = Record<string, string> & { is_active: string };

const emptyForm = (): FormState => ({ is_active: 'true' } as FormState);

const SLOT_META: Record<string, { name: string; hint: string; imageOnly?: boolean; placeholders: Record<string, string> }> = {
  about_arch: {
    name: 'About page — arch image',
    hint: 'The arch photo in the About page hero. Portrait works best (roughly 4:5); it’s cropped into a rounded arch. Empty = the drawn wardrobe artwork.',
    imageOnly: true,
    placeholders: {},
  },
  card_1: {
    name: 'Collection card — left',
    hint: 'Defaults: "Occasion wear / The Festive Edit" with the maroon paisley artwork.',
    placeholders: {
      overline: 'Occasion wear',
      title_line_1: 'The Festive Edit',
      cta_label: 'Shop the Edit',
      cta_link: '/products',
    },
  },
  card_2: {
    name: 'Collection card — right',
    hint: 'Defaults: "Daily comfort / Everyday Essentials" with the plaid artwork.',
    placeholders: {
      overline: 'Daily comfort',
      title_line_1: 'Everyday Essentials',
      cta_label: 'Shop Essentials',
      cta_link: '/products',
    },
  },
  story: {
    name: 'Home story band',
    hint: 'The story section on the home page — heading, paragraph, three counters, button and arch image.',
    placeholders: {
      overline: 'Our promise',
      title_line_1: 'Made to Be',
      title_line_2: 'Lived In',
      description:
        'Every piece is picked for how it feels on a real day — quality fabrics, honest stitching and cuts that flatter.',
      cta_label: 'Read our story',
      cta_link: '/about',
      stat1_value: '900+', stat1_label: 'Styles',
      stat2_value: '7-Day', stat2_label: 'Easy returns',
      stat3_value: '50k+', stat3_label: 'Happy customers',
    },
  },
};

const inputCls =
  'w-full border border-input rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-maroon';
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5';

const SlotEditor = ({ slot, row, onSaved }: {
  slot: string;
  row: SectionRow | null;
  onSaved: (row: SectionRow) => void;
}) => {
  const meta = SLOT_META[slot];
  const isStory = slot === 'story';
  const imageOnly = Boolean(meta.imageOnly);
  const fields = imageOnly ? ([] as readonly string[]) : isStory ? STORY_TEXT_FIELDS : CARD_TEXT_FIELDS;

  const [form, setForm] = useState<FormState>(emptyForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = emptyForm();
    fields.forEach((f) => { next[f] = (row?.[f] as string) || ''; });
    next.is_active = row ? String(row.is_active) : 'true';
    setForm(next);
    setImageFile(null);
    setRemoveImage(false);
    if (fileRef.current) fileRef.current.value = '';
  }, [row]);  // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    const fd = new FormData();
    fields.forEach((f) => fd.append(f, form[f] ?? ''));
    fd.append('is_active', form.is_active);
    fd.append('remove_image', String(removeImage && !imageFile));
    if (imageFile) fd.append('image_file', imageFile);
    setSaving(true);
    try {
      const res = await api.put(`/admin/home-sections/${slot}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved(res.data as SectionRow);
      setImageFile(null);
      setRemoveImage(false);
      if (fileRef.current) fileRef.current.value = '';
      toast({ title: `${meta.name} saved` });
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const currentImage = imageFile
    ? URL.createObjectURL(imageFile)
    : !removeImage && row?.image_url
    ? mediaUrl(row.image_url)
    : null;

  const visible = form.is_active !== 'false';

  return (
    <div className="bg-white border border-border rounded-md p-5">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">{meta.name}</h3>
        {!imageOnly && (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {visible ? 'Visible' : 'Hidden'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={visible}
            onClick={() => set('is_active', visible ? 'false' : 'true')}
            className={`relative h-5 w-9 rounded-full transition-colors ${visible ? 'bg-maroon' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${visible ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">{meta.hint}</p>

      {/* Image */}
      <label
        htmlFor={`home-section-image-${slot}`}
        className="block border-2 border-dashed border-sand rounded-md bg-ivory text-center px-4 py-5 cursor-pointer hover:border-gold transition-colors"
      >
        {currentImage ? (
          <img src={currentImage} alt="" className="mx-auto max-h-28 rounded-sm object-cover" />
        ) : (
          <UploadCloud className="h-6 w-6 mx-auto text-maroon mb-1.5" strokeWidth={1.5} />
        )}
        <span className="block text-sm font-medium text-espresso mt-2">
          {imageFile ? imageFile.name : currentImage ? 'Choose a different image' : 'Click to choose an image (optional)'}
        </span>
        <span className="block text-xs text-muted-foreground mt-1">
          JPG/PNG/WebP · max 8 MB · empty = the built-in artwork
        </span>
      </label>
      <input
        id={`home-section-image-${slot}`}
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { setImageFile(e.target.files?.[0] || null); setRemoveImage(false); }}
      />
      {(row?.image_url || imageFile) && !removeImage && (
        <button
          type="button"
          onClick={() => { setImageFile(null); setRemoveImage(true); if (fileRef.current) fileRef.current.value = ''; }}
          className="mt-2 text-xs text-muted-foreground hover:text-sale inline-flex items-center gap-1"
        >
          <X className="h-3.5 w-3.5" /> Remove image — use the built-in artwork
        </button>
      )}

      {/* Text fields */}
      {!imageOnly && (
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Overline (small gold text)</label>
          <input className={inputCls} value={form.overline || ''} onChange={(e) => set('overline', e.target.value)} placeholder={meta.placeholders.overline} />
        </div>
        <div>
          <label className={labelCls}>{isStory ? 'Heading line 1' : 'Title'}</label>
          <input className={inputCls} value={form.title_line_1 || ''} onChange={(e) => set('title_line_1', e.target.value)} placeholder={meta.placeholders.title_line_1} />
        </div>
        {isStory && (
          <div>
            <label className={labelCls}>Heading line 2</label>
            <input className={inputCls} value={form.title_line_2 || ''} onChange={(e) => set('title_line_2', e.target.value)} placeholder={meta.placeholders.title_line_2} />
          </div>
        )}
        <div>
          <label className={labelCls}>Button label</label>
          <input className={inputCls} value={form.cta_label || ''} onChange={(e) => set('cta_label', e.target.value)} placeholder={meta.placeholders.cta_label} />
        </div>
        <div>
          <label className={labelCls}>Button link</label>
          <input className={inputCls} value={form.cta_link || ''} onChange={(e) => set('cta_link', e.target.value)} placeholder={meta.placeholders.cta_link} />
        </div>
      </div>
      )}

      {isStory && (
        <>
          <div className="mt-3">
            <label className={labelCls}>Paragraph</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder={meta.placeholders.description} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <label className={labelCls}>Counter {n}</label>
                <input className={`${inputCls} mb-2`} value={form[`stat${n}_value`] || ''} onChange={(e) => set(`stat${n}_value`, e.target.value)} placeholder={meta.placeholders[`stat${n}_value`]} />
                <input className={inputCls} value={form[`stat${n}_label`] || ''} onChange={(e) => set(`stat${n}_label`, e.target.value)} placeholder={meta.placeholders[`stat${n}_label`]} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save section'}
        </Button>
      </div>
    </div>
  );
};

const AdminHomeSections = () => {
  const [rows, setRows] = useState<Record<string, SectionRow>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.resolve(api.get('/admin/home-sections'))
      .then((res) =>
        setRows(
          (res.data && typeof res.data === 'object' ? res.data : {}) as Record<string, SectionRow>,
        ),
      )
      .catch(() => toast({ title: 'Failed to load home sections' }))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mt-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-maroon" /> Home sections
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          The two collection cards under the hero, the home story band,
          and the About page’s arch image. Blank fields keep the built-in text and artwork.
        </p>
      </div>
      {loaded && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <SlotEditor slot="card_1" row={rows.card_1 || null} onSaved={(r) => setRows((p) => ({ ...p, card_1: r }))} />
          <SlotEditor slot="card_2" row={rows.card_2 || null} onSaved={(r) => setRows((p) => ({ ...p, card_2: r }))} />
          <div className="xl:col-span-2">
            <SlotEditor slot="story" row={rows.story || null} onSaved={(r) => setRows((p) => ({ ...p, story: r }))} />
          </div>
          <SlotEditor slot="about_arch" row={rows.about_arch || null} onSaved={(r) => setRows((p) => ({ ...p, about_arch: r }))} />
        </div>
      )}
    </div>
  );
};

export default AdminHomeSections;
