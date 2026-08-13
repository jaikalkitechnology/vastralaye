
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import UserSidebar from './UserSidebar';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const navigate = useNavigate();
  const { state } = useStore();
  const { isLoggedIn } = state;

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const user = state.currentUser;
  const firstName =
    (user?.first_name || user?.firstName || '').trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    '';

  return (
    <div className="min-h-screen bg-background">
      {/* ESPRESSO ACCOUNT BAND */}
      <div className="bg-espresso border-b-[3px] border-gold">
        <div className="container mx-auto flex items-end justify-between gap-5 px-4 py-6 md:py-7">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/55">
              Home · <span className="text-gold font-medium">My Account</span>
            </p>
            <h1 className="font-serif text-2xl md:text-[32px] font-medium text-ivory mt-1.5">
              {firstName ? `Namaste, ${firstName}` : 'My Account'}
            </h1>
          </div>
          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/55 px-3.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold">
              <span className="w-1.5 h-1.5 border border-gold rotate-45" />
              Vastraliya Member
            </span>
            <p className="text-[12.5px] text-ivory/65 mt-1.5">Handcrafted wardrobe, managed here</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:gap-10">
          <UserSidebar />
          <div className="min-w-0 flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
