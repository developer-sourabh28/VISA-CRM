import { useState } from 'react';
import { BellIcon, MenuIcon, SearchIcon, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../lib/api';

const dummyBranches = [
  { id: 'dubai', name: 'Dubai Branch' },
  { id: 'abu-dhabi', name: 'Abu Dhabi Branch' },
];

function Header({ toggleSidebar, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(dummyBranches[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
      queryClient.setQueryData(['/api/auth/profile'], null);
      toast({ title: "Logged out successfully" });
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
    toast({
      title: "Search",
      description: `Searching for: ${searchQuery}`,
    });
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setDropdownOpen(false);
    toast({
      title: "Branch Changed",
      description: `Selected: ${branch.name}`,
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 shadow-sm">
      <button type="button" className="mr-4 rounded-md md:hidden" onClick={toggleSidebar}>
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <form onSubmit={handleSearchSubmit}>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notification */}
        <button className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none">
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
        </button>

        {/* Branch Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
          >
            {selectedBranch.name}
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border bg-white shadow">
              {dummyBranches.map(branch => (
                <div
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch)}
                  className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100"
                >
                  {branch.name}
                </div>
              ))}
              <div className="border-t px-4 py-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 text-blue-600 text-sm hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Create Branch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar/Logout */}
        <button
          className="rounded-full bg-white text-sm focus:outline-none"
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

      {/* Create Branch Modal */}
 {showCreateModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm px-4">
    <div className="w-full max-w-3xl rounded-xl bg-white shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Create New Branch</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Submit logic
          toast({ title: "Branch created (mocked)" });
          setShowCreateModal(false);
        }}
        className="space-y-8"
      >
        {/* Branch Info */}
        <section>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Branch Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Branch Name</label>
              <input type="text" required placeholder="e.g. Dubai Office" className="form-input" />
            </div>
            <div>
              <label className="form-label">Branch Location</label>
              <input type="text" required placeholder="e.g. Sheikh Zayed Road" className="form-input" />
            </div>
            <div>
              <label className="form-label">Branch ID</label>
              <input type="text" required placeholder="Unique Branch ID" className="form-input" />
            </div>
            <div>
              <label className="form-label">Branch Email</label>
              <input type="email" required placeholder="branch@email.com" className="form-input" />
            </div>
            <div>
              <label className="form-label">Contact Number</label>
              <input type="tel" required placeholder="+971 50 123 4567" className="form-input" />
            </div>
          </div>
        </section>

        {/* Branch Head */}
        <section>
          <h3 className="text-lg font-medium text-gray-700 mb-4 border-t pt-4">Branch Head Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" required placeholder="John Doe" className="form-input" />
            </div>
            <div>
              <label className="form-label">Contact Number</label>
              <input type="tel" required placeholder="+971 55 654 3210" className="form-input" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" required placeholder="head@email.com" className="form-input" />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select required className="form-input">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            className="text-sm text-gray-600 px-4 py-2 rounded-md hover:underline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-md shadow-sm"
          >
            Create Branch
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </header>
  );
}

export default Header;
