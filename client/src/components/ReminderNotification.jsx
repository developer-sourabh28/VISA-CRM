import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function ReminderNotification() {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const checkDueReminders = async () => {
    try {
      const response = await fetch('/api/reminders/due');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setNotifications(data.data);
        setIsVisible(true);
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('Audio play failed:', err));
      }
    } catch (error) {
      console.error('Failed to fetch due reminders:', error);
    }
  };

  useEffect(() => {
    // Check for due reminders immediately when component mounts
    checkDueReminders();

    // Set up interval to check for due reminders every minute
    const intervalId = setInterval(checkDueReminders, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif._id !== id));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Due Reminders ({notifications.length})
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((reminder) => (
            <div
              key={reminder._id}
              className="flex items-start bg-gray-50 p-3 rounded-md"
            >
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {reminder.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {reminder.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    reminder.priority === 'Urgent'
                      ? 'bg-red-100 text-red-800'
                      : reminder.priority === 'High'
                      ? 'bg-orange-100 text-orange-800'
                      : reminder.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {reminder.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(reminder.reminderDate).toLocaleDateString()} at {reminder.reminderTime}
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismissNotification(reminder._id)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 