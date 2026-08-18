import { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, MailOpen, Trash2, RefreshCw, Send, Loader2 } from 'lucide-react';

/**
 * Admin › Enquiries — "Letters from the Loom" subscribers. The home page's
 * newsletter band stores addresses in newsletter_subscribers; this panel
 * lists them and writes to one with the same branded email machinery the
 * enquiry replies use (and the same sending account from Email settings).
 */

interface Subscriber {
  id: number;
  email: string;
  created_at: string | null;
  last_emailed_at: string | null;
}

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

const inputCls =
  'w-full border border-input rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-maroon';
const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5';

const AdminSubscribers = () => {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState<Subscriber | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/newsletter');
      setSubs(Array.isArray(res.data) ? (res.data as Subscriber[]) : []);
    } catch {
      toast({ title: 'Failed to load subscribers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCompose = (s: Subscriber) => {
    setComposing(s);
    setSubject('');
    setMessage('');
  };

  const send = async () => {
    if (!composing) return;
    if (message.trim().length < 2) {
      return toast({ title: 'Write a message before sending.' });
    }
    setSending(true);
    try {
      const res = await api.post(`/admin/newsletter/${composing.id}/email`, {
        subject: subject.trim(),
        message: message.trim(),
      });
      const data = res.data as { detail: string; subscriber: Subscriber };
      toast({ title: data.detail || 'Email sent' });
      setSubs((prev) => prev.map((s) => (s.id === composing.id ? data.subscriber : s)));
      setComposing(null);
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || 'Could not send the email' });
    } finally {
      setSending(false);
    }
  };

  const remove = async (s: Subscriber) => {
    if (!window.confirm(`Remove ${s.email} from the newsletter list?`)) return;
    try {
      await api.delete(`/admin/newsletter/${s.id}`);
      setSubs((prev) => prev.filter((x) => x.id !== s.id));
      toast({ title: `${s.email} removed` });
    } catch {
      toast({ title: 'Failed to remove subscriber' });
    }
  };

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MailOpen className="h-5 w-5 text-maroon" /> Letters from the Loom
            <span className="text-sm font-normal text-muted-foreground">
              · {subs.length} subscriber{subs.length === 1 ? '' : 's'}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Emails collected by the home page newsletter band. Write to one with the
            same sending account as enquiry replies.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="bg-white border border-border rounded-md overflow-hidden">
        {subs.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            {loading ? 'Loading…' : 'No subscribers yet — the sign-up band on the home page fills this list.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-ivory text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">Email</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">Subscribed</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">Last emailed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-espresso">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.created_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.last_emailed_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openCompose(s)}
                          className="inline-flex items-center gap-1.5 border border-border rounded-sm px-3 py-1.5 text-xs font-medium text-espresso hover:border-maroon hover:text-maroon transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${s.email}`}
                          onClick={() => remove(s)}
                          className="w-8 h-8 border border-sale/40 rounded-sm inline-flex items-center justify-center text-sale hover:bg-sale/5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compose dialog */}
      <Dialog open={Boolean(composing)} onOpenChange={(v) => !v && !sending && setComposing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-medium text-espresso">
              Email {composing?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Subject</label>
              <input
                className={inputCls}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="A note from Vastraliya"
                maxLength={150}
              />
            </div>
            <div>
              <label className={labelCls}>Message</label>
              <textarea
                className={`${inputCls} min-h-[140px]`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your note — it goes out in the branded email design."
                maxLength={5000}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setComposing(null)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={send} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscribers;
