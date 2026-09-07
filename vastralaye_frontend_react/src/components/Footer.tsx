import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useSiteSettings, FALLBACK_WHATSAPP } from '@/hooks/use-site-settings';
import PaymentBadges from '@/components/PaymentBadges';
import FooterScene from '@/components/decor/FooterScene';
import {
  WhatsAppLogo,
  InstagramLogo,
  FacebookLogo,
  YouTubeLogo,
  XLogo,
} from '@/components/icons/SocialIcons';
import { PAISLEY_TILE } from '@/components/decor/patterns';

/**
 * Editorial dark footer (design.md §5.13) — espresso background,
 * gold accents, link columns covering all existing routes.
 *
 * The background carries a faint woven paisley (boteh) motif — an
 * inline SVG tile (shared via decor/patterns) so it costs no network
 * request; opacity is kept low so text contrast is unaffected.
 */

const Footer = () => {
  const settings = useSiteSettings();

  const shopLinks = [
    { label: 'All Products', to: '/products' },
    { label: 'New Arrivals', to: '/new-arrivals' },
    { label: 'Bestsellers', to: '/best-sellers' },
    { label: 'Categories', to: '/categories' },
    { label: 'Wishlist', to: '/wishlist' },
  ];

  const companyLinks = [
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact-us' },
    { label: 'My Account', to: '/account/profile' },
    { label: 'My Orders', to: '/account/orders' },
  ];

  const policyLinks = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms & Conditions', to: '/terms-conditions' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Shipping & Delivery', to: '/shipping-delivery-policy' },
    { label: 'Data Retention', to: '/data-retention-policy' },
  ];

  return (
    <footer className="relative overflow-hidden bg-espresso text-ivory/70 border-t-[3px] border-gold">
      {/* Woven paisley background motif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: PAISLEY_TILE, backgroundSize: '160px 160px' }}
      />
      <div className="container relative mx-auto px-4">
        {/* Main columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10 lg:gap-12 py-14">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src="/logo-mark.png"
                alt=""
                aria-hidden
                className="h-9 w-9 rounded-md"
              />
              <span className="font-serif text-2xl font-semibold text-ivory">
                Vastra<span className="text-gold">liya</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mt-4 mb-6 max-w-xs">
              Quality fashion, chosen with care. Timeless style for every
              celebration — and every day in between.
            </p>
            <div className="flex flex-wrap gap-3">
              {/* Original brand logos on ivory chips; links managed from Admin → Store Settings */}
              {[
                {
                  label: 'Chat on WhatsApp',
                  href: `https://wa.me/${(settings.whatsapp_number || FALLBACK_WHATSAPP).replace(/[^\d]/g, '')}`,
                  glyph: <WhatsAppLogo className="w-[18px] h-[18px] text-[#25D366]" />,
                },
                {
                  label: 'Instagram',
                  href: settings.instagram_url || 'https://instagram.com',
                  glyph: <InstagramLogo gradient className="w-[18px] h-[18px]" />,
                },
                {
                  label: 'Facebook',
                  href: settings.facebook_url || 'https://facebook.com',
                  glyph: <FacebookLogo className="w-[18px] h-[18px] text-[#1877F2]" />,
                },
                {
                  label: 'X (Twitter)',
                  href: settings.twitter_url || 'https://twitter.com',
                  glyph: <XLogo className="w-4 h-4 text-black" />,
                },
                ...(settings.youtube_url
                  ? [
                      {
                        label: 'YouTube',
                        href: settings.youtube_url,
                        glyph: <YouTubeLogo className="w-[18px] h-[18px] text-[#FF0000]" />,
                      },
                    ]
                  : []),
              ].map(({ href, label, glyph }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="w-9 h-9 rounded-full bg-ivory flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white"
                >
                  {glyph}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-gold text-xs font-semibold uppercase tracking-[0.22em] mb-5">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              {shopLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-gold text-xs font-semibold uppercase tracking-[0.22em] mb-5">Company</h4>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies + contact */}
          <div>
            <h4 className="text-gold text-xs font-semibold uppercase tracking-[0.22em] mb-5">
              Help &amp; Policies
            </h4>
            <ul className="space-y-2.5 text-sm mb-6">
              {policyLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-gold shrink-0" strokeWidth={1.5} />
                <span>
                  Gala No 230, Second Floor, Pride Industrial Estate,
                  <br />
                  Vasai East, Thane, Maharashtra – 401208
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-gold shrink-0" strokeWidth={1.5} />
                +91 70661 81207
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gold shrink-0" strokeWidth={1.5} />
                support@vastraliya.com
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — company legal identity */}
        <div className="border-t border-ivory/15 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px]">
          <div className="text-center md:text-left">
            <span>© {new Date().getFullYear()} Vastraliya Fashion Pvt. Ltd. · All rights reserved</span>
            <p className="mt-1 text-[11px] tracking-[0.04em] text-ivory/45">
              CIN: U47711MR2026PTC478420 · GSTIN: 27AAMCV4451F1Z4
            </p>
          </div>
          <PaymentBadges />
        </div>
      </div>

      {/* Illustrated heritage panorama along the base; extra bottom room
          on mobile so the fixed bottom nav doesn't cover the artwork */}
      <div aria-hidden className="pointer-events-none relative h-36 sm:h-44 md:h-52 mb-14 md:mb-0">
        <FooterScene />
      </div>
    </footer>
  );
};

export default Footer;
