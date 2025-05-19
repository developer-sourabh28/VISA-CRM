import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

function ApplicationTable({ applications, loading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('All Applications');
  
  const filteredApplications = applications?.filter(app => {
    if (filterStatus === 'All Applications') return true;
    return app.status === filterStatus.replace('Applications', '').trim();
  }) || [];
  
  // Pagination settings
  const itemsPerPage = 5;
  const totalPages = Math.ceil((filteredApplications.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);
  
  // Status badge component
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
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Applications</h3>
        <div className="flex space-x-2">
          <select 
            className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filterStatus}
            onChange={handleFilterChange}
          >
            <option>All Applications</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center">Loading applications...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Visa Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Submission Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Executive
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedApplications.length > 0 ? (
                paginatedApplications.map((application) => (
                  <tr key={application.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                            alt={`${application.client.firstName} ${application.client.lastName}`}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.client.firstName} {application.client.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{application.client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{application.visaType}</div>
                      <div className="text-sm text-gray-500">{application.destination}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(application.submissionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {application.executive}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link href={`/applications/${application.id}`} className="text-primary-600 hover:text-primary-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 0 && (
        <div className="border-t px-5 py-3">
          <nav className="flex items-center justify-between">
            <div className="flex flex-1 items-center justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing
                  <span className="font-medium"> {Math.min(startIndex + 1, filteredApplications.length)} </span>
                  to
                  <span className="font-medium"> {Math.min(startIndex + itemsPerPage, filteredApplications.length)} </span>
                  of
                  <span className="font-medium"> {filteredApplications.length} </span>
                  results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 ${
                      currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center border ${
                        currentPage === i + 1
                          ? 'z-10 border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                      } px-4 py-2 text-sm font-medium focus:z-20`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 ${
                      currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20'
                    }`}
                  >
                    <span className="sr-only">Next</span>
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
