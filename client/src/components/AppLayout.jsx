import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import Header from './Header';
import ReminderNotification from './ReminderNotification';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../lib/api';
import { useToast } from './ui/use-toast.js';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Only fetch profile if we're not on a client page
  const isClientPage = location.startsWith('/clients/');
  const { data: userData, error } = useQuery({
    queryKey: ['/api/auth/profile'],
    queryFn: getProfile,
    retry: false,
    enabled: !isClientPage, // Only fetch profile if not on client page
    onError: (err) => {
      if (err.message.includes('401') && !isClientPage) {
        setLocation('/login');
        toast({
          title: 'Authentication required',
          description: 'Please log in to continue',
          variant: 'destructive',
        });
      }
    },
  });

  const user = userData?.data;

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sidebarOpen &&
        !e.target.closest('#mobile-sidebar') &&
        !e.target.closest('#mobile-menu-button')
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  if (location === '/login') return children;

  return (
    <div className="flex h-screen bg-background dark:bg-gray-900">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black opacity-50"></div>
        <div id="mobile-sidebar" className="fixed inset-y-0 left-0 w-12 bg-white dark:bg-gray-900 shadow-lg z-50">
          <Sidebar user={user} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="w-16 md:w-48">
          <Sidebar user={user} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={user} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
          {user && <ReminderNotification />}
        </main>

        {/* Footer */}
        <footer className="border-t bg-white dark:bg-gray-900 py-4 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2023 Visa CRM. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">Contact Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
