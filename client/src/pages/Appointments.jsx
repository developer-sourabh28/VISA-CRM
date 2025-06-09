import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { PlusIcon, ChevronLeft, ChevronRight, CalendarIcon, Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppointments, getUpcomingAppointments } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

function Appointments() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const queryClient = useQueryClient();

  // Add event listener for appointment refresh
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['upcomingAppointments']);
    };

    window.addEventListener('refreshAppointments', handleRefresh);
    return () => window.removeEventListener('refreshAppointments', handleRefresh);
  }, [queryClient]);

  // Fetch appointments with proper error handling
  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ['appointments', page, limit, startDate, endDate, status, appointmentType],
    queryFn: async () => {
      try {
        const params = {
          page,
          limit
        };

        // Only add filter parameters if they have values
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (status) params.status = status;
        if (appointmentType) params.type = appointmentType;

        const data = await getAppointments(params);
        return data;
      } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch upcoming appointments
  const { data: upcomingAppointments } = useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: async () => {
      try {
        const data = await getUpcomingAppointments(7);
        return data;
      } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  // Add debugging
  console.log("Appointments Data:", appointmentsData);
  console.log("Loading State:", isLoading);
  console.log("Error State:", error);

  // Add debugging for upcoming appointments
  console.log("Upcoming Appointments:", upcomingAppointments);

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
    setPage(newPage);
  };

  // Function to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not Scheduled';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading appointments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 dark:text-red-400">{error.message}</div>
      </div>
    );
  }

  // Ensure we have valid data structure
  const appointments = appointmentsData?.appointments || [];
  const totalAppointments = appointmentsData?.total || 0;

  console.log("Processed appointments for display:", appointments);
  console.log("Total appointments count:", totalAppointments);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Appointments</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">All Appointments</h2>
            <div className="flex items-center space-x-4">
              <form onSubmit={handleDateFilter} className="flex space-x-2">
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="h-10">Filter</Button>
                </div>
              </form>
              <select
                value={status}
                onChange={handleStatusChange}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option key="all-status" value="">All Status</option>
                <option key="scheduled" value="SCHEDULED">Scheduled</option>
                <option key="not-scheduled" value="NOT_SCHEDULED">Not Scheduled</option>
                <option key="attended" value="ATTENDED">Attended</option>
                <option key="missed" value="MISSED">Missed</option>
                <option key="rescheduled" value="RESCHEDULED">Rescheduled</option>
              </select>
              <select
                value={appointmentType}
                onChange={handleTypeChange}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option key="all-types" value="">All Types</option>
                <option key="visa-interview" value="VISA_INTERVIEW">Visa Interview</option>
                <option key="biometrics" value="BIOMETRICS">Biometrics</option>
                <option key="document-submission" value="DOCUMENT_SUBMISSION">Document Submission</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
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
              {appointments.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {appointment.client?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDateTime(appointment.dateTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">{appointment.embassy || 'Not Specified'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {appointment.type || 'Not Specified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(appointment.status)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">{appointment.status || 'Not Scheduled'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {appointment.confirmationNumber || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No appointments have been scheduled yet.
            </p>
          </div>
        )}

        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div key="total" className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Appointments</p>
                <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-100">{totalAppointments}</p>
              </div>
              <div key="scheduled" className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Scheduled</p>
                <p className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-100">
                  {appointments.filter(a => a.status === 'SCHEDULED').length}
                </p>
              </div>
              <div key="upcoming" className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Upcoming</p>
                <p className="mt-1 text-2xl font-semibold text-yellow-900 dark:text-yellow-100">
                  {upcomingAppointments?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Appointments;
