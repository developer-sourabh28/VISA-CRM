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
  BarChart2,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../lib/api.js';
import { useToast } from "../components/ui/use-toast.js";
import { useBranch } from '../contexts/BranchContext';
import { apiRequest } from '../lib/api.js';
// import BackButton from '../components/BackButton';

function Clients() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [visaType, setVisaType] = useState('');
  const [visaCountry, setVisaCountry] = useState('');
  const [consultant, setConsultant] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { selectedBranch } = useBranch();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole')?.toUpperCase();
    setIsAdmin(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN');
  }, []);

  const { data: countriesData } = useQuery({
    queryKey: ['visaCountries'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/clients/visa-countries');
        return response.data;
      } catch (err) {
        console.error('Error fetching visa countries:', err);
        return [];
      }
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  //check filter 
  const hasActiveFilters = Boolean(
    status || visaType || visaCountry || consultant || startDate || endDate || searchQuery
  );
  

  const { 
    data: clientsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['clients', page, limit, searchQuery, status, visaType, visaCountry, consultant, selectedBranch?.branchId, startDate, endDate],
    queryFn: async () => {
      try {
        
        const params = new URLSearchParams({
          page,
          limit,
          search: searchQuery,
          status,
          visaType,
          visaCountry,
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
      case 'visaCountry':
        setVisaCountry(value);
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
    setVisaCountry('');
    setConsultant('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setSearchQuery('');
    setPage(1);
  };

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
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

  // Check if date range has values
  const hasDateRange = startDate || endDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        {/* <BackButton /> */}
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            
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
  {showFilters && (
    <div className="mt-6">
      <div className="flex flex-wrap items-end gap-4 w-full max-w-full">
        {/* Date Range Filter */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-36 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-36 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            />
            {/* {hasDateRange ? (
              <button
                onClick={clearDateRange}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            ) : (
              <button
                onClick={() => {
                  if (startDate || endDate) {
                    setSearchQuery(search);
                    setPage(1);
                  }
                }}
                disabled={!startDate && !endDate}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            )} */}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select
            value={status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Visa Type Filter */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visa Type</label>
          <select
            value={visaType}
            onChange={(e) => handleFilterChange('visaType', e.target.value)}
            className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          >
            <option value="">All Types</option>
            <option value="Tourist">Tourist</option>
            <option value="Student">Student</option>
            <option value="Work">Work</option>
            <option value="Business">Business</option>
            <option value="PR">PR</option>
            <option value="Dependent">Dependent</option>
            <option value="Transit">Transit</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Visa Country Filter */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visa Country</label>
          <select
            value={visaCountry}
            onChange={(e) => handleFilterChange('visaCountry', e.target.value)}
            className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-36 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          >
            <option value="">All Countries</option>
            {(countriesData || []).map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Consultant Filter */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consultant</label>
          <select
            value={consultant}
            onChange={(e) => handleFilterChange('consultant', e.target.value)}
            className="border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-2 w-36 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          >
            <option value="">All Consultants</option>
            <option value="John Smith">John Smith</option>
            <option value="Emma Davis">Emma Davis</option>
          </select>
        </div>

        {/* Clear All Filters Button */}
        <div className="pb-4">
        <button
  onClick={clearFilters}
  disabled={!hasActiveFilters}
  className={`font-medium border-grey transition-colors whitespace-nowrap ${
    hasActiveFilters
      ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
      : 'text-gray-400 cursor-not-allowed'
  }`}
>
  Clear
</button>

        </div>
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Client ID</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Email</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Phone</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Nationality</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                    <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6">
                        <div className="flex justify-center items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading clients...</span>
                        </div>
                      </td>
                    </tr>
                  ) : clients.length === 0 ? (
                    <tr>                              
                      <td colSpan={9} className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr 
                        key={client._id}
                        onClick={() => navigateToClientProfile(client._id)}
                         className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                      >
                        <td className="py-4 px-5 font-medium">{client.clientId || client._id.substring(0, 8)}</td>
                        <td className="py-4 px-5 font-medium">
                          {client.firstName} {client.lastName}
                        </td>
                        <td className="py-4 px-5">{client.email || '-'}</td>
                        <td className="py-4 px-5">{client.phone || '-'}</td>
                        <td className="py-4 px-5">{client.visaType || '-'}</td>
                        <td className="py-4 px-5">{client.address?.visaCountry || client.visaCountry || '-'}</td>
                        <td className="py-4 px-5">{client.nationality || '-'}</td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              client.status === 'Active'
                                ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400 group-hover:bg-green-700 group-hover:text-white"
                                : client.status === 'Inactive'
                                ? "bg-yellow-100/40 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 group-hover:bg-yellow-700 group-hover:text-white"
                                : "bg-red-100/40 dark:bg-red-900/30 text-red-800 dark:text-red-400 group-hover:bg-red-700 group-hover:text-white"
                            }`}
                          >
                            {client.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-5">{formatDate(client.createdAt)}</td>
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