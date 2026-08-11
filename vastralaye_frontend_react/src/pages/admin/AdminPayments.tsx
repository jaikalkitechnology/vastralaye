import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { toast } from '@/components/ui/use-toast';
import {
  AlertTriangle,
  Check,
  Copy,
  CreditCard,
  KeyRound,
  Link2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

/**
 * Admin › Payment Integration — gateway credentials, the webhook URL the
 * gateway should call, and recent online payment activity.
 *
 * Stored secrets come back masked; leaving a secret field blank keeps the
 * value already saved, so the form can be submitted without re-typing them.
 */

interface Credential {
  configured: boolean;
  gateway_name: string;
  token_id_masked: string;
  secret_key_masked: string;
  base_url: string;
  endpoint_path: string;
  is_active: boolean;
  has_webhook_secret: boolean;
  verify_amount: boolean;
  updated_at: string | null;
}

interface PaymentRow {
  order_id: number;
  merchant_ref: string | null;
  txn_id: string | null;
  rrn_no: string | null;
  payment_status: string | null;
  order_status: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  payment_date: string | null;
  created_at: string | null;
}

const inputCls =
  'w-full h-10 rounded-sm border border-border bg-white px-3 text-[13.5px] text-espresso placeholder:text-muted-foreground focus:outline-none focus:border-maroon';
const labelCls =
  'block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5';

const money = (n: number | null) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—';

const statusChip = (status: string | null) => {
  const s = (status || '').toLowerCase();
  if (s === 'paid')
    return 'bg-green-50 text-green-700 border-green-200';
  if (s === 'failed')
    return 'bg-sale/10 text-sale border-sale/30';
  return 'bg-gold/15 text-[#8A6414] border-gold/35';
};

const AdminPayments = () => {
  const [cred, setCred] = useState<Credential | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [envFallback, setEnvFallback] = useState<{ token_id: boolean; secret_key: boolean }>({
    token_id: false,
    secret_key: false,
  });
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [unlinked, setUnlinked] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [tokenId, setTokenId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [endpointPath, setEndpointPath] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [verifyAmount, setVerifyAmount] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [gw, logs] = await Promise.all([
        api.get<any>('/admin/payment-gateway'),
        api
          .get<any>('/admin/payment-logs?limit=25')
          .catch(() => ({ data: { rows: [], unlinked_online_orders: 0 } })),
      ]);
      const c: Credential = gw.data?.credential;
      setCred(c);
      setWebhookUrl(gw.data?.webhook_url || '');
      setEnvFallback(gw.data?.env_fallback || { token_id: false, secret_key: false });
      setBaseUrl(c?.base_url || '');
      setEndpointPath(c?.endpoint_path || '');
      setIsActive(c?.is_active !== false);
      setVerifyAmount(Boolean(c?.verify_amount));
      setRows(logs.data?.rows || []);
      setUnlinked(logs.data?.unlinked_online_orders || 0);
    } catch (err: any) {
      toast({
        title: 'Could not load payment settings',
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
      fd.append('token_id', tokenId);
      fd.append('secret_key', secretKey);
      fd.append('base_url', baseUrl);
      fd.append('endpoint_path', endpointPath);
      fd.append('webhook_secret', webhookSecret);
      fd.append('is_active', String(isActive));
      fd.append('verify_amount', String(verifyAmount));
      const res = await api.put<Credential>('/admin/payment-gateway', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCred(res.data);
      setTokenId('');
      setSecretKey('');
      setWebhookSecret('');
      toast({ title: 'Payment settings saved' });
    } catch (err: any) {
      toast({
        title: 'Could not save',
        description: err?.response?.data?.detail || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const clearSecret = async () => {
    if (!window.confirm('Remove the webhook secret? The webhook will accept unsigned calls again.'))
      return;
    const fd = new FormData();
    fd.append('clear_webhook_secret', 'true');
    fd.append('base_url', baseUrl);
    fd.append('endpoint_path', endpointPath);
    fd.append('is_active', String(isActive));
    fd.append('verify_amount', String(verifyAmount));
    try {
      const res = await api.put<Credential>('/admin/payment-gateway', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCred(res.data);
      toast({ title: 'Webhook secret removed' });
    } catch {
      toast({ title: 'Could not remove the secret' });
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Copy failed', description: webhookUrl });
    }
  };

  const usingEnv = cred && !cred.configured && (envFallback.token_id || envFallback.secret_key);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CreditCard className="h-6 w-6 text-maroon" /> Payment Integration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gateway credentials, the webhook endpoint, and recent online payments.
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

      {/* Unlinked-orders warning */}
      {unlinked > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-sm border border-sale/35 bg-sale/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-sale" />
          <div className="text-[13px] leading-relaxed text-espresso">
            <p className="font-semibold text-sale">
              {unlinked} online order{unlinked === 1 ? '' : 's'} with no merchant reference
            </p>
            <p className="mt-0.5 text-muted-foreground">
              The webhook matches a payment to an order by its merchant reference. Orders
              without one can never be confirmed automatically — they have to be marked
              paid by hand in Orders.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[440px_1fr]">
        {/* ── Credentials ── */}
        <div className="space-y-5">
          <div className="rounded-md border border-border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                <KeyRound className="h-3.5 w-3.5 text-maroon" /> Gateway credentials
              </h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  cred?.configured && cred.is_active
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-border bg-ivory text-muted-foreground'
                }`}
              >
                {cred?.configured ? (cred.is_active ? 'Live' : 'Disabled') : 'Not set'}
              </span>
            </div>

            {usingEnv && (
              <p className="mb-4 rounded-sm border border-border bg-ivory p-3 text-[11.5px] leading-relaxed text-muted-foreground">
                Currently running on the credentials in <code>.env</code>. Saving here
                stores them in the database instead, which takes priority from the next
                payment onward.
              </p>
            )}

            <div className="space-y-3.5">
              <div>
                <label className={labelCls}>Token ID</label>
                <input
                  className={inputCls}
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder={cred?.token_id_masked || 'Paste your Token-Id'}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelCls}>Secret key</label>
                <input
                  className={inputCls}
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder={cred?.secret_key_masked || 'Paste your Secret-Key'}
                  spellCheck={false}
                  autoComplete="new-password"
                />
              </div>
              {cred?.configured && (
                <p className="-mt-1 text-[11px] text-muted-foreground">
                  Leave either blank to keep the value already saved.
                </p>
              )}
              <div>
                <label className={labelCls}>Base URL</label>
                <input
                  className={inputCls}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://payin.mizorpay.in"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className={labelCls}>Endpoint path</label>
                <input
                  className={inputCls}
                  value={endpointPath}
                  onChange={(e) => setEndpointPath(e.target.value)}
                  placeholder="/api/collection-v9-payment"
                  spellCheck={false}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-[#7A1F2B]"
                />
                Use these credentials for live payments
              </label>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-1 w-full rounded-sm bg-maroon py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-terracotta disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save credentials'}
              </button>
            </div>
          </div>

          {/* ── Webhook ── */}
          <div className="rounded-md border border-border bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
              <Link2 className="h-3.5 w-3.5 text-maroon" /> Webhook
            </h2>

            <label className={labelCls}>Paste this into the gateway dashboard</label>
            <div className="flex items-center gap-2">
              <input readOnly value={webhookUrl} className={`${inputCls} bg-ivory`} />
              <button
                type="button"
                onClick={copyWebhook}
                className="inline-flex h-10 flex-none items-center gap-1.5 rounded-sm border border-border px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-espresso transition-colors hover:border-maroon hover:text-maroon"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-700" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="mt-4">
              <label className={labelCls}>Shared secret</label>
              <input
                className={inputCls}
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={cred?.has_webhook_secret ? '•••••••• (saved)' : 'Not set'}
                spellCheck={false}
                autoComplete="new-password"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                While this is empty the webhook accepts any caller — anyone who guesses a
                merchant reference could mark an order paid. Set the same value here and
                in the gateway dashboard; it is accepted as{' '}
                <code>X-Webhook-Secret</code>, <code>X-Webhook-Token</code>,{' '}
                <code>X-Api-Key</code>, a bearer token, or <code>?secret=</code>.
              </p>
              {cred?.has_webhook_secret && (
                <button
                  type="button"
                  onClick={clearSecret}
                  className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-sale hover:underline"
                >
                  Remove secret
                </button>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-sm border border-border bg-ivory p-3">
              <input
                type="checkbox"
                checked={verifyAmount}
                onChange={(e) => setVerifyAmount(e.target.checked)}
                className="mt-[3px] accent-[#7A1F2B]"
              />
              <span>
                <span className="block text-[12.5px] font-medium text-espresso">
                  Verify the settled amount
                </span>
                <span className="block text-[11px] leading-relaxed text-muted-foreground">
                  Hold an order instead of confirming it when the amount the gateway
                  settles doesn't match the order total. Check one real payment first —
                  if the gateway reports in a different unit this would hold everything.
                </span>
              </span>
            </label>

            <div className="mt-4 flex items-center gap-2 rounded-sm border border-border bg-ivory px-3 py-2.5">
              <ShieldCheck
                className={`h-4 w-4 flex-none ${
                  cred?.has_webhook_secret ? 'text-green-700' : 'text-sale'
                }`}
              />
              <span className="text-[11.5px] text-muted-foreground">
                {cred?.has_webhook_secret
                  ? 'Webhook is protected by a shared secret.'
                  : 'Webhook is currently unauthenticated.'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Recent payments ── */}
        <div className="rounded-md border border-border bg-white">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">
              Recent online payments
            </h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Last 25 non-COD orders, newest first.
            </p>
          </div>

          {loading ? (
            <div className="py-14 text-center text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">
              No online payments yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-ivory text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-4 py-2.5 font-semibold">Order</th>
                    <th className="px-4 py-2.5 font-semibold">Merchant ref</th>
                    <th className="px-4 py-2.5 font-semibold">Txn ID</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.order_id} className="border-t border-border">
                      <td className="px-4 py-2.5 font-medium text-espresso">#{r.order_id}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                        {r.merchant_ref || (
                          <span className="text-sale">missing</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                        {r.txn_id || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusChip(
                            r.payment_status
                          )}`}
                        >
                          {r.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-espresso">
                        {money(r.total_amount)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-espresso">
                        {money(r.paid_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
