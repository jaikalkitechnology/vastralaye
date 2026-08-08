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

  return (
    <aside className="w-full self-start rounded-sm border border-border bg-white md:w-60">
      {/* HEADER */}
      <div className="border-b border-border px-5 py-5">
        <h2 className="font-serif text-xl font-medium text-espresso">My Account</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {state.user?.name
            ? `Welcome, ${state.user.name}`
            : "Manage your account settings"}
        </p>
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
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 border-l-2 border-transparent px-5 py-3 text-left text-[13px] uppercase tracking-[0.1em] text-sale transition-colors hover:bg-sale/5"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </nav>
    </aside>
  );
};

export default UserSidebar;
