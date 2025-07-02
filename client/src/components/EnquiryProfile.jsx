import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Mail, Phone, Calendar, MapPin, Globe, FileText, User, Building, Plus, Send, Clock, Eye, History as HistoryIcon, DollarSign, File, BookText, Handshake, CreditCard, Trash2, MessageCircleMore, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getEnquiry, getEnquiryAgreement, createOrUpdateEnquiryAgreement, getEnquiryMeeting, createOrUpdateEnquiryMeeting, getEnquiryTasks, createEnquiryTask, updateEnquiryTask, deleteEnquiryTask, getEnquiryHistory, getOtherApplicantDetails } from '../lib/api';
import { useToast } from './ui/use-toast.js';
import { convertEnquiry } from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { apiRequest, API_BASE_URL } from '../lib/api';
import { useRoute } from 'wouter';
import { useLocation } from 'wouter';

const EnquiryProfile = () => {
  const { toast } = useToast();
  const [match, params] = useRoute("/enquiries/:enquiryId");
  const enquiryId = params?.enquiryId;
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('history');
  const [showClientStatus, setShowClientStatus] = useState(true);
  const [clientStatusMessage, setClientStatusMessage] = useState("Checking if this person is a client...");

  // Add state variables for status update
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);

  // State for Agreement details
  const [agreementDetails, setAgreementDetails] = useState({
    agreementDate: new Date().toISOString().split('T')[0], // Initialize with today's date
    agreementStatus: 'NOT_SENT',
    agreementFile: null,
    notes: ''
  });

  // State for Meeting details
  const [meetingDetails, setMeetingDetails] = useState({
    meetingType: '',
    dateTime: '',
    platform: '', // e.g., Zoom, Google Meet, In-Person
    status: 'NOT_SCHEDULED',
    notes: ''
  });

  // State to control visibility of Agreement form
  const [isAgreementFormOpen, setIsAgreementFormOpen] = useState(false);

  // State to control visibility of Meeting form
  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false);

  // State for conversion loading
  const [isConverting, setIsConverting] = useState(false);

  // Team member assignment states
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState('');
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskDetails, setTaskDetails] = useState({
    title: '',
    description: '',
    type: '',
    dueDate: '',
    priority: 'MEDIUM',
    assignedTo: '',
    checklist: [],
    notes: ''
  });

  const [isOtherApplicantDialogOpen, setIsOtherApplicantDialogOpen] = useState(false);

  // State for Other Applicant Details forms
  const [otherApplicants, setOtherApplicants] = useState([
    { name: '', email: '', mobileNumber: '', nationality: '', passportNumber: '', dateOfBirth: '', maritalStatus: 'Single', occupation: '', educationLevel: '', document: null }
  ]);

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'Cash',
    totalAmount: '',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [otherApplicantDetails, setOtherApplicantDetails] = useState([]);

  const queryClient = useQueryClient();

  // Function to fetch team members
  const fetchTeamMembers = async () => {
    setIsLoadingTeamMembers(true);
    try {
      const response = await apiRequest('GET', '/api/team-members');
      if (Array.isArray(response)) {
        setTeamMembers(response);
      } else {
        console.error("Unexpected team members response format:", response);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error",
        description: "Failed to load team members. Please try again.",
        variant: "destructive",
      });
      setTeamMembers([]);
    } finally {
      setIsLoadingTeamMembers(false);
    }
  };

  // Fetch enquiry payments
  const { data: paymentsResponse, isLoading: arePaymentsLoading } = useQuery({
    queryKey: ['enquiryPayments', enquiryId],
    queryFn: () => apiRequest('GET', `/api/enquiries/${enquiryId}/payments`),
    enabled: !!enquiryId,
  });
  const enquiryPayments = paymentsResponse?.data || [];

  const createPaymentMutation = useMutation({
    mutationFn: (paymentData) => apiRequest('POST', `/api/enquiries/${enquiryId}/payments`, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['enquiryPayments', enquiryId]);
      toast({
        title: 'Success',
        description: 'Payment added successfully!',
      });
      setIsPaymentFormOpen(false);
      setPaymentDetails({ // Reset form
        paymentMethod: 'Cash',
        totalAmount: '',
        transactionId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        description: ''
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

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['/api/enquiries', enquiryId],
    queryFn: async () => {
      const result = await getEnquiry(enquiryId);
      console.log("Raw enquiry data:", result);
      console.log("Enquiry data structure:", {
        firstName: result?.data?.firstName,
        lastName: result?.data?.lastName,
        email: result?.data?.email,
        phone: result?.data?.phone,
        branch: result?.data?.branch,
        branchId: result?.data?.branchId
      });
      return result;
    },
    enabled: !!enquiryId,
    retry: 1, // Only retry once
    onError: (error) => {
      console.error("Error fetching enquiry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load enquiry details. Please try again.",
        variant: "destructive",
      });
    }
  });

  const { data: historyResponse, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['enquiryHistory', enquiryId],
    queryFn: () => getEnquiryHistory(enquiryId),
    enabled: !!enquiryId,
  });

  const historicalEnquiries = historyResponse?.data?.enquiries || [];
  const historicalClients = historyResponse?.data?.clients || [];

  const handleConvertToClient = async () => {
    if (!enquiryId) {
      toast({
        title: "Error",
        description: "Enquiry ID is missing.",
        variant: "destructive",
      });
      return;
    }

    // Debug log to check enquiry data
    console.log("Raw enquiry data:", response);
    console.log("Enquiry data structure:", {
      firstName: response?.data?.firstName,
      lastName: response?.data?.lastName,
      email: response?.data?.email,
      phone: response?.data?.phone,
      branch: response?.data?.branch,
      branchId: response?.data?.branchId
    });

    // Add validation for required fields with more detailed error message
    if (!response?.data) {
      toast({
        title: "Error",
        description: "Enquiry data is not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { firstName, lastName } = response.data;
    if (!firstName || !lastName) {
      toast({
        title: "Error",
        description: `Missing required fields: ${!firstName ? 'First Name' : ''} ${!lastName ? 'Last Name' : ''}`,
        variant: "destructive",
      });
      return;
    }

    // Fetch team members and open the assignment modal
    await fetchTeamMembers();
    setIsAssignmentModalOpen(true);
  };

  // Function to handle the final conversion after team member assignment
  const handleCompleteConversion = async () => {
    if (!selectedTeamMemberId) {
      toast({
        title: "Error",
        description: "Please select a team member to assign this client to.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    try {
      console.log("Converting enquiry:", enquiryId);
      console.log("Assigned to team member:", selectedTeamMemberId);
      
      // First check if a client with this email already exists
      const emailCheckResponse = await apiRequest('GET', `/api/clients/check-email?email=${encodeURIComponent(response.data.email)}`).catch(() => null);
      let clientExists = false;
      
      // If client exists, confirm before continuing
      if (emailCheckResponse?.data?.exists) {
        clientExists = true;
        const confirmMerge = window.confirm(
          `A client with email ${response.data.email} already exists. Do you want to merge this enquiry with the existing client?`
        );
        
        if (!confirmMerge) {
          setIsConverting(false);
          setIsAssignmentModalOpen(false);
          return;
        }
      }
      
      // Now convert the enquiry to client with the assigned team member
      const result = await convertEnquiry(enquiryId, selectedTeamMemberId);
      console.log("Conversion result:", result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: clientExists 
            ? "Enquiry successfully merged with existing client."
            : "Enquiry successfully converted to client.",
          variant: "success",
        });
        
        // Navigate to the client page if returning a client
        if (result.data && result.data._id) {
          setLocation(`/clients/${result.data._id}`);
        } else {
          setLocation('/enquiries');
        }
      } else {
        // If we get a duplicate key error, try using our direct method
        if (result.message && result.message.includes('duplicate key error')) {
          console.log("Handling duplicate key error with alternative method...");
          
          toast({
            title: "Processing",
            description: "Handling duplicate email, please wait...",
            variant: "info",
          });
          
          // Use our backup endpoint to fix duplicate conversion
          const fixResult = await fetch(`${API_BASE_URL}/api/clients/fix-duplicate-conversion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
              enquiryId,
              assignedTo: selectedTeamMemberId
            })
          }).then(res => res.json());
          
          if (fixResult.success) {
            toast({
              title: "Success",
              description: "Enquiry successfully merged with existing client.",
              variant: "success",
            });
            
            if (fixResult.data && fixResult.data.clientId) {
              setLocation(`/clients/${fixResult.data.clientId}`);
            } else {
              setLocation('/enquiries');
            }
            return;
          } else {
            throw new Error(fixResult.message || "Failed to handle duplicate client conversion");
          }
        }
        
        throw new Error(result.message || "Failed to convert enquiry to client");
      }
    } catch (error) {
      console.error("Error converting enquiry:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred during conversion.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
      setIsAssignmentModalOpen(false);
    }
  };

  const handleSendEmail = async () => {
    if (!enquiry?.email) {
      toast({
        title: "Error",
        description: "No email address available for this enquiry.",
        variant: "destructive",
      });
      return;
    }
    if (!enquiryId) {
      toast({
        title: "Error",
        description: "Enquiry ID is missing for sending email.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "Sending",
        description: "Preparing and sending email...",
      });

      // Directly call the server-side email sending endpoint with type and data
      const response = await apiRequest('POST', `/api/enquiries/${enquiryId}/send-email`, {
        type: 'enquiryConfirmation', // Assuming a default type for now, adjust as needed
        data: { // Pass relevant enquiry data for the template on the server
          firstName: enquiry.firstName,
          lastName: enquiry.lastName,
          email: enquiry.email,
          phone: enquiry.phone,
          visaType: enquiry.visaType,
          destinationCountry: enquiry.destinationCountry,
          enquiryStatus: enquiry.enquiryStatus,
          // Add any other enquiry fields needed by the server-side template
        }
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
        description: error.message || "Failed to send email. Please ensure the server is running and the email template exists.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsApp = async () => {
    if (!enquiry?.phone) {
      toast({
        title: "Error",
        description: "No phone number available for this enquiry.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "Loading",
        description: "Fetching WhatsApp templates...",
      });

      // Fetch available templates for enquiry type
      const templatesResponse = await apiRequest('GET', '/api/whatsapp-templates/type/ENQUIRY');
      
      if (!templatesResponse.success) {
        throw new Error(templatesResponse.message || 'Failed to fetch WhatsApp templates');
      }

      const templates = templatesResponse.data;
      if (!templates || templates.length === 0) {
        toast({
          title: "No Templates Available",
          description: "Please create a WhatsApp template for enquiries before sending messages.",
          variant: "destructive",
        });
        return;
      }

      // Use the first template by default
      const template = templates[0];
      
      // Replace variables in the template
      let messageBody = template.body;

      // Replace variables with actual values
      const variables = {
        firstName: enquiry.firstName,
        lastName: enquiry.lastName,
        email: enquiry.email,
        phone: enquiry.phone,
        visaType: enquiry.visaType,
        destinationCountry: enquiry.destinationCountry,
        enquiryStatus: enquiry.enquiryStatus,
        // Add more variables as needed
      };

      // Replace variables in message body
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        messageBody = messageBody.replace(regex, value || '');
      });

      // Show sending toast
      toast({
        title: "Sending",
        description: "Preparing WhatsApp message...",
      });

      // Send WhatsApp message using apiRequest
      const response = await apiRequest('POST', '/api/whatsapp-templates/send-message', {
        type: 'ENQUIRY',
        deadline: {
          ...enquiry,
          clientPhone: enquiry.phone // Ensure phone number is included
        }
      });

      if (response.success) {
        window.open(response.url, "_blank");
        toast({
          title: "Success",
          description: "WhatsApp chat opened successfully!",
        });
      } else {
        throw new Error(response.message || 'Failed to generate WhatsApp message');
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send WhatsApp message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const enquiry = response?.data;

  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `Updated: ${date.toLocaleDateString()} • ${Math.round((new Date() - date) / (1000 * 60 * 60 * 24))} days ago`;
  };

  // Effect to handle client status message visibility
  useEffect(() => {
    if (!enquiryId || !response?.data) return;

    // Simulate checking backend for client status
    const checkTimer = setTimeout(() => {
      // In a real scenario, you would use enquiry.isClient or similar data here
      const isClient = false; // Placeholder: Assume not a client for this simulation

      if (!isClient) {
        setClientStatusMessage("This person is not currently a client.");
        // Set another timer to hide the message after it's displayed
        const hideTimer = setTimeout(() => {
          setShowClientStatus(false);
        }, 3000); // Hide after 3 seconds

        return () => clearTimeout(hideTimer); // Cleanup hide timer
      } else {
        // If they are a client, you might set a different message
        setClientStatusMessage("This person is an existing client.");
      }
    }, 1500); // Simulate check taking 1.5 seconds

    return () => clearTimeout(checkTimer); // Cleanup check timer
  }, [enquiryId, response?.data]); // Rerun if enquiry or id changes

   // Effect to fetch agreement and meeting data on load
  useEffect(() => {
    const fetchAgreementAndMeeting = async () => {
      if (!enquiryId || !response?.data) return;

      try {
        // Fetch agreement
        const agreementResponse = await getEnquiryAgreement(enquiryId);
        if (agreementResponse?.data) {
          setAgreementDetails(prevDetails => ({
            ...prevDetails,
            ...agreementResponse.data,
            agreementFile: agreementResponse.data.agreementFile || null,
          }));
        }

        // Fetch meeting
        const meetingResponse = await getEnquiryMeeting(enquiryId);
        if (meetingResponse?.data) {
          setMeetingDetails(prevDetails => ({
            ...prevDetails,
            ...meetingResponse.data,
            dateTime: meetingResponse.data.dateTime ? meetingResponse.data.dateTime.slice(0, 16) : '',
          }));
        } else {
          // Reset meeting details to default values if no meeting found
          setMeetingDetails({
            meetingType: '',
            dateTime: '',
            platform: '',
            status: 'NOT_SCHEDULED',
            notes: ''
          });
        }
      } catch (error) {
        console.error("Error fetching agreement or meeting details:", error);
        // Don't show toast for 404s as they're expected when no data exists
        if (!error.message.includes('404')) {
          toast({
            title: "Error",
            description: error.message || "Failed to fetch agreement or meeting details.",
            variant: "destructive",
          });
        }
      }
    };

    fetchAgreementAndMeeting();
  }, [enquiryId, response?.data, toast]);

  // Fetch tasks when component loads
  useEffect(() => {
    const fetchTasks = async () => {
      if (enquiryId && !isLoading) {
        try {
          const response = await getEnquiryTasks(enquiryId);
          if (response?.data) {
            setTasks(Array.isArray(response.data) ? response.data : []);
          } else {
            setTasks([]);
          }
        } catch (error) {
          console.error("Error fetching tasks:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to fetch tasks.",
            variant: "destructive",
          });
        }
      }
    };

    fetchTasks();
  }, [enquiryId, isLoading, toast]);

  const handleSaveAgreement = async () => {
    if (!enquiryId) {
      toast({
        title: "Error",
        description: "Enquiry ID is missing.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!agreementDetails.agreementDate) {
      toast({
        title: "Error",
        description: "Agreement date is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure agreementDate is in ISO format
      const formattedData = {
        ...agreementDetails,
        agreementDate: new Date(agreementDetails.agreementDate).toISOString()
      };

      const response = await createOrUpdateEnquiryAgreement(enquiryId, formattedData);
      if (response.success) {
        // Update the agreement details with the response data
        setAgreementDetails(prevDetails => ({
          ...prevDetails,
          ...response.data,
          agreementFile: response.data.agreementFile || prevDetails.agreementFile
        }));
        
        toast({
          title: "Success",
          description: "Agreement details saved successfully.",
        });
        setIsAgreementFormOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save agreement details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving agreement:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while saving agreement. Please ensure the server is running.",
        variant: "destructive",
      });
    }
  };

  // Add a function to handle file preview
  const handleFilePreview = async (fileName) => {
    if (!fileName) {
      toast({
        title: "Error",
        description: "No file name provided",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get the base URL from the environment or use a default
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Check if the fileName is already a full URL
      let fileUrl;
      if (fileName.startsWith('http')) {
        fileUrl = fileName;
      } else if (fileName.startsWith('/api/')) {
        // If it's already a path starting with /api/, just prepend the baseUrl
        fileUrl = `${baseUrl}${fileName}`;
      } else {
        // Otherwise, construct the full path
        fileUrl = `${baseUrl}/api/enquiries/agreements/file/${encodeURIComponent(fileName)}`;
      }
      
      console.log('Attempting to access file at:', fileUrl); // Debug log
      
      // Show loading toast
      toast({
        title: "Loading",
        description: "Attempting to open file...",
      });

      // First check if the file exists
      const response = await fetch(fileUrl, { 
        method: 'HEAD',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found on server');
        } else if (response.status === 401) {
          throw new Error('Unauthorized to access this file');
        } else {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
      }

      // For PDFs and images, open in a new tab
      if (fileName.toLowerCase().endsWith('.pdf') || 
          fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
        window.open(fileUrl, '_blank');
      } else {
        // For other file types, trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName.split('/').pop(); // Get just the filename from the path
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Show success toast
      toast({
        title: "Success",
        description: "File opened successfully",
      });
    } catch (error) {
      console.error("Error opening file:", error);
      
      // More specific error messages based on the error type
      let errorMessage = "Failed to open the file. ";
      if (error.message.includes('Failed to fetch')) {
        errorMessage += "Could not connect to the server. Please check if the server is running.";
      } else if (error.message.includes('not found')) {
        errorMessage += "The file was not found on the server.";
      } else if (error.message.includes('Unauthorized')) {
        errorMessage += "You are not authorized to access this file.";
      } else {
        errorMessage += error.message || "Please try again or contact support.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Update the file display section
  const renderFileDisplay = () => {
    if (!agreementDetails.agreementFile) return <p>N/A</p>;

    // Handle both string and object formats of agreementFile
    const fileName = typeof agreementDetails.agreementFile === 'string' 
      ? agreementDetails.agreementFile 
      : agreementDetails.agreementFile.name;
    
    const fileUrl = typeof agreementDetails.agreementFile === 'string'
      ? `/api/enquiries/agreements/file/${encodeURIComponent(agreementDetails.agreementFile)}`
      : agreementDetails.agreementFile.url;
    
    // Extract just the filename from the path if it's a full path
    const displayName = fileName.split('/').pop();
    
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="link"
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          onClick={() => handleFilePreview(fileUrl)}
          disabled={!fileName}
        >
          <File size={16} className="mr-1" /> {displayName}
        </Button>
      </div>
    );
  };

  const handleSaveMeeting = async () => {
    if (!enquiryId) {
      toast({
        title: "Error",
        description: "Enquiry ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await createOrUpdateEnquiryMeeting(enquiryId, meetingDetails);
      if (response.success) {
        toast({
          title: "Success",
          description: "Meeting details saved successfully.",
        });
        setIsMeetingFormOpen(false);
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

  const handleSaveTask = async () => {
    if (!enquiryId) {
      toast({
        title: "Error",
        description: "Enquiry ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await createEnquiryTask(enquiryId, taskDetails);
      if (response?.data) {
        toast({
          title: "Success",
          description: "Task created successfully.",
        });
        setTasks(prevTasks => [...prevTasks, response.data]);
        setIsTaskFormOpen(false);
        setTaskDetails({
          title: '',
          description: '',
          type: '',
          dueDate: '',
          priority: 'MEDIUM',
          assignedTo: '',
          checklist: [],
          notes: ''
        });
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to create task.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while creating task.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!enquiryId) {
      toast({
        title: "Error",
        description: "Enquiry ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await deleteEnquiryTask(enquiryId, taskId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Task deleted successfully.",
        });
        // Remove the deleted task from the state
        setTasks(tasks.filter(task => task._id !== taskId));
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

  // Add handleStatusUpdate function
  const handleStatusUpdate = async (newStatus) => {
    if (!enquiryId) return;
    
    setStatusUpdateLoading(true);
    setStatusUpdateSuccess(false);
    
    try {
      const response = await apiRequest('PUT', `/api/enquiries/${enquiryId}`, {
        enquiryStatus: newStatus
      });
      
      if (response.success) {
        setStatusUpdateSuccess(true);
        // Refresh the enquiry data
        await queryClient.invalidateQueries(['/api/enquiries', enquiryId]);
        toast({
          title: "Status Updated",
          description: `Enquiry status has been updated to ${newStatus}`,
        });
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateLoading(false);
      // Hide success message after 3 seconds
      setTimeout(() => {
        setStatusUpdateSuccess(false);
      }, 3000);
    }
  };

  const handleCreateNewEnquiry = () => {
    if (enquiry) {
      // Create a new object with the data we want to auto-fill
      const autoFillData = {
        firstName: enquiry.firstName,
        lastName: enquiry.lastName,
        email: enquiry.email,
        phone: enquiry.phone,
        alternatePhone: enquiry.alternatePhone,
        nationality: enquiry.nationality,
        currentCountry: enquiry.currentCountry,
        preferredContactMethod: enquiry.preferredContactMethod,
        preferredContactTime: enquiry.preferredContactTime,
        passportNumber: enquiry.passportNumber,
        passportExpiryDate: enquiry.passportExpiryDate,
        dateOfBirth: enquiry.dateOfBirth,
        maritalStatus: enquiry.maritalStatus,
        occupation: enquiry.occupation,
        educationLevel: enquiry.educationLevel,
      };
      // Encode data and navigate to the create enquiry page
      setLocation(`/enquiries?prefill=${encodeURIComponent(JSON.stringify(autoFillData))}&allowDuplicate=true`);
    }
  };

  useEffect(() => {
    async function fetchOtherApplicantDetails() {
      const id = enquiry?.clientId || enquiry?._id;
      if (!id) return;
      try {
        const res = await getOtherApplicantDetails(id);
        setOtherApplicantDetails(res.data || []);
      } catch (err) {
        setOtherApplicantDetails([]);
      }
    }
    fetchOtherApplicantDetails();
  }, [enquiry?.clientId, enquiry?._id]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          <p className="font-semibold">Error loading enquiry details</p>
          <p className="text-sm mt-2">{error.message || "Please try again later."}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!response?.data) {
    return (
      <div className="p-6">
        <div className="text-gray-500">
          <p>No enquiry details found.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation('/enquiries')}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Dummy data for tabs (replace with actual data fetching later)
  const historyData = [
    { date: enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : 'N/A', activity: 'Enquiry Created', enquiryId: enquiry.enquiryId || 'N/A', status: enquiry.enquiryStatus, assignedTo: enquiry.assignedConsultant || 'N/A' },
    // Add more history items here if available in enquiry data or backend
    // Example: { date: '2023-10-26', activity: 'Meeting Scheduled', enquiryId: enquiry.enquiryId || 'N/A', status: 'Scheduled', assignedTo: 'Sarah Thompson' },
    // Example: { date: '2023-10-20', activity: 'Agreement Sent', enquiryId: enquiry.enquiryId || 'N/A', status: 'Sent', assignedTo: 'Mark Wilson' },
  ];

  const paymentsData = []; // No payment data in typical enquiry flow
  const documentsData = []; // No document data in typical enquiry flow
  const notesData = [{ date: 'N/A', note: enquiry.notes || 'No specific notes.' }];

  return (
    <div className="p-6 space-y-6  min-h-screen  rounded-xl shadow-lg bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

{/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-400/15 to-yellow-400/15 dark:from-amber-400/8 dark:to-yellow-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div> */}
      {/* Profile Header Card */}
      <Card className=" dark:via-gray rounded-xl shadow-lg dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 bg-amber-500 dark:bg-amber-900 rounded-full flex items-center justify-center text-amber-800 dark:text-amber-300">
              <User size={40} />
            </div>
            
            <div>
              <div className="flex items-center space-x-2 dark:bg-gray">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {enquiry.firstName} {enquiry.lastName}
                </h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  enquiry.enquiryStatus === 'New' ? 'bg-amber-300 text-amber-800' :
                  enquiry.enquiryStatus === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  enquiry.enquiryStatus === 'Closed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {enquiry.enquiryStatus}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{enquiry.visaType} Enquiry</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatLastUpdated(enquiry.updatedAt)}</p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-700 dark:text-gray-300 text-sm">
            <div>
              <p className="font-semibold">Assigned Consultant</p>
              <p>{enquiry.assignedConsultant || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Enquiry ID</p>
              <p>{enquiry.enquiryId || 'N/A'}</p>
            </div>
             <div>
              <p className="font-semibold">Country</p>
              <p>{enquiry.destinationCountry || 'N/A'}</p>
            </div>
             <div>
              <p className="font-semibold">Timeline</p>
              <p>Started: {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4 ">
            <Button variant="outline" className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white" onClick={() => setIsTaskFormOpen(true)}>
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
              onClick={handleSendWhatsApp}
            >
              <MessageCircleMore size={16} /><span>WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
              onClick={handleCreateNewEnquiry}
            >
              <Plus size={16} /><span>Create New Enquiry</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
              onClick={() => setIsOtherApplicantDialogOpen(true)}
            >
              <Plus size={16} /><span>Add Other Applicant Details</span>
            </Button>
            
            <Select
              value={enquiry.enquiryStatus}
              onValueChange={handleStatusUpdate}
              disabled={statusUpdateLoading}
            >
              <SelectTrigger className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 w-[180px]">
                {statusUpdateLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="not connect">Not Connect</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="off leads">Off Leads</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            {/* Convert to Client Button */}
            <Button
              onClick={handleConvertToClient}
              disabled={isLoading || !enquiryId || isConverting}
              className="bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isConverting ? 'Converting...' : 'Convert to Client'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="history" className="flex items-center space-x-2"><HistoryIcon size={16} /><span>History</span></TabsTrigger>
              <TabsTrigger value="status" className="flex items-center space-x-2"><Clock size={16} /><span>prerequisites</span></TabsTrigger>
              {/* <TabsTrigger value="payments" className="flex items-center space-x-2"><DollarSign size={16} /><span>Payments</span></TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-2"><File size={16} /><span>Documents</span></TabsTrigger> */}
              <TabsTrigger value="notes" className="flex items-center space-x-2"><BookText size={16} /><span>Notes</span></TabsTrigger>

              
            <TabsTrigger value="otherApplicantDetails" className="flex items-center space-x-2">
              <FileText size={16} /> <span>Other Applicant Details</span>
            </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="p-6  dark:text-white">
              <h3 className="text-lg font-semibold mb-4">Enquiry History</h3>
              {/* Placeholder for Client Status */}
              {showClientStatus && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-md text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Client Status:</p>
                    <p>{clientStatusMessage}</p>
                </div>
              )}

              <h4 className="text-md font-semibold mb-3">Activity Log</h4>
               {historyData.length > 0 ? (
                 <div className="overflow-x-auto">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Date</TableHead>
                         <TableHead>Activity</TableHead>
                          <TableHead>Enquiry ID</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Assigned To</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {historyData.map((item, index) => (
                         <TableRow key={index}>
                           <TableCell>{item.date}</TableCell>
                           <TableCell>{item.activity}</TableCell>
                            <TableCell>{item.enquiryId}</TableCell>
                            <TableCell>
                             <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                               item.status === 'New' ? 'bg-amber-300 text-amber-800' :
                               item.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                               item.status === 'Closed' ? 'bg-green-100 text-green-800' :
                               'bg-gray-100 text-gray-800'
                             }`}>
                               {item.status}
                             </span>
                           </TableCell>
                           <TableCell>{item.assignedTo}</TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               ) : (
                 <p className="text-gray-500">No history available for this enquiry.</p>
               )}

              <h4 className="text-md font-semibold mb-3 mt-6">Related Contact History</h4>
              {isHistoryLoading ? (
                <p>Loading history...</p>
              ) : (historicalEnquiries.length === 0 && historicalClients.length === 0) ? (
                <p className="text-gray-500">No other enquiries or clients found with the same email or phone.</p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Date Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalEnquiries.map(item => (
                      <TableRow key={item._id}>
                        <TableCell>Enquiry</TableCell>
                        <TableCell>{item.firstName} {item.lastName}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{item.enquiryStatus}</TableCell>
                        <TableCell>
                          <Button variant="link" onClick={() => setLocation(`/enquiries/${item._id}`)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {historicalClients.map(item => (
                      <TableRow key={item._id}>
                        <TableCell>Client</TableCell>
                        <TableCell>{item.firstName} {item.lastName}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>Active</TableCell>
                        <TableCell>
                          <Button variant="link" onClick={() => setLocation(`/clients/${item._id}`)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </TabsContent>

             {/* New Status Tab */}
            <TabsContent value="status" className="p-6 space-y-6 ">
              <h3 className="text-lg font-semibold mb-4  dark:text-white">Enquiry Status Tracking</h3>

              {/* Pre-requisite Status Display */}
              {/* <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg mb-6">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white">
                    <Clock size={20} /><span>Current Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <p className="font-semibold">Pre-requisite Status:</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        enquiry.enquiryStatus === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        enquiry.enquiryStatus === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        enquiry.enquiryStatus === 'not connect' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        enquiry.enquiryStatus === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        enquiry.enquiryStatus === 'cancelled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400' :
                        enquiry.enquiryStatus === 'off leads' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        enquiry.enquiryStatus === 'referral' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400'
                      }`}>
                        {enquiry.enquiryStatus}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card> */}

              {/* Agreement Section */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white"><Handshake size={20} /><span>Agreement</span></CardTitle>
                   <Button variant="outline" size="sm" onClick={() => setIsAgreementFormOpen(true)} disabled={isLoading || !enquiryId}>
                    <Plus size={16} className="mr-1" /> {agreementDetails.agreementStatus === 'NOT_SENT' ? 'Add Agreement' : 'Edit Agreement'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">Manage agreement details for this enquiry.</p>
                   {/* Display Agreement Details or Form */}
                   {!isAgreementFormOpen ? (
                     // Display Agreement Details
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                          <p className="font-semibold">Agreement Date:</p>
                          <p>{agreementDetails.agreementDate || 'N/A'}</p>
                        </div>
                        <div>
                           <p className="font-semibold">Agreement Status:</p>
                           <span className={`px-2 py-1 text-xs font-medium rounded-full ${agreementDetails.agreementStatus === 'SIGNED' ? 'bg-green-100 text-green-800' : agreementDetails.agreementStatus === 'SENT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {agreementDetails.agreementStatus || 'N/A'}
                          </span>
                        </div>
                        <div>
                           <p className="font-semibold">Agreement File:</p>
                           {renderFileDisplay()}
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold">Notes:</p>
                          <p>{agreementDetails.notes || 'N/A'}</p>
                        </div>
                     </div>
                   ) : (
                     // Display Agreement Form
                    <div className="space-y-4">
                     <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agreement Date</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        value={agreementDetails.agreementDate}
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, agreementDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agreement Status</label>
                       <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        value={agreementDetails.agreementStatus}
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, agreementStatus: e.target.value })}
                      >
                        <option value="NOT_SENT">Not Sent</option>
                        <option value="SENT">Sent</option>
                        <option value="RECEIVED">Received</option>
                        <option value="SIGNED">Signed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agreement File</label>
                      <input
                        type="file"
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, agreementFile: e.target.files[0] })}
                      />
                       {/* Display current file name if exists */}
                       {agreementDetails.agreementFile && ( agreementDetails.agreementFile.name ?
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Current file: {agreementDetails.agreementFile.name}</p> : null
                       )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        rows="3"
                        value={agreementDetails.notes}
                        onChange={(e) => setAgreementDetails({ ...agreementDetails, notes: e.target.value })}
                        placeholder="Add notes about the agreement..."
                      />
                    </div>
                     <div className="mt-4 flex justify-end">
                       <Button onClick={handleSaveAgreement} disabled={isLoading || !enquiryId}>Save Agreement</Button>
                        <Button variant="outline" className="ml-2" onClick={() => setIsAgreementFormOpen(false)}>Cancel</Button>
                     </div>
                  </div>
                   )}
                </CardContent>
              </Card>

              {/* Schedule Meeting Section */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2 dark:text-white"><Calendar size={20} /><span>Schedule Meeting</span></CardTitle>
                   {/* Add button to open meeting form */}
                   <Button variant="outline" size="sm" onClick={() => setIsMeetingFormOpen(true)} disabled={isLoading || !enquiryId}>
                    <Plus size={16} className="mr-1" /> {meetingDetails.status === 'NOT_SCHEDULED' ? 'Schedule Meeting' : 'Edit Meeting'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">Schedule and manage meeting details for this enquiry.</p>
                   {/* Display Meeting Details or Form */}
                   {!isMeetingFormOpen ? (
                     // Display Meeting Details
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                          <p className="font-semibold">Meeting Type:</p>
                          <p>{meetingDetails.meetingType || 'N/A'}</p>
                        </div>
                        <div>
                           <p className="font-semibold">Date and Time:</p>
                           <p>{meetingDetails.dateTime ? new Date(meetingDetails.dateTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div>
                           <p className="font-semibold">Platform:</p>
                           <p>{meetingDetails.platform || 'N/A'}</p>
                        </div>
                        <div>
                           <p className="font-semibold">Status:</p>
                           <span className={`px-2 py-1 text-xs font-medium rounded-full ${meetingDetails.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : meetingDetails.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {meetingDetails.status || 'N/A'}
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold">Notes:</p>
                          <p>{meetingDetails.notes || 'N/A'}</p>
                        </div>
                     </div>
                   ) : (
                     // Display Meeting Form
                    <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        value={meetingDetails.meetingType}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, meetingType: e.target.value })}
                      >
                        <option value="">Select Meeting Type</option>
                        <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                        <option value="DOCUMENT_REVIEW">Document Review</option>
                        <option value="STATUS_UPDATE">Status Update</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date and Time</label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        value={meetingDetails.dateTime}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, dateTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                       <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        value={meetingDetails.platform}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, platform: e.target.value })}
                         placeholder="e.g., Zoom, In-Person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        value={meetingDetails.status}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, status: e.target.value })}
                      >
                        <option value="NOT_SCHEDULED">Not Scheduled</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RESCHEDULED">Rescheduled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                       <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-transparent"
                        rows="3"
                        value={meetingDetails.notes}
                        onChange={(e) => setMeetingDetails({ ...meetingDetails, notes: e.target.value })}
                        placeholder="Add notes about the meeting..."
                      />
                    </div>
                     <div className="mt-4 flex justify-end">
                       <Button onClick={handleSaveMeeting} disabled={isLoading || !enquiryId}>Save Meeting</Button>
                        <Button variant="outline" className="ml-2" onClick={() => setIsMeetingFormOpen(false)}>Cancel</Button>
                     </div>
                  </div>
                   )}
                </CardContent>
              </Card>

              {/* Payment Collection Section */}
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2"><CreditCard size={20} /><span>Payment Collection</span></CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setIsPaymentFormOpen(!isPaymentFormOpen)}>
                    <Plus size={16} className="mr-1" /> {isPaymentFormOpen ? 'Cancel' : 'Add Payment'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPaymentFormOpen ? (
                    <div className="space-y-4">
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
                        <Label htmlFor="totalAmount">Total Amount</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          value={paymentDetails.totalAmount}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, totalAmount: e.target.value })}
                          placeholder="e.g., 500"
                        />
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
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" onClick={() => setIsPaymentFormOpen(false)}>Cancel</Button>
                        <Button onClick={() => createPaymentMutation.mutate({ ...paymentDetails, amount: paymentDetails.totalAmount, method: paymentDetails.paymentMethod, date: paymentDetails.paymentDate })} disabled={createPaymentMutation.isLoading}>
                          {createPaymentMutation.isLoading ? 'Saving...' : 'Save Payment'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Track payments made for this enquiry.</p>
                      {arePaymentsLoading ? (
                        <p>Loading payments...</p>
                      ) : enquiryPayments.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enquiryPayments.map((payment) => (
                              <TableRow key={payment._id}>
                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                <TableCell>${payment.amount}</TableCell>
                                <TableCell>{payment.method}</TableCell>
                                <TableCell>{payment.description || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-gray-500 mt-2">No payments recorded for this enquiry yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* <TabsContent value="payments" className="p-6">
               <h3 className="text-lg font-semibold mb-4">Payments</h3>
              {paymentsData.length > 0 ? (
                // Render payments table/list here
                <div>Payments content will go here.</div>
              ) : (
                <p className="text-gray-500">No payment information available for this enquiry.</p>
              )}
            </TabsContent> */}

            {/* <TabsContent value="documents" className="p-6">
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
               {documentsData.length > 0 ? (
                // Render documents list/table here
                 <div>Documents content will go here.</div>
              ) : (
                <p className="text-gray-500">No documents associated with this enquiry.</p>
              )}
            </TabsContent> */}

             <TabsContent value="notes" className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notes & Tasks</h3>
              <div className="space-y-6">
                {/* Tasks Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold">Tasks</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsTaskFormOpen(true)}
                      className="flex items-center space-x-2 dark:bg-gray-700 dark:text-white"
                    >
                      <Plus size={16} /><span>Add Task</span>
                    </Button>
                  </div>
                  {tasks.length > 0 ? (
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div key={task._id} className="border rounded-lg p-4 bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 ">
                                <h4 className="font-semibold">{task.title}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full  ${
                                  task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                  task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                  task.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-100"
                              onClick={() => handleDeleteTask(task._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Type:</span> {task.type}
                            </div>
                            <div>
                              <span className="font-medium">Due:</span> {new Date(task.dueDate).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Assigned To:</span> {task.assignedTo}
                            </div>
                          </div>
                          {task.notes && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Notes:</span> {task.notes}
                            </div>
                          )}
                          {task.checklist && task.checklist.length > 0 && (
                            <div className="mt-2">
                              <span className="font-medium text-sm">Checklist:</span>
                              <ul className="mt-1 space-y-1">
                                {task.checklist.map((item, index) => (
                                  <li key={index} className="flex items-center space-x-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={item.isCompleted}
                                      onChange={() => {
                                        // TODO: Implement checklist item update
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>
                                      {item.item}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No tasks available.</p>
                  )}
                </div>

                {/* General Notes */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">General Notes</h4>
                  {notesData.length > 0 ? (
                    <div className="space-y-4">
                      {notesData.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
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
            </TabsContent>

            <TabsContent value="otherApplicantDetails" className="p-6">
              <h3 className="text-lg font-semibold mb-4">Other Applicant Details</h3>
              {otherApplicantDetails.length === 0 ? (
                <div className="text-gray-500">No other applicant details found.</div>
              ) : (
                <div className="space-y-4">
                  {otherApplicantDetails.map((item, idx) => (
                    <div key={item._id} className="border rounded-lg p-4 bg-white/40 dark:bg-gray-800/40">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-lg">Applicant {idx + 1}: {item.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-100"
                          onClick={async () => {
                            try {
                              // Assuming you have a delete endpoint like /api/other-applicant-details/:id
                              await apiRequest('DELETE', `/api/other-applicant-details/${item._id}`);
                              setOtherApplicantDetails(otherApplicantDetails.filter(d => d._id !== item._id));
                              toast({ title: 'Success', description: 'Applicant detail deleted.' });
                            } catch (err) {
                              toast({ title: 'Error', description: err.message || 'Failed to delete detail', variant: 'destructive' });
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
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
                              href={`${API_BASE_URL}/api/files/name/${item.document}`} 
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

       {/* Keep the close button visible outside the cards */}
       <div className="flex justify-end mt-6">
         <Button variant="outline" onClick={() => setLocation('/enquiries')}>
           Close Profile
         </Button>
       </div>

       {/* Task Form Dialog */}
       <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
         <DialogContent className="sm:max-w-[600px] backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
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
                 className="col-span-3 bg-transparent"
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="type" className="text-right">Type</Label>
               <Select
                 value={taskDetails.type}
                 onValueChange={(value) => setTaskDetails({ ...taskDetails, type: value })}
               >
                 <SelectTrigger className="col-span-3 bg-transparent">
                   <SelectValue placeholder="Select task type" />
                 </SelectTrigger>
                 <SelectContent className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
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
                 className="col-span-3 bg-transparent"
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="priority" className="text-right">Priority</Label>
               <Select
                 value={taskDetails.priority}
                 onValueChange={(value) => setTaskDetails({ ...taskDetails, priority: value })}
               >
                 <SelectTrigger className="col-span-3 bg-transparent">
                   <SelectValue placeholder="Select priority" />
                 </SelectTrigger>
                 <SelectContent className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
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
                 className="col-span-3 bg-transparent"
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="description" className="text-right">Description</Label>
               <Textarea
                 id="description"
                 value={taskDetails.description}
                 onChange={(e) => setTaskDetails({ ...taskDetails, description: e.target.value })}
                 className="col-span-3 bg-transparent"
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="notes" className="text-right">Notes</Label>
               <Textarea
                 id="notes"
                 value={taskDetails.notes}
                 onChange={(e) => setTaskDetails({ ...taskDetails, notes: e.target.value })}
                 className="col-span-3 bg-transparent"
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
             <Button onClick={handleSaveTask}>Save Task</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Add Other Applicant Details Dialog */}
       <Dialog open={isOtherApplicantDialogOpen} onOpenChange={setIsOtherApplicantDialogOpen}>
         <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
           <DialogHeader>
             <DialogTitle>Add Other Applicant Details</DialogTitle>
           </DialogHeader>
           <div className="flex-grow overflow-y-auto pr-6 space-y-4">
             {otherApplicants.map((applicant, index) => (
               <div key={index} className="border rounded-lg p-4 relative space-y-4 bg-gray-50 dark:bg-gray-800">
                 <h4 className="font-semibold text-lg mb-2">Applicant {index + 1}</h4>
                 {otherApplicants.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                      onClick={() => {
                        const newApplicants = [...otherApplicants];
                        newApplicants.splice(index, 1);
                        setOtherApplicants(newApplicants);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <Input id={`name-${index}`} value={applicant.name} onChange={(e) => {
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].name = e.target.value;
                        setOtherApplicants(newApplicants);
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input id={`email-${index}`} type="email" value={applicant.email} onChange={(e) => {
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].email = e.target.value;
                        setOtherApplicants(newApplicants);
                      }}/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`mobile-${index}`}>Mobile Number</Label>
                      <Input id={`mobile-${index}`} value={applicant.mobileNumber} onChange={(e) => {
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].mobileNumber = e.target.value;
                        setOtherApplicants(newApplicants);
                      }}/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`nationality-${index}`}>Nationality</Label>
                      <Input id={`nationality-${index}`} value={applicant.nationality} onChange={(e) => {
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].nationality = e.target.value;
                        setOtherApplicants(newApplicants);
                      }}/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`passport-${index}`}>Passport Number</Label>
                      <Input id={`passport-${index}`} value={applicant.passportNumber} onChange={(e) => {
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].passportNumber = e.target.value;
                        setOtherApplicants(newApplicants);
                      }}/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`dob-${index}`}>Date of Birth</Label>
                      <Input id={`dob-${index}`} type="date" value={applicant.dateOfBirth} onChange={(e) => {
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].dateOfBirth = e.target.value;
                        setOtherApplicants(newApplicants);
                      }}/>
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor={`maritalStatus-${index}`}>Marital Status</Label>
                        <Select
                            value={applicant.maritalStatus}
                            onValueChange={(value) => {
                                const newApplicants = [...otherApplicants];
                                newApplicants[index].maritalStatus = value;
                                setOtherApplicants(newApplicants);
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
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].occupation = e.target.value;
                        setOtherApplicants(newApplicants);
                      }}/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`education-${index}`}>Education Level</Label>
                      <Input id={`education-${index}`} value={applicant.educationLevel} onChange={(e) => {
                        const newApplicants = [...otherApplicants];
                        newApplicants[index].educationLevel = e.target.value;
                        setOtherApplicants(newApplicants);
                      }}/>
                    </div>
                 </div>
                  <div className="space-y-1">
                    <Label htmlFor={`document-${index}`}>Document (PDF)</Label>
                    <Input id={`document-${index}`} type="file" accept="application/pdf" onChange={(e) => {
                      const newApplicants = [...otherApplicants];
                      newApplicants[index].document = e.target.files[0];
                      setOtherApplicants(newApplicants);
                    }} />
                  </div>
               </div>
             ))}
             <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setOtherApplicants([...otherApplicants, { name: '', email: '', mobileNumber: '', nationality: '', passportNumber: '', dateOfBirth: '', maritalStatus: 'Single', occupation: '', educationLevel: '', document: null }])}
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
                   const clientId = enquiry?.clientId || enquiry?._id;
                   if (!clientId) throw new Error("Client or Enquiry ID not found.");

                   formData.append('clientId', clientId);
                   
                   const applicantsPayload = otherApplicants.map(app => {
                     // Create a copy of the applicant and remove the file object
                     const { document, ...rest } = app;
                     return {
                       ...rest,
                       hasDocument: !!document, // Add a flag to indicate if a file is present
                     };
                   });
                   formData.append('applicants', JSON.stringify(applicantsPayload));

                   otherApplicants.forEach(app => {
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

       {/* Team Member Assignment Modal */}
       <Dialog open={isAssignmentModalOpen} onOpenChange={setIsAssignmentModalOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Assign Client To Team Member</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="teamMember">Select Team Member</Label>
               {isLoadingTeamMembers ? (
                 <div className="flex items-center space-x-2">
                   <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                   <span>Loading team members...</span>
                 </div>
               ) : (
                 <Select value={selectedTeamMemberId} onValueChange={setSelectedTeamMemberId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select a team member" />
                   </SelectTrigger>
                   <SelectContent>
                     {teamMembers.length > 0 ? (
                       teamMembers.map((member) => (
                         <SelectItem key={member._id} value={member._id}>
                           {member.fullName}
                         </SelectItem>
                       ))
                     ) : (
                       <SelectItem value="" disabled>No team members found</SelectItem>
                     )}
                   </SelectContent>
                 </Select>
               )}
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</Button>
             <Button 
               onClick={handleCompleteConversion} 
               disabled={isConverting || !selectedTeamMemberId}
               className="relative"
             >
               {isConverting && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 </div>
               )}
               <span className={isConverting ? 'opacity-0' : ''}>Convert to Client</span>
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </div>
  );
};

export default EnquiryProfile; 