import { useState } from "react";
import { BellIcon, MenuIcon, SearchIcon, Plus, Moon, Sun, Activity } from "lucide-react";
import { useToast } from './ui/use-toast.js';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import CreateBranchModal from "../pages/CreateBranchModal";
import { useDarkMode } from "../App";
import { useQuery } from "@tanstack/react-query";
import { getRecentActivities } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, UserPlus, UserCheck, Mail, CalendarPlus, DollarSign, CheckCircle2, TrendingUp, Calendar, FileText } from "lucide-react";

const dummyBranches = [
  { id: "dubai", name: "Dubai Branch" },
  { id: "abu-dhabi", name: "Abu Dhabi Branch" },
];

function Header({ toggleSidebar, user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(dummyBranches[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        return "bg-blue-100 dark:bg-blue-900/50";
      case "enquiry-converted":
        return "bg-green-100 dark:bg-green-900/50";
      case "new-enquiry":
        return "bg-purple-100 dark:bg-purple-900/50";
      case "new-appointment":
        return "bg-indigo-100 dark:bg-indigo-900/50";
      case "payment-received":
        return "bg-green-200 dark:bg-green-800/50";
      case "task-completed":
        return "bg-emerald-100 dark:bg-emerald-900/50";
      case "status-update":
        return "bg-orange-100 dark:bg-orange-900/50";
      case "appointment":
        return "bg-blue-100 dark:bg-blue-900/50";
      case "note":
        return "bg-yellow-100 dark:bg-yellow-900/50";
      case "visa-approved":
        return "bg-green-200 dark:bg-green-800/50";
      default:
        return "bg-gray-100 dark:bg-gray-800/50";
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
    setSelectedBranch(branch);
    setDropdownOpen(false);
    toast({ title: "Branch Switched", description: branch.name });
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
        // TODO: Optionally refresh branch list
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
      <header className="sticky top-0 z-10 flex h-16 items-center bg-sidebar-background px-4 shadow-sm dark:bg-gray-800">
        <button
          type="button"
          className="mr-4 rounded-md md:hidden"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-6 w-6 dark:text-white" />
        </button>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Activity Button */}
          <button
            onClick={() => setShowActivityModal(true)}
            className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:text-gray-100"
            title="Today's Activity"
          >
            <Activity className="h-6 w-6" />
            {activitiesData?.data && activitiesData.data.length > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
            )}
          </button>

          {/* Notifications */}
          <button className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:text-gray-100">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>

          {/* Branch Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {selectedBranch.name}
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white shadow dark:bg-gray-800 dark:text-gray-200">
                {dummyBranches.map((branch) => (
                  <div
                    key={branch.id}
                    onClick={() => handleBranchSelect(branch)}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {branch.name}
                  </div>
                ))}
                <div className="border-t px-4 py-2 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2 text-blue-600 text-sm hover:underline dark:text-blue-400"
                  >
                    <Plus className="h-4 w-4" />
                    Create Branch
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <button
            className="rounded-full bg-white text-sm focus:outline-none dark:bg-gray-700"
            onClick={handleLogout}
            title="Logout"
          >
            <img
              className="h-8 w-8 rounded-full"
              src={user?.profileImage || "https://i.pravatar.cc/40"}
              alt="Profile"
            />
          </button>
        </div>
      </header>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-2xl font-bold dark:text-white">Today's Activity</h2>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading activities...</p>
                  </div>
                </div>
              ) : activitiesData?.data && activitiesData.data.length > 0 ? (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {activitiesData.data.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className={`p-2 rounded-full ${getActivityBg(activity.type)} flex-shrink-0`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities today</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No activities have been recorded today yet.
                  </p>
                </div>
              )}
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

// Import this at the top if not already
