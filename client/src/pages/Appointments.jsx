import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { PlusIcon, ChevronLeft, ChevronRight, CalendarIcon, Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, X, Search } from 'lucide-react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppointments, getUpcomingAppointments, createAppointment, getClients } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../components/ui/use-toast';


function Appointments() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    appointmentType: '',
    scheduledFor: '',
    location: '',
    notes: '',
    confirmationNumber: '',
    status: ''
  });
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  
  const queryClient = useQueryClient();

  // Fetch clients for the dropdown
  const { data: clientsResponse, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients
  });

  // Extract clients array from response
  const clients = clientsResponse?.data || [];

  // Fetch appointments with proper error handling
  const { data: appointmentsResponse, isLoading, error, isError } = useQuery({
    queryKey: ['appointments', page, limit, startDate, endDate, status, appointmentType],
    queryFn: async () => {
      try {
        console.log('Fetching appointments with params:', { page, limit, startDate, endDate, status, appointmentType });
        const data = await getAppointments({ 
          page, 
          limit, 
          startDate, 
          endDate, 
          status, 
          appointmentType 
        });
        console.log('Raw API Response:', data);
        return data;
        
      } catch (error) {
        console.error('Error fetching appointments:', error);
        throw new Error(error.message || 'Failed to fetch appointments');
      }
    },
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Properly destructure the appointments data
  const appointments = appointmentsResponse?.data || [];
  const totalAppointments = appointmentsResponse?.pagination?.total || 0;
  const totalPages = appointmentsResponse?.pagination?.pages || 0;

  // Remove duplicate console.logs
  console.log("Appointments Response:", appointmentsResponse);
  console.log("Processed appointments:", appointments);
  console.log("Total Appointments:", totalAppointments);
  console.log("Total Pages:", totalPages);
  console.log("Loading State:", isLoading);
  console.log("Error State:", error);

  // Add event listener for appointment refresh
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
    };

    window.addEventListener('refreshAppointments', handleRefresh);
    return () => window.removeEventListener('refreshAppointments', handleRefresh);
  }, [queryClient]);

  // Fetch upcoming appointments
  const { data: upcomingAppointments, error: upcomingError } = useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: async () => {
      try {
        const data = await getUpcomingAppointments(7);
        return data;
        
      } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  
  
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1); // Reset to first page on status change
  };

  const handleTypeChange = (e) => {
    setAppointmentType(e.target.value);
    setPage(1); // Reset to first page on type change
  };

  const handleDateFilter = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on date filter change
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('');
    setAppointmentType('');
    setPage(1);
  };

  // Function to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not Scheduled';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusIcon = (appointmentStatus) => {
    switch (appointmentStatus) {
      case 'SCHEDULED':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'NOT_SCHEDULED':
        return <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      case 'MISSED':
        return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'ATTENDED':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'RESCHEDULED':
        return <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const formatAppointmentType = (type) => {
    if (!type) return 'Not Specified';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      client: client._id
    }));
    setClientSearch(`${client.firstName} ${client.lastName}`);
    setShowClientDropdown(false);
  };

  const filteredClients = clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await createAppointment(formData);
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      setIsNewAppointmentModalOpen(false);
      setFormData({
        client: '',
        appointmentType: '',
        scheduledFor: '',
        location: '',
        notes: '',
        confirmationNumber: '',
        status: ''
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    }
  };

  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-500 dark:text-gray-400">Loading appointments...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 dark:text-red-400 mb-4">
          {error?.message || 'Failed to load appointments'}
        </div>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="shadow-sm border-b border-gray-200 ">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center ">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Appointments</h1>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsNewAppointmentModalOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              New Appointment
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsNewAppointmentModalOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              New Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  New Appointment
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-6">
                {/* Client Selection with both Dropdown and Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        name="client"
                        value={formData.client}
                        onChange={(e) => {
                          const selected = clients.find(c => c._id === e.target.value);
                          if (selected) {
                            handleClientSelect(selected);
                          }
                        }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select a client</option>
                        {Array.isArray(clients) && clients.map(client => (
                          <option key={client._id} value={client._id}>
                            {client.firstName} {client.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        placeholder="Search client name"
                        className="w-full"
                      />
                      {showClientDropdown && clientSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                              <div
                                key={client._id}
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleClientSelect(client)}
                              >
                                {client.firstName} {client.lastName}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                              No clients found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewAppointmentModalOpen(false)}
                      className="whitespace-nowrap"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add New
                    </Button>
                  </div>
                </div>

                {/* Appointment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Appointment Type
                  </label>
                  <select
                    name="appointmentType"
                    value={formData.appointmentType}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="VISA_INTERVIEW">Visa Interview</option>
                    <option value="BIOMETRICS">Biometrics</option>
                    <option value="DOCUMENT_SUBMISSION">Document Submission</option>
                    <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                  </select>
                </div>

                {/* Appointment Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select status</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="NOT_SCHEDULED">Not Scheduled</option>
                    <option value="ATTENDED">Attended</option>
                    <option value="MISSED">Missed</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                  </select>
                </div>

                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date and Time
                  </label>
                  <Input
                    type="datetime-local"
                    name="scheduledFor"
                    value={formData.scheduledFor}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location/Embassy
                  </label>
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    placeholder="Enter location or embassy name"
                  />
                </div>

                {/* Confirmation Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirmation Number
                  </label>
                  <Input
                    type="text"
                    name="confirmationNumber"
                    value={formData.confirmationNumber}
                    onChange={handleFormChange}
                    placeholder="Enter confirmation number"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add any additional notes"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewAppointmentModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Appointment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Filter Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDateFilter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className='dark:bg-gray-700 dark:text-white'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className='dark:bg-gray-700 dark:text-white'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={handleStatusChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="NOT_SCHEDULED">Not Scheduled</option>
                    <option value="ATTENDED">Attended</option>
                    <option value="MISSED">Missed</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={appointmentType}
                    onChange={handleTypeChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="VISA_INTERVIEW">Visa Interview</option>
                    <option value="BIOMETRICS">Biometrics</option>
                    <option value="DOCUMENT_SUBMISSION">Document Submission</option>
                    <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Apply Filters</Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card className=''>
          <CardHeader>
            <CardTitle className="flex justify-between items-center ">
              <span>All Appointments ({totalAppointments})</span>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 ">
            {appointments.length > 0 ? (
              <>
                <div className="overflow-x-auto ">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 ">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr >
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Embassy/Consulate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Confirmation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {appointments.map((appointment, index) => (
                        <tr key={appointment._id || appointment.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <User className="h-10 w-10 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {appointment.client?.firstName || appointment.clientName || 'N/A'} {appointment.client?.lastName || ''}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {appointment.client?.email || appointment.clientEmail || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDateTime(appointment.dateTime || appointment.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {appointment.embassy || appointment.location || 'Not Specified'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {formatAppointmentType(appointment.type || appointment.appointmentType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(appointment.status)}
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {appointment.status || 'Not Scheduled'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {appointment.confirmationNumber || appointment.confirmation || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalAppointments)} of {totalAppointments} appointments
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No appointments found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {startDate || endDate || status || appointmentType 
                    ? 'No appointments match your current filters.'
                    : 'No appointments have been scheduled yet.'
                  }
                </p>
                {(startDate || endDate || status || appointmentType) && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Appointments</p>
                  <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-100">{totalAppointments}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Scheduled</p>
                  <p className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-100">
                    {appointments.filter(a => a.status === 'SCHEDULED').length}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Upcoming</p>
                  <p className="mt-1 text-2xl font-semibold text-yellow-900 dark:text-yellow-100">
                    {Array.isArray(upcomingAppointments) ? upcomingAppointments.length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Appointments;