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
import { getVisaTracker, getClient, getClientAppointments, getClientTasks, createClientTask, updateClientTask, deleteClientTask, apiRequest, getOtherApplicantDetails, getClientPayments, getClientAgreements, getClientMeeting, createOrUpdateClientMeeting, getClientEnquiries, createClientEnquiry, createPayment, API_BASE_URL } from '../lib/api';
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
import { useAuth } from '../context/AuthContext';
import { useForm, Controller } from 'react-hook-form';

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
    date: new Date().toISOString().split('T')[0],
    time: '',
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
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    paymentType: 'Full Payment',
    totalAmount: '',
    amountPaid: '',
    numberOfInstallments: '',
    paymentMethod: 'Cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'Completed'
  });
  const { user } = useAuth();
  const [isOtherApplicantDialogOpen, setIsOtherApplicantDialogOpen] = useState(false);
  // Add useForm for the enquiry form
  const { handleSubmit, control, register, formState: { errors }, reset, setValue } = useForm();
  const [nextEnquiryId, setNextEnquiryId] = useState("");

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

  const createPaymentMutation = useMutation({
    mutationFn: (paymentData) => createPayment({ ...paymentData, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientPayments', clientId]);
      toast({
        title: 'Success',
        description: 'Payment added successfully!',
      });
      setIsPaymentFormOpen(false);
      setPaymentDetails({
        paymentType: 'Full Payment',
        totalAmount: '',
        amountPaid: '',
        numberOfInstallments: '',
        paymentMethod: 'Cash',
        transactionId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        description: '',
        status: 'Completed'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add payment.',
        variant: 'destructive',
      });
    },
  });

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
        date: meeting.dateTime ? meeting.dateTime.split('T')[0] : '',
        time: meeting.dateTime ? meeting.dateTime.split('T')[1] : '',
        platform: meeting.platform || '',
        status: meeting.status || 'NOT_SCHEDULED',
        notes: meeting.notes || '',
        assignedTo: meeting.assignedTo || ''
      });
    }
  }, [meeting]);

  useEffect(() => {
    if (client?._id) {
      getOtherApplicantDetails(client._id).then(res => setOtherApplicantDetails(res.data || []));
    }
  }, [client?._id]);

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
      // Combine date and time into a valid DateTime string
      const { date, time, ...otherDetails } = meetingDetails;
      if (!date || !time) {
        toast({
          title: "Error",
          description: "Both date and time are required.",
          variant: "destructive",
        });
        return;
      }

      // Create a new Date object from the date and time strings
      const dateTime = new Date(`${date}T${time}`);
      if (isNaN(dateTime.getTime())) {
        toast({
          title: "Error",
          description: "Invalid date or time format.",
          variant: "destructive",
        });
        return;
      }

      const response = await createOrUpdateClientMeeting(clientId, {
        ...otherDetails,
        dateTime: dateTime.toISOString()
      });

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

  // Add this handler for the enquiry form
  const onSubmit = (data) => {
    createEnquiryMutation.mutate(data);
  };

  // Fetch nextEnquiryId when the create enquiry dialog/tab is opened
  useEffect(() => {
    if (isCreateEnquiryDialogOpen) {
      const fetchNextEnquiryId = async () => {
        try {
          const response = await fetch("/api/enquiries/next-id");
          const data = await response.json();
          if (data.success) {
            setNextEnquiryId(data.nextEnquiryId);
            setValue && setValue("enquiryId", data.nextEnquiryId);
          } else {
            setNextEnquiryId("Error");
          }
        } catch (e) {
          setNextEnquiryId("Error");
        }
      };
      fetchNextEnquiryId();
    }
  }, [isCreateEnquiryDialogOpen, setValue]);

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/branches"],
    queryFn: async () => {
      const response = await fetch("/api/branches");
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      const data = await response.json();
      return data;
    },
  });

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
              <p>{client.clientId || client.applicantId || (client._id ? client._id.substring(0, 8) : "—")}</p>
              <p className="font-semibold mt-2">Enquiry ID</p>
              <p>{client.enquiryId || (clientEnquiries && clientEnquiries.length > 0 ? clientEnquiries[0].enquiryId : "—")}</p>
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
            {/* <Button 
              variant="outline" 
              className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
              onClick={() => setIsTaskFormOpen(true)}
            >
              <Plus size={16} /><span>Add Task</span>
            </Button> */}
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
            {/* <Button
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
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="history" className="flex items-center space-x-2"><FileText size={16} /><span>History</span></TabsTrigger>
              <TabsTrigger value="status" className="flex items-center space-x-2"><Clock size={16} /><span>Status</span></TabsTrigger>
              <TabsTrigger value="enquiries" className="flex items-center space-x-2"><HistoryIcon size={16} /><span>Enquiries</span></TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center space-x-2"><Edit size={16} /><span>Notes</span></TabsTrigger>
              <TabsTrigger value="visaTracker" className="flex items-center space-x-2"><MapPin size={16} /><span>Visa Tracker</span></TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center space-x-2"><CreditCard size={16} /><span>Payments</span></TabsTrigger>
              <TabsTrigger value="otherApplicantDetails" className="flex items-center space-x-2"><FileText size={16} /><span>Other Applicant Details</span></TabsTrigger>
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
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTaskFormOpen(true)}
                        className="mt-2"
                      >
                        Create First Task
                      </Button> */}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Client Notes */}
              {/* <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
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
              </Card> */}
            </TabsContent>

            <TabsContent value="visaTracker" className="p-6 dark:text-white">
              {/* <h3 className="text-lg font-semibold mb-4">Visa Application Tracker</h3> */}
              
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

            <TabsContent value="payments" className="p-6 space-y-6 dark:text-white">
              <h3 className="text-lg font-semibold mb-4">Payments</h3>
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white"><CreditCard size={20} /><span>Payments</span></CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setIsPaymentFormOpen(true)} className="flex items-center space-x-2">
                    <Plus size={16} /><span>Add Payment</span>
                  </Button>
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
                              <td className="p-2">د.إ{payment.amount}</td>
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
              {/* Add Payment Form Dialog */}
              <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="paymentType">Payment Type</Label>
                      <Select
                        value={paymentDetails.paymentType}
                        onValueChange={(value) => setPaymentDetails({ ...paymentDetails, paymentType: value, status: value === 'Full Payment' ? 'Completed' : 'Pending' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full Payment">Full Payment</SelectItem>
                          <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {paymentDetails.paymentType === 'Partial Payment' && (
                      <>
                        <div>
                          <Label htmlFor="totalAmount">Total Amount</Label>
                          <Input
                            id="totalAmount"
                            type="number"
                            value={paymentDetails.totalAmount}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, totalAmount: e.target.value })}
                            placeholder="e.g., 1000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="amountPaid">Amount Paid</Label>
                          <Input
                            id="amountPaid"
                            type="number"
                            value={paymentDetails.amountPaid}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, amountPaid: e.target.value })}
                            placeholder="e.g., 250"
                          />
                        </div>
                        <div>
                          <Label>Amount Left</Label>
                          <Input
                            readOnly
                            value={paymentDetails.totalAmount - paymentDetails.amountPaid}
                          />
                        </div>
                        <div>
                          <Label htmlFor="numberOfInstallments">Number of Installments</Label>
                          <Input
                            id="numberOfInstallments"
                            type="number"
                            max="4"
                            value={paymentDetails.numberOfInstallments}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, numberOfInstallments: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dueDate">Due Date for Remaining Amount</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={paymentDetails.dueDate}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, dueDate: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {paymentDetails.paymentType === 'Full Payment' && (
                      <div>
                        <Label htmlFor="totalAmount">Total Amount</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          value={paymentDetails.totalAmount}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, totalAmount: e.target.value })}
                          placeholder="e.g., 500"
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select
                        value={paymentDetails.paymentMethod}
                        onValueChange={(value) => setPaymentDetails({ ...paymentDetails, paymentMethod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                      <Input
                        id="transactionId"
                        value={paymentDetails.transactionId}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                        placeholder="(Optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentDate">Payment Date</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={paymentDetails.paymentDate}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={paymentDetails.description}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, description: e.target.value })}
                        placeholder="Describe the payment..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPaymentFormOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      const payload = {
                        ...paymentDetails,
                        amount: paymentDetails.paymentType === 'Full Payment' ? parseFloat(paymentDetails.totalAmount) || 0 : parseFloat(paymentDetails.amountPaid) || 0,
                      };
                      if (!payload.amount) {
                        toast({
                          title: "Error",
                          description: "Amount cannot be zero or empty.",
                          variant: "destructive"
                        });
                        return;
                      }
                      createPaymentMutation.mutate(payload);
                    }} disabled={createPaymentMutation.isPending}>
                      {createPaymentMutation.isPending ? "Saving..." : "Save Payment"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="otherApplicantDetails" className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Other Applicant Details</h3>
                <Button variant="outline" size="sm" onClick={() => setIsOtherApplicantDialogOpen(true)}>
                  <Plus size={16} className="mr-1" /> Add Other Applicant Details
                </Button>
              </div>
              {otherApplicantDetails.length === 0 ? (
                <div className="text-gray-500">No other applicant details found.</div>
              ) : (
                <div className="space-y-4">
                  {otherApplicantDetails.map((item, idx) => (
                    <div key={item._id} className="border rounded-lg p-4 relative space-y-4 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-semibold text-lg mb-2">Applicant {idx + 1}: {item.name}</h4>
                      {otherApplicantDetails.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                          onClick={() => {
                            const newApplicants = [...otherApplicantDetails];
                            newApplicants.splice(idx, 1);
                            setOtherApplicantDetails(newApplicants);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><strong>Email:</strong> {item.email || '-'}</div>
                        <div><strong>Mobile:</strong> {item.mobileNumber || '-'}</div>
                        <div><strong>Nationality:</strong> {item.nationality || '-'}</div>
                        <div><strong>Passport:</strong> {item.passportNumber || '-'}</div>
                        <div><strong>DOB:</strong> {item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : '-'}</div>
                        <div><strong>Marital Status:</strong> {item.maritalStatus || '-'}</div>
                        <div><strong>Occupation:</strong> {item.occupation || '-'}</div>
                        <div><strong>Education:</strong> {item.educationLevel || '-'}</div>
                        <div>
                          <strong>Document:</strong>
                          {item.document ? (
                            <a 
                              href={`${API_BASE_URL}/uploads/otherApplicants/${item.document}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="ml-2 text-blue-600 underline"
                            >
                              View Document
                            </a>
                          ) : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
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
              <Label htmlFor="date" className="text-right">Date</Label>
              <Input
                id="date"
                type="date"
                value={meetingDetails.date}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Time</Label>
              <Input
                id="time"
                type="time"
                value={meetingDetails.time}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, time: e.target.value })}
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
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle>Create New Enquiry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            {/* 1. Enquirer Information */}
            <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-4 lg:p-5 rounded-xl mb-4 sm:mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 lg:mb-5 text-gray-800 dark:text-gray-200">1. Enquirer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                {/* Enquiry ID (auto-generated) */}
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="enquiryId" className="text-sm sm:text-base">Enquiry ID *</Label>
                  <Input id="enquiryId" value={nextEnquiryId} readOnly disabled className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-sm sm:text-base" {...register("enquiryId", { required: true })} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="firstName" className="text-sm sm:text-base">First Name *</Label>
                  <Input id="firstName" {...register("firstName", { required: "First name is required" })} className={`${errors.firstName ? "border-red-500" : "bg-transparent"} text-sm sm:text-base`} />
                  {errors.firstName && <p className="text-red-500 text-xs sm:text-sm">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="lastName" className="text-sm sm:text-base">Last Name *</Label>
                  <Input id="lastName" {...register("lastName", { required: "Last name is required" })} className={`${errors.lastName ? "border-red-500" : "bg-transparent"} text-sm sm:text-base`} />
                  {errors.lastName && <p className="text-red-500 text-xs sm:text-sm">{errors.lastName.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email Address *</Label>
                  <div className="relative">
                    <Input 
                      id="email" 
                      type="email" 
                      {...register("email", { 
                        required: "Email is required", 
                        pattern: { 
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                          message: "Invalid email address" 
                        } 
                      })} 
                      className={`${errors.email ? "border-red-500" : "bg-transparent"} pr-10 text-sm sm:text-base`} 
                    />
                    {errors.email && <p className="text-red-500 text-xs sm:text-sm">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number *</Label>
                  <div className="relative">
                    <Input 
                      id="phone" 
                      {...register("phone", { required: "Phone number is required" })} 
                      className={`${errors.phone ? "border-red-500" : "bg-transparent"} pr-10 text-sm sm:text-base`} 
                    />
                    {errors.phone && <p className="text-red-500 text-xs sm:text-sm">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="alternatePhone" className="text-sm sm:text-base">Alternate Contact Number</Label>
                  <Input id="alternatePhone" {...register("alternatePhone")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="nationality" className="text-sm sm:text-base">Nationality *</Label>
                  <Input id="nationality" {...register("nationality", { required: "Nationality is required" })} className={`${errors.nationality ? "border-red-500" : "bg-transparent"} text-sm sm:text-base`} />
                  {errors.nationality && <p className="text-red-500 text-xs sm:text-sm">{errors.nationality.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="currentCountry" className="text-sm sm:text-base">Current Country of Residence *</Label>
                  <Input id="currentCountry" {...register("currentCountry", { required: "Current country is required" })} className={`${errors.currentCountry ? "border-red-500" : "bg-transparent"} text-sm sm:text-base`} />
                  {errors.currentCountry && <p className="text-red-500 text-xs sm:text-sm">{errors.currentCountry.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="preferredContactMethod" className="text-sm sm:text-base">Preferred Contact Method</Label>
                  <Controller name="preferredContactMethod" control={control} defaultValue="Email" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="preferredContactMethod" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select contact method" /></SelectTrigger>
                      <SelectContent><SelectItem value="Email">Email</SelectItem><SelectItem value="Phone">Phone</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="SMS">SMS</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="preferredContactTime" className="text-sm sm:text-base">Preferred Contact Time</Label>
                  <Input id="preferredContactTime" {...register("preferredContactTime")} className="bg-transparent text-sm sm:text-base" />
                </div>
              </div>
            </div>
            {/* 2. Visa Enquiry Details */}
            <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-4 lg:p-5 rounded-xl mb-4 sm:mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 lg:mb-5 text-gray-800 dark:text-gray-200">2. Visa Enquiry Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="visaType" className="text-sm sm:text-base">Visa Type *</Label>
                  <Controller name="visaType" control={control} defaultValue="Tourist" rules={{ required: "Visa type is required" }} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="visaType" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select visa type" /></SelectTrigger>
                      <SelectContent><SelectItem value="Tourist">Tourist</SelectItem><SelectItem value="Student">Student</SelectItem><SelectItem value="Work">Work</SelectItem><SelectItem value="Business">Business</SelectItem><SelectItem value="PR">Permanent Resident</SelectItem><SelectItem value="Dependent">Dependent</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                  )} />
                  {errors.visaType && <p className="text-red-500 text-xs sm:text-sm">{errors.visaType.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="destinationCountry" className="text-sm sm:text-base">Destination Country *</Label>
                  <Controller name="destinationCountry" control={control} defaultValue="USA" rules={{ required: "Destination country is required" }} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="destinationCountry" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select destination" /></SelectTrigger>
                      <SelectContent><SelectItem value="USA">USA</SelectItem><SelectItem value="Canada">Canada</SelectItem><SelectItem value="UK">UK</SelectItem><SelectItem value="Australia">Australia</SelectItem><SelectItem value="New Zealand">New Zealand</SelectItem><SelectItem value="Schengen">Schengen</SelectItem><SelectItem value="UAE">UAE</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                  )} />
                  {errors.destinationCountry && <p className="text-red-500 text-xs sm:text-sm">{errors.destinationCountry.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="purposeOfTravel" className="text-sm sm:text-base">Purpose of Travel</Label>
                  <Input id="purposeOfTravel" {...register("purposeOfTravel")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="intendedTravelDate" className="text-sm sm:text-base">Intended Travel Date</Label>
                  <Input id="intendedTravelDate" type="date" {...register("intendedTravelDate")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="durationOfStay" className="text-sm sm:text-base">Duration of Stay</Label>
                  <Input id="durationOfStay" {...register("durationOfStay")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="previousVisaApplications" className="text-sm sm:text-base">Previous Visa Applications</Label>
                  <Controller name="previousVisaApplications" control={control} defaultValue="No" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="previousVisaApplications" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select option" /></SelectTrigger>
                      <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="visaUrgency" className="text-sm sm:text-base">Visa Urgency</Label>
                  <Controller name="visaUrgency" control={control} defaultValue="Normal" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="visaUrgency" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                      <SelectContent><SelectItem value="Normal">Normal</SelectItem><SelectItem value="Urgent">Urgent</SelectItem><SelectItem value="Express">Express</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            </div>
            {/* 3. Additional Applicant Details */}
            <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-4 lg:p-5 rounded-xl mb-4 sm:mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 lg:mb-5 text-gray-800 dark:text-gray-200">3. Additional Applicant Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="passportNumber" className="text-sm sm:text-base">Passport Number *</Label>
                  <Input id="passportNumber" {...register("passportNumber", { required: "Passport number is required" })} className={`${errors.passportNumber ? "border-red-500" : "bg-transparent"} text-sm sm:text-base`} />
                  {errors.passportNumber && <p className="text-red-500 text-xs sm:text-sm">{errors.passportNumber.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="passportExpiryDate" className="text-sm sm:text-base">Passport Expiry Date</Label>
                  <Input id="passportExpiryDate" type="date" {...register("passportExpiryDate")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm sm:text-base">Date of Birth *</Label>
                  <Input id="dateOfBirth" type="date" {...register("dateOfBirth", { required: "Date of birth is required" })} className={`${errors.dateOfBirth ? "border-red-500" : "bg-transparent"} text-sm sm:text-base`} />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs sm:text-sm">{errors.dateOfBirth.message}</p>}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="maritalStatus" className="text-sm sm:text-base">Marital Status</Label>
                  <Controller name="maritalStatus" control={control} defaultValue="Single" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="maritalStatus" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem><SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="numberOfApplicants" className="text-sm sm:text-base">Number of Applicants</Label>
                  <Input id="numberOfApplicants" type="number" {...register("numberOfApplicants")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="occupation" className="text-sm sm:text-base">Occupation</Label>
                  <Input id="occupation" {...register("occupation")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="educationLevel" className="text-sm sm:text-base">Education Level</Label>
                  <Controller name="educationLevel" control={control} defaultValue="Bachelor's" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="educationLevel" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select education level" /></SelectTrigger>
                      <SelectContent><SelectItem value="High School">High School</SelectItem><SelectItem value="Bachelor's">Bachelor's</SelectItem><SelectItem value="Master's">Master's</SelectItem><SelectItem value="PhD">PhD</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            </div>
            {/* 4. Source and Marketing Information */}
            <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-4 lg:p-5 rounded-xl mb-4 sm:mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 lg:mb-5 text-gray-800 dark:text-gray-200">4. Source and Marketing Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="enquirySource" className="text-sm sm:text-base">Enquiry Source</Label>
                  <Controller name="enquirySource" control={control} defaultValue="Website" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="enquirySource" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent><SelectItem value="Website">Website</SelectItem><SelectItem value="Social Media">Social Media</SelectItem><SelectItem value="Referral">Referral</SelectItem><SelectItem value="Walk-in">Walk-in</SelectItem><SelectItem value="Advertisement">Advertisement</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="campaignName" className="text-sm sm:text-base">Campaign Name</Label>
                  <Input id="campaignName" {...register("campaignName")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="referredBy" className="text-sm sm:text-base">Referred By</Label>
                  <Input id="referredBy" {...register("referredBy")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="branch" className="text-sm sm:text-base">Branch/Office *</Label>
                  <Controller name="branch" control={control} defaultValue={user?.branch || ""} rules={{ required: "Branch is required" }} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="branch" className={`${errors.branch ? "border-red-500" : "bg-transparent"} text-sm sm:text-base`}><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {(branchesData?.data || []).map((b) => (
                          <SelectItem key={b.branchName} value={b.branchName}>{b.branchName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.branch && <p className="text-red-500 text-xs sm:text-sm">{errors.branch.message}</p>}
                </div>
              </div>
            </div>
            {/* 5. Internal Tracking and Assignment */}
            <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-4 lg:p-5 rounded-xl mb-4 sm:mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 lg:mb-5 text-gray-800 dark:text-gray-200">5. Internal Tracking and Assignment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="enquiryStatus" className="text-sm sm:text-base">Enquiry Status</Label>
                  <Controller name="enquiryStatus" control={control} defaultValue="New" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="enquiryStatus" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent><SelectItem value="New">New</SelectItem><SelectItem value="Contacted">Contacted</SelectItem><SelectItem value="Qualified">Qualified</SelectItem><SelectItem value="Processing">Processing</SelectItem><SelectItem value="Closed">Closed</SelectItem><SelectItem value="Lost">Lost</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="not connect">Not Connect</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="off leads">Off Leads</SelectItem><SelectItem value="referral">Referral</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="assignedConsultant" className="text-sm sm:text-base">Assigned Consultant</Label>
                  <Input id="assignedConsultant" {...register("assignedConsultant")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="followUpDate" className="text-sm sm:text-base">Follow-Up Date</Label>
                  <Input id="followUpDate" type="date" {...register("followUpDate")} className="bg-transparent text-sm sm:text-base" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="priorityLevel" className="text-sm sm:text-base">Priority Level</Label>
                  <Controller name="priorityLevel" control={control} defaultValue="Medium" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="priorityLevel" className="bg-transparent text-sm sm:text-base"><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-1 sm:space-y-2 col-span-2">
                  <Label htmlFor="notes" className="text-sm sm:text-base">Notes/Comments</Label>
                  <Textarea id="notes" {...register("notes")} rows={4} className="bg-transparent text-sm sm:text-base" />
                </div>
              </div>
            </div>
            {/* Hidden/auto fields: branchId, facebookLeadId, facebookFormId, facebookRawData, facebookSyncedAt, enquiryId (auto-generated in backend) */}
            <div className="sticky bottom-0 pt-4 pb-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 rounded-b-xl mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateEnquiryDialogOpen(false)} 
                  className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-4 sm:px-6 w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2"
                  disabled={createEnquiryMutation.isPending}
                >
                  {createEnquiryMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Enquiry"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Other Applicant Details Dialog */}
      <Dialog open={isOtherApplicantDialogOpen} onOpenChange={setIsOtherApplicantDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Other Applicant Details</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-6 space-y-4">
            {otherApplicantDetails.map((applicant, index) => (
              <div key={index} className="border rounded-lg p-4 relative space-y-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold text-lg mb-2">Applicant {index + 1}</h4>
                {otherApplicantDetails.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                    onClick={() => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants.splice(index, 1);
                      setOtherApplicantDetails(newApplicants);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`name-${index}`}>Name</Label>
                    <Input id={`name-${index}`} value={applicant.name} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].name = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`email-${index}`}>Email</Label>
                    <Input id={`email-${index}`} type="email" value={applicant.email} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].email = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`mobile-${index}`}>Mobile Number</Label>
                    <Input id={`mobile-${index}`} value={applicant.mobileNumber} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].mobileNumber = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`nationality-${index}`}>Nationality</Label>
                    <Input id={`nationality-${index}`} value={applicant.nationality} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].nationality = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`passport-${index}`}>Passport Number</Label>
                    <Input id={`passport-${index}`} value={applicant.passportNumber} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].passportNumber = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`dob-${index}`}>Date of Birth</Label>
                    <Input id={`dob-${index}`} type="date" value={applicant.dateOfBirth} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].dateOfBirth = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`maritalStatus-${index}`}>Marital Status</Label>
                    <Select
                      value={applicant.maritalStatus}
                      onValueChange={(value) => {
                        const newApplicants = [...otherApplicantDetails];
                        newApplicants[index].maritalStatus = value;
                        setOtherApplicantDetails(newApplicants);
                      }}
                    >
                      <SelectTrigger id={`maritalStatus-${index}`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-gray-900">
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`occupation-${index}`}>Occupation</Label>
                    <Input id={`occupation-${index}`} value={applicant.occupation} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].occupation = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`education-${index}`}>Education Level</Label>
                    <Input id={`education-${index}`} value={applicant.educationLevel} onChange={(e) => {
                      const newApplicants = [...otherApplicantDetails];
                      newApplicants[index].educationLevel = e.target.value;
                      setOtherApplicantDetails(newApplicants);
                    }}/>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`document-${index}`}>Document (PDF)</Label>
                  <Input id={`document-${index}`} type="file" accept="application/pdf" onChange={(e) => {
                    const newApplicants = [...otherApplicantDetails];
                    newApplicants[index].document = e.target.files[0];
                    setOtherApplicantDetails(newApplicants);
                  }} />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setOtherApplicantDetails([...otherApplicantDetails, { name: '', email: '', mobileNumber: '', nationality: '', passportNumber: '', dateOfBirth: '', maritalStatus: 'Single', occupation: '', educationLevel: '', document: null }])}
            >
              <Plus size={16} className="mr-2" /> Add Another Form
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOtherApplicantDialogOpen(false)}>Close</Button>
            <Button
              onClick={async () => {
                try {
                  const formData = new FormData();
                  const clientId = client?._id;
                  if (!clientId) throw new Error("Client ID not found.");

                  formData.append('clientId', clientId);
                  
                  const applicantsPayload = otherApplicantDetails.map(app => {
                    // Create a copy of the applicant and remove the file object
                    const { document, ...rest } = app;
                    return {
                      ...rest,
                      hasDocument: !!document, // Add a flag to indicate if a file is present
                    };
                  });
                  formData.append('applicants', JSON.stringify(applicantsPayload));

                  otherApplicantDetails.forEach(app => {
                    if (app.document) {
                      formData.append('documents', app.document);
                    }
                  });
                  
                  // Use apiRequest for multipart form data
                  const response = await apiRequest('POST', '/api/other-applicant-details', formData, true);

                  if (response.success) {
                    toast({ title: 'Success', description: 'Other Applicant Details saved!' });
                    setIsOtherApplicantDialogOpen(false);
                    // Refetch details
                    const res = await getOtherApplicantDetails(clientId);
                    setOtherApplicantDetails(res.data || []);
                  } else {
                    throw new Error(response.message || 'Failed to save details');
                  }
                } catch (err) {
                  toast({ title: 'Error', description: err.message || 'Failed to save details', variant: 'destructive' });
                }
              }}
              className="ml-2"
            >
              Save All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClientProfile;