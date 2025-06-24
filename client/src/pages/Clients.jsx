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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Client Directory
              </h1>
            </div>
            {selectedBranch?.branchId && selectedBranch.branchId !== 'all' && (
              <p className="text-gray-600 dark:text-gray-300 ml-5">
                Showing clients for {selectedBranch.branchName}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            )}
            
            {/* <Link to="/clients/new">
              <button className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="w-5 h-5" />
                <span>New Client</span>
              </button>
            </Link> */}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full px-4 py-2 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>

            {/* Advanced Filters for Admin */}
            {isAdmin && showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-full bg-transparent text-gray-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-full bg-transparent text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-full bg-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visa Type</label>
                  <select
                    value={visaType}
                    onChange={(e) => handleFilterChange('visaType', e.target.value)}
                    className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-full bg-transparent text-gray-900 dark:text-white"
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
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consultant</label>
                  <select
                    value={consultant}
                    onChange={(e) => handleFilterChange('consultant', e.target.value)}
                    className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-full bg-transparent text-gray-900 dark:text-white"
                  >
                    <option value="">All Consultants</option>
                    <option value="John Smith">John Smith</option>
                    <option value="Emma Davis">Emma Davis</option>
                  </select>
                </div>
                <div className="col-span-full flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clients Table */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visa Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visa Country</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6">
                        <div className="flex justify-center items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading clients...</span>
                        </div>
                      </td>
                    </tr>
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr 
                        key={client._id}
                        onClick={() => navigateToClientProfile(client._id)}
                        className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                      >
                        <td className="text-gray-900 dark:text-white py-3 px-4">
                          {client.firstName} {client.lastName}
                        </td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{client.email || '-'}</td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{client.phone || '-'}</td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{client.visaType || '-'}</td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{client.address?.visaCountry || client.visaCountry || '-'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              client.status === 'Active'
                                ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                : client.status === 'Inactive'
                                ? "bg-yellow-100/40 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                                : "bg-red-100/40 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                            }`}
                          >
                            {client.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="text-gray-900 dark:text-white py-3 px-4">{formatDate(client.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {(pagination.page - 1) * limit + 1} to {Math.min(pagination.page * limit, pagination.total)} of {pagination.total} clients
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`p-2 rounded-full ${
                      page === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-amber-100/30 dark:hover:bg-amber-900/20'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = page <= 3
                      ? i + 1
                      : page >= pagination.pages - 2
                        ? pagination.pages - 4 + i
                        : page - 2 + i;
                    if (pageNum <= pagination.pages && pageNum > 0) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-full ${
                            pageNum === page
                              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-amber-100/30 dark:hover:bg-amber-900/20'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.pages}
                    className={`p-2 rounded-full ${
                      page === pagination.pages
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-amber-100/30 dark:hover:bg-amber-900/20'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Clients;