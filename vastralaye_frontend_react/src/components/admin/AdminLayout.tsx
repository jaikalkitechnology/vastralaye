
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { state } = useStore();
  const { isLoggedIn, currentUser } = state;
  
useEffect(() => {
  if (isLoggedIn === false || (currentUser && currentUser.role !== 'admin')) {
    navigate('/login');
  }
}, [isLoggedIn, currentUser, navigate]);

  
  // For debugging purposes
  useEffect(() => {
    console.log('Admin Layout - Current User:', currentUser);
    console.log('Admin Layout - Is Logged In:', isLoggedIn);
  }, [currentUser, isLoggedIn]);
  
  // If not logged in or not admin, we'll redirect in the useEffect
  // Don't return null here as it prevents the layout from rendering
  if (!isLoggedIn || currentUser?.role !== 'admin') {
    console.log('Not showing admin layout because user is not admin or not logged in');
    return null;
  }
  
  console.log('Rendering admin layout');
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <AdminSidebar />
      <div className="ml-[7rem] p-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
