import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
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
  const { state, dispatch } = useStore();

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

  // ✅ FIXED LOGOUT FUNCTION
  const handleSignOut = () => {
    try {
      // clear storage
      localStorage.clear();
      sessionStorage.clear();

      // update global state
      // @ts-expect-error — pre-existing "LOGOUT" action is not part of the typed reducer union
      dispatch({ type: "LOGOUT" });

      toast.success("Signed out successfully");

      // redirect user
      navigate("/login", { replace: true });

      // optional reload to reset app state
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out");
    }
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
  const avatarUrl = storeUser?.avatar;
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
            className="flex w-full items-center gap-3 border-l-2 border-transparent px-5 py-3 text-left text-[13px] uppercase tracking-[0.1em] text-sale transition-colors hover:bg-sale/5"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;
