import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      icon: <User className="h-5 w-5" />,
    },
    {
      name: "My Orders",
      path: "/account/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      name: "Account Settings",
      path: "/account/settings",
      icon: <Settings className="h-5 w-5" />,
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
    <Card className="w-full md:w-72 p-6 border-0 shadow-lg rounded-2xl bg-white">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#559F4B] to-[#E1783E] bg-clip-text text-transparent">
          My Account
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          {state.user?.name
            ? `Welcome, ${state.user.name}`
            : "Manage your account settings"}
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              relative flex items-center px-4 py-3.5 rounded-xl
              transition-all duration-300 group
              ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-[#559F4B]/10 to-[#E1783E]/10 border-l-4 border-[#559F4B]"
                  : "hover:bg-gradient-to-r hover:from-[#559F4B]/5 hover:to-[#E1783E]/5 border-l-4 border-transparent"
              }
            `}
          >
            {/* ICON */}
            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center mr-3
                transition-all duration-300
                ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white"
                    : "bg-gray-100 text-gray-600 group-hover:text-[#559F4B]"
                }
              `}
            >
              {item.icon}
            </div>

            {/* TEXT */}
            <span
              className={`
                font-medium
                ${
                  isActive(item.path)
                    ? "text-gray-900"
                    : "text-gray-700 group-hover:text-gray-900"
                }
              `}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="
            w-full flex items-center px-4 py-3.5 rounded-xl
            bg-gradient-to-r from-red-50 to-red-50/50
            hover:from-red-100 hover:to-red-100/50
            text-red-600 hover:text-red-700
            transition-all duration-300
            group
          "
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-red-100 group-hover:bg-red-200 transition-colors">
            <LogOut className="h-5 w-5" />
          </div>

          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </Card>
  );
};

export default UserSidebar;