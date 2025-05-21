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
  <CardContent>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-7">
      <form onSubmit={handleSearch} className="relative w-full md:w-1/2">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search clients..."
          className="pl-10 pr-32"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" className="absolute right-0 top-0 bottom-0 rounded-l-none">
          Search
        </Button>
      </form>

      <div className="flex gap-2 w-full md:w-auto">
        <select
          className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:ring-primary-500"
          value={status}
          onChange={handleStatusChange}
        >
          <option value="">Status</option>
          <option value="Active">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Hold">Hold</option>
        </select>
        {/* You can add Visa Type and Consultant dropdowns here similarly if needed */}
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
              // ...existing code...
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <th className="px-6 py-3">Client</th>
      <th className="px-6 py-3">Visa Type</th>
      <th className="px-6 py-3">Assigned Consultant</th>
      <th className="px-6 py-3">Status</th>
      <th className="px-6 py-3">Created</th>
      <th className="px-6 py-3 text-right">Actions</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {clients.map((client) => (
      <tr key={client._id} className="hover:bg-gray-50">
        <td className="py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              {/* Profile image if needed */}
            </div>
            <div>
              <div className="text-sm font-medium ml-[-15px] text-gray-900">
                {client.firstName} {client.lastName}
              </div>
              <div className="text-sm ml-[-15px] text-gray-500">
                {client.email}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {client.visaType || "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {client.assignedConsultant?.firstName
            ? `${client.assignedConsultant.firstName} ${client.assignedConsultant.lastName || ""}`
            : (client.assignedConsultant || "-")}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-2 inline-flex text-xs font-semibold rounded-full ${
              client.status === "Completed"
                ? "bg-green-100 text-green-800"
                : client.status === "Active"
                ? "bg-blue-100 text-blue-600"
                : client.status === "Hold"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {client.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDate(client.createdAt)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 space-x-3">
          <Link href={`/clients/${client._id}`} className="hover:underline">View Profile</Link>
          <Link href={`/clients/${client._id}/edit`} className="hover:underline">Update Status</Link>
          <Link href="#" className="hover:underline">Transfer</Link>
        </td>
      </tr>
    ))}
  </tbody>
</table>
// ...existing code...
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
  onClick={() => handlePageChange(i + 1)}
  className={`relative inline-flex items-center px-3 py-1 text-sm font-medium rounded-md border ${
    page === i + 1
      ? "bg-blue-500 text-white border-blue-500"
      : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
  }`}
>
  {i + 1}
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
