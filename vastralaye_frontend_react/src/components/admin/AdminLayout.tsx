import { createContext, Suspense, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import AdminLoading from './AdminLoading';

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
  const { isLoggedIn, currentUser, authChecked } = state;

  const isAdmin = isLoggedIn && currentUser?.role === 'admin';

  /* Mobile/tablet sidebar drawer (static rail on lg+) */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (insideShell) return;
    /* Wait for the session check. Before it lands, "not logged in" only means
       "not known yet" — the store starts every page load that way. Redirecting
       on it is what bounced every admin refresh out to /login. */
    if (!authChecked) return;
    if (!isAdmin) {
      navigate('/login', { replace: true });
    }
  }, [insideShell, authChecked, isAdmin, navigate]);

  // Nested usage: the outer shell already renders the frame.
  if (insideShell) {
    return <>{children}</>;
  }

  if (!isAdmin) {
    /* Checked and genuinely not an admin — the effect above is redirecting.
       Still checking, with no remembered session to go on — hold the ground
       with the dashboard's own loader rather than a flash of nothing. */
    return authChecked ? null : (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F4EF]">
        <AdminLoading />
      </div>
    );
  }

  return (
    <AdminShellContext.Provider value={true}>
      <div className="min-h-screen bg-[#F7F4EF] font-sans text-espresso">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Content column — offset by the fixed 240px rail on lg+, full width below */}
        <div className="flex min-h-screen flex-col lg:ml-60">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
            {/* Scoped to the canvas on purpose. Admin pages are code-split, and
                the app-wide boundary in App.tsx would blank the sidebar and
                topbar too while the next page's chunk downloads — the whole
                dashboard flashing for what is really just this panel changing.
                Catching it here keeps the frame on screen and swaps the panel. */}
            <Suspense fallback={<AdminLoading />}>{children}</Suspense>
          </main>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
};

export default AdminLayout;
