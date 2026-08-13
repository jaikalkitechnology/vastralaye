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
  reply: string | null;
  replied_at: string | null;
}

interface EmailConfig {
  configured: boolean;
  sender_email: string;
  sender_name: string;
  notify_email: string;
  notify_enabled: boolean;
  smtp_host: string;
  smtp_port: number | null;
  smtp_ssl: boolean | null;
  app_password_masked: string;
  effective: {
    sender_email: string;
    sender_name: string;
    notify_email: string;
    smtp_host: string;
    smtp_port: number;
    smtp_ssl: boolean;
    has_password: boolean;
    from_env: boolean;
  };
  updated_at: string | null;
}

/**
 * One-click server settings. Getting host/port/encryption right by hand is
 * where mail setups usually die, and the two that matter here are known.
 */
const PRESETS = [
  { id: 'hostinger', label: 'Hostinger', host: 'smtp.hostinger.com', port: 465, ssl: true,
    hint: 'Use the mailbox password you set in hPanel — Hostinger has no separate app password.' },
  { id: 'gmail', label: 'Gmail', host: 'smtp.gmail.com', port: 465, ssl: true,
    hint: 'Needs a Google app password (2-step verification on), not the account password.' },
] as const;

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
  /* Reply composer, inside the open enquiry */
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

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
    smtp_host: '',
    smtp_port: '' as string | number,
    smtp_ssl: true,
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
        // Show what sending actually uses, so the fields never sit empty while
        // mail works fine off a default the admin can't see.
        smtp_host: res.data.smtp_host || res.data.effective?.smtp_host || '',
        smtp_port: res.data.smtp_port ?? res.data.effective?.smtp_port ?? '',
        smtp_ssl: res.data.smtp_ssl ?? res.data.effective?.smtp_ssl ?? true,
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
    setReplyText('');
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
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port === '' ? null : Number(form.smtp_port),
        smtp_ssl: form.smtp_ssl,
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

  /**
   * Send the reply. A failure here is surfaced, not swallowed: unlike the
   * enquiry notification, whoever is looking at this can act on it.
   */
  const sendReply = async () => {
    if (!open) return;
    setSendingReply(true);
    try {
      const res = await api.post<{ detail: string; message: Enquiry }>(
        `/admin/contact-messages/${open.id}/reply`,
        { message: replyText }
      );
      const updated = res.data?.message;
      if (updated) {
        setOpen(updated);
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        if (!open.is_read) setUnread((n) => Math.max(0, n - 1));
      }
      setReplyText('');
      toast.success(res.data?.detail || 'Reply sent');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not send the reply');
    } finally {
      setSendingReply(false);
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

  const activePreset = PRESETS.find((p) => p.host === form.smtp_host);
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
                The mailbox the shop sends from, and where enquiries are announced.
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
                  placeholder="Vastraliya"
                  className="text-[13px]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  Email account
                </label>
                <Input
                  value={form.sender_email}
                  onChange={(e) => setForm((f) => ({ ...f, sender_email: e.target.value }))}
                  placeholder="noreply@vastraliya.com"
                  className="text-[13px]"
                />
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  The mailbox that sends. Most providers refuse mail whose From address
                  isn't the account it logged in as.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                  {activePreset?.id === 'gmail' ? 'App password' : 'Mailbox password'}
                </label>
                <Input
                  type="password"
                  value={form.app_password}
                  onChange={(e) => setForm((f) => ({ ...f, app_password: e.target.value }))}
                  placeholder={config?.app_password_masked || 'Mailbox password'}
                  autoComplete="new-password"
                  className="text-[13px]"
                />
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  {activePreset?.hint || 'The mailbox password.'} Leave blank to keep the stored one.
                </p>
              </div>

              {/* Mail server */}
              <div className="md:col-span-2">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                    Mail server
                  </span>
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          smtp_host: preset.host,
                          smtp_port: preset.port,
                          smtp_ssl: preset.ssl,
                        }))
                      }
                      className={`rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
                        form.smtp_host === preset.host
                          ? 'border-maroon bg-blush text-maroon'
                          : 'border-border text-muted-foreground hover:border-gold hover:bg-ivory'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_120px_150px]">
                  <Input
                    value={form.smtp_host}
                    onChange={(e) => setForm((f) => ({ ...f, smtp_host: e.target.value }))}
                    placeholder="smtp.hostinger.com"
                    aria-label="SMTP host"
                    className="text-[13px]"
                  />
                  <Input
                    value={String(form.smtp_port)}
                    inputMode="numeric"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, smtp_port: e.target.value.replace(/\D/g, '') }))
                    }
                    placeholder="465"
                    aria-label="SMTP port"
                    className="text-[13px]"
                  />
                  <select
                    value={form.smtp_ssl ? 'ssl' : 'starttls'}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        smtp_ssl: e.target.value === 'ssl',
                        // The two go together; changing one without the other is
                        // the single most common way this ends up not connecting.
                        smtp_port: e.target.value === 'ssl' ? 465 : 587,
                      }))
                    }
                    aria-label="Encryption"
                    className="h-10 rounded-md border border-border bg-white px-3 text-[13px] text-espresso"
                  >
                    <option value="ssl">SSL · 465</option>
                    <option value="starttls">STARTTLS · 587</option>
                  </select>
                </div>
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
                    {row.reply && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-[#FBF8F3] px-2 py-0.5 text-[11px] font-medium text-[#8A6414]">
                        <MailCheck className="h-3 w-3" /> replied
                      </span>
                    )}
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
        <Dialog open={Boolean(open)} onOpenChange={(v) => !v && !sendingReply && setOpen(null)}>
          <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
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

              {/* What was already said, so a second reply has context */}
              {open?.reply && (
                <div className="rounded-sm border-l-[3px] border-gold bg-[#FBF8F3] p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6414]">
                    <MailCheck className="h-3.5 w-3.5" />
                    Replied {formatDate(open.replied_at)}
                  </p>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-espresso">
                    {open.reply}
                  </p>
                </div>
              )}

              {/* Reply composer — sends from the shop's mailbox, no mail client */}
              <div>
                <label
                  htmlFor="enquiry-reply"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso"
                >
                  {open?.reply ? 'Reply again' : 'Reply'}
                </label>
                <textarea
                  id="enquiry-reply"
                  rows={5}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sendingReply}
                  placeholder={`Write back to ${open?.name || 'them'}…`}
                  className="w-full resize-none rounded-md border border-border bg-white px-3 py-2.5 text-[13px] leading-relaxed text-espresso focus:border-maroon focus:outline-none"
                />
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  Sent to <span className="text-espresso">{open?.email}</span> from the shop's
                  mailbox, with their original message quoted underneath.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" disabled={sendingReply} onClick={() => setOpen(null)}>
                  Close
                </Button>
                <Button
                  onClick={sendReply}
                  disabled={sendingReply || replyText.trim().length < 2}
                  className="gap-2 bg-maroon text-ivory hover:bg-terracotta"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sendingReply ? 'Sending…' : 'Send reply'}
                </Button>
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
