import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { PlusIcon, ChevronLeft, ChevronRight, CalendarIcon, Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, X, Search, RefreshCw } from 'lucide-react';

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

  const { data: appointmentsResponse, isLoading, error, isError } = useQuery({
    queryKey: ['appointments', page, limit, startDate, endDate, status, appointmentType],
    queryFn: () => getAppointments({ page, limit, startDate, endDate, status, appointmentType }),
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  // Properly destructure the appointments data
  const appointments = appointmentsResponse?.data || [];
  const totalAppointments = appointmentsResponse?.pagination?.total || 0;
  const totalPages = appointmentsResponse?.pagination?.pages || 0;

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

  // Add this function after handleCreateAppointment
  const navigateToAppointmentDetail = (appointmentId) => {
    // Check if we have a valid appointment ID
    if (appointmentId) {
      // Navigate to the appointment detail page
      // You might need to adjust this route based on your actual routing setup
      window.location.href = `/appointments/${appointmentId}`;
    } else {
      toast({
        title: "Error",
        description: "Invalid appointment ID",
        variant: "destructive",
      });
    }
  };

  // Function to render the appointments list part
  const renderAppointmentsList = () => {
    if (isError) {
      return (
        <div className="p-6 text-center">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error loading appointments
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Location</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  <div className="flex justify-center items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">Loading appointments...</span>
                  </div>
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No appointments found
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr 
                  key={appointment._id}
                  className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="text-gray-900 dark:text-white py-3 px-4">
                    {appointment.clientName || 'Unknown Client'}
                  </td>
                  <td className="text-gray-900 dark:text-white py-3 px-4">
                    {formatAppointmentType(appointment.appointmentType)}
                  </td>
                  <td className="text-gray-900 dark:text-white py-3 px-4">
                    {formatDateTime(appointment.scheduledFor)}
                  </td>
                  <td className="text-gray-900 dark:text-white py-3 px-4">
                    {appointment.location || 'Not specified'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getStatusIcon(appointment.status)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'SCHEDULED' || appointment.status === 'ATTENDED'
                          ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : appointment.status === 'NOT_SCHEDULED' || appointment.status === 'RESCHEDULED'
                          ? "bg-yellow-100/40 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                          : "bg-red-100/40 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                      }`}>
                        {appointment.status ? appointment.status.replace(/_/g, ' ') : 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateToAppointmentDetail(appointment._id)}
                        className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                      >
                        View Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalAppointments)} of {totalAppointments} appointments
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3
                  ? i + 1
                  : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;
                if (pageNum <= totalPages && pageNum > 0) {
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
                disabled={page === totalPages}
                className={`p-2 rounded-full ${
                  page === totalPages
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
    );
  };

  // Function to render upcoming appointments
  const renderUpcomingAppointments = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-amber-500" />
          This Week's Schedule
        </h3>
        
        {upcomingAppointments?.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div 
                key={appointment._id}
                className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-md transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className={`mr-2 w-2 h-2 rounded-full ${
                        appointment.status === 'SCHEDULED' || appointment.status === 'ATTENDED'
                          ? "bg-green-500"
                          : appointment.status === 'NOT_SCHEDULED' || appointment.status === 'RESCHEDULED'
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}></span>
                      <h4 className="font-medium text-gray-900 dark:text-white">{appointment.clientName}</h4>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDateTime(appointment.scheduledFor)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3 mr-1" />
                        {appointment.location || 'No location specified'}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToAppointmentDetail(appointment._id)}
                    className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No upcoming appointments
          </div>
        )}
      </div>
    );
  };

  // Render the create appointment dialog
  const renderCreateAppointmentDialog = () => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" style={{ display: isNewAppointmentModalOpen ? 'flex' : 'none' }}>
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl p-6 w-full max-w-md m-4">
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Appointment</h2>
            <button 
              onClick={() => setIsNewAppointmentModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Client
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search client by name"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {showClientDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                    {isLoadingClients ? (
                      <div className="p-2 text-center text-gray-500">Loading clients...</div>
                    ) : filteredClients.length > 0 ? (
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
                      <div className="p-2 text-center text-gray-500">No clients found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Appointment Type
              </label>
              <select
                name="appointmentType"
                value={formData.appointmentType}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Select Type</option>
                <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                <option value="DOCUMENT_SUBMISSION">Document Submission</option>
                <option value="BIOMETRIC_APPOINTMENT">Biometric Appointment</option>
                <option value="VISA_INTERVIEW">Visa Interview</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date & Time
              </label>
              <input
                type="datetime-local"
                name="scheduledFor"
                value={formData.scheduledFor}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                placeholder="Enter location"
                className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Additional notes"
                className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Select Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="NOT_SCHEDULED">Not Scheduled</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="ATTENDED">Attended</option>
                <option value="MISSED">Missed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewAppointmentModalOpen(false)}
                className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              >
                Create Appointment
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Main return component
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Appointments
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-5 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
              className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button> */}
            
            <Button
              onClick={() => setIsNewAppointmentModalOpen(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PlusIcon className="w-5 h-5" />
              <span>New Appointment</span>
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointment List */}
          <div className="lg:col-span-2 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Appointments</h3>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={status}
                    onChange={handleStatusChange}
                    className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="NOT_SCHEDULED">Not Scheduled</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                    <option value="ATTENDED">Attended</option>
                    <option value="MISSED">Missed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <select
                    value={appointmentType}
                    onChange={handleTypeChange}
                    className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                    <option value="DOCUMENT_SUBMISSION">Document Submission</option>
                    <option value="BIOMETRIC_APPOINTMENT">Biometric Appointment</option>
                    <option value="VISA_INTERVIEW">Visa Interview</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <form onSubmit={handleDateFilter} className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border border-gray-200/50 dark:border-gray-600/50 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
                  >
                    Filter
                  </Button>
                  {(startDate || endDate || status || appointmentType) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      Clear
                    </Button>
                  )}
                </form>
              </div>
              
              {renderAppointmentsList()}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative p-6">
              {renderUpcomingAppointments()}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {renderCreateAppointmentDialog()}
    </div>
  );
}

export default Appointments;