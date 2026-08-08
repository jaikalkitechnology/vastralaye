import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Tag,
  Home,
  LogOut,
  FolderTree,
  BarChart,
  Package,
  TrendingUp,
  MessageSquare,
  Clapperboard
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const AdminSidebar = () => {
  const { logout, state } = useStore();
  const location = useLocation();
  const { currentUser } = state;
  
  const navItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Products',
      path: '/admin/products',
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Categories',
      path: '/admin/categories',
      icon: <FolderTree className="h-5 w-5" />,
    },
    {
      name: 'Coupons',
      path: '/admin/coupons',
      icon: <Tag className="h-5 w-5" />,
    },
    {
      name: 'Reels',
      path: '/admin/reels',
      icon: <Clapperboard className="h-5 w-5" />,
    },
    // {
    //   name: 'Analytics',
    //   path: '/admin/analytics',
    //   icon: <BarChart className="h-5 w-5" />,
    // },
    {
      name: 'Reviews',
      path: '/admin/reviews',
      icon: <MessageSquare className="h-5 w-5" />,
    }
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
  
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-950 text-white h-screen flex flex-col w-64 fixed left-0 top-0 z-50 border-r border-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center shadow-md">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Vastralaye</h1>
            <p className="text-gray-400 text-sm">Admin Panel</p>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                  active
                    ? "bg-gradient-to-r from-[#7A1F2B]/20 to-[#B85C38]/20 text-white border-l-4 border-[#7A1F2B]"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <div className={cn(
                  "transition-colors",
                  active ? "text-white" : "text-gray-400"
                )}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {currentUser?.first_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentUser?.first_name} {currentUser?.last_name}
            </p>
            <p className="text-gray-400 text-xs truncate">Administrator</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to="/" className="flex-1">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full border-gray-700/0 text-gray-300 bg-gray-800 hover:text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Store
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-700/0 text-gray-300 bg-red-600/20 text-white hover:border-red-500/30"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;