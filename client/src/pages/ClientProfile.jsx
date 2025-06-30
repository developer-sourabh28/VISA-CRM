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
  Trash2,
  Handshake,
  Edit,
  History as HistoryIcon,
  FileSearch
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVisaTracker, getClient, getClientAppointments, getClientTasks, createClientTask, updateClientTask, deleteClientTask, apiRequest, getOtherApplicantDetails, getClientPayments, getClientAgreements, getClientMeeting, createOrUpdateClientMeeting, getClientEnquiries, createClientEnquiry } from '../lib/api';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "../components/ui/tabs";

function ClientProfile() {
  const [location, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [isOtherDetailsOpen, setIsOtherDetailsOpen] = useState(false);
  const [otherApplicantDetails, setOtherApplicantDetails] = useState([]);
  const [selectedOtherIdx, setSelectedOtherIdx] = useState(0);
  const [linkedClientId, setLinkedClientId] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState({
    meetingType: '',
    dateTime: '',
    platform: '',
    status: 'NOT_SCHEDULED',
    notes: '',
    assignedTo: ''
  });
  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false);
  const [isCreateEnquiryDialogOpen, setIsCreateEnquiryDialogOpen] = useState(false);
  const [newEnquiryDetails, setNewEnquiryDetails] = useState({
    enquirySource: 'Website',
    enquiryStatus: 'New',
    assignedConsultant: '',
    priorityLevel: 'Medium',
    notes: ''
  });

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

  // Fetch client enquiries
  const {
    data: clientEnquiriesResponse,
    isLoading: enquiriesLoading,
    error: enquiriesError
  } = useQuery({
    queryKey: ['clientEnquiries', clientId],
    queryFn: () => getClientEnquiries(clientId),
    enabled: !!clientId,
    retry: false
  });

  const clientEnquiries = clientEnquiriesResponse?.data || [];

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
    data: appointmentsResponse,
    isLoading: appointmentsLoading,
    error: appointmentsError
  } = useQuery({
    queryKey: ['clientAppointments', clientId],
    queryFn: () => getClientAppointments(clientId),
    enabled: !!clientId,
    retry: false
  });
  
  const { 
    data: paymentsResponse, 
    isLoading: paymentsLoading, 
    error: paymentsError 
  } = useQuery({
      queryKey: ['clientPayments', clientId],
      queryFn: () => getClientPayments(clientId),
      enabled: !!clientId,
  });

  const { 
    data: agreementsResponse, 
    isLoading: agreementsLoading, 
    error: agreementsError 
  } = useQuery({
      queryKey: ['clientAgreements', clientId],
      queryFn: () => getClientAgreements(clientId),
      enabled: !!clientId,
  });

  // Fetch client meeting
  const {
    data: meetingResponse,
    isLoading: meetingLoading,
    error: meetingError
  } = useQuery({
    queryKey: ['clientMeeting', clientId],
    queryFn: () => getClientMeeting(clientId),
    enabled: !!clientId,
    retry: false
  });

  // Get activities data from the response
  const activities = appointmentsResponse?.data;
  const payments = paymentsResponse?.data || [];
  const agreements = agreementsResponse?.data || [];
  const meeting = meetingResponse?.data;

  // Mutation for creating a new enquiry
  const createEnquiryMutation = useMutation({
    mutationFn: (enquiryData) => createClientEnquiry(clientId, enquiryData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New enquiry created successfully!",
      });
      queryClient.invalidateQueries(['clientEnquiries', clientId]);
      setIsCreateEnquiryDialogOpen(false);
      setNewEnquiryDetails({
        enquirySource: 'Website',
        enquiryStatus: 'New',
        assignedConsultant: '',
        priorityLevel: 'Medium',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create enquiry",
        variant: "destructive",
      });
    },
  });

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
          setTask([]);
        }
      }
    };
    fetchTasks();
  }, [clientId, isLoading]);

  // Effect to populate meeting details when meeting data is loaded
  useEffect(() => {
    if (meeting) {
      setMeetingDetails({
        meetingType: meeting.meetingType || '',
        dateTime: meeting.dateTime ? meeting.dateTime.slice(0, 16) : '',
        platform: meeting.platform || '',
        status: meeting.status || 'NOT_SCHEDULED',
        notes: meeting.notes || '',
        assignedTo: meeting.assignedTo || ''
      });
    }
  }, [meeting]);

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

  // When a file is selected:
