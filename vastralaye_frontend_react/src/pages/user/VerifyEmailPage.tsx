import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/api';
import { CheckCircle2, Loader2, MailWarning, Send } from 'lucide-react';

/**
 * The page the activation link in the welcome email lands on.
 *
 * It consumes the token immediately — there is nothing for the customer to
 * fill in, so making them press a button would only add a step. If the link is
 * spent or expired, the same screen offers to send a new one, because that is
 * the only thing they can usefully do from here.
 */

type State = 'checking' | 'done' | 'failed';

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [state, setState] = useState<State>(token ? 'checking' : 'failed');
  const [message, setMessage] = useState(
    token ? '' : 'That link is missing its code. Open the link from your email again.'
  );
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  /* React 18 StrictMode mounts effects twice in development. Without this the
     token would be spent by the first run and the second would report failure
     on a verification that actually succeeded. */
  const claimed = useRef(false);

  useEffect(() => {
    if (!token || claimed.current) return;
    claimed.current = true;

    api
      .post<{ message: string }>('/users/verify-email', { token })
      .then((res) => {
        setState('done');
        setMessage(res.data?.message || 'Your email is confirmed.');
      })
      .catch((err) => {
        setState('failed');
        setMessage(
          err?.response?.data?.detail ||
            'We could not confirm this link. Ask for a new one below.'
        );
      });
  }, [token]);

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/users/resend-verification', { email });
      setResent(true);
    } catch {
      // The endpoint answers the same way for every address by design, so
      // there is nothing useful to distinguish here.
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="border-b-[3px] border-gold bg-espresso">
        <div className="container mx-auto px-4 py-6 text-center">
          <Link to="/" className="font-serif text-2xl font-semibold text-ivory">
            Vastra<span className="text-gold">liya</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto flex justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-md border border-border bg-white p-8 text-center">
          {state === 'checking' && (
            <>
              <Loader2 className="mx-auto mb-5 h-10 w-10 animate-spin text-maroon" strokeWidth={1.5} />
              <h1 className="font-serif text-xl font-medium text-espresso">
                Confirming your email…
              </h1>
            </>
          )}

          {state === 'done' && (
            <>
              <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-maroon" strokeWidth={1.4} />
              <h1 className="font-serif text-2xl font-medium text-espresso">You're all set</h1>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{message}</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-7 w-full rounded-sm bg-maroon px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-terracotta"
              >
                Sign in
              </button>
            </>
          )}

          {state === 'failed' && (
            <>
              <MailWarning className="mx-auto mb-5 h-12 w-12 text-[#8A6414]" strokeWidth={1.4} />
              <h1 className="font-serif text-2xl font-medium text-espresso">
                This link didn't work
              </h1>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{message}</p>

              {resent ? (
                <p className="mt-7 rounded-sm border border-border bg-ivory p-4 text-[13px] leading-relaxed text-espresso">
                  If that account still needs confirming, a new link is on its way. It can
                  take a minute to arrive.
                </p>
              ) : (
                <div className="mt-7 text-left">
                  <label
                    htmlFor="resend-email"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso"
                  >
                    Send me a new link
                  </label>
                  <input
                    id="resend-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-sm border border-border bg-white px-4 py-3 text-[13.5px] text-espresso focus:border-maroon focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resending || !email.includes('@')}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-maroon px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-terracotta disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {resending ? 'Sending…' : 'Send new link'}
                  </button>
                </div>
              )}

              <p className="mt-6 text-[13px] text-muted-foreground">
                <Link to="/login" className="text-maroon hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
