import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Settings, Instagram, Facebook, Twitter, Youtube, MessageCircle, Phone, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface SettingsForm {
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  whatsapp_number: string;
  call_number: string;
  float_enabled: string;
  // "true" hides that link/icon on the storefront (footer + floating hub)
  whatsapp_hidden: string;
  call_hidden: string;
  instagram_hidden: string;
  facebook_hidden: string;
  twitter_hidden: string;
  youtube_hidden: string;
}

const empty: SettingsForm = {
  instagram_url: '',
  facebook_url: '',
  twitter_url: '',
  youtube_url: '',
  whatsapp_number: '',
  call_number: '',
  float_enabled: 'true',
  whatsapp_hidden: 'false',
  call_hidden: 'false',
  instagram_hidden: 'false',
  facebook_hidden: 'false',
  twitter_hidden: 'false',
  youtube_hidden: 'false',
};

const isValidUrl = (v: string) => !v || /^https?:\/\/.+\..+/.test(v);

/**
 * Admin › Store Settings — social media links shown in the footer /
 * Instagram section, and the WhatsApp chat number.
 */
const AdminSettings = () => {
  const [form, setForm] = useState<SettingsForm>({ ...empty });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fronted/settings');
      if (res.data && typeof res.data === 'object') {
        setForm({ ...empty, ...res.data });
      }
    } catch {
      toast({ title: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const set = (key: keyof SettingsForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const key of ['instagram_url', 'facebook_url', 'twitter_url', 'youtube_url'] as const) {
      if (!isValidUrl(form[key])) {
        return toast({ title: `Please enter a valid URL for ${key.replace('_', ' ')}` });
      }
    }
    if (form.whatsapp_number && !/^[\d+\s-]{8,18}$/.test(form.whatsapp_number)) {
      return toast({ title: 'WhatsApp number should be digits with country code, e.g. 917066181207' });
    }
    if (form.call_number && !/^[\d+\s-]{8,18}$/.test(form.call_number)) {
      return toast({ title: 'Call number should be digits with country code, e.g. 917066181207' });
    }
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      toast({ title: 'Settings saved — live on the storefront' });
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof SettingsForm; hideKey: keyof SettingsForm; label: string; placeholder: string; icon: any }[] = [
    { key: 'instagram_url', hideKey: 'instagram_hidden', label: 'Instagram URL', placeholder: 'https://instagram.com/vastralaye', icon: Instagram },
    { key: 'facebook_url', hideKey: 'facebook_hidden', label: 'Facebook URL', placeholder: 'https://facebook.com/vastralaye', icon: Facebook },
    { key: 'twitter_url', hideKey: 'twitter_hidden', label: 'Twitter / X URL', placeholder: 'https://x.com/vastralaye', icon: Twitter },
    { key: 'youtube_url', hideKey: 'youtube_hidden', label: 'YouTube URL (optional)', placeholder: 'https://youtube.com/@vastralaye', icon: Youtube },
    { key: 'whatsapp_number', hideKey: 'whatsapp_hidden', label: 'WhatsApp number (with country code)', placeholder: '917066181207', icon: MessageCircle },
    { key: 'call_number', hideKey: 'call_hidden', label: 'Call number (optional, with country code)', placeholder: '917066181207', icon: Phone },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6 text-maroon" /> Store Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Social media links shown in the footer and the WhatsApp chat button.
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-border rounded-md p-6 max-w-xl">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] mb-5">Social Media & Chat</h2>

        {fields.map(({ key, hideKey, label, placeholder, icon: Icon }) => {
          const hidden = form[hideKey] === 'true';
          return (
            <div key={key} className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <div
                  className={`flex flex-1 items-center gap-2.5 border border-input rounded-sm bg-white px-3 focus-within:border-maroon ${
                    hidden ? 'opacity-50' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <input
                    className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    disabled={loading}
                  />
                </div>
                {/* Show/Hide — hides this link & icon on the storefront */}
                <button
                  type="button"
                  onClick={() => set(hideKey, hidden ? 'false' : 'true')}
                  disabled={loading}
                  aria-pressed={hidden}
                  title={hidden ? 'Hidden on the storefront — click to show' : 'Visible on the storefront — click to hide'}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                    hidden
                      ? 'border-maroon bg-maroon text-ivory hover:bg-terracotta'
                      : 'border-input bg-white text-espresso hover:border-maroon hover:text-maroon'
                  }`}
                >
                  {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {hidden ? 'Hidden' : 'Visible'}
                </button>
              </div>
            </div>
          );
        })}

        <label className="flex items-center gap-2.5 text-sm cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={form.float_enabled !== 'false'}
            onChange={(e) => set('float_enabled', e.target.checked ? 'true' : 'false')}
            className="accent-[#992534]"
            disabled={loading}
          />
          Show the floating contact button on the storefront (middle-right; expands into WhatsApp,
          Call and your social links)
        </label>

        <p className="text-xs text-muted-foreground mb-5">
          The Visible/Hidden button next to each field controls whether that link and its icon
          appear on the storefront — in the footer and in the floating contact hub. Leave a field
          empty to keep the storefront's built-in default for it.
        </p>

        <Button type="submit" disabled={saving || loading} className="w-full">
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
};

export default AdminSettings;
