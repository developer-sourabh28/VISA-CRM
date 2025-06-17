import { useState, useEffect } from "react";
import { Plus, Bell, Clock, Calendar, Filter, CheckCircle2, XCircle, AlertCircle, Mail, MessageCircle } from "lucide-react";
import { useToast } from "./ui/use-toast.js";
import { useUser } from '../context/UserContext';
import { apiRequest } from '../lib/api';
import { useMutation } from "@tanstack/react-query";

export default function Reminder() {
  const { toast } = useToast();
  const { user } = useUser();
  const [reminders, setReminders] = useState([]);
  const [paymentReminders, setPaymentReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "",
    priority: "Medium",
    repeat: "None",
    notificationMethod: "Email",
    type: "BIRTHDAY",
    email: "",
    mobileNumber: "",
    clientName: ""
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', `/api/reminders/${data.reminderId}/send-message`, { messageType: data.messageType }),
    onSuccess: (response) => {
      if (response.success) {
        if (response.data?.whatsappUrl) {
          // Open WhatsApp link in new tab
          window.open(response.data.whatsappUrl, '_blank');
        }
        toast({
          title: "Success",
          description: response.message || "Message sent successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send message",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    console.log('Reminder component mounted');
    console.log('Current user:', user);
    fetchReminders();
    fetchPaymentReminders();
  }, []);

  const fetchPaymentReminders = async () => {
    try {
      const response = await apiRequest('GET', '/api/dashboard/recent-activities');
      console.log('Payment reminders response:', response);
      
      if (response.success && response.upcomingPayments) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Sort by due date
        const sortedPayments = [...response.upcomingPayments].sort((a, b) => 
          new Date(a.dueDate) - new Date(b.dueDate)
        );
        
        setPaymentReminders(sortedPayments);

        // Check for payments due today and show alert
        const dueToday = sortedPayments.filter(payment => {
          const dueDate = new Date(payment.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime() && payment.recordedBy === user._id;
        });

        if (dueToday.length > 0) {
          toast({
            title: "Payment Due Today!",
            description: `You have ${dueToday.length} payment${dueToday.length > 1 ? 's' : ''} due today.`,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error('Error fetching payment reminders:', err);
      toast({
        title: "Error",
        description: "Failed to fetch payment reminders",
        variant: "destructive",
      });
    }
  };

  const fetchReminders = async () => {
    setLoading(true);
    try {
      console.log('Fetching reminders...');
      const response = await apiRequest('GET', '/api/reminders');
      console.log('Response data:', response);
      
      if (response.success) {
        // Sort reminders by date, with upcoming ones first
        const sortedReminders = response.data.sort((a, b) => {
          const dateA = new Date(a.reminderDate);
          const dateB = new Date(b.reminderDate);
          return dateA - dateB;
        });
        console.log('Sorted reminders:', sortedReminders);
        setReminders(sortedReminders);
      } else {
        console.error('Failed to fetch reminders:', response.message);
        toast({
          title: "Error",
          description: response.message || "Failed to fetch reminders",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch reminders",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest('POST', '/api/reminders', formData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Reminder added successfully",
        });
        setShowForm(false);
        fetchReminders();
        setFormData({
          title: "",
          description: "",
          reminderDate: "",
          reminderTime: "",
          priority: "Medium",
          repeat: "None",
          notificationMethod: "Email",
          type: "BIRTHDAY",
          email: "",
          mobileNumber: "",
          clientName: ""
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add reminder",
        variant: "destructive",
      });
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      const response = await apiRequest('PATCH', `/api/reminders/${id}/complete`);
      if (response.success) {
        toast({
          title: "Success",
          description: "Reminder marked as complete",
        });
        fetchReminders();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiRequest('DELETE', `/api/reminders/${id}`);
      if (response.success) {
        toast({
          title: "Success",
          description: "Reminder deleted successfully",
        });
        fetchReminders();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (reminderId, messageType) => {
    sendMessageMutation.mutate({ reminderId, messageType });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return 'No date set';
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `${formattedDate} at ${time || '00:00'}`;
  };

  const calculateUrgency = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Past due";
    if (diff === 0) return "Due today";
    return `Due in ${diff} day${diff > 1 ? "s" : ""}`;
  };

  const getUrgencyColor = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff > 10) return "text-green-600 bg-green-50";
    if (diff > 5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Debug render
  console.log('Current reminders state:', reminders);
  console.log('Loading state:', loading);
  console.log('User context:', user);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">🔔 Reminders</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Reminder
        </button>
      </div>

      {/* Payment Reminders Section */}
      {paymentReminders && paymentReminders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Payment Reminders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentReminders.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Payment Due: ₹{payment.amount?.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {payment.clientId ? `${payment.clientId.firstName} ${payment.clientId.lastName}` : 'Unknown Client'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(payment.dueDate)}`}>
                    {calculateUrgency(payment.dueDate)}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    {payment.serviceType}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <AlertCircle size={16} className="mr-2" />
                    {payment.method}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {payment.status}
                  </span>
                  {payment.status !== "Completed" && (
                    <button
                      onClick={() => handleMarkComplete(payment._id)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Mark as complete"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Reminder</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, reminderDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) =>
                    setFormData({ ...formData, reminderTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat
                </label>
                <select
                  value={formData.repeat}
                  onChange={(e) =>
                    setFormData({ ...formData, repeat: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="None">None</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BIRTHDAY">Birthday</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, mobileNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : reminders && reminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((reminder) => (
            <div
              key={reminder._id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {reminder.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {reminder.description}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                    reminder.priority
                  )}`}
                >
                  {reminder.priority}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  {formatDateTime(reminder.reminderDate, reminder.reminderTime)}
                </div>
                {reminder.repeat !== "None" && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    Repeats {reminder.repeat}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reminder.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {reminder.status}
                </span>
                <div className="flex gap-2">
                  {reminder.type === 'BIRTHDAY' && reminder.status !== "Completed" && (
                    <>
                      <button
                        onClick={() => handleSendMessage(reminder._id, 'email')}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Send Email"
                        disabled={sendMessageMutation.isLoading}
                      >
                        <Mail size={20} />
                      </button>
                      <button
                        onClick={() => handleSendMessage(reminder._id, 'whatsapp')}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Send WhatsApp"
                        disabled={sendMessageMutation.isLoading}
                      >
                        <MessageCircle size={20} />
                      </button>
                    </>
                  )}
                  {reminder.status !== "Completed" && (
                    <button
                      onClick={() => handleMarkComplete(reminder._id)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Mark as complete"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(reminder._id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete reminder"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Reminders
          </h3>
          <p className="text-gray-600">
            Add a new reminder to stay on top of your tasks
          </p>
        </div>
      )}
    </div>
  );
} 