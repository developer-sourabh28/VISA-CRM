import { useState, useEffect } from "react";
import { Plus, Bell, Clock, Calendar, Filter, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "./ui/use-toast.js";

export default function Reminder() {
  const { toast } = useToast();
  const [reminders, setReminders] = useState([]);
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
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      console.log('Fetching reminders...');
      const res = await fetch("/api/reminders");
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      if (data.success) {
        setReminders(data.data);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch reminders",
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
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
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
      const res = await fetch(`/api/reminders/${id}/complete`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(date);
    return `${dateObj.toLocaleDateString()} at ${time}`;
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-6 py-4 border-b bg-white gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reminders</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSelectedDate("")}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No reminders set</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repeat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reminders.map((reminder) => (
                <tr key={reminder._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reminder.title}</div>
                        <div className="text-sm text-gray-500">{reminder.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(reminder.reminderDate, reminder.reminderTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reminder.repeat}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      reminder.status === "Completed" 
                        ? "bg-green-100 text-green-800" 
                        : reminder.status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {reminder.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {reminder.status === "Pending" && (
                        <button
                          onClick={() => handleMarkComplete(reminder._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Reminder Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Reminder</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Repeat</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.repeat}
                    onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
                  >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Method</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.notificationMethod}
                  onChange={(e) => setFormData({ ...formData, notificationMethod: e.target.value })}
                >
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Add Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 