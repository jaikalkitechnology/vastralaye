import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { toast } from '@/components/ui/use-toast';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Users,
} from 'lucide-react';

/**
 * Admin › Settings › Login Methods — switch "Continue with Google" on and off
 * for the storefront login page and hold the Google Client ID.
 *
 * Only the client ID is stored: the storefront uses Google's ID-token flow, so
 * there is no client secret involved. Email + password sign-in is always on.
 */

interface Config {
  enabled: boolean;
  switch_on: boolean;
  client_id: string;
  allow_signup: boolean;
  google_users: number;
  /** Callback the API exposes — Google Cloud Console's redirect URI field. */
  redirect_uri: string;
  storefront_origin: string;
  fetch_profile: boolean;
}

const inputCls =
  'w-full h-10 rounded-sm border border-border bg-white px-3 text-[13.5px] text-espresso placeholder:text-muted-foreground focus:outline-none focus:border-maroon';
const labelCls =
  'block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5';

const AdminLoginMethods = () => {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState('');
  const [allowSignup, setAllowSignup] = useState(true);
  const [fetchProfile, setFetchProfile] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  /* The exact string Google wants in "Authorised JavaScript origins" —
     scheme + host + port, no path. Guessing this is the usual reason for
     "Access blocked: Authorization Error". */
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  // Google allows loopback (localhost / 127.0.0.1) over http, but no other bare IP.
  const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const originIsPrivateIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) && !isLoopback;
  const originIsInsecure = origin.startsWith('http://') && !isLoopback && !originIsPrivateIp;

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast({ title: 'Copy failed', description: value });
    }
  };

  /** One labelled, copyable value to paste into Google Cloud Console. */
  const ConsoleValue = ({ id, value }: { id: string; value: string }) => (
    <span className="mt-2 flex items-center gap-2">
      <code className="flex-1 truncate rounded-sm border border-border bg-ivory px-2 py-1.5 font-mono text-[12px] text-espresso">
        {value || '—'}
      </code>
      <button
        type="button"
        onClick={() => copy(value, id)}
        disabled={!value}
        className="inline-flex flex-none items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-espresso transition-colors hover:border-maroon hover:text-maroon disabled:opacity-50"
      >
        {copied === id ? (
          <Check className="h-3 w-3 text-green-700" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        {copied === id ? 'Copied' : 'Copy'}
      </button>
    </span>
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Config>('/admin/auth/google');
      setCfg(res.data);
      setEnabled(Boolean(res.data.switch_on));
      setClientId(res.data.client_id || '');
      setAllowSignup(res.data.allow_signup !== false);
      setFetchProfile(Boolean(res.data.fetch_profile));
    } catch (err: any) {
      toast({
        title: 'Could not load login settings',
        description: err?.response?.data?.detail || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('enabled', String(enabled));
      fd.append('client_id', clientId.trim());
      fd.append('allow_signup', String(allowSignup));
      fd.append('fetch_profile', String(fetchProfile));
      // The callback needs somewhere to send the browser back to; this page
      // is served from the storefront, so its own origin is the answer.
      fd.append('storefront_origin', origin);
      await api.put('/admin/auth/google', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
      toast({ title: 'Login settings saved' });
    } catch (err: any) {
      toast({
        title: 'Could not save',
        description: err?.response?.data?.detail || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const misconfigured = enabled && !clientId.trim();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <KeyRound className="h-6 w-6 text-maroon" /> Login Methods
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How customers sign in to the storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso transition-colors hover:border-maroon hover:text-maroon disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[520px_1fr]">
        <div className="rounded-md border border-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">
              Continue with Google
            </h2>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                cfg?.enabled
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-border bg-ivory text-muted-foreground'
              }`}
            >
              {cfg?.enabled ? 'Live' : 'Off'}
            </span>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-sm border border-border bg-ivory p-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mt-[3px] accent-[#7A1F2B]"
            />
            <span>
              <span className="block text-[12.5px] font-medium text-espresso">
                Show the Google button on the login page
              </span>
              <span className="block text-[11px] leading-relaxed text-muted-foreground">
                Email and password sign-in stays available either way.
              </span>
            </span>
          </label>

          <div className="mt-4">
            <label className={labelCls}>Google Client ID</label>
            <input
              className={inputCls}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="1234567890-abcdef.apps.googleusercontent.com"
              spellCheck={false}
              autoComplete="off"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              From Google Cloud Console → APIs &amp; Services → Credentials → OAuth 2.0
              Client ID (type: Web application). There is no client secret to enter —
              the storefront uses the ID-token flow, which only needs this.
            </p>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-maroon hover:underline"
            >
              Open Google Cloud Console <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-sm border border-border p-3">
            <input
              type="checkbox"
              checked={allowSignup}
              onChange={(e) => setAllowSignup(e.target.checked)}
              className="mt-[3px] accent-[#7A1F2B]"
            />
            <span>
              <span className="block text-[12.5px] font-medium text-espresso">
                Let new customers create an account with Google
              </span>
              <span className="block text-[11px] leading-relaxed text-muted-foreground">
                Turn this off to allow Google only for people who already registered
                with the same email address.
              </span>
            </span>
          </label>

          <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-sm border border-border p-3">
            <input
              type="checkbox"
              checked={fetchProfile}
              onChange={(e) => setFetchProfile(e.target.checked)}
              className="mt-[3px] accent-[#7A1F2B]"
            />
            <span>
              <span className="block text-[12.5px] font-medium text-espresso">
                Also fetch phone &amp; address from Google
              </span>
              <span className="block text-[11px] leading-relaxed text-muted-foreground">
                After signing in, asks for the People API scopes and fills any{' '}
                <em>blank</em> phone or address fields on the account — anything the
                customer already entered is left alone. Adds a second consent prompt,
                and many Google profiles have no address saved, so treat it as a
                shortcut rather than a replacement for the checkout form.
              </span>
            </span>
          </label>

          {fetchProfile && (
            <div className="mt-3 flex items-start gap-2.5 rounded-sm border border-gold/40 bg-gold/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[#8A6414]" />
              <p className="text-[12px] leading-relaxed text-espresso">
                These are <span className="font-medium">sensitive scopes</span>. Until
                Google verifies your app it is capped at 100 users and shows a warning on
                the consent screen — start verification in Cloud Console → OAuth consent
                screen before relying on this in production.
              </p>
            </div>
          )}

          {misconfigured && (
            <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-sale/35 bg-sale/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-sale" />
              <p className="text-[12px] leading-relaxed text-espresso">
                Add the Client ID before saving — the button can't be switched on
                without it.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-5 w-full rounded-sm bg-maroon py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-terracotta disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save login settings'}
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-md border border-border bg-white p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em]">
              Before it will work
            </h2>
            <ol className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-espresso">1.</span> Create an{' '}
                <span className="font-medium text-espresso">OAuth 2.0 Client ID</span> of
                type <em>Web application</em> in Google Cloud Console.
              </li>
              <li>
                <span className="font-medium text-espresso">2.</span> Add{' '}
                <span className="font-medium text-espresso">this exact origin</span> to{' '}
                <span className="font-medium text-espresso">
                  Authorised JavaScript origins
                </span>
                . Google rejects sign-in from any origin not listed, character for
                character — no trailing slash, no path.
                <ConsoleValue id="origin" value={origin} />
                {originIsPrivateIp && (
                  <span className="mt-2 block rounded-sm border border-sale/35 bg-sale/5 p-2.5 text-[11.5px] text-espresso">
                    Google does not accept a LAN IP address as an origin — only{' '}
                    <code className="rounded-sm bg-ivory px-1">localhost</code>,{' '}
                    <code className="rounded-sm bg-ivory px-1">127.0.0.1</code> or a real
                    domain. Sign-in will always be blocked from here.
                  </span>
                )}
                {originIsInsecure && (
                  <span className="mt-2 block rounded-sm border border-sale/35 bg-sale/5 p-2.5 text-[11.5px] text-espresso">
                    Google only allows <code className="rounded-sm bg-ivory px-1">http://</code>{' '}
                    for <code className="rounded-sm bg-ivory px-1">localhost</code>. Any
                    other host has to be HTTPS.
                  </span>
                )}
              </li>
              <li>
                <span className="font-medium text-espresso">3.</span> Add this to{' '}
                <span className="font-medium text-espresso">Authorised redirect URIs</span>.
                The button uses a popup, which never redirects — so this is{' '}
                <span className="font-medium text-espresso">optional today</span>, and only
                comes into play if sign-in is switched to redirect mode. Add it anyway and
                the field is never the thing that's wrong.
                <ConsoleValue id="redirect" value={cfg?.redirect_uri || ''} />
              </li>
              <li>
                <span className="font-medium text-espresso">4.</span> Paste the Client ID
                here, tick the box and save.
              </li>
            </ol>
          </div>

          <div className="rounded-md border border-border bg-white p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em]">
              "Access blocked: Authorization Error"
            </h2>
            <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
              That page comes from Google, before any token reaches us. Open{' '}
              <span className="font-medium text-espresso">Error details</span> on it — the
              code tells you which of these it is.
            </p>
            <dl className="space-y-2.5 text-[12.5px] leading-relaxed">
              <div>
                <dt className="font-mono text-[11.5px] font-medium text-espresso">
                  origin_mismatch / redirect_uri_mismatch
                </dt>
                <dd className="text-muted-foreground">
                  The origin above isn't in Authorised JavaScript origins. Add it exactly,
                  then wait — Google can take a few minutes to apply the change.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11.5px] font-medium text-espresso">
                  access_denied · "app is being tested"
                </dt>
                <dd className="text-muted-foreground">
                  The OAuth consent screen is in <em>Testing</em>. Either publish it, or
                  add the signing-in address under <em>Test users</em>.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[11.5px] font-medium text-espresso">
                  invalid_client / invalid_request
                </dt>
                <dd className="text-muted-foreground">
                  The Client ID is wrong or belongs to a client that isn't of type{' '}
                  <em>Web application</em>.
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-border bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
              <Users className="h-3.5 w-3.5 text-maroon" /> Accounts
            </h2>
            <p className="font-serif text-3xl font-medium text-espresso">
              {cfg?.google_users ?? 0}
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              customers created their account with Google.
            </p>
            <p className="mt-3 border-t border-border pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              Signing in with Google for an email that already has a password account
              links the two — the customer keeps one account either way. Accounts created
              through Google have no password, so they must keep using the Google button
              (or reset a password from Forgot password).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginMethods;
