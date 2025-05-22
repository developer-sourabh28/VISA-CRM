import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEnquiries, createEnquiry, updateEnquiry, deleteEnquiry } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';

function Enquiries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Fetch enquiries
  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ['enquiries', { status: statusFilter, branch: branchFilter }],
    queryFn: () => getEnquiries({ status: statusFilter, branch: branchFilter })
  });

  // Create enquiry mutation
  const createMutation = useMutation({
    mutationFn: createEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries(['enquiries']);
      toast({
        title: "Success",
        description: "Enquiry created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create enquiry",
        variant: "destructive",
      });
    }
  });

  // Update enquiry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateEnquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['enquiries']);
      toast({
        title: "Success",
        description: "Enquiry updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update enquiry",
        variant: "destructive",
      });
    }
  });

  // Delete enquiry mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries(['enquiries']);
      toast({
        title: "Success",
        description: "Enquiry deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete enquiry",
        variant: "destructive",
      });
    }
  });

  //convert enquiry mutation



  // Filter enquiries based on search term
  const filteredEnquiries = enquiriesData?.data?.filter(enquiry => 
    enquiry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.phone.includes(searchTerm)
  ) || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Enquiries</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all enquiries in your system including their name, contact details, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            onClick={() => {/* TODO: Open create enquiry modal */}}
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Enquiry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            placeholder="Search enquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Processing">Processing</option>
          <option value="Closed">Closed</option>
          <option value="Lost">Lost</option>
        </select>
        <select
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          <option value="">All Branches</option>
          <option value="Main Office">Main Office</option>
          <option value="North Branch">North Branch</option>
          <option value="South Branch">South Branch</option>
          <option value="East Branch">East Branch</option>
          <option value="West Branch">West Branch</option>
          <option value="Abu Dhabi">Abu Dhabi</option>
          <option value="New York">New York</option>
        </select>
      </div>

      {/* Enquiries Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Visa Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Destination
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Branch
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="py-4 text-center text-sm text-gray-500">
                        Loading enquiries...
                      </td>
                    </tr>
                  ) : filteredEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-4 text-center text-sm text-gray-500">
                        No enquiries found
                      </td>
                    </tr>
                  ) : (
                    filteredEnquiries.map((enquiry) => (
                      <tr key={enquiry._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {enquiry.fullName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div>{enquiry.email}</div>
                          <div>{enquiry.phone}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {enquiry.visaType}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {enquiry.destinationCountry}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            enquiry.enquiryStatus === 'New' ? 'bg-blue-100 text-blue-800' :
                            enquiry.enquiryStatus === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                            enquiry.enquiryStatus === 'Qualified' ? 'bg-green-100 text-green-800' :
                            enquiry.enquiryStatus === 'Processing' ? 'bg-purple-100 text-purple-800' :
                            enquiry.enquiryStatus === 'Closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {enquiry.enquiryStatus}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {enquiry.branch}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => {/* TODO: Open edit modal */}}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this enquiry?')) {
                                deleteMutation.mutate(enquiry._id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Enquiries; 