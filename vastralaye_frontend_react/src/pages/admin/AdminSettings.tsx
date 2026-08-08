import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Settings, Instagram, Facebook, Twitter, Youtube, MessageCircle, RefreshCw } from 'lucide-react';

interface SettingsForm {
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  whatsapp_number: string;
}

const empty: SettingsForm = {
  instagram_url: '',
  facebook_url: '',
  twitter_url: '',
  youtube_url: '',
  whatsapp_number: '',
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
      return toast({ title: 'WhatsApp number should be digits with country code, e.g. 918527596413' });
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

  const fields: { key: keyof SettingsForm; label: string; placeholder: string; icon: any }[] = [
    { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/vastralaye', icon: Instagram },
    { key: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/vastralaye', icon: Facebook },
    { key: 'twitter_url', label: 'Twitter / X URL', placeholder: 'https://x.com/vastralaye', icon: Twitter },
    { key: 'youtube_url', label: 'YouTube URL (optional)', placeholder: 'https://youtube.com/@vastralaye', icon: Youtube },
    { key: 'whatsapp_number', label: 'WhatsApp number (with country code)', placeholder: '918527596413', icon: MessageCircle },
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

        {fields.map(({ key, label, placeholder, icon: Icon }) => (
          <div key={key} className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5">
              {label}
            </label>
            <div className="flex items-center gap-2.5 border border-input rounded-sm bg-white px-3 focus-within:border-maroon">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <input
                className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                disabled={loading}
              />
            </div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground mb-5">
          Leave a field empty to keep the storefront's built-in default for it.
        </p>

        <Button type="submit" disabled={saving || loading} className="w-full">
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
};

export default AdminSettings;
