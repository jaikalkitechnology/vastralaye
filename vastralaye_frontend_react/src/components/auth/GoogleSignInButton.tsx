import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { useStore } from '@/contexts/StoreContext';
import { AlertCircle } from 'lucide-react';

/**
 * "Continue with Google", rendered only when an admin has switched it on in
 * Admin → Settings → Login Methods.
 *
 * Uses Google Identity Services and Google's own rendered button — their
 * branding rules require the official mark, and it handles One Tap, locale
 * and accessibility for us. The ID token it returns is verified server-side;
 * nothing here is trusted.
 */

declare global {
  interface Window {
    google?: any;
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

/* One script tag per page, however many buttons ask for it. */
let gisPromise: Promise<void> | null = null;

const loadGis = (): Promise<void> => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = GIS_SRC;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => {
        gisPromise = null; // let a later mount retry
        reject(new Error('Google sign-in script could not be loaded'));
      };
      document.head.appendChild(el);
    });
  }
  return gisPromise;
};

interface Props {
  /** Google's button copy: "signin_with" | "continue_with" | "signup_with". */
  text?: 'signin_with' | 'continue_with' | 'signup_with';
}

const GoogleSignInButton = ({ text = 'continue_with' }: Props) => {
  const { loginWithGoogle, applyGoogleSession } = useStore();
  const [clientId, setClientId] = useState('');
  const [failed, setFailed] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  /* Redirect flow: the callback hands the session back in the URL fragment,
     which never reaches a server or a referrer. Consume it and wipe it. */
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const token = params.get('google_token');
    const error = params.get('google_error');
    if (!token && !error) return;

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (token) applyGoogleSession(token);
    else if (error) setFailed(true);
  }, [applyGoogleSession]);

  /* Is it switched on, and with which client ID? */
  useEffect(() => {
    let cancelled = false;
    api
      .get<any>('/fronted/auth/google')
      .then((res) => {
        if (cancelled) return;
        if (res.data?.enabled && res.data?.client_id) setClientId(res.data.client_id);
      })
      .catch(() => {
        /* off, or the endpoint isn't deployed yet — render nothing */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled || !holder.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) loginWithGoogle(response.credential);
          },
        });
        holder.current.innerHTML = '';
        window.google.accounts.id.renderButton(holder.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          // Google caps this at 400; match the form column below that.
          width: Math.min(400, holder.current.offsetWidth || 360),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, text, loginWithGoogle]);

  if (!clientId) return null;

  return (
    <div className="mb-6">
      <div ref={holder} className="flex justify-center [color-scheme:light]" />

      {failed && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] text-sale">
          <AlertCircle className="h-3.5 w-3.5" />
          Google sign-in is unavailable right now — please use your email.
        </p>
      )}

      <div className="mt-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
};

export default GoogleSignInButton;
