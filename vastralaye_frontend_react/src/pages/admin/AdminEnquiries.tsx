import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLoading from '@/components/admin/AdminLoading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Inbox,
  Mail,
  MailCheck,
  MailWarning,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react';

/**
 * Admin › Enquiries — everything sent through the storefront's Contact Us form,
 * plus the email configuration that decides where a copy is sent.
 *
 * The list is the source of truth. Email is a notification on top of it, so a
 * misconfigured mail account loses nothing — the rows that couldn't be sent say
 * so, and say why.
 */

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  emailed: boolean;
  email_error: string | null;
  created_at: string | null;
}

interface EmailConfig {
  configured: boolean;
  sender_email: string;
  sender_name: string;
  notify_email: string;
  notify_enabled: boolean;
  app_password_masked: string;
  effective: {
    sender_email: string;
    sender_name: string;
    notify_email: string;
    has_password: boolean;
    from_env: boolean;
  };
  updated_at: string | null;
}

const formatDate = (value: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const AdminEnquiries = () => {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [open, setOpen] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState<Enquiry | null>(null);
  const [busy, setBusy] = useState(false);

  /* Email configuration */
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    sender_email: '',
    sender_name: '',
    notify_email: '',
    app_password: '',
    notify_enabled: true,
  });

  const fetchRows = async (opts?: { search?: string; unreadOnly?: boolean }) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Enquiry[]; total: number; unread: number }>(
        '/admin/contact-messages',
        {
          params: {
            search: opts?.search ?? search,
            unread_only: opts?.unreadOnly ?? unreadOnly,
            limit: 100,
          },
        }
      );
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setUnread(res.data?.unread || 0);
    } catch {
      toast.error('Could not load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get<EmailConfig>('/admin/email-config');
      setConfig(res.data);
      setForm({
        sender_email: res.data.sender_email || '',
        sender_name: res.data.sender_name || '',
        notify_email: res.data.notify_email || '',
        app_password: '',
        notify_enabled: res.data.notify_enabled,
      });
    } catch {
      /* the list is the important half — don't shout about this one */
    }
  };

  useEffect(() => {
    fetchRows();
    fetchConfig();
  }, []);

  /** Opening an enquiry marks it read — that's what opening it means. */
  const openEnquiry = async (row: Enquiry) => {
    setOpen(row);
    if (row.is_read) return;
    try {
      await api.patch(`/admin/contact-messages/${row.id}/read`, { is_read: true });
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_read: true } : r)));
      setUnread((n) => Math.max(0, n - 1));
    } catch {
      /* cosmetic — the message is open either way */
    }
  };

  const toggleRead = async (row: Enquiry) => {
    try {
      await api.patch(`/admin/contact-messages/${row.id}/read`, { is_read: !row.is_read });
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_read: !r.is_read } : r)));
      setUnread((n) => Math.max(0, row.is_read ? n + 1 : n - 1));
    } catch {
      toast.error('Could not update this enquiry');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/contact-messages/${deleting.id}`);
      toast.success('Enquiry deleted');
      setDeleting(null);
      setOpen(null);
      fetchRows();
    } catch {
      toast.error('Could not delete this enquiry');
    } finally {
      setBusy(false);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await api.put<EmailConfig>('/admin/email-config', {
        sender_email: form.sender_email,
        sender_name: form.sender_name,
        notify_email: form.notify_email,
        notify_enabled: form.notify_enabled,
        // Blank means "keep the stored password" — the server treats it that way.
        ...(form.app_password ? { app_password: form.app_password } : {}),
      });
      setConfig(res.data);
      setForm((f) => ({ ...f, app_password: '' }));
      toast.success('Email configuration saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not save the configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await api.post<{ detail: string }>('/admin/email-config/test', {
        to_email: form.notify_email || undefined,
      });
      toast.success(res.data?.detail || 'Test email sent');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not send the test email');
    } finally {
      setTesting(false);
    }
  };

  const effectiveInbox = config?.effective?.notify_email || '';
  const canSend = Boolean(config?.effective?.sender_email && config?.effective?.has_password);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl font-medium text-espresso md:text-2xl">Enquiries</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {total} message{total === 1 ? '' : 's'} from the Contact Us form
              {unread > 0 && (
                <>
                  {' · '}
                  <span className="font-semibold text-maroon">{unread} unread</span>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfig((v) => !v)}
              className="gap-2 text-[12px]"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Email settings
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchRows()}
              disabled={loading}
              className="gap-2 text-[12px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Where enquiries are going — the one line that answers "is this working?" */}
        <div
          className={`flex flex-wrap items-center gap-2 rounded-md border px-4 py-3 text-[12.5px] ${
            canSend && config?.notify_enabled !== false
              ? 'border-border bg-white text-muted-foreground'
              : 'border-[#B07C1F]/30 bg-[#B07C1F]/10 text-[#8A6414]'
          }`}
        >
          {canSend && config?.notify_enabled !== false ? (
            <>
              <MailCheck className="h-4 w-4 text-maroon" />
              <span>
                New enquiries are emailed to{' '}
                <span className="font-semibold text-espresso">{effectiveInbox}</span>
                {config?.effective?.from_env && ' (from the server\'s .env)'}
              </span>
            </>
          ) : (
            <>
              <MailWarning className="h-4 w-4" />
              <span>
                {config?.notify_enabled === false
                  ? 'Email notifications are switched off — enquiries are still saved here.'
                  : 'No sending account configured — enquiries are saved here but not emailed.'}
              </span>
            </>
          )}
        </div>

        {/* Email configuration */}
        {showConfig && (
          <section className="rounded-md border border-border bg-white">
            <header className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-serif text-lg font-medium text-espresso">
                <Mail className="h-4 w-4 text-maroon" />
                Email configuration
              </h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                The Gmail account the shop sends from, and where enquiries are announced.
              </p>
            </header>

            <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  Send enquiries to
                </label>
                <Input
                  value={form.notify_email}
                  onChange={(e) => setForm((f) => ({ ...f, notify_email: e.target.value }))}
                  placeholder="noreply@vastraliya.com"
                  className="text-[13px]"
                />
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  Leave blank to use {config?.effective?.notify_email || 'the default'}.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  Sender name
                </label>
                <Input
                  value={form.sender_name}
                  onChange={(e) => setForm((f) => ({ ...f, sender_name: e.target.value }))}
                  placeholder="Vastralaye"
                  className="text-[13px]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  Gmail account
                </label>
                <Input
                  value={form.sender_email}
                  onChange={(e) => setForm((f) => ({ ...f, sender_email: e.target.value }))}
                  placeholder="shop@gmail.com"
                  className="text-[13px]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  App password
                </label>
                <Input
                  type="password"
                  value={form.app_password}
                  onChange={(e) => setForm((f) => ({ ...f, app_password: e.target.value }))}
                  placeholder={config?.app_password_masked || 'Gmail app password'}
                  autoComplete="new-password"
                  className="text-[13px]"
                />
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  A Google <em>app password</em>, not the account password. Leave blank to keep the
                  stored one.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.notify_enabled}
                  onChange={(e) => setForm((f) => ({ ...f, notify_enabled: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 accent-[#7A1F2B]"
                />
                <span>
                  <span className="block text-[13px] font-medium text-espresso">
                    Email me new enquiries
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    Off means enquiries are still collected here, just not emailed on.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4 md:col-span-2">
                <Button
                  variant="outline"
                  onClick={sendTest}
                  disabled={testing || savingConfig}
                  className="gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {testing ? 'Sending…' : 'Send test email'}
                </Button>
                <Button
                  onClick={saveConfig}
                  disabled={savingConfig}
                  className="bg-maroon text-ivory hover:bg-terracotta"
                >
                  {savingConfig ? 'Saving…' : 'Save configuration'}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRows({ search })}
              placeholder="Search by name, email or message…"
              className="h-10 pl-9 text-[13px]"
            />
          </div>
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            onClick={() => {
              const next = !unreadOnly;
              setUnreadOnly(next);
              fetchRows({ unreadOnly: next });
            }}
            className={unreadOnly ? 'bg-maroon text-ivory hover:bg-terracotta' : ''}
          >
            Unread only
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="rounded-md border border-border bg-white">
            <AdminLoading label="enquiries" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-white px-6 py-16 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" strokeWidth={1.2} />
            <p className="text-sm text-muted-foreground">
              {search || unreadOnly
                ? 'No enquiries match that.'
                : 'No enquiries yet — messages from the Contact Us form will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-white">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`flex flex-wrap items-start gap-4 border-b border-border px-4 py-3.5 last:border-b-0 ${
                  row.is_read ? '' : 'bg-blush/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => openEnquiry(row)}
                  className="min-w-[200px] flex-1 text-left"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    {!row.is_read && (
                      <span aria-label="Unread" className="h-2 w-2 rounded-full bg-maroon" />
                    )}
                    <span
                      className={`text-[13.5px] text-espresso ${row.is_read ? '' : 'font-semibold'}`}
                    >
                      {row.name}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">{row.email}</span>
                    {!row.emailed && (
                      <span
                        title={row.email_error || 'Not emailed'}
                        className="inline-flex items-center gap-1 rounded-full border border-[#B07C1F]/30 bg-[#B07C1F]/10 px-2 py-0.5 text-[11px] font-medium text-[#8A6414]"
                      >
                        <MailWarning className="h-3 w-3" /> not emailed
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[12.5px] text-muted-foreground">
                    {row.message}
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">
                    {formatDate(row.created_at)}
                  </span>
                  <button
                    type="button"
                    title={row.is_read ? 'Mark as unread' : 'Mark as read'}
                    onClick={() => toggleRead(row)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] border border-border bg-white text-muted-foreground transition-colors hover:border-espresso hover:text-espresso"
                  >
                    {row.is_read ? (
                      <Mail className="h-3.5 w-3.5" />
                    ) : (
                      <MailCheck className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Delete enquiry"
                    onClick={() => setDeleting(row)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] border border-sale/40 bg-white text-sale transition-colors hover:bg-sale hover:text-ivory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* One enquiry */}
        <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-medium text-espresso">
                {open?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                <a
                  href={`mailto:${open?.email}`}
                  className="inline-flex items-center gap-2 text-maroon hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" /> {open?.email}
                </a>
                {open?.phone && (
                  <a
                    href={`tel:${open.phone}`}
                    className="inline-flex items-center gap-2 text-maroon hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" /> {open.phone}
                  </a>
                )}
              </div>

              <p className="text-[12px] text-muted-foreground">{formatDate(open?.created_at || null)}</p>

              <p className="whitespace-pre-wrap rounded-sm border border-border bg-ivory p-4 text-[13.5px] leading-relaxed text-espresso">
                {open?.message}
              </p>

              {open && !open.emailed && (
                <p className="flex items-start gap-2 rounded-sm border border-[#B07C1F]/30 bg-[#B07C1F]/10 p-3 text-[12.5px] text-[#8A6414]">
                  <MailWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Not emailed on. {open.email_error || ''}</span>
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setOpen(null)}>
                  Close
                </Button>
                <a
                  href={`mailto:${open?.email}?subject=${encodeURIComponent('Re: your enquiry')}`}
                  className="inline-flex items-center gap-2 rounded-sm bg-maroon px-4 py-2 text-[13px] font-medium text-ivory transition-colors hover:bg-terracotta"
                >
                  <Send className="h-3.5 w-3.5" /> Reply
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={Boolean(deleting)} onOpenChange={(v) => !v && !busy && setDeleting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-sale">
                <AlertTriangle className="h-4 w-4" />
                Delete this enquiry?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <p className="text-sm leading-relaxed text-muted-foreground">
                The message from{' '}
                <span className="font-medium text-espresso">{deleting?.name}</span> (
                {deleting?.email}) will be removed permanently. This cannot be undone.
              </p>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-sale text-ivory hover:bg-sale/90"
                  disabled={busy}
                  onClick={confirmDelete}
                >
                  {busy ? 'Deleting…' : 'Delete permanently'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEnquiries;
