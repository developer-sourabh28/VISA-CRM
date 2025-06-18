import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  User,
  FileText,
  Clock,
  ChevronRight,
  Plus,
  ArrowLeft,
  Send,
  CircleUser,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getVisaTracker, getClient, getClientAppointments, getClientTasks, createClientTask, updateClientTask, deleteClientTask, apiRequest } from '../lib/api';
import { useToast } from '../components/ui/use-toast.js';
import VisaApplicationTracker from "../components/VisaApplicationTracker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

function ClientProfile() {
  const [location, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('history');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [task, setTask] = useState([]);
  const [taskDetails, setTaskDetails] = useState({
    title: '',
    description: '',
    type: 'REMINDER',
    dueDate: '',
    priority: 'MEDIUM',
    assignedTo: '',
    checklist: [],
    notes: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);

  // Extract client ID from URL
  const clientId = id || location.split('/').pop();
  console.log('Current location:', location);
  console.log('Extracted client ID:', clientId);
  console.log('useParams ID:', id);

  // Fetch client data
  const {
    data: clientResponse,
    isLoading: clientLoading,
    error: clientError
  } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) {
        console.error('No client ID provided');
        throw new Error('Client ID is required');
      }
      console.log('Making API request for client ID:', clientId);
      try {
        const response = await getClient(clientId);
        console.log('Raw API Response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching client:', error);
        throw error;
      }
    },
    enabled: !!clientId,
    retry: false
  });

  // Get client data from the response
  const client = clientResponse?.data?.data || clientResponse?.data;
  console.log('Client Response:', clientResponse);
  console.log('Client Data:', client);

  // Fetch visa tracker data
  const {
    data: visaTrackerResponse,
    isLoading: visaTrackerLoading,
    error: visaTrackerError
  } = useQuery({
    queryKey: ['visaTracker', client?._id],
    queryFn: async () => {
      if (!client?._id) {
        throw new Error('Client ID is required');
      }
      console.log('Fetching visa tracker for client:', client._id);
      try {
        const response = await getVisaTracker(client._id);
        console.log('Visa tracker response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching visa tracker:', error);
        throw error;
      }
    },
    enabled: !!client?._id,
    retry: false
  });

  // Get visa tracker data from the response
  const visaTracker = visaTrackerResponse?.data?.data || visaTrackerResponse?.data;

  // Fetch client activities/history
  const {
    data: activitiesResponse,
    isLoading: activitiesLoading,
    error: activitiesError
  } = useQuery({
    queryKey: ['clientAppointments', clientId],
    queryFn: () => getClientAppointments(clientId),
    enabled: !!clientId && !!client,
    retry: false
  });

  // Get activities data from the response
  const activities = activitiesResponse?.data;

  useEffect(() => {
    if (clientError) {
      console.error('Client Error:', clientError);
      toast({
        title: "Error loading client",
        description: clientError.message || "Could not load client data. Please try again.",
        variant: "destructive"
      });
    }
  }, [clientError, toast]);

  useEffect(() => {
    const fetchTasks = async () => {
      if(clientId && !isLoading) {
        try {
          const response = await getClientTasks(clientId);
          if(response?.data) {
            setTask(Array.isArray(response.data) ? response.data : [response.data]);
          } else {
            setTask([]);
          }
        } catch (error) {
          console.error('Error fetching tasks:', error);
          toast({
            title: "Error fetching tasks",
            description: error.message || "Could not fetch tasks. Please try again.",
            variant: "destructive"
          });
        }
      }
    };
    fetchTasks();
  }, [clientId, isLoading, toast]);

  const handleSaveTask = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required to save tasks.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await createClientTask(clientId, taskDetails);

      if (response?.data) {
        toast({
          title: "Task Created",
          description: "The task has been successfully created.",
        });

        setTask((prevTasks) => [...prevTasks, response.data]);
        setIsTaskFormOpen(false);
        setTaskDetails({
          title: '',
          description: '',
          type: 'REMINDER',
          dueDate: '',
          priority: 'MEDIUM',
          assignedTo: '',
          checklist: [],
          notes: ''
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "Could not create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await deleteClientTask(clientId, taskId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Task deleted successfully.",
        });
        // Remove the deleted task from the state
        setTask((prevTasks) => prevTasks.filter(task => task._id !== taskId));
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete task.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while deleting task.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Add this before the return statement in ClientProfile
  const notesData = client && client.notes
    ? Array.isArray(client.notes)
      ? client.notes
      : [{ date: client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : 'N/A', note: client.notes }]
    : [];

  const handleSendEmail = async () => {
    if (!client?.email) {
      toast({
        title: "Error",
        description: "No email address available for this client.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "Loading",
        description: "Fetching email templates...",
      });

      // Fetch available templates for client type
      const templatesResponse = await apiRequest('GET', '/api/email-templates/type/CLIENT');
      
      if (!templatesResponse.success) {
        throw new Error(templatesResponse.message || 'Failed to fetch email templates');
      }

      const templates = templatesResponse.data;
      if (!templates || templates.length === 0) {
        toast({
          title: "No Templates Available",
          description: "Please create an email template for clients before sending emails.",
          variant: "destructive",
        });
        return;
      }

      // Use the first template by default
      const template = templates[0];
      
      // Replace variables in the template
      let subject = template.subject;
      let body = template.body;

      // Replace variables with actual values
      const variables = {
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        visaType: client.visaType || '',
        destinationCountry: client.address?.country || '',
        status: client.status || '',
      };

      // Replace variables in subject and body
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      });

      // Show sending toast
      toast({
        title: "Sending",
        description: "Sending email...",
      });

      // Send email using apiRequest
      const response = await apiRequest('POST', '/api/send-email', {
        to: client.email,
        subject: subject,
        body: body,
        isHtml: true
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Email sent successfully!",
        });
      } else {
        throw new Error(response.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update the navigation to payments
  const handleViewPayments = () => {
    if (id) {
      setLocation(`/payments/${id}`);
    } else {
      toast({
        title: "Error",
        description: "Client ID is required to view payments",
        variant: "destructive",
      });
    }
  };

  if (clientLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">Loading client profile...</div>
      </div>
    );
  }

  if (!client && !clientLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">
          <h2 className="text-xl font-medium">Client not found</h2>
          <p className="mt-2 text-gray-600">The client you're looking for doesn't exist or you may not have permission to view it.</p>
          <button 
            onClick={() => setLocation('/clients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Clients
          </button>
        </div>
      </div>
    );
  }

  // Convert client status to badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-purple-100 text-purple-800";
      case "Hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Header Area */}
      <div className="bg-white border-b bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-amber-400 flex items-center justify-center text-amber-700">
                  <CircleUser size={24} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-medium">
                    {client?.firstName || ''} {client?.lastName || ''}
                  </h1>
                  <span className={`px-2 py-0.5 text-xs bg-amber-400 text-amber-700 font-medium rounded-full ${getStatusBadgeClass(client?.status)}`}>
                    {client?.status || "Active"}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{client?.visaType || "No Visa Type"}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Updated: {formatDate(client?.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Client Details Row */}
          <div className="grid grid-cols-4 gap-8 mt-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Assigned Consultant</div>
              <div className="text-sm font-medium">
                {client.assignedConsultant || "Not Assigned"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Application ID</div>
              <div className="text-sm font-medium">
                {client._id ? client._id.substring(0, 8) : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Country</div>
              <div className="text-sm font-medium">
                {client.address?.country || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Timeline</div>
              <div className="text-sm font-medium">
                Started: {formatDate(client.createdAt)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsTaskFormOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus size={16} /><span>Add Task</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSendEmail}
              className="flex items-center space-x-2"
            >
              <Send size={16} /> Send Email
            </Button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'visaTracker' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('visaTracker')}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                Visa Tracker
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Main content area with tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          {/* Tabs navigation */}
          <div className="border-b">
            <nav className="flex">
              <button
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('history')}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  History
                </div>
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={handleViewPayments}
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={16} />
                  Payments
                </div>
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'documents' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('documents')}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Documents
                </div>
              </button>
              <button
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('notes')}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Notes
                </div>
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'history' && (
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Activity</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Assigned To</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities?.map((activity, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 pr-4">
                          <div className="text-sm">{formatDate(activity.date)}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-sm font-medium">{activity.type}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(activity.status)}`}>
                            {activity.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-sm">{activity.assignedTo || "—"}</div>
                        </td>
                        <td className="py-3 text-right">
                          <button className="text-blue-600 hover:underline text-xs flex items-center gap-1 ml-auto">
                            View Details <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="text-center py-6 text-gray-500">
                Payment history will be displayed here.
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="text-center py-6 text-gray-500">
                Client's documents will be displayed here.
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6">
                {/* Tasks Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold">Tasks</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsTaskFormOpen(true)}
                      className="flex items-center space-x-2"
                    >
                      <Plus size={16} /><span>Add Task</span>
                    </Button>
                  </div>
                  {task.length > 0 ? (
                    <div className="space-y-4">
                      {task.map((taskItem) => (
                        <div key={taskItem._id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold">{taskItem.title}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  taskItem.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                                  taskItem.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                  taskItem.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {taskItem.priority}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  taskItem.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  taskItem.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                  taskItem.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {taskItem.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{taskItem.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-100"
                              onClick={() => handleDeleteTask(taskItem._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Type:</span> {taskItem.type}
                            </div>
                            <div>
                              <span className="font-medium">Due:</span> {new Date(taskItem.dueDate).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Assigned To:</span> {taskItem.assignedTo}
                            </div>
                          </div>
                          {taskItem.notes && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Notes:</span> {taskItem.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No tasks available.</p>
                  )}
                </div>

                {/* Notes Section */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">General Notes</h4>
                  {notesData.length > 0 ? (
                    <div className="space-y-4">
                      {notesData.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                          {item.date !== 'N/A' && <p className="text-sm font-semibold text-gray-700 mb-1">{item.date}</p>}
                          <p className="text-gray-700 dark:text-gray-300">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No notes available.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'visaTracker' && (
              <div className="p-4">
                {visaTrackerLoading ? (
                  <div className="text-center py-6 text-gray-500">
                    Loading visa tracker data...
                  </div>
                ) : visaTrackerError ? (
                  <div className="text-center py-6 text-red-500">
                    Error loading visa tracker: {visaTrackerError.message}
                  </div>
                ) : client ? (
                  <VisaApplicationTracker client={client} />
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No client data available.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={taskDetails.title}
                onChange={(e) => setTaskDetails({ ...taskDetails, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select
                value={taskDetails.type}
                onValueChange={(value) => setTaskDetails({ ...taskDetails, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMINDER">Reminder</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                  <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                  <SelectItem value="NEXT_STEP">Next Step</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={taskDetails.dueDate}
                onChange={(e) => setTaskDetails({ ...taskDetails, dueDate: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <Select
                value={taskDetails.priority}
                onValueChange={(value) => setTaskDetails({ ...taskDetails, priority: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTo" className="text-right">Assigned To</Label>
              <Input
                id="assignedTo"
                value={taskDetails.assignedTo}
                onChange={(e) => setTaskDetails({ ...taskDetails, assignedTo: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea
                id="description"
                value={taskDetails.description}
                onChange={(e) => setTaskDetails({ ...taskDetails, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                value={taskDetails.notes}
                onChange={(e) => setTaskDetails({ ...taskDetails, notes: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask}>Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClientProfile;