import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Mail, Phone, Calendar, MapPin, Globe, FileText, User, Building, Plus, Send, Clock, Eye, History as HistoryIcon, DollarSign, File, BookText, Handshake, CreditCard, Trash2, MessageCircleMore } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEnquiry, getEnquiryAgreement, createOrUpdateEnquiryAgreement, getEnquiryMeeting, createOrUpdateEnquiryMeeting, getEnquiryTasks, createEnquiryTask, updateEnquiryTask, deleteEnquiryTask } from '../lib/api';
import { useToast } from './ui/use-toast.js';
import { convertEnquiry } from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { apiRequest } from '../lib/api';
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

    setIsConverting(true);
    try {
      console.log("Converting enquiry:", enquiryId);
      console.log("Enquiry details:", {
        firstName,
        lastName,
        email: response.data.email,
        phone: response.data.phone,
        branch: response.data.branch
      });
      
      const result = await convertEnquiry(enquiryId);
      console.log("Conversion result:", result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Enquiry successfully converted to client.",
        });
        setLocation('/enquiries');
      } else {
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
      setLocation(`/enquiries?prefill=${encodeURIComponent(JSON.stringify(autoFillData))}`);
    }
  };

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
    { date: enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : 'N/A', activity: 'Enquiry Created', enquiryId: enquiry._id || 'N/A', status: enquiry.enquiryStatus, assignedTo: enquiry.assignedConsultant || 'N/A' },
    // Add more history items here if available in enquiry data or backend
    // Example: { date: '2023-10-26', activity: 'Meeting Scheduled', enquiryId: enquiry._id || 'N/A', status: 'Scheduled', assignedTo: 'Sarah Thompson' },
    // Example: { date: '2023-10-20', activity: 'Agreement Sent', enquiryId: enquiry._id || 'N/A', status: 'Sent', assignedTo: 'Mark Wilson' },
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
              <p>{enquiry._id || 'N/A'}</p>
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
              <TabsTrigger value="status" className="flex items-center space-x-2"><Clock size={16} /><span>Status</span></TabsTrigger>
              {/* <TabsTrigger value="payments" className="flex items-center space-x-2"><DollarSign size={16} /><span>Payments</span></TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-2"><File size={16} /><span>Documents</span></TabsTrigger> */}
              <TabsTrigger value="notes" className="flex items-center space-x-2"><BookText size={16} /><span>Notes</span></TabsTrigger>
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

              <h4 className="text-md font-semibold mb-3">Previous Enquiries</h4>
               {/* Placeholder for Previous Enquiries List */}
               {/* Replace with actual data rendering based on fetched previousEnquiries array */}
               {/* Check if a previousEnquiries array exists and has items */}
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
            </TabsContent>

             {/* New Status Tab */}
            <TabsContent value="status" className="p-6 space-y-6 ">
              <h3 className="text-lg font-semibold mb-4  dark:text-white">Enquiry Status Tracking</h3>

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
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2"><CreditCard size={20} /><span>Payment Collection</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-gray-600 dark:text-gray-400">Track payments made for this enquiry.</p>
                    {/* Placeholder for Payment Tracking Form/Details */}
                   <div>
                     {/* Add Payment Form or details here */}
                      <p className="text-gray-500">Payment details and tracking will go here.</p>
                       {/* Example: <PaymentTracker enquiryId={enquiry._id} /> */}
                   </div>
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

    </div>
  );
};

export default EnquiryProfile; 