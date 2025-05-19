import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import Header from './Header';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../lib/api';
import { useToast } from '../hooks/use-toast';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch user profile
  const { data: userData, error, isLoading } = useQuery({
    queryKey: ['/api/auth/profile'],
    queryFn: getProfile,
    retry: false,
    onError: (err) => {
      // Redirect to login if not authenticated
      if (err.message.includes('401')) {
        setLocation('/login');
        toast({
          title: "Authentication required",
          description: "Please log in to continue",
          variant: "destructive",
        });
      }
    }
  });
  
  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sidebarOpen && !e.target.closest('aside')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [sidebarOpen]);
  
  // If on login page, don't show layout
  if (location === '/login') {
    return children;
  }
  
  const user = userData?.data;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true"></div>
          <Sidebar user={user} />
        </div>
      )}
      
      {/* Desktop sidebar */}
      <Sidebar user={user} />
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto md:ml-64">
        <Header toggleSidebar={toggleSidebar} user={user} />
        
        <main className="p-4 md:p-6">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-white py-4 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-500">© 2023 Visa CRM. All rights reserved.</p>
            </div>
            <div className="mt-4 flex space-x-4 md:mt-0 md:space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Contact Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
