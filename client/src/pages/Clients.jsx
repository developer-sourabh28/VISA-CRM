import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  PlusIcon, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Search as SearchIcon
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';

function Clients() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const { toast } = useToast();

  // Fetch clients
  const { data: clientsData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/clients', page, limit, searchQuery, status],
    queryFn: () => getClients({ page, limit, search: searchQuery, status }),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading clients",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1); // Reset to first page on new search
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1); // Reset to first page on status change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Function to format date 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const clients = clientsData?.data || [];
  const pagination = clientsData?.pagination || { total: 0, page: 1, pages: 1 };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <Link href="/clients/new">
            <Button>
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Client
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-2/3">
              <form onSubmit={handleSearch} className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by name, email, or passport number"
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="submit" className="absolute right-0 top-0 bottom-0 rounded-l-none">
                  Search
                </Button>
              </form>
            </div>
            <div className="w-full md:w-1/3">
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={status}
                onChange={handleStatusChange}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center">Loading clients...</div>
            ) : clients.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">
                      <div className="flex items-center">
                        Passport
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3">Nationality</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={client.profileImage || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                              alt={`${client.firstName} ${client.lastName}`}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.passportNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.nationality}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            client.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : client.status === "Completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/clients/${client._id}`}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          href={`/clients/${client._id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No clients found. Try adjusting your search criteria or add a new client.
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="border-t px-5 py-3">
              <nav className="flex items-center justify-between">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(pagination.page - 1) * limit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(pagination.page * limit, pagination.total)}
                      </span>{" "}
                      of <span className="font-medium">{pagination.total}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                          page === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        } border border-gray-300 text-sm font-medium`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: pagination.pages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                            page === i + 1
                              ? "bg-primary-50 text-primary-600 border-primary-500 z-10"
                              : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                          } border`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                        disabled={page === pagination.pages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                          page === pagination.pages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        } border border-gray-300 text-sm font-medium`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default Clients;
