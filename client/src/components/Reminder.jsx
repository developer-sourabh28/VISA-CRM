import { useState, useEffect } from "react";
import { Plus, Bell, Clock, Calendar, Filter, CheckCircle2, XCircle, AlertCircle, Mail, MessageCircle, Search, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "./ui/use-toast.js";
import { useUser } from '../context/UserContext';
import { apiRequest } from '../lib/api';
import { useMutation } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import BackButton from "./BackButton";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

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
      const response = await apiRequest('GET', '/api/visa/payments/upcoming');
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
          return dueDate.getTime() === today.getTime();
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

  // Filter payment reminders from the fetched reminders
  const paymentDueReminders = reminders.filter(r => r.category === 'PAYMENT' && r.status === 'PENDING');

  // Debug render
  console.log('Current reminders state:', reminders);
  console.log('Loading state:', loading);
  console.log('User context:', user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Reminders
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
            <Button
              onClick={() => {
                fetchReminders();
                fetchPaymentReminders();
              }}
              className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            
            <Button
              onClick={() => setShowForm(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5" />
              <span>Add Reminder</span>
            </Button>
          </div>
        </div>

        {/* Payment Due Reminders Section */}
        {paymentDueReminders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center"><Clock className="mr-2" />Payment Due Reminders</h2>
            <ul className="space-y-2">
              {paymentDueReminders.map(reminder => (
                <li key={reminder._id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium text-yellow-800">{reminder.title}</div>
                    <div className="text-sm text-gray-700">{reminder.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Due: {new Date(reminder.reminderDate).toLocaleDateString()} at {reminder.reminderTime || '09:00'}</div>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleMarkComplete(reminder._id)}>
                      Mark Complete
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendMessageMutation.mutate({ reminderId: reminder._id, messageType: 'whatsapp' })}>
                      WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendMessageMutation.mutate({ reminderId: reminder._id, messageType: 'email' })}>
                      Email
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reminders Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Reminders */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-amber-500" />
                  Upcoming Reminders
                </h3>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50 rounded-full w-40"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">Loading reminders...</span>
                  </div>
                ) : reminders.filter(r => 
                  !selectedDate || new Date(r.reminderDate).toISOString().split('T')[0] === selectedDate
                ).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No reminders found</p>
                  </div>
                ) : (
                  reminders
                    .filter(r => 
                      !selectedDate || new Date(r.reminderDate).toISOString().split('T')[0] === selectedDate
                    )
                    .sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate))
                    .map((reminder) => (
                      <div 
                        key={reminder._id} 
                        className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-md transition-all duration-300"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Badge 
                                className={`mr-2 ${
                                  reminder.priority === "High" 
                                    ? "bg-red-100/40 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
                                    : reminder.priority === "Medium"
                                    ? "bg-yellow-100/40 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-green-100/40 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                }`}
                              >
                                {reminder.priority}
                              </Badge>
                              <h4 className="font-medium text-gray-900 dark:text-white">{reminder.title}</h4>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {reminder.description}
                            </p>
                            
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-3">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDateTime(reminder.reminderDate, reminder.reminderTime)}
                              </span>
                              <span className="flex items-center">
                                <Bell className="h-3 w-3 mr-1" />
                                {reminder.notificationMethod}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkComplete(reminder._id)}
                              className="h-8 w-8 p-0 hover:bg-green-100/30 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(reminder._id)}
                              className="h-8 w-8 p-0 hover:bg-red-100/30 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {(reminder.email || reminder.mobileNumber) && (
                          <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-end space-x-2">
                            {reminder.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendMessage(reminder._id, "email")}
                                className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                disabled={sendMessageMutation.isLoading}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                <span className="text-xs">Send Email</span>
                              </Button>
                            )}
                            {reminder.mobileNumber && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendMessage(reminder._id, "whatsapp")}
                                className="hover:bg-amber-100/30 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                disabled={sendMessageMutation.isLoading}
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                <span className="text-xs">Send WhatsApp</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Payment Reminders */}
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-amber-500" />
                  Upcoming Payments
                </h3>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                    <span className="ml-3 text-gray-500 dark:text-gray-400">Loading payment reminders...</span>
                  </div>
                ) : paymentReminders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No upcoming payments found</p>
                  </div>
                ) : (
                  paymentReminders.map((payment) => (
                    <div 
                      key={payment._id} 
                      className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Badge 
                              className={`mr-2 ${getUrgencyColor(payment.dueDate)}`}
                            >
                              {calculateUrgency(payment.dueDate)}
                            </Badge>
                            <h4 className="font-medium text-gray-900 dark:text-white">{payment.clientName}</h4>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Amount Due: ₹{payment.amountDue?.toLocaleString() || 0}
                          </p>
                          
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-3">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(payment.dueDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              {payment.paymentType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-2xl sm:max-w-md">
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl"></div>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Add New Reminder
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Create a reminder with notification options
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Reminder title"
                required
                className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional details"
                className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminderDate">Date</Label>
                <Input
                  id="reminderDate"
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({...formData, reminderDate: e.target.value})}
                  required
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminderTime">Time</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({...formData, reminderTime: e.target.value})}
                  required
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                    <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                    <SelectItem value="DEADLINE">Deadline</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                    <SelectItem value="FOLLOWUP">Follow-up</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                placeholder="Optional client name"
                className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="For notifications"
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile (Optional)</Label>
                <Input
                  id="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                  placeholder="For WhatsApp"
                  className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="bg-transparent border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              >
                Save Reminder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 