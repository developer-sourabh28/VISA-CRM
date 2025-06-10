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
    <div className="container mx-auto px-4 py-6">
      {/* Header with New Client button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
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
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search bar */}
            <div className="relative flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <button 
                  onClick={handleSearch}
                  className="absolute right-0 top-0 bottom-0 px-3 bg-blue-600 text-white rounded-r-md"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading clients...</div>
        ) : clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left border-b">
                  <th className="px-6 py-3 text-gray-600 font-medium">Client Name</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Visa Type</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Assigned Consultant</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Status</th>
                  <th className="px-6 py-3 text-gray-600 font-medium">Last Updated</th>
                  <th className="px-6 py-3 text-gray-600 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={client._id || index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                          console.log('Navigating to client:', client._id);
                          setLocation(`/clients/${client._id}`);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-blue-600 hover:text-blue-800">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {client.visaType || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {client.assignedConsultant?.firstName
                        ? `${client.assignedConsultant.firstName} ${client.assignedConsultant.lastName || ""}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          client.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : client.status === "Active"
                            ? "bg-blue-100 text-blue-800"
                            : client.status === "Hold"
                            ? "bg-yellow-100 text-yellow-800"
                            : client.status === "Processing"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <Link href={`/clients/${client._id}`} className="text-blue-600 hover:text-blue-800 text-sm">View Profile</Link>
                      <Link href={`/clients/${client._id}/edit`} className="text-blue-600 hover:text-blue-800 text-sm">Update Status</Link>
                      <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm">Transfer</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No clients found. Try adjusting your search criteria or add a new client.
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-white border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * limit + 1} to {Math.min(pagination.page * limit, pagination.total)} of {pagination.total} entries
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`inline-flex items-center px-3 py-1 rounded-md ${
                    page === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-100 border"
                  }`}
                >
                  <ChevronLeft size={16} />
                  <span className="sr-only">Previous</span>
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  // Calculate page numbers to show based on current page
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`inline-flex items-center justify-center w-8 h-8 text-sm rounded-md ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100 border"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className={`inline-flex items-center px-3 py-1 rounded-md ${
                    page === pagination.pages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-100 border"
                  }`}
                >
                  <ChevronRight size={16} />
                  <span className="sr-only">Next</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Clients;