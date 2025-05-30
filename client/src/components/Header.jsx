import { useState } from "react";
import { BellIcon, MenuIcon, SearchIcon, Plus, Moon, Sun } from "lucide-react";
import { useToast } from './ui/use-toast.js';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import CreateBranchModal from "../pages/CreateBranchModal";
import { useDarkMode } from "../App";

const dummyBranches = [
  { id: "dubai", name: "Dubai Branch" },
  { id: "abu-dhabi", name: "Abu Dhabi Branch" },
];

function Header({ toggleSidebar, user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(dummyBranches[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      {/* Modal */}
      {showCreateModal && (
        <CreateBranchModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBranch}
        />
      )}
    </header>
  );
}

export default Header;

// Import this at the top if not already
