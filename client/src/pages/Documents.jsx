import { useState, useEffect } from 'react';
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  FileSpreadsheetIcon,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '../lib/api';
import { useToast } from "../components/ui/use-toast.js";

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
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [documentType, setDocumentType] = useState('');

  const { toast } = useToast();

  const {
    data: documentsData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['/api/documents', page, limit, searchQuery, status, documentType],
    queryFn: () => getDocuments({ page, limit, search: searchQuery, status, documentType }),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (queryError) {
      toast({
        title: "Error loading documents",
        description: queryError.message || "Unknown error",
        variant: "destructive",
      });
    }
  }, [queryError, toast]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleTypeChange = (e) => {
    setDocumentType(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (documentsData?.pagination?.pages || 1)) {
      setPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getDocumentIcon = (mimeType) => {
    if (!mimeType) return <FileIcon className="h-8 w-8 text-gray-400" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileTextIcon className="h-8 w-8 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheetIcon className="h-8 w-8 text-green-500" />;
    return <FileIcon className="h-8 w-8 text-gray-400" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <FileTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const documents = documentsData?.data || [];
  const pagination = documentsData?.pagination || { total: 0, page: 1, pages: 1 };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading documents...</div>;
  }

  if (queryError) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error loading documents</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSearchSubmit} className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Document Management</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View and manage all client documents</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <select value={status} onChange={handleStatusChange} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={documentType} onChange={handleTypeChange} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="">All Types</option>
                {Object.entries(documentTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Search</button>
              <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <Upload className="mr-2 h-5 w-5" />
                Upload
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No documents found. Upload a new document to get started.</p>
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr key={document._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                      {getDocumentIcon(document.mimeType)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">{document.fileName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {document.client?.firstName} {document.client?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{document.client?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {document.documentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(document.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(document.status)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{document.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">View</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Documents;
