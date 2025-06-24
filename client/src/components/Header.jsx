import { useState, useEffect } from "react";
import { MenuIcon, SearchIcon, Moon, Sun, Activity, ChevronDown, X, Plus } from "lucide-react";
import { useToast } from './ui/use-toast.js';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import CreateBranchModal from "../pages/CreateBranchModal";
import { useDarkMode } from "../App";
import { useQuery } from "@tanstack/react-query";
import { getRecentActivities } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, UserPlus, UserCheck, Mail, CalendarPlus, DollarSign, CheckCircle2, TrendingUp, Calendar, FileText } from "lucide-react";
import { useBranch } from "../contexts/BranchContext";
import NotificationBell from "./NotificationBell";
import ProfileDropdown from "./ProfileDropdown";

function Header({ toggleSidebar, user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedBranch, updateSelectedBranch } = useBranch();

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/branches"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/branches", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data;
    },
  });

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activities"],
    queryFn: getRecentActivities,
    refetchInterval: 60000, // Refresh every minute
  });

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "new-client":
        return <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "enquiry-converted":
        return <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "new-enquiry":
        return <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case "new-appointment":
        return <CalendarPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case "payment-received":
        return <DollarSign className="h-4 w-4 text-green-700 dark:text-green-300" />;
      case "task-completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "status-update":
        return <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "note":
        return <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "visa-approved":
        return <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-300" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
    }
  };

  const getActivityBg = (type) => {
    switch (type) {
      case "new-client":
        return "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500";
      case "enquiry-converted":
        return "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500";
      case "new-enquiry":
        return "bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500";
      case "new-appointment":
        return "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500";
      case "payment-received":
        return "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600";
      case "task-completed":
        return "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500";
      case "status-update":
        return "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500";
      case "appointment":
        return "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500";
      case "note":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500";
      case "visa-approved":
        return "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600";
      default:
        return "bg-gray-50 dark:bg-gray-800/20 border-l-4 border-gray-400";
    }
  };

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/profile"] });
      queryClient.setQueryData(["/api/auth/profile"], null);
      toast({ title: "Logged out successfully" });
      window.location.href = "/login";
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => logoutMutation.mutate();
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    toast({ title: "Searching", description: searchQuery });
  };
  const handleBranchSelect = (branch) => {
    updateSelectedBranch({
      branchName: branch.branchName,
      branchId: branch.branchId, // Always use branchId
      branchLocation: branch.branchLocation
    });
    setDropdownOpen(false);
    toast({ 
      title: "Branch Switched", 
      description: branch.branchName === "All Branches" ? "Showing all branches" : `Switched to ${branch.branchName}` 
    });
  };

  const handleCreateBranch = async (formData) => {
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Branch created successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      } else {
        throw new Error(data.message || "Something went wrong");
      }
    } catch (err) {
      toast({
        title: "Error creating branch",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300 md:hidden"
              onClick={toggleSidebar}
            >
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </button>
            
            {/* Logo/Brand - Optional */}
            {/* <div className="hidden md:flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div> */}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search Bar - Optional */}
            {/* <div className="hidden lg:flex items-center">
              <form onSubmit={handleSearchSubmit} className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
                />
              </form>
            </div> */}

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </button>

            {/* Activity Button */}
            <button
              onClick={() => setShowActivityModal(true)}
              className="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              title="Today's Activity"
            >
              <Activity className="h-5 w-5" />
              {activitiesData?.data && activitiesData.data.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-900">
                  <span className="sr-only">New activities</span>
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Branch Selector */}
            <div className="relative">
              {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN') ? (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800"
                  >
                    <span className="truncate max-w-32">
                      {selectedBranch?.branchName || (user?.branchId === 'all' ? 'All Branches' : user?.branch) || "Select Branch"}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setDropdownOpen(false)}
                      />
                      
                      {/* Dropdown */}
                      <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
                        <div className="p-1">
                          <button
                            onClick={() => {
                              handleBranchSelect({
                                branchName: "All Branches",
                                branchId: "all",
                                branchLocation: "All Locations"
                              });
                            }}
                            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                          >
                            All Branches
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              View all locations
                            </span>
                          </button>
                          
                          {(Array.isArray(branchesData) ? branchesData : branchesData?.data || []).map((branch) => (
                            <button
                              key={branch._id}
                              onClick={() => handleBranchSelect(branch)}
                              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                            >
                              {branch.branchName}
                              {branch.branchLocation && (
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                  {branch.branchLocation}
                                </span>
                              )}
                            </button>
                          ))}
                          
                          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                            <button
                              onClick={() => {
                                setDropdownOpen(false);
                                setShowCreateModal(true);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <Plus className="h-4 w-4" />
                              Create New Branch
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="inline-flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {user?.branch || "No Branch Assigned"}
                </div>
              )}
            </div>

            {/* User Avatar & Logout */}
            <ProfileDropdown user={user} />
          </div>
        </div>
      </header>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowActivityModal(false)}
            />
            
            {/* Modal */}
            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  onClick={() => setShowActivityModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-shrink-0">
                      <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Today's Activity
                    </h3>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {activitiesLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : activitiesData?.data?.length > 0 ? (
                      <div className="space-y-3">
                        {activitiesData.data.map((activity) => (
                          <div
                            key={activity._id}
                            className={`flex items-start gap-3 p-4 rounded-lg ${getActivityBg(activity.type)}`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatTimeAgo(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                          No activities yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Activity will appear here as it happens.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && (
        <CreateBranchModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBranch}
        />
      )}
    </>
  );
}

export default Header;