import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

interface PageMeta {
  prefix: string;
  title: string;
  context?: string;
}

/** Longest prefix first so nested paths resolve correctly */
const PAGE_META: PageMeta[] = [
  { prefix: '/admin/analytics', title: 'Analytics', context: 'Sales, orders & customer trends' },
  { prefix: '/admin/products', title: 'Products', context: 'Manage your catalog' },
  { prefix: '/admin/categories', title: 'Categories', context: 'Collections & subcategories' },
  { prefix: '/admin/coupons', title: 'Coupons', context: 'Discount codes & promotions' },
  { prefix: '/admin/reels', title: 'Reels', context: 'Product videos on the storefront' },
  { prefix: '/admin/banners', title: 'Banners', context: 'Homepage hero slides' },
  { prefix: '/admin/testimonials', title: 'Testimonials', context: 'Customer quotes on the homepage' },
  { prefix: '/admin/settings', title: 'Store Settings', context: 'Social links & WhatsApp chat' },
  { prefix: '/admin/orders', title: 'Orders', context: 'Track & fulfil customer orders' },
  { prefix: '/admin/reviews', title: 'Reviews', context: 'Moderate customer feedback' },
  { prefix: '/admin/users', title: 'Users', context: 'Customer accounts & access' },
  { prefix: '/admin', title: 'Dashboard' },
];

const AdminTopbar = () => {
  const location = useLocation();
  const { state } = useStore();
  const { currentUser } = state;

  const meta =
    PAGE_META.find(
      (m) => location.pathname === m.prefix || location.pathname.startsWith(`${m.prefix}/`),
    ) ?? PAGE_META[PAGE_META.length - 1];

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const context =
    meta.title === 'Dashboard' ? `${today} · here's how the store is doing` : meta.context;

  const firstName = currentUser?.first_name || currentUser?.firstName || '';
  const lastName = currentUser?.last_name || currentUser?.lastName || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Admin';
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    firstName.charAt(0).toUpperCase() ||
    'A';

  return (
    <header className="sticky top-0 z-40 flex h-16 flex-none items-center gap-4 border-b border-border bg-white px-6 lg:px-8">
      {/* Page title + context */}
      <div className="min-w-0">
        <h1 className="truncate font-serif text-xl font-medium leading-tight text-espresso">
          {meta.title}
        </h1>
        {context && <p className="truncate text-xs text-[#6E5F53]">{context}</p>}
      </div>

      {/* Search (visual placeholder) */}
      <div className="ml-auto hidden w-72 items-center gap-2.5 rounded-md border border-border bg-[#F7F4EF] px-3 py-2 text-[13px] text-[#6E5F53] lg:flex">
        <Search className="h-4 w-4 flex-none" />
        <span className="truncate">Search orders, products…</span>
        <kbd className="ml-auto rounded border border-border bg-white px-1.5 py-px font-sans text-[10.5px] text-[#6E5F53]">
          ⌘K
        </kbd>
      </div>

      {/* Notification bell (placeholder) */}
      <button
        type="button"
        aria-label="Notifications"
        className="relative ml-auto flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border text-[#6E5F53] transition-colors hover:bg-[#FBF8F3] lg:ml-0"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-1.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#C62828]" />
      </button>

      {/* Admin chip */}
      <div className="flex flex-none items-center gap-2.5 rounded-md border border-border py-1 pl-1.5 pr-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-[11.5px] font-semibold text-ivory">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[140px] truncate text-[12.5px] font-medium leading-tight text-espresso">
            {displayName}
          </span>
          <span className="block text-[10.5px] leading-tight text-[#6E5F53]">Administrator</span>
        </span>
      </div>
    </header>
  );
};

export default AdminTopbar;
