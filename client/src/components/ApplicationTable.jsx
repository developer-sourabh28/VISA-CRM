import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from "../lib/api";

function ApplicationTable({ applications, loading, defaultFilter = 'All Applications', title = 'Recent Applications' }) {
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: getClients,
  });

  // Filter clients created in the current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const recentClients = (clientsData?.data || []).filter(client => {
    const created = new Date(client.createdAt);
    return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
  });

  // Map to ApplicationTable structure
  const mappedRecentClients = recentClients.map(client => ({
    id: client._id || client.id,
    client: {
      firstName: client.firstName || client.name || "",
      lastName: client.lastName || "",
      email: client.email || "",
    },
    visaType: client.visaType || "-",
    submissionDate: client.createdAt || client.submissionDate || "",
    status: client.status || "Pending",
    destination: client.destination || "-",
  }));

  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState(defaultFilter);

  // Reset filter when defaultFilter changes
  useEffect(() => {
    setFilterStatus(defaultFilter);
    setCurrentPage(1);
  }, [defaultFilter]);

  const filteredApplications = mappedRecentClients?.filter(app => {
    if (filterStatus === 'All Applications') return true;

    if (filterStatus === 'This Month') {
      if (!app.submissionDate) {
        console.log('No submission date for app:', app);
        return false;
      }
      
      const now = new Date();
      const appDate = new Date(app.submissionDate);
      
      // Debug logging
      console.log('Current month/year:', now.getMonth(), now.getFullYear());
      console.log('App date:', app.submissionDate, 'Parsed:', appDate, 'Month/Year:', appDate.getMonth(), appDate.getFullYear());
      
      // Check if the date is valid
      if (isNaN(appDate.getTime())) {
        console.log('Invalid date for app:', app);
        return false;
      }
      
      const isCurrentMonth = appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
      console.log('Is current month:', isCurrentMonth);
      
      return isCurrentMonth;
    }

    return app.status === filterStatus.replace('Applications', '').trim();
  }) || [];

  // Get current month name for display
  const getCurrentMonthName = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[new Date().getMonth()];
  };

  // Count current month applications with debugging
  const currentMonthCount = applications?.filter(app => {
    if (!app.submissionDate) return false;
    const now = new Date();
    const appDate = new Date(app.submissionDate);
    
    // Check if the date is valid
    if (isNaN(appDate.getTime())) return false;
    
    return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
  }).length || 0;

  // Debug logging
  console.log('Total applications:', applications?.length);
  console.log('Current month count:', currentMonthCount);
  console.log('Filtered applications:', filteredApplications.length);
  console.log('Filter status:', filterStatus);

  // Pagination settings
  const itemsPerPage = 5;
  const totalPages = Math.ceil((filteredApplications.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    let className = '';
    switch (status) {
      case 'Approved':
        className = 'visa-status-approved';
        break;
      case 'In Progress':
        className = 'visa-status-in-progress';
        break;
      case 'Rejected':
        className = 'visa-status-rejected';
        break;
      default:
        className = 'visa-status-pending';
    }
    return <span className={className}>{status}</span>;
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-hidden rounded-xl shadow-lg bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/20 backdrop-blur-md">
      <div className="flex items-center justify-between border-b dark:border-gray-700 px-5 py-4 bg-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{title}</h3>
          {filterStatus === 'This Month' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50/40 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm backdrop-blur-sm">
              <CalendarIcon className="w-4 h-4" />
              <span>{getCurrentMonthName()}: {currentMonthCount} clients</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <select 
            className="rounded-md border-gray-300 dark:border-gray-600 bg-transparent backdrop-blur-sm py-1 pl-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filterStatus}
            onChange={handleFilterChange}
          >
            <option className="bg-transparent">All Applications</option>
            <option className="bg-transparent">This Month</option>
            <option className="bg-transparent">Pending</option>
            <option className="bg-transparent">In Progress</option>
            <option className="bg-transparent">Approved</option>
            <option className="bg-transparent">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-transparent backdrop-blur-sm">Loading applications...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-transparent backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Visa Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Submission Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-transparent backdrop-blur-sm">
              {paginatedApplications.length > 0 ? (
                paginatedApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-100/10 dark:hover:bg-gray-700/10 transition-colors bg-transparent">
                    <td className="whitespace-nowrap px-6 py-4 bg-transparent">
                      <div className="flex items-center">
                        {/* <div className="h-10 w-10 flex-shrink-0">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                            alt={`${application.client.firstName} ${application.client.lastName}`} 
                          />
                        </div> */}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.client.firstName} {application.client.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{application.client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 bg-transparent">
                      <div className="text-sm text-gray-900 dark:text-white">{application.visaType}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{application.destination}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 bg-transparent">
                      <div className="text-sm text-gray-900">
                        {application.submissionDate ? new Date(application.submissionDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 bg-transparent">
                      <span className={getStatusBadge(application.status).props.className}>
                        {getStatusBadge(application.status).props.children}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium bg-transparent">
                      <Link href={`/clients/${application.id}`} className="text-primary-600 hover:text-primary-900 transition-colors">View</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 bg-transparent backdrop-blur-sm">
                    {filterStatus === 'This Month' 
                      ? `No applications found for ${getCurrentMonthName()}`
                      : 'No applications found'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 0 && (
        <div className="border-t dark:border-gray-700 px-5 py-3 bg-transparent backdrop-blur-sm">
          <nav className="flex items-center justify-between">
            <div className="flex flex-1 items-center justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-transparent backdrop-blur-sm px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50/10 dark:hover:bg-gray-700/10'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-transparent backdrop-blur-sm px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50/10 dark:hover:bg-gray-700/10'
                }`}
              >
                Next
              </button>
            </div>

            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{Math.min(startIndex + 1, filteredApplications.length)}</span> to{' '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredApplications.length)}</span> of{' '}
                  <span className="font-medium">{filteredApplications.length}</span> results
                </p>
              </div>

              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 bg-transparent backdrop-blur-sm px-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 ${
                      currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50/10 dark:hover:bg-gray-700/10 focus:z-20'
                    }`}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center border ${currentPage === i + 1
                          ? 'z-10 border-blue-500 bg-blue-50/40 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 backdrop-blur-sm'
                          : 'border-gray-300 dark:border-gray-600 bg-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50/10 dark:hover:bg-gray-700/10 backdrop-blur-sm'
                      } px-4 py-2 text-sm font-medium focus:z-20`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 bg-transparent backdrop-blur-sm px-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 ${
                      currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50/10 dark:hover:bg-gray-700/10 focus:z-20'
                    }`}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

export default ApplicationTable;