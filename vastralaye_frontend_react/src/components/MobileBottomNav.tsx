import { Link, useLocation } from 'react-router-dom';
import { User, LayoutGrid, Search, Sparkles, ShoppingBag } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

/**
 * Mobile bottom navigation (design.md §5 family) — five tabs with a
 * raised espresso Search button at the center, like premium ethnic-wear
 * stores. Mobile only (`md:hidden`); hides itself on admin pages, the
 * product page (which owns a sticky add-to-cart bar), checkout and the
 * standalone auth screens.
 */
const HIDDEN_PREFIXES = [
  '/admin',
  '/product/',
  '/checkout',
  '/forgot-password',
  '/reset-password',
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { state } = useStore();

  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const cartCount = state.cart.reduce((n, item) => n + (item.quantity || 1), 0);
  const account = state.isLoggedIn
    ? { to: '/account/profile', label: 'Account' }
    : { to: '/login', label: 'Login' };

  const tabs = [
    { to: account.to, label: account.label, icon: User },
    { to: '/categories', label: 'Categories', icon: LayoutGrid },
    null, // center search
    { to: '/new-arrivals', label: 'New Arrivals', icon: Sparkles },
    { to: '/cart', label: 'Cart', icon: ShoppingBag, badge: cartCount },
  ] as const;

  const isActive = (to: string) => location.pathname === to;

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-border shadow-[0_-4px_14px_rgba(43,27,18,0.08)]"
    >
      <div className="grid grid-cols-5 items-end pt-2 pb-1.5">
        {tabs.map((tab, i) => {
          if (tab === null) {
            return (
              <Link
                key="search"
                to="/products"
                aria-label="Search products"
                className="flex flex-col items-center gap-1 -mt-7"
              >
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-espresso text-ivory border-[3px] border-white ring-1 ring-gold shadow-lg">
                  <Search className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="text-[10px] tracking-wide text-espresso/80">Search</span>
              </Link>
            );
          }

          const Icon = tab.icon;
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to + i}
              to={tab.to}
              className="flex flex-col items-center gap-1"
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 ${active ? 'text-maroon' : 'text-espresso'}`}
                  strokeWidth={1.6}
                />
                {'badge' in tab && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-maroon px-1 text-[9px] font-semibold text-ivory">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </span>
              <span
                className={`whitespace-nowrap text-[10px] tracking-wide ${
                  active ? 'font-semibold text-maroon' : 'text-espresso/80'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
