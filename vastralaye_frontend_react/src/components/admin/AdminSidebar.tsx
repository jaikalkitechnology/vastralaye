import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Tag,
  LogOut,
  FolderTree,
  BarChart,
  TrendingUp,
  MessageSquare,
  Clapperboard,
  ExternalLink,
  GalleryHorizontal,
  Quote,
  Settings,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

const ICON_CLASS = 'h-[17px] w-[17px] flex-none';

const AdminSidebar = () => {
  const { logout, state } = useStore();
  const location = useLocation();
  const { currentUser } = state;

  // Same destinations as before (Reels kept, Analytics re-enabled),
  // grouped under the §2 section labels.
  const navSections: SidebarSection[] = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className={ICON_CLASS} /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <BarChart className={ICON_CLASS} /> },
      ],
    },
    {
      label: 'Catalog',
      items: [
        { name: 'Products', path: '/admin/products', icon: <ShoppingBag className={ICON_CLASS} /> },
        { name: 'Categories', path: '/admin/categories', icon: <FolderTree className={ICON_CLASS} /> },
        { name: 'Coupons', path: '/admin/coupons', icon: <Tag className={ICON_CLASS} /> },
        { name: 'Reels', path: '/admin/reels', icon: <Clapperboard className={ICON_CLASS} /> },
      ],
    },
    {
      label: 'Content',
      items: [
        { name: 'Banners', path: '/admin/banners', icon: <GalleryHorizontal className={ICON_CLASS} /> },
        { name: 'Testimonials', path: '/admin/testimonials', icon: <Quote className={ICON_CLASS} /> },
      ],
    },
    {
      label: 'Sales',
      items: [
        { name: 'Orders', path: '/admin/orders', icon: <TrendingUp className={ICON_CLASS} /> },
        { name: 'Reviews', path: '/admin/reviews', icon: <MessageSquare className={ICON_CLASS} /> },
      ],
    },
    {
      label: 'Customers',
      items: [
        { name: 'Users', path: '/admin/users', icon: <Users className={ICON_CLASS} /> },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const firstName = currentUser?.first_name || currentUser?.firstName || '';
  const lastName = currentUser?.last_name || currentUser?.lastName || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Admin';
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    firstName.charAt(0).toUpperCase() ||
    'A';

  const itemClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 border-l-[3px] px-5 py-[9px] text-[13.5px] transition-colors',
      active
        ? 'border-gold bg-gold/10 font-medium text-gold'
        : 'border-transparent text-ivory/75 hover:bg-ivory/5 hover:text-ivory',
    );

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col bg-espresso text-ivory/75">
      {/* Brand */}
      <div className="border-b border-ivory/10 px-5 pb-5 pt-6">
        <Link to="/admin" className="block">
          <span className="font-serif text-[22px] font-semibold leading-none text-ivory">
            Vastra<span className="text-gold">laye</span>
          </span>
          <span className="mt-1.5 block text-[8.5px] uppercase tracking-[0.4em] text-gold">
            Handcrafted India
          </span>
        </Link>
        <span className="mt-3 inline-block rounded-full border border-ivory/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-ivory/55">
          Admin Panel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-5 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">
              {section.label}
            </p>
            {section.items.map((item) => (
              <Link key={item.path} to={item.path} className={itemClass(isActive(item.path))}>
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-ivory/10 pb-4 pt-2">
        <Link to="/admin/settings" className={itemClass(isActive('/admin/settings'))}>
          <Settings className={ICON_CLASS} />
          <span>Store Settings</span>
        </Link>
        <Link to="/" className={itemClass(false)}>
          <ExternalLink className={ICON_CLASS} />
          <span>View store</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className={cn(itemClass(false), 'w-full text-left')}
        >
          <LogOut className={ICON_CLASS} />
          <span>Logout</span>
        </button>

        {/* Admin identity chip */}
        <div className="mt-2 flex items-center gap-3 px-5 pt-2">
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-gold text-[13px] font-semibold text-espresso">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium leading-tight text-ivory">
              {displayName}
            </span>
            <span className="block truncate text-[11px] text-ivory/50">
              {currentUser?.email || 'Administrator'}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
