import { useState } from "react";
import { useLocation } from "wouter";
import { User, Settings, LogOut, Lock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import { useToast } from "./ui/use-toast.js";
import { useUser } from "../context/UserContext";

function ProfileDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logout: userContextLogout } = useUser();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear queries
      queryClient.invalidateQueries();
      queryClient.clear();
      
      // Update user context
      userContextLogout();
      
      // Show toast
      toast({ title: "Logged out successfully" });
      
      // Navigate to login
      navigate("/login");
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    setIsOpen(false);
    logoutMutation.mutate();
  };

  const navigateTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition-colors"
        aria-label="User menu"
      >
        <img
          className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
          src={user?.profileImage || "https://i.pravatar.cc/40"}
          alt="Profile"
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown panel */}
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10 overflow-hidden">
            {/* User info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <img
                  className="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                  src={user?.profileImage || "https://i.pravatar.cc/40"}
                  alt="Profile"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.name || "User"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email || "user@example.com"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Menu items */}
            <div className="p-2">
              <button
                onClick={() => navigateTo("/profile")}
                className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </button>
              
              <button
                onClick={() => navigateTo("/settings")}
                className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </button>
              
              <button
                onClick={() => navigateTo("/change-password")}
                className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </button>
              
              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
              
              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileDropdown; 