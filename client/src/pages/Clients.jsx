import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Search,
  User,
  Filter,
  Calendar,
  BarChart2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../lib/api.js';
import { useToast } from "../components/ui/use-toast.js";
import { useBranch } from '../contexts/BranchContext';
import { apiRequest } from '../lib/api.js';

function Clients() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [visaType, setVisaType] = useState('');
  const [consultant, setConsultant] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { selectedBranch } = useBranch();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole')?.toUpperCase();
    setIsAdmin(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN');
  }, []);

  const { 
    data: clientsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['clients', page, limit, searchQuery, status, visaType, consultant, selectedBranch?.branchId, startDate, endDate],
    queryFn: async () => {
      try {
        
        const params = new URLSearchParams({
          page,
          limit,
          search: searchQuery,
          status,
          visaType,
          consultant
        });
        
        if (selectedBranch?.branchId && selectedBranch.branchId !== 'all') {
          params.append('branchId', selectedBranch.branchId);
        }

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await apiRequest('GET', `/api/clients?${params.toString()}`);
        return response;
      } catch (err) {
        console.error('Error fetching clients:', err);
        toast({
          title: "Error loading clients",
          description: err.message || "Failed to load clients. Please try again.",
          variant: "destructive"
        });
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading clients",
        description: error.message || "Failed to load clients. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleSearch = () => {
    setSearchQuery(search);
    setPage(1);
  };

  const handleFilterChange = (type, value) => {
    switch(type) {
      case 'status':
        setStatus(value);
        break;
      case 'visaType':
        setVisaType(value);
        break;
      case 'consultant':
        setConsultant(value);
        break;
      case 'startDate':
        setStartDate(value);
        break;
      case 'endDate':
        setEndDate(value);
        break;
    }
    setPage(1);
  };

  const clearFilters = () => {
    setStatus('');
    setVisaType('');
    setConsultant('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setSearchQuery('');
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  // Navigate to client profile page
  const navigateToClientProfile = (clientId) => {
    setLocation(`/clients/${clientId}`);
  };
  
  const clients = clientsData?.data || [];
  const pagination = clientsData?.pagination || { total: 0, page: 1, pages: 1 };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with New Client button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Clients</h1>
          {selectedBranch?.branchId && selectedBranch.branchId !== 'all' && (
            <p className="text-sm text-gray-500 mt-1">
              Showing clients for {selectedBranch.branchName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
            </button>
          )}
          <Link to="/clients/new">
            <button className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2">
              <Plus size={18} />
              <span>New Client</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Advanced Filters for Admin */}
      {isAdmin && showFilters && (
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
              <select
                value={visaType}
                onChange={(e) => handleFilterChange('visaType', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              >
                <option value="">All Visa Types</option>
                <option value="Tourist">Tourist</option>
                <option value="Student">Student</option>
                <option value="Work">Work</option>
                <option value="Business">Business</option>
                <option value="PR">PR</option>
                <option value="Dependent">Dependent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultant</label>
              <select
                value={consultant}
                onChange={(e) => handleFilterChange('consultant', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              >
                <option value="">All Consultants</option>
                <option value="John Smith">John Smith</option>
                <option value="Emma Davis">Emma Davis</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Branch Statistics for Admin */}
      {isAdmin && clientsData?.branchStats && (
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">Branch Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clientsData.branchStats.map((stat) => (
              <div key={stat.branchName} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{stat.branchName}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">Total Clients: {stat.totalClients}</p>
                  <p className="text-sm text-gray-600">Active Clients: {stat.activeClients}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className=" rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search bar */}
            <div className="relative flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <button 
                  onClick={handleSearch}
                  className="absolute right-0 top-0 bottom-0 px-3 bg-blue-600 text-white rounded-r-md bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600"
                value={visaType}
                onChange={(e) => handleFilterChange('visaType', e.target.value)}
              >
                <option value="">Visa Type</option>
                <option value="Student Visa">Student Visa</option>
                <option value="Work Visa">Work Visa</option>
                <option value="Tourist Visa">Tourist Visa</option>
                <option value="Business Visa">Business Visa</option>
              </select>
              
              <select
                className="border border-gray-300 rounded-md px-5 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={consultant}
                onChange={(e) => handleFilterChange('consultant', e.target.value)}
              >
                <option value="">Consultant</option>
                <option value="John Smith">John Smith</option>
                <option value="Emma Davis">Emma Davis</option>
              </select>

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Status</option>
                <option value="Active">Active</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading clients...</div>
        ) : clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-left border-b dark:border-gray-600">
                  <th className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium">Client Name</th>
                  <th className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium">Visa Type</th>
                  <th className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium">Assigned Consultant</th>
                  <th className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium">Status</th>
                  <th className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium">Last Updated</th>
                  <th className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{client.visaType}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{client.destination}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{client.assignedConsultant}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        client.status === "Approved"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : client.status === "In Progress"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : client.status === "Rejected"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(client.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/clients/${client._id}`}
                        className="text-amber-600 dark:text-amber-600 hover:text-primary-900 dark:hover:text-primary-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No clients found.
          </div>
        )}
      </div>
    </div>
  );
}

export default Clients;