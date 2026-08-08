import { useState } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';
import { useSiteSettings, FALLBACK_WHATSAPP } from '@/hooks/use-site-settings';
import {
  WhatsAppLogo,
  InstagramLogo,
  FacebookLogo,
  YouTubeLogo,
  XLogo,
  INSTAGRAM_GRADIENT,
} from '@/components/icons/SocialIcons';

/**
 * Floating contact hub — a round button pinned to the MIDDLE of the
 * right edge that expands into the store's contact/social links
 * (WhatsApp, Call, Instagram, Facebook, X, YouTube), each drawn with
 * the brand's original logo on its official color.
 *
 * Fully controlled from Admin → Store Settings: each link appears only
 * when its value is set (WhatsApp keeps a fallback number), and the
 * whole hub can be switched off with the "floating contact button"
 * toggle (`float_enabled`).
 */
const WhatsAppFloat = () => {
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);

  /* Admin kill-switch */
  if (settings.float_enabled === 'false') return null;

  const whatsappNumber = (settings.whatsapp_number || FALLBACK_WHATSAPP).replace(/[^\d]/g, '');

  const links = [
    {
      key: 'whatsapp',
      label: 'Chat on WhatsApp',
      href: `https://wa.me/${whatsappNumber}`,
      icon: <WhatsAppLogo className="w-5 h-5" />,
      className: 'bg-[#25D366] text-white',
    },
    settings.call_number
      ? {
          key: 'call',
          label: 'Call us',
          href: `tel:${settings.call_number.replace(/[^\d+]/g, '')}`,
          icon: <Phone className="w-[18px] h-[18px]" strokeWidth={1.8} />,
          className: 'bg-maroon text-ivory',
        }
      : null,
    settings.instagram_url
      ? {
          key: 'instagram',
          label: 'Instagram',
          href: settings.instagram_url,
          icon: <InstagramLogo className="w-5 h-5" />,
          className: 'text-white',
          style: { background: INSTAGRAM_GRADIENT },
        }
      : null,
    settings.facebook_url
      ? {
          key: 'facebook',
          label: 'Facebook',
          href: settings.facebook_url,
          icon: <FacebookLogo className="w-5 h-5" />,
          className: 'bg-[#1877F2] text-white',
        }
      : null,
    settings.twitter_url
      ? {
          key: 'twitter',
          label: 'X (Twitter)',
          href: settings.twitter_url,
          icon: <XLogo className="w-4 h-4" />,
          className: 'bg-black text-white',
        }
      : null,
    settings.youtube_url
      ? {
          key: 'youtube',
          label: 'YouTube',
          href: settings.youtube_url,
          icon: <YouTubeLogo className="w-5 h-5" />,
          className: 'bg-[#FF0000] text-white',
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    icon: JSX.Element;
    className: string;
    style?: React.CSSProperties;
  }[];

  return (
    <div className="fixed right-3 md:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
      {/* Expanded links — cascade upward from the main button */}
      <div className="flex flex-col items-center gap-2.5 mb-2.5">
        {links.map((link, i) => (
          <a
            key={link.key}
            href={link.href}
            target={link.href.startsWith('tel:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label}
            tabIndex={open ? 0 : -1}
            style={{ ...link.style, transitionDelay: open ? `${i * 40}ms` : '0ms' }}
            className={`w-11 h-11 rounded-full shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 ${link.className} ${
              open
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-4 scale-75 pointer-events-none'
            }`}
          >
            {link.icon}
          </a>
        ))}
      </div>

      {/* Main toggle */}
      <button
        type="button"
        aria-label={open ? 'Close contact menu' : 'Contact us'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-full bg-espresso border border-gold text-ivory shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? (
          <X className="w-5 h-5" strokeWidth={1.8} />
        ) : (
          <MessageCircle className="w-[22px] h-[22px]" strokeWidth={1.6} />
        )}
      </button>
    </div>
  );
};

export default WhatsAppFloat;
