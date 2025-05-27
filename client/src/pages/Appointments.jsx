import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { PlusIcon, ChevronLeft, ChevronRight, CalendarIcon, Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAppointments } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';

function Appointments() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const { toast } = useToast();

  // Fetch appointments
  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ['/api/appointments', page, limit, startDate, endDate, status, appointmentType],
    queryFn: () => getAppointments({ 
      page, 
      limit, 
      startDate, 
      endDate, 
      status, 
      appointmentType 
    }),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading appointments",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [error, toast]);

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
    // The query will automatically refetch when startDate or endDate changes
    setPage(1); // Reset to first page on date filter change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Function to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to get calendar day
  const getCalendarDay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getDate();
  };

  // Function to get calendar month
  const getCalendarMonth = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short' });
  };

  const appointments = appointmentsData?.data || [];
  const pagination = appointmentsData?.pagination || { total: 0, page: 1, pages: 1 };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Appointments</h1>
            <div className="mt-4 flex space-x-3 md:mt-0">
              <Link href="/appointments/new">
                <Button>
                  <Calendar className="-ml-1 mr-2 h-5 w-5" />
                  New Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">All Appointments</h2>
              <div className="flex items-center space-x-4">
                <form onSubmit={handleDateFilter} className="flex space-x-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
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
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
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
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {appointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={appointment.client?.avatar || `https://ui-avatars.com/api/?name=${appointment.client?.firstName} ${appointment.client?.lastName}`}
                            alt={`${appointment.client?.firstName} ${appointment.client?.lastName}`}
                          />
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
                        {formatDateTime(appointment.scheduledFor)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{appointment.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {appointment.appointmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(appointment.status)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{appointment.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/appointments/${appointment._id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/appointments/${appointment._id}/edit`}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Edit
                      </Link>
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
                Get started by scheduling a new appointment.
              </p>
              <div className="mt-6">
                <Link href="/appointments/new">
                  <Button>
                    <Calendar className="-ml-1 mr-2 h-5 w-5" />
                    New Appointment
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, appointments.length)}
                    </span>{' '}
                    of <span className="font-medium">{appointments.length}</span> results
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Appointments</p>
                <p className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-100">{appointments.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Confirmed</p>
                <p className="mt-1 text-2xl font-semibold text-green-900 dark:text-green-100">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-yellow-900 dark:text-yellow-100">
                  {appointments.filter(a => a.status === 'pending').length}
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
