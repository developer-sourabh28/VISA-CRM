import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  PlusIcon, 
  ChevronLeft, 
  ChevronRight, 
  FileIcon, 
  FileTextIcon, 
  ImageIcon, 
  FileSpreadsheetIcon 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
// Directly define document types to resolve import issue
const documentTypes = {
  PASSPORT: "Passport",
  ID_CARD: "ID Card",
  PHOTO: "Photograph",
  BANK_STATEMENT: "Bank Statement",
  INVITATION_LETTER: "Invitation Letter",
  FLIGHT_BOOKING: "Flight Booking",
  HOTEL_BOOKING: "Hotel Booking",
  EMPLOYMENT_LETTER: "Employment Letter",
  TRAVEL_ITINERARY: "Travel Itinerary",
  MEDICAL_CERTIFICATE: "Medical Certificate",
  VISA_FORM: "Visa Application Form",
};

function Documents() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [documentType, setDocumentType] = useState('');
  const { toast } = useToast();

  // Fetch documents
  const { data: documentsData, isLoading, error } = useQuery({
    queryKey: ['/api/documents', page, limit, searchQuery, status, documentType],
    queryFn: () => getDocuments({ 
      page, 
      limit, 
      search: searchQuery, 
      status, 
      documentType 
    }),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading documents",
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

  const handleTypeChange = (e) => {
    setDocumentType(e.target.value);
    setPage(1); // Reset to first page on type change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Function to format date 
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to get document icon based on mime type
  const getDocumentIcon = (mimeType) => {
    if (!mimeType) return <FileIcon className="h-8 w-8 text-gray-400" />;
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileTextIcon className="h-8 w-8 text-red-500" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheetIcon className="h-8 w-8 text-green-500" />;
    } else {
      return <FileIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  const documents = documentsData?.data || [];
  const pagination = documentsData?.pagination || { total: 0, page: 1, pages: 1 };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <Link href="/documents/upload">
            <Button>
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Upload Document
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <form onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder="Search by filename or notes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
            </div>
            <div>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={status}
                onChange={handleStatusChange}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={documentType}
                onChange={handleTypeChange}
              >
                <option value="">All Document Types</option>
                {Object.values(documentTypes).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center">Loading documents...</div>
            ) : documents.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Document</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Uploaded By</th>
                    <th className="px-6 py-3">Upload Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => (
                    <tr key={document._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getDocumentIcon(document.mimeType)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {document.fileName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {document.client?.firstName} {document.client?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {document.client?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.documentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(document.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            document.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : document.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : document.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {document.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.uploadedBy?.firstName} {document.uploadedBy?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          View
                        </a>
                        <a
                          href={document.fileUrl}
                          download={document.fileName}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No documents found. Try adjusting your search criteria or upload a new document.
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

export default Documents;