const handleFileChange = async (e, idx) => {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    // Upload to backend
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    // Save the file URL/filename in the document
    const newDocs = [...otherDocumentCollection.documents];
    newDocs[idx].fileUrl = data.url; // or data.filename
    setOtherDocumentCollection({ ...otherDocumentCollection, documents: newDocs });
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

  const handleViewPayments = () => {
    setActiveTab('status');
  };

  // Meeting handlers
  const handleSaveMeeting = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await createOrUpdateClientMeeting(clientId, meetingDetails);
      if (response.success) {
        toast({
          title: "Success",
          description: "Meeting details saved successfully.",
        });
        setIsMeetingFormOpen(false);
        // Refresh the meeting data
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save meeting details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while saving meeting.",
        variant: "destructive",
      });
    }
  };

  // Handler for creating a new enquiry
  const handleCreateEnquiry = () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is missing.",
        variant: "destructive",
      });
      return;
    }

    createEnquiryMutation.mutate(newEnquiryDetails);
  };

  // Handler for viewing enquiry details
  const handleViewEnquiry = (enquiryId) => {
    if (!enquiryId) return;
    setLocation(`/enquiries/${enquiryId}`);
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
    <div className="p-6 space-y-6 min-h-screen rounded-xl shadow-lg bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Profile Header Card */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 bg-amber-500 dark:bg-amber-900 rounded-full flex items-center justify-center text-amber-800 dark:text-amber-300">
              <User size={40} />
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {client?.firstName || ''} {client?.lastName || ''}
                </h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(client?.status)}`}>
                  {client?.status || "Active"}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{client?.visaType || "No Visa Type"}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Updated: {formatDate(client?.updatedAt)} • {client?.updatedAt ? Math.round((new Date() - new Date(client.updatedAt)) / (1000 * 60 * 60 * 24)) : 0} days ago
              </p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-700 dark:text-gray-300 text-sm">
            <div>
              <p className="font-semibold">Assigned Consultant</p>
              <p>{client.assignedConsultant || "Not Assigned"}</p>
            </div>
            <div>
              <p className="font-semibold">Client ID</p>
              <p>{client.applicantId || (client._id ? client._id.substring(0, 8) : "—")}</p>
            </div>
            <div>
              <p className="font-semibold">Country</p>
              <p>{client.address?.country || "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Timeline</p>
              <p>Started: {formatDate(client.createdAt)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
              onClick={() => setIsTaskFormOpen(true)}
            >
              <Plus size={16} /><span>Add Task</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
              onClick={handleSendEmail}
            >
              <Send size={16} /><span>Send Email</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
              onClick={() => setIsCreateEnquiryDialogOpen(true)}
            >
              <FileSearch size={16} /><span>Create New Enquiry</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
              onClick={async () => {
                try {
                  const res = await getOtherApplicantDetails(client._id);
                  setOtherApplicantDetails(res.data || []);
                  setIsOtherDetailsOpen(true);
                } catch (err) {
                  toast({ title: 'Error', description: err.message || 'Failed to fetch details', variant: 'destructive' });
                }
              }}
            >
              <FileText size={16} /><span>View Other Applicant Details</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="history" className="flex items-center space-x-2"><FileText size={16} /><span>History</span></TabsTrigger>
              <TabsTrigger value="status" className="flex items-center space-x-2"><Clock size={16} /><span>Status</span></TabsTrigger>
              <TabsTrigger value="enquiries" className="flex items-center space-x-2"><HistoryIcon size={16} /><span>Enquiries</span></TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center space-x-2"><Edit size={16} /><span>Notes</span></TabsTrigger>
              <TabsTrigger value="visaTracker" className="flex items-center space-x-2"><MapPin size={16} /><span>Visa Tracker</span></TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="p-6 dark:text-white">
              <h3 className="text-lg font-semibold mb-4">Client History</h3>
              <h4 className="text-md font-semibold mb-3">Activity Log</h4>
              {activities?.length > 0 ? (
                <div className="overflow-x-auto">
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
              ) : (
                <p className="text-gray-500">No history available for this client.</p>
              )}
            </TabsContent>

            <TabsContent value="enquiries" className="p-6 space-y-4 dark:text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Enquiry History</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateEnquiryDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus size={16} /><span>Create New Enquiry</span>
                </Button>
              </div>
              
              {enquiriesLoading ? (
                <div className="text-center py-8">Loading enquiries...</div>
              ) : clientEnquiries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="pb-2 font-medium">Enquiry ID</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Source</th>
                        <th className="pb-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientEnquiries.map((enquiry) => (
                        <tr key={enquiry._id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleViewEnquiry(enquiry._id)}>
                          <td className="py-3 pr-4">
                            <div className="text-sm font-medium">{enquiry.enquiryId}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="text-sm">{formatDate(enquiry.createdAt)}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              enquiry.enquiryStatus === 'New' ? 'bg-blue-100 text-blue-800' :
                              enquiry.enquiryStatus === 'Qualified' ? 'bg-green-100 text-green-800' :
                              enquiry.enquiryStatus === 'Processing' ? 'bg-purple-100 text-purple-800' :
                              enquiry.enquiryStatus === 'Closed' ? 'bg-gray-100 text-gray-800' :
                              enquiry.enquiryStatus === 'Lost' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {enquiry.enquiryStatus}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="text-sm">{enquiry.enquirySource}</div>
                          </td>
                          <td className="py-3 text-right">
                            <button 
                              className="text-blue-600 hover:underline text-xs flex items-center gap-1 ml-auto"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click from triggering
                                handleViewEnquiry(enquiry._id);
                              }}
                            >
                              View Details <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No enquiries found for this client.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCreateEnquiryDialogOpen(true)}
                    className="mt-4"
                  >
                    Create First Enquiry
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="status" className="p-6 space-y-6 dark:text-white">
              <h3 className="text-lg font-semibold mb-4">Client Status Tracking</h3>
              
              {/* Agreements Section */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white"><Handshake size={20} /><span>Agreements</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">Manage agreement details for this client.</p>
                  {agreementsLoading ? <p>Loading agreements...</p> : agreements.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Sent Date</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Notes</th>
                            <th className="text-left p-2">Document</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agreements.map(agreement => (
                            <tr key={agreement._id} className="border-b">
                              <td className="p-2">{new Date(agreement.agreement.sentDate).toLocaleDateString()}</td>
                              <td className="p-2">{agreement.agreement.status}</td>
                              <td className="p-2">{agreement.agreement.notes}</td>
                              <td className="p-2">
                                {agreement.agreement.documentUrl && <a href={agreement.agreement.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View</a>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p>No agreements found.</p>}
                </CardContent>
              </Card>

              {/* Meetings Section */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white"><Calendar size={20} /><span>Meetings</span></CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsMeetingFormOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus size={16} /><span>{meeting ? 'Edit Meeting' : 'Schedule Meeting'}</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">Manage meeting details for this client.</p>
                  {meetingLoading ? <p>Loading meetings...</p> : meeting ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">Meeting Type:</p>
                            <p>{meeting.meetingType || 'N/A'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">Date & Time:</p>
                            <p>{meeting.dateTime ? new Date(meeting.dateTime).toLocaleString() : 'N/A'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">Platform:</p>
                            <p>{meeting.platform || 'N/A'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">Status:</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              meeting.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                              meeting.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : 
                              meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {meeting.status || 'N/A'}
                            </span>
                          </div>
                          {meeting.assignedTo && (
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold">Assigned To:</p>
                              <p>{meeting.assignedTo}</p>
                            </div>
                          )}
                          {meeting.notes && (
                            <div className="flex items-start space-x-2">
                              <p className="font-semibold">Notes:</p>
                              <p className="text-sm text-gray-600">{meeting.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">No meetings scheduled</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsMeetingFormOpen(true)}
                        className="flex items-center space-x-2"
                      >
                        <Plus size={16} /><span>Schedule Meeting</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payments Section */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white"><CreditCard size={20} /><span>Payments</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">Manage payment details for this client.</p>
                  {paymentsLoading ? <p>Loading payments...</p> : payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Amount</th>
                            <th className="text-left p-2">Method</th>
                            <th className="text-left p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(payment => (
                            <tr key={payment._id} className="border-b">
                              <td className="p-2">{new Date(payment.date).toLocaleDateString()}</td>
                              <td className="p-2">${payment.amount}</td>
                              <td className="p-2">{payment.paymentMethod}</td>
                              <td className="p-2">{payment.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p>No payments found.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="p-6 space-y-6 dark:text-white">
              <h3 className="text-lg font-semibold mb-4">Notes & Tasks</h3>
              
              {/* Tasks Section */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white">
                    <Clock size={20} /><span>Tasks</span>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsTaskFormOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus size={16} /><span>Add Task</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">Manage tasks associated with this client.</p>
                  
                  {task.length > 0 ? (
                    <div className="space-y-4">
                      {task.map((item) => (
                        <div 
                          key={item._id} 
                          className="p-4 border rounded-lg bg-white dark:bg-gray-800/50 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Not specified'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTask(item._id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          {item.description && (
                            <p className="mt-2 text-gray-600 dark:text-gray-300">{item.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.priority} Priority
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {item.type}
                            </span>
                            {item.assignedTo && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                Assigned: {item.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No tasks have been created for this client yet.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTaskFormOpen(true)}
                        className="mt-2"
                      >
                        Create First Task
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Client Notes */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-white">
                    <FileText size={20} /><span>Client Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notesData.length > 0 ? (
                    <div className="space-y-4">
                      {notesData.map((note, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-white dark:bg-gray-800/50 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {note.date}</p>
                          <p className="mt-2 text-gray-600 dark:text-gray-300">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No notes available for this client.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visaTracker" className="p-6 dark:text-white">
              <h3 className="text-lg font-semibold mb-4">Visa Application Tracker</h3>
              
              {visaTrackerLoading ? (
                <div className="p-4 text-center">Loading visa tracker...</div>
              ) : visaTracker ? (
                <div>
                  <VisaApplicationTracker
                    client={client}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No visa tracking information available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

      {/* Other Applicant Details Dialog */}
      <Dialog open={isOtherDetailsOpen} onOpenChange={setIsOtherDetailsOpen}>
        <DialogContent className="max-w-4xl flex flex-col h-[80vh]">
          <DialogHeader>
            <DialogTitle>Other Applicant Details</DialogTitle>
          </DialogHeader>
          {otherApplicantDetails.length === 0 ? (
            <div className="text-gray-500 flex-1 flex items-center justify-center">No other applicant details found.</div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="flex space-x-2 mb-4">
                {otherApplicantDetails.map((item, idx) => (
                  <Button className='bg-amber-500 text-white border-amber-500 ml-2 mt-2' key={item._id} variant={selectedOtherIdx === idx ? 'default' : 'outline'} size="sm" onClick={() => setSelectedOtherIdx(idx)}>
                    Application {idx + 1}
                  </Button>
                ))}
              </div>
              {/* Show details for selectedOtherIdx */}
              {(() => {
                const item = otherApplicantDetails[selectedOtherIdx];
                return (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Document Collection</h4>
                      {item.documentCollection?.documents?.length > 0 ? (
                        <ul>
                          {item.documentCollection.documents.map((doc, dIdx) => (
                            <li key={dIdx}>
                              <strong>Type:</strong> {doc.type} | <strong>Status:</strong> {doc.verificationStatus} | <strong>Notes:</strong> {doc.notes}
                              {doc.fileUrl && (
                                <a className='bg-black' href={doc.fileUrl} target="_blank" rel="noopener noreferrer">View PDF</a>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="ml-2"
                                onClick={async () => {
                                  const detailId = item._id; // The OtherApplicantDetail _id
                                  const section = "documentCollection"; // or "supportingDocuments"
                                  const docIndex = dIdx; // index of the document

                                  try {
                                    const response = await fetch(`/api/other-applicant-details/${detailId}/${section}/${docIndex}`, {
                                      method: 'DELETE',
                                    });
                                    if (!response.ok) {
                                      throw new Error('Failed to delete document');
                                    }
                                    // Refetch all details to update UI
                                    const res = await getOtherApplicantDetails(enquiry?.clientId || enquiry?._id);
                                    setOtherApplicantDetails(res.data || []);
                                    toast({ title: 'Success', description: 'Document deleted.' });
                                  } catch (err) {
                                    toast({ title: 'Error', description: err.message || 'Failed to delete document', variant: 'destructive' });
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div>No documents added.</div>
                      )}
                      <div>
                        <strong>Collection Status:</strong> {item.documentCollection?.collectionStatus}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Visa Application</h4>
                      <div><strong>Type:</strong> {item.visaApplication?.type}</div>
                      <div><strong>Submission Date:</strong> {item.visaApplication?.submissionDate}</div>
                      <div><strong>Status:</strong> {item.visaApplication?.status}</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Supporting Documents</h4>
                      {item.supportingDocuments?.documents?.length > 0 ? (
                        <ul>
                          {item.supportingDocuments.documents.map((doc, idx) => (
                            <li key={idx}>
                              <strong>Type:</strong> {doc.type} | <strong>Date:</strong> {doc.preparationDate}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div>No supporting documents added.</div>
                      )}
                      <div>
                        <strong>Preparation Status:</strong> {item.supportingDocuments?.preparationStatus}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Payment Details</h4>
                      <div><strong>Type:</strong> {item.paymentDetails?.type}</div>
                      <div><strong>Amount:</strong> {item.paymentDetails?.amount}</div>
                      <div><strong>Method:</strong> {item.paymentDetails?.method}</div>
                      <div><strong>Status:</strong> {item.paymentDetails?.status}</div>
                      <div><strong>Due Date:</strong> {item.paymentDetails?.dueDate}</div>
                      <div><strong>Payment Date:</strong> {item.paymentDetails?.paymentDate}</div>
                      <div><strong>Notes:</strong> {item.paymentDetails?.notes}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            <Button className='bg-amber-500' variant="outline" onClick={() => setIsOtherDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Form Dialog */}
      <Dialog open={isMeetingFormOpen} onOpenChange={setIsMeetingFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Schedule and manage meeting details for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meetingType" className="text-right">Meeting Type</Label>
              <Select
                value={meetingDetails.meetingType}
                onValueChange={(value) => setMeetingDetails({ ...meetingDetails, meetingType: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INITIAL_CONSULTATION">Initial Consultation</SelectItem>
                  <SelectItem value="DOCUMENT_REVIEW">Document Review</SelectItem>
                  <SelectItem value="STATUS_UPDATE">Status Update</SelectItem>
                  <SelectItem value="VISA_INTERVIEW_PREP">Visa Interview Prep</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateTime" className="text-right">Date & Time</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={meetingDetails.dateTime}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, dateTime: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="platform" className="text-right">Platform</Label>
              <Select
                value={meetingDetails.platform}
                onValueChange={(value) => setMeetingDetails({ ...meetingDetails, platform: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZOOM">Zoom</SelectItem>
                  <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                  <SelectItem value="TEAMS">Microsoft Teams</SelectItem>
                  <SelectItem value="PHONE">Phone Call</SelectItem>
                  <SelectItem value="IN_PERSON">In Person</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                value={meetingDetails.status}
                onValueChange={(value) => setMeetingDetails({ ...meetingDetails, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_SCHEDULED">Not Scheduled</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedTo" className="text-right">Assigned To</Label>
              <Input
                id="assignedTo"
                value={meetingDetails.assignedTo}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, assignedTo: e.target.value })}
                className="col-span-3"
                placeholder="Enter consultant name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                value={meetingDetails.notes}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, notes: e.target.value })}
                className="col-span-3"
                placeholder="Add notes about the meeting..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMeetingFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMeeting}>Save Meeting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Enquiry Dialog */}
      <Dialog open={isCreateEnquiryDialogOpen} onOpenChange={setIsCreateEnquiryDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Enquiry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="enquirySource">Enquiry Source</Label>
              <Select
                value={newEnquiryDetails.enquirySource}
                onValueChange={(value) => setNewEnquiryDetails({...newEnquiryDetails, enquirySource: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Advertisement">Advertisement</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="enquiryStatus">Status</Label>
              <Select
                value={newEnquiryDetails.enquiryStatus}
                onValueChange={(value) => setNewEnquiryDetails({...newEnquiryDetails, enquiryStatus: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignedConsultant">Assigned Consultant</Label>
              <Input
                id="assignedConsultant"
                value={newEnquiryDetails.assignedConsultant}
                onChange={(e) => setNewEnquiryDetails({...newEnquiryDetails, assignedConsultant: e.target.value})}
                placeholder="Consultant name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priorityLevel">Priority</Label>
              <Select
                value={newEnquiryDetails.priorityLevel}
                onValueChange={(value) => setNewEnquiryDetails({...newEnquiryDetails, priorityLevel: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newEnquiryDetails.notes}
                onChange={(e) => setNewEnquiryDetails({...newEnquiryDetails, notes: e.target.value})}
                placeholder="Add any relevant notes about this enquiry"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateEnquiryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateEnquiry}
              disabled={createEnquiryMutation.isPending}
            >
              {createEnquiryMutation.isPending ? "Creating..." : "Create Enquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClientProfile;