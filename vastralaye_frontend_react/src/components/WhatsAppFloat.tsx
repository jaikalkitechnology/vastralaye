import { useState } from 'react';
import { MessageCircle, X, Phone, Instagram, Facebook, Youtube } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-site-settings';

/**
 * Floating contact hub — a round button pinned to the MIDDLE of the
 * right edge that expands into the store's contact/social links
 * (WhatsApp, Call, Instagram, Facebook, YouTube).
 *
 * Fully controlled from Admin → Store Settings: each link appears only
 * when its value is set (WhatsApp keeps a fallback number), and the
 * whole hub can be switched off with the "floating contact button"
 * toggle (`float_enabled`).
 */
const FALLBACK_WHATSAPP = '918527596413';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3 4.2c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.6-.7c.2-.2.2-.4.1-.6L10 8.7c-.1-.3-.3-.4-.5-.4z" />
  </svg>
);

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
      icon: <WhatsAppIcon />,
      className: 'bg-[#25D366] text-white border-transparent',
    },
    settings.call_number
      ? {
          key: 'call',
          label: 'Call us',
          href: `tel:${settings.call_number.replace(/[^\d+]/g, '')}`,
          icon: <Phone className="w-[18px] h-[18px]" strokeWidth={1.8} />,
          className: 'bg-maroon text-ivory border-transparent',
        }
      : null,
    settings.instagram_url
      ? {
          key: 'instagram',
          label: 'Instagram',
          href: settings.instagram_url,
          icon: <Instagram className="w-[18px] h-[18px]" strokeWidth={1.8} />,
          className: 'bg-white text-espresso border-border hover:border-gold',
        }
      : null,
    settings.facebook_url
      ? {
          key: 'facebook',
          label: 'Facebook',
          href: settings.facebook_url,
          icon: <Facebook className="w-[18px] h-[18px]" strokeWidth={1.8} />,
          className: 'bg-white text-espresso border-border hover:border-gold',
        }
      : null,
    settings.youtube_url
      ? {
          key: 'youtube',
          label: 'YouTube',
          href: settings.youtube_url,
          icon: <Youtube className="w-[18px] h-[18px]" strokeWidth={1.8} />,
          className: 'bg-white text-espresso border-border hover:border-gold',
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    icon: JSX.Element;
    className: string;
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
            style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
            className={`w-11 h-11 rounded-full border shadow-md flex items-center justify-center transition-all duration-300 ${link.className} ${
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
