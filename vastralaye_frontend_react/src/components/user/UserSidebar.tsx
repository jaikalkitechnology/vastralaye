import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import { mediaUrl } from '@/lib/media';
import { useStore } from "@/contexts/StoreContext";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const UserSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, logout } = useStore();
  const [signingOut, setSigningOut] = useState(false);

  const navItems: SidebarItem[] = [
    {
      name: "My Profile",
      path: "/account/profile",
      icon: <User className="h-4 w-4" />,
    },
    {
      name: "My Orders",
      path: "/account/orders",
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      name: "Account Settings",
      path: "/account/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Smooth SPA sign-out: the context's logout() resets auth state in
  // memory (so the navbar updates instantly) — no hard page reload.
  const handleSignOut = () => {
    if (signingOut) return;
    setSigningOut(true);

    // Brief pause so the "Signing out…" feedback is visible instead of
    // the view vanishing mid-click.
    setTimeout(() => {
      try {
        // Legacy token keys not covered by the context's logout()
        ["access_token", "userToken", "accessToken"].forEach((k) =>
          localStorage.removeItem(k)
        );
        sessionStorage.clear();

        logout();
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Failed to sign out");
        setSigningOut(false);
      }
    }, 400);
  };

  const storeUser = state.currentUser;
  const fullName = [
    storeUser?.first_name || storeUser?.firstName,
    storeUser?.last_name || storeUser?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const displayName = fullName || "My Account";
  const email = storeUser?.email;
  // /users/me returns the stored path as-is, so resolve it here: local
  // uploads need the API origin, Google picture URLs must not be touched.
  const avatarUrl = mediaUrl(storeUser?.avatar);
  const initial = (fullName || email || "M").charAt(0).toUpperCase();

  return (
    <aside className="w-full self-start rounded-sm border border-border bg-white overflow-hidden md:w-64 md:sticky md:top-24">
      {/* IDENTITY HEADER */}
      <div className="flex items-center gap-3 border-b border-border bg-gradient-to-b from-ivory to-white px-5 py-5">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white ring-1 ring-gold">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-sand font-serif text-maroon">
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-serif text-[15.5px] font-medium text-espresso leading-tight">
            {displayName}
          </p>
          {email && (
            <p className="text-[11.5px] text-muted-foreground truncate">{email}</p>
          )}
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="py-2.5">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 border-l-2 px-5 py-3 text-[13px] uppercase tracking-[0.1em] transition-colors ${
              isActive(item.path)
                ? "border-gold bg-ivory font-semibold text-espresso"
                : "border-transparent text-muted-foreground hover:bg-ivory hover:text-espresso"
            }`}
          >
            <span className={isActive(item.path) ? "text-maroon" : "text-muted-foreground"}>
              {item.icon}
            </span>
            {item.name}
          </Link>
        ))}

        {/* SIGN OUT */}
        <div className="border-t border-border mt-1.5 pt-1.5">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 border-l-2 border-transparent px-5 py-3 text-left text-[13px] uppercase tracking-[0.1em] text-sale transition-colors hover:bg-sale/5 disabled:opacity-60"
          >
            {signingOut ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-sale border-t-transparent" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {signingOut ? "Signing Out…" : "Sign Out"}
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;
