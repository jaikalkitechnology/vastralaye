import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Megaphone, RefreshCw } from 'lucide-react';
import { DEFAULT_TOP_BAR_TEXT, renderTopBar } from '@/components/NavBar';

/**
 * Admin control for the announcement strip above the storefront header —
 * the maroon line that used to be hard-coded in NavBar.
 *
 * Stored in the existing `site_settings` key/value table (`topbar_enabled`,
 * `topbar_text`) and read by `useSiteSettings`, so no schema change and every
 * page picks it up from the one request the storefront already makes.
 */

/** Matches site_settings.value (VARCHAR 500) — the API refuses more. */
const MAX_LEN = 500;

const AdminTopBarControl = () => {
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Record<string, string>>('/fronted/settings');
      const data = res.data || {};
      // Unset means on, so a store that has never touched this keeps its strip.
      setEnabled(data.topbar_enabled !== 'false');
      setText(data.topbar_text || '');
    } catch {
      toast.error('Could not load the top bar settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (text.length > MAX_LEN) {
      toast.error(`Too long — ${MAX_LEN} characters maximum.`);
      return;
    }
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        topbar_enabled: enabled ? 'true' : 'false',
        topbar_text: text.trim(),
      });
      toast.success('Top bar updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not save the top bar');
    } finally {
      setSaving(false);
    }
  };

  /* Blank means "use the line the site ships with" — show them that, so the
     preview never disagrees with what the storefront will actually render. */
  const shown = text.trim() || DEFAULT_TOP_BAR_TEXT;

  return (
    <section className="rounded-md border border-border bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg font-medium text-espresso">
            <Megaphone className="h-4 w-4 text-maroon" />
            Storefront top bar
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            The strip above the header, on every page of the shop.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading || saving}
          className="gap-2 text-[12px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      <div className="space-y-5 px-5 py-5">
        {/* On / off */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={enabled}
            disabled={loading}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#7A1F2B]"
          />
          <span>
            <span className="block text-[13px] font-medium text-espresso">Show the top bar</span>
            <span className="block text-[12.5px] text-muted-foreground">
              Turn this off and the strip disappears from the shop entirely.
            </span>
          </span>
        </label>

        {/* Text */}
        <div>
          <label
            htmlFor="topbar-text"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso"
          >
            Message
          </label>
          <Input
            id="topbar-text"
            value={text}
            disabled={loading}
            maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value)}
            placeholder={DEFAULT_TOP_BAR_TEXT}
            className="text-[13px]"
          />
          <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[12.5px] text-muted-foreground">
              Wrap a phrase in <code className="text-espresso">*stars*</code> to pick it out in
              gold. Leave the box empty to use the built-in line.
            </p>
            <span
              className={`text-[12px] tabular-nums ${
                text.length > MAX_LEN - 40 ? 'text-sale' : 'text-muted-foreground'
              }`}
            >
              {text.length}/{MAX_LEN}
            </span>
          </div>
        </div>

        {/* Preview — the real component's own markup, at the real colours */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
            Preview
          </p>
          {enabled ? (
            <div className="overflow-hidden rounded-sm border border-border">
              <div className="bg-maroon px-4 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-ivory md:text-xs">
                {renderTopBar(shown)}
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-3">
                <span className="font-serif text-[15px] font-semibold text-espresso">
                  Vastra<span className="text-maroon">laye</span>
                </span>
                <span className="text-[11px] text-muted-foreground">— the header sits here</span>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-ivory px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              Hidden — the shop's header starts straight away.
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <Button
            onClick={save}
            disabled={loading || saving}
            className="bg-maroon text-ivory hover:bg-terracotta"
          >
            {saving ? 'Saving…' : 'Save top bar'}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AdminTopBarControl;
