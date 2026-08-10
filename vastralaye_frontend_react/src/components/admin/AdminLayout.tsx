import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Routes wrap pages in <AdminLayout> AND several admin pages still wrap
 * themselves in it. This context makes nested instances pass-through so
 * the shell (sidebar + topbar + canvas) only ever renders once.
 */
const AdminShellContext = createContext(false);

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const insideShell = useContext(AdminShellContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useStore();
  const { isLoggedIn, currentUser } = state;

  /* Mobile/tablet sidebar drawer (static rail on lg+) */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (insideShell) return;
    if (isLoggedIn === false || (currentUser && currentUser.role !== 'admin')) {
      navigate('/login');
    }
  }, [insideShell, isLoggedIn, currentUser, navigate]);

  // Nested usage: the outer shell already renders the frame.
  if (insideShell) {
    return <>{children}</>;
  }

  // If not logged in or not admin, the useEffect above redirects.
  if (!isLoggedIn || currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <AdminShellContext.Provider value={true}>
      <div className="min-h-screen bg-[#F7F4EF] font-sans text-espresso">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Content column — offset by the fixed 240px rail on lg+, full width below */}
        <div className="flex min-h-screen flex-col lg:ml-60">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
};

export default AdminLayout;
