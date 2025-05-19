import { Link } from 'wouter';
import { MoreHorizontalIcon, PlusIcon } from 'lucide-react';

function DeadlineList({ deadlines, loading, onAddDeadline }) {
  // Determine progress bar fill class based on status
  const getProgressBarClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'progress-bar-fill-success';
      case 'Overdue':
        return 'progress-bar-fill-danger';
      default:
        return 'progress-bar-fill-warning';
    }
  };

  // Format date to display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Deadlines</h3>
        <div>
          <button 
            type="button" 
            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={onAddDeadline}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Deadline
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-6 text-center">Loading deadlines...</div>
        ) : deadlines && deadlines.length > 0 ? (
          deadlines.map((deadline) => (
            <div key={deadline.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">Client: {deadline.client}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <time dateTime={deadline.dueDate}>{formatDate(deadline.dueDate)}</time>
                    {` (${deadline.daysLeft} ${deadline.daysLeft === 1 ? 'day' : 'days'} left)`}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(deadline.status)}`}>
                    {deadline.status}
                  </span>
                  <button type="button" className="rounded-full bg-white p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <MoreHorizontalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="progress-bar">
                  <div 
                    className={getProgressBarClass(deadline.status)} 
                    style={{ width: `${deadline.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">No upcoming deadlines</div>
        )}
      </div>
      
      <div className="border-t p-5">
        <Link href="/tasks" className="text-sm font-medium text-primary-600 hover:text-primary-500">
          View all deadlines
        </Link>
      </div>
    </div>
  );
}

export default DeadlineList;
