import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail } from 'lucide-react';

/**
 * Editorial dark footer (design.md §5.13) — espresso background,
 * gold accents, link columns covering all existing routes.
 */
const Footer = () => {
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
    <footer className="bg-espresso text-ivory/70 border-t-[3px] border-gold">
      <div className="container mx-auto px-4">
        {/* Main columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10 lg:gap-12 py-14">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block">
              <span className="font-serif text-2xl font-semibold text-ivory">
                Vastra<span className="text-gold">laye</span>
              </span>
              <span className="block text-[9px] font-sans uppercase tracking-[0.42em] text-gold mt-0.5">
                Handcrafted India
              </span>
            </Link>
            <p className="text-sm leading-relaxed mt-4 mb-6 max-w-xs">
              Woven with love by artisans across India. Timeless ethnic wear for every
              celebration — and every day in between.
            </p>
            <div className="flex gap-3.5">
              {[
                { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
                { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
                { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-ivory/30 flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
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
                Faridabad, Haryana, India
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-gold shrink-0" strokeWidth={1.5} />
                +91 85275 96413
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gold shrink-0" strokeWidth={1.5} />
                support@vastralaye.in
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ivory/15 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px]">
          <span>© {new Date().getFullYear()} Vastralaye · All rights reserved</span>
          <div className="flex gap-2">
            {['UPI', 'VISA', 'MASTERCARD', 'RUPAY', 'COD'].map((m) => (
              <span
                key={m}
                className="border border-ivory/30 rounded-[2px] text-[10.5px] tracking-[0.08em] px-2.5 py-1"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
