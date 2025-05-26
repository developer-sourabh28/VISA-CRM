import { useState} from 'react';
import { Link } from 'wouter';
import { PlusIcon, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAppointments } from '../lib/api';
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


  // Fetch appointments
  const { data: appointmentsData, isLoading} = useQuery({
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

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <Link href="/appointments/new">
            <Button>
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={status}
                onChange={handleStatusChange}
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="No-show">No-show</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={appointmentType}
                onChange={handleTypeChange}
              >
                <option value="">All Types</option>
                <option value="Initial Consultation">Initial Consultation</option>
                <option value="Document Review">Document Review</option>
                <option value="Embassy Interview">Embassy Interview</option>
                <option value="Biometrics">Biometrics</option>
                <option value="Follow-up Meeting">Follow-up Meeting</option>
                <option value="Application Submission">Application Submission</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center">Loading appointments...</div>
            ) : appointments.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Date & Time</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md flex flex-col items-center justify-center mr-3">
                            <div className="text-xs font-medium text-gray-500">
                              {getCalendarMonth(appointment.scheduledFor)}
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {getCalendarDay(appointment.scheduledFor)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-900">
                            {formatDateTime(appointment.scheduledFor)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.client?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.appointmentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "Scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : appointment.status === "No-show"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.assignedTo?.firstName} {appointment.assignedTo?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/appointments/${appointment._id}`}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          href={`/appointments/${appointment._id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No appointments found. Try adjusting your filter criteria or schedule a new appointment.
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

export default Appointments;
