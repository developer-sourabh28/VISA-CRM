import { useState } from 'react';
import { BellIcon, MenuIcon, SearchIcon } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../lib/api';

function Header({ toggleSidebar, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation for logout
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
      queryClient.setQueryData(['/api/auth/profile'], null);
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      // Redirect to login page
      window.location.href = '/login';
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Implement search functionality
    toast({
      title: "Search",
      description: `Searching for: ${searchQuery}`,
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 shadow-sm">
      <button 
        type="button" 
        className="mr-4 rounded-md md:hidden"
        onClick={toggleSidebar}
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      
      <div className="relative w-full max-w-md">
        <form onSubmit={handleSearchSubmit}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      
      <div className="ml-auto flex items-center space-x-4">
        <button 
          type="button"
          className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
        </button>
        
        <div className="relative">
          <div>
            <button
              type="button"
              className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={handleLogout}
              title="Click to logout"
            >
              <img
                className="h-8 w-8 rounded-full"
                src={user?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                alt={user ? `${user.firstName} ${user.lastName}` : "User profile"}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
