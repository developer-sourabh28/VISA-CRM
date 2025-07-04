import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getEnquiries, getFacebookLeads, updateFacebookLeadStatus } from "../lib/api";
import { useToast } from "../components/ui/use-toast.js";
import { Eye, Edit, RefreshCw, CheckCircle, Trash2, Search, Plus, Mail, Phone, Calendar, Filter, Users as UsersIcon } from "lucide-react";
import { convertEnquiry } from "../lib/api";
import EnquiryProfile from "../components/EnquiryProfile";
import { useLocation } from "wouter";
// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import EditEnquiryForm from "./EditEnquiryForm";
import { useBranch } from '../contexts/BranchContext';
import { useUser } from '../context/UserContext';
import axios from "axios";
// import BackButton from "../components/BackButton";

export default function Enquiries() {
  const [, setLocation] = useLocation();
  const { toast, dismiss } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewEnquiry, setViewEnquiry] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [filterVisaType, setFilterVisaType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [duplicateCheckInProgress, setDuplicateCheckInProgress] = useState({
    email: false,
    phone: false
  });
  const debounceTimerRef = useRef(null);
  const [nextEnquiryId, setNextEnquiryId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
    watch,
    setError,
    clearErrors,
  } = useForm();

  const { selectedBranch } = useBranch();
  const { user } = useUser();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';

  const urlParams = new URLSearchParams(window.location.search);
  const allowDuplicate = urlParams.get('allowDuplicate') === 'true';

  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ['/api/enquiries', selectedBranch.branchName, filterStatus, filterSource],
    queryFn: async () => {
      const url = new URL("/api/enquiries", window.location.origin);
      if (selectedBranch.branchName !== "All Branches") {
        url.searchParams.append('branchId', selectedBranch.branchName);
      }
      if (filterStatus) {
        url.searchParams.append('status', filterStatus);
      }
      if (filterSource) {
        url.searchParams.append('source', filterSource);
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch enquiries');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

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

  const enquiries = enquiriesData?.data || [];

  const createEnquiryMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.branch) {
        throw new Error('Please select a branch');
      }
      data.allowDuplicate = allowDuplicate;
      const response = await apiRequest("POST", "/api/enquiries", data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create enquiry');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/enquiries"]);
      toast({
        title: "Success",
        description: "Enquiry created successfully!",
      });
      reset();
      setActiveTab("list");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create enquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEnquiryMutation = useMutation({
    mutationFn: ({ id, data }) =>
      apiRequest("PUT", `/api/enquiries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/enquiries"]);
      toast({
        title: "Success",
        description: "Enquiry updated successfully!",
      });
      setIsDialogOpen(false);
      setSelectedEnquiry(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update enquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEnquiryMutation = useMutation({
    mutationFn: (id) => apiRequest("DELETE", `/api/enquiries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/enquiries"]);
      toast({
        title: "Success",
        description: "Enquiry deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete enquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const convertEnquiryMutation = useMutation({
    mutationFn: convertEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/enquiries"]);
      queryClient.invalidateQueries(["/api/clients"]);
      toast({
        title: "Success",
        description: "Enquiry converted to client successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Conversion failed",
        variant: "destructive",
      });
    },
  });

  const handleConvertToEnquiry = async (leadData) => {
    try {
      // Reset form first to clear any existing data
      reset();
      
      // Set the form data with lead information
      Object.keys(leadData).forEach((key) => {
        if (leadData[key] !== null && leadData[key] !== undefined && leadData[key] !== '') {
          setValue(key, leadData[key]);
        }
      });

      // Switch to the create enquiry tab
      setActiveTab("create");

      toast({
        title: "Lead Data Loaded",
        description: "Facebook lead data has been loaded into the enquiry form. Please review and submit.",
      });
    } catch (error) {
      console.error('Error converting lead to enquiry:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead to enquiry",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isAdmin && user?.branch) {
      setValue('branch', user.branch);
    }
  }, [isAdmin, user?.branch, setValue]);

  // New useEffect to handle prefill data from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prefill = urlParams.get('prefill');
    if (prefill) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(prefill));
        Object.keys(parsedData).forEach((key) => {
          setValue(key, parsedData[key]);
        });
        setActiveTab("create");
        // Clear only the prefill parameter from the URL after using it, keeping others
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete('prefill');
        setLocation(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
      } catch (e) {
        console.error("Error parsing prefill data from URL:", e);
        toast({
          title: "Error",
          description: "Failed to pre-fill form from URL data.",
          variant: "destructive",
        });
      }
    }
  }, [setLocation, setValue, toast]);

  // Handle filtering based on active tab
  useEffect(() => {
    // Reset filters when changing tabs
    if (activeTab === 'list') {
      setFilterStatus('');
      setFilterSource('');
    } else if (activeTab === 'inhouse') {
      setFilterStatus('');
      setFilterSource('Walk-in,Other');
    } else if (activeTab === 'facebook') {
      setFilterStatus('');
      setFilterSource('Social Media');
    } else if (activeTab === 'active') {
      setFilterStatus('active');
      setFilterSource('');
    } else if (activeTab === 'new') {
      setFilterStatus('New');
      setFilterSource('');
    } else if (activeTab === 'not-connect') {
      setFilterStatus('not connect');
      setFilterSource('');
    } else if (activeTab === 'confirmed') {
      setFilterStatus('confirmed');
      setFilterSource('');
    } else if (activeTab === 'cancelled') {
      setFilterStatus('cancelled');
      setFilterSource('');
    } else if (activeTab === 'off-leads') {
      setFilterStatus('off leads');
      setFilterSource('');
    } else if (activeTab === 'referral') {
      setFilterStatus('referral');
      setFilterSource('');
    }
  }, [activeTab]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      const matchesName =
        !searchName ||
        enquiry.firstName?.toLowerCase().includes(searchName.toLowerCase());
      const matchesVisaType =
        !filterVisaType || enquiry.visaType === filterVisaType;
      const matchesStatus =
        !filterStatus || enquiry.enquiryStatus === filterStatus;
      
      // Handle comma-separated source values (for inhouse leads)
      const matchesSource = !filterSource || 
        (filterSource.includes(',') 
          ? filterSource.split(',').some(source => enquiry.enquirySource === source.trim())
          : enquiry.enquirySource === filterSource);
      
      return matchesName && matchesVisaType && matchesStatus && matchesSource;
    });
  }, [enquiries, searchName, filterVisaType, filterStatus, filterSource]);

  const handleFieldBlur = async (fieldName, value) => {
    if (activeTab !== 'create' || allowDuplicate) return;

    if ((fieldName === 'email' && value) || (fieldName === 'phone' && value)) {
      // Show a loading toast immediately
      const loadingToast = toast({
        title: `Checking ${fieldName} for duplicates...`,
        description: "Please wait while we verify if this user already exists.",
        duration: null, // Keep this toast open indefinitely until manually dismissed
      });

      try {
        // Create the request payload
        const payload = {};
        if (fieldName === 'email') {
          payload.email = value;
          payload.phone = watch('phone') || '';
        } else {
          payload.phone = value;
          payload.email = watch('email') || '';
        }

        const response = await axios.post('/api/enquiries/check-duplicate-user', payload);

        // Dismiss the loading toast once the API call is complete
        dismiss(loadingToast.id);

        if (response.data.exists) {
          toast({
            title: "Duplicate Entry",
            description: `An ${response.data.type} with this ${fieldName} already exists.`,
            variant: "destructive",
          });
          // Add visual indication to the field
          if (fieldName === 'email') {
            setValue('email', value, { shouldValidate: true });
          } else if (fieldName === 'phone') {
            setValue('phone', value, { shouldValidate: true });
          }
        }
      } catch (error) {
        // Dismiss the loading toast even if an error occurs
        dismiss(loadingToast.id);
        console.error(`Error checking duplicate ${fieldName}:`, error);
        toast({
          title: "Error",
          description: error.message || `Failed to check for duplicate ${fieldName}.`,
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data) => {
    console.log('[onSubmit] Form data:', data);
    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'nationality', 'currentCountry', 'passportNumber', 'dateOfBirth'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // For non-admin users, ensure they can only create enquiries for their branch
      if (!isAdmin && user?.branch) {
        data.branch = user.branch;
      }

      // --- Only do duplicate check if allowDuplicate is false ---
      if (!allowDuplicate) {
        const checkDuplicateResponse = await axios.post('/api/enquiries/check-duplicate-user', {
          email: data.email,
          phone: data.phone
        });

        if (checkDuplicateResponse.data.exists) {
          toast({
            title: "Duplicate Entry",
            description: `An ${checkDuplicateResponse.data.type} with this email or phone already exists.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Get the branch data to access country code
      const branch = branchesData?.data?.find(b => b.branchName === data.branch);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Add the country code to the phone number if it doesn't already have one
      if (data.phone && !data.phone.startsWith('+')) {
        data.phone = `${branch.countryCode}${data.phone}`;
      }
      if (data.alternatePhone && !data.alternatePhone.startsWith('+')) {
        data.alternatePhone = `${branch.countryCode}${data.alternatePhone}`;
      }

      // Add branchId to the data
      data.branchId = branch._id;

      // Set default values for optional fields if not provided
      data.enquiryStatus = data.enquiryStatus || 'New';
      data.source = data.enquirySource || 'Website';
      data.visaType = data.visaType || 'Tourist';
      data.destinationCountry = data.destinationCountry || 'USA';

      // Create the enquiry
      const response = await createEnquiryMutation.mutateAsync(data);
      
      if (response.success) {
        // Reset form and close dialog
        reset();
        setIsDialogOpen(false);
        setActiveTab("list");

        toast({
          title: "Success",
          description: "Enquiry created successfully",
          variant: "default",
        });
      } else {
        throw new Error(response.message || 'Failed to create enquiry');
      }
    } catch (error) {
      console.error('Error creating enquiry:', error);
      // Handle duplicate specific error from server (409 Conflict)
      if (error.response && error.response.status === 409) {
        toast({
          title: "Duplicate Entry",
          description: error.response.data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create enquiry. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (enquiry) => {
    setSelectedEnquiry(enquiry);
    Object.keys(enquiry).forEach((key) => {
      setValue(key, enquiry[key]);
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = (data) => {
    if (selectedEnquiry && selectedEnquiry._id) {
      updateEnquiryMutation.mutate({ id: selectedEnquiry._id, data });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      deleteEnquiryMutation.mutate(id);
    }
  };

  const handleEnquiryClick = (enquiry) => {
    // Navigate to the dedicated enquiry profile page
    setLocation(`/enquiries/${enquiry._id}`);
  };

  const handleCloseProfile = () => {
    // This function will now typically be called when closing the profile page itself,
    // or when navigating back to the list. For now, it can remain as a placeholder.
    // If you're using wouter, navigating back would be more direct.
    setLocation('/enquiries');
  };

  const handleGoToProfile = () => {
    // Ensure the dialog is closed BEFORE navigating to the profile
    setDuplicateUserDialog({ isOpen: false, type: null, userData: null });

    if (type === 'enquiry') {
      setLocation(`/enquiries/${userData._id}`);
    } else if (type === 'client') {
      setLocation(`/clients/${userData._id}`);
    }
  };

  const handleCreateNewEnquiry = (profileData) => {
    setAutoFillData(profileData);
  };

  const FacebookLeadsTable = ({ onConvertToEnquiry }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [convertingLeadId, setConvertingLeadId] = useState(null);
    const [filters, setFilters] = useState({
      startDate: '',
      endDate: '',
      campaignName: ''
    });

    const fetchLeads = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the proper API function
        const result = await getFacebookLeads(filters);
        
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error('Invalid response format from server');
        }
        
        setLeads(result.data);
      } catch (error) {
        console.error('Error fetching Facebook leads:', error);
        setError(error.message || 'Failed to fetch Facebook leads');
        toast({
          title: "Error",
          description: "Failed to fetch Facebook leads. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, [filters, toast]);

    // Update useEffect to prevent infinite loop
    useEffect(() => {
      let isSubscribed = true;

      const loadData = async () => {
        try {
          if (isSubscribed) {
            await fetchLeads();
          }
        } catch (error) {
          if (isSubscribed) {
            console.error('Failed to load leads:', error);
          }
        }
      };

      loadData();

      return () => {
        isSubscribed = false;
      };
    }, []); // Empty dependency array since fetchLeads is memoized

    const handleFilterChange = (key, value) => {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    };

    const handleRefresh = () => {
      fetchLeads();
    };

    const handleConvert = async (lead) => {
      try {
        setConvertingLeadId(lead.leadId);
        
        // Extract field data from lead with improved field mapping
        const getFieldValue = (fieldName) => {
          if (!lead.fieldData || !Array.isArray(lead.fieldData)) {
            return null;
          }
          
          const field = lead.fieldData.find(f => 
            f && f.name && (
              f.name.toLowerCase() === fieldName.toLowerCase() ||
              f.name.toLowerCase().includes(fieldName.toLowerCase())
            )
          );
          return field && field.value ? field.value : null;
        };

        // Helper function to extract name parts
        const extractNameParts = (fullName) => {
          if (!fullName) return { firstName: '', lastName: '' };
          const nameParts = fullName.trim().split(' ');
          if (nameParts.length === 1) {
            return { firstName: nameParts[0], lastName: '' };
          } else {
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            return { firstName, lastName };
          }
        };

        // Get full name from various possible field names
        const fullName = getFieldValue('full_name') || 
                        getFieldValue('name') || 
                        getFieldValue('fullname') ||
                        getFieldValue('first_name') + ' ' + getFieldValue('last_name') ||
                        getFieldValue('firstname') + ' ' + getFieldValue('lastname');

        const { firstName, lastName } = extractNameParts(fullName);

        // Map lead data to enquiry form fields with comprehensive mapping
        const enquiryData = {
          // Basic information
          firstName: firstName || getFieldValue('first_name') || getFieldValue('firstname') || '',
          lastName: lastName || getFieldValue('last_name') || getFieldValue('lastname') || '',
          email: getFieldValue('email') || getFieldValue('email_address') || '',
          phone: getFieldValue('phone_number') || getFieldValue('phone') || getFieldValue('mobile') || getFieldValue('telephone') || '',
          alternatePhone: getFieldValue('alternate_phone') || getFieldValue('secondary_phone') || '',
          
          // Location information
          nationality: getFieldValue('nationality') || getFieldValue('country') || getFieldValue('origin_country') || '',
          currentCountry: getFieldValue('current_country') || getFieldValue('residence_country') || getFieldValue('country') || '',
          destinationCountry: getFieldValue('destination_country') || getFieldValue('target_country') || getFieldValue('visa_country') || 'USA',
          
          // Visa information
          visaType: getFieldValue('visa_type') || getFieldValue('visa_category') || getFieldValue('service_type') || 'Tourist',
          purposeOfTravel: getFieldValue('purpose_of_travel') || getFieldValue('travel_purpose') || getFieldValue('reason_for_visit') || '',
          intendedTravelDate: getFieldValue('intended_travel_date') || getFieldValue('travel_date') || getFieldValue('planned_date') || '',
          durationOfStay: getFieldValue('duration_of_stay') || getFieldValue('stay_duration') || getFieldValue('length_of_stay') || '',
          
          // Personal information
          dateOfBirth: getFieldValue('date_of_birth') || getFieldValue('birth_date') || getFieldValue('dob') || '',
          passportNumber: getFieldValue('passport_number') || getFieldValue('passport') || '',
          passportExpiryDate: getFieldValue('passport_expiry_date') || getFieldValue('passport_expiry') || '',
          maritalStatus: getFieldValue('marital_status') || getFieldValue('marital') || 'Single',
          occupation: getFieldValue('occupation') || getFieldValue('job_title') || getFieldValue('profession') || '',
          educationLevel: getFieldValue('education_level') || getFieldValue('education') || getFieldValue('qualification') || 'Bachelor\'s',
          numberOfApplicants: getFieldValue('number_of_applicants') || getFieldValue('applicants') || getFieldValue('family_size') || '1',
          
          // Contact preferences
          preferredContactMethod: getFieldValue('preferred_contact_method') || getFieldValue('contact_method') || getFieldValue('contact_preference') || 'Email',
          preferredContactTime: getFieldValue('preferred_contact_time') || getFieldValue('contact_time') || getFieldValue('best_time') || '',
          
          // Visa history
          previousVisaApplications: getFieldValue('previous_visa_applications') || getFieldValue('visa_history') || getFieldValue('applied_before') || 'No',
          visaUrgency: getFieldValue('visa_urgency') || getFieldValue('urgency') || getFieldValue('timeline') || 'Normal',
          
          // Source and status
          enquirySource: 'Facebook Lead',
          enquiryStatus: 'New',
          assignedConsultant: getFieldValue('assigned_consultant') || getFieldValue('consultant') || '',
          
          // Notes with comprehensive lead information
          notes: `Converted from Facebook Lead
Lead ID: ${lead.leadId}
Campaign: ${lead.rawData?.campaignName || 'N/A'}
Form ID: ${lead.formId || 'N/A'}
Created: ${new Date(lead.createdTime).toLocaleString()}
${getFieldValue('additional_notes') || getFieldValue('notes') || getFieldValue('comments') || ''}`
        };

        // Call the parent component's convert handler
        onConvertToEnquiry(enquiryData);
        
        // Update lead status to converted
        try {
          await updateFacebookLeadStatus(lead.leadId, {
            status: 'converted'
          });
        } catch (statusError) {
          console.warn('Failed to update lead status:', statusError);
          // Don't fail the conversion if status update fails
        }

        toast({
          title: "Success",
          description: "Lead converted to enquiry successfully! Please review and submit the form.",
        });

        // Refresh the leads list
        fetchLeads();
      } catch (error) {
        console.error('Error converting lead:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to convert lead to enquiry",
          variant: "destructive",
        });
      } finally {
        setConvertingLeadId(null);
      }
    };

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="bg-transparent"
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="bg-transparent"
              />
            </div>
            <div>
              <Label>Campaign</Label>
              <Input
                type="text"
                value={filters.campaignName}
                onChange={(e) => handleFilterChange('campaignName', e.target.value)}
                placeholder="Filter by campaign..."
                className="bg-transparent"
              />
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Leads Table */}
        <div className="rounded-md border">
          {/* Summary Section */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {leads.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {leads.filter(lead => lead.status === 'new').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">New Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {leads.filter(lead => lead.status === 'converted').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Converted</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Click "Convert to Enquiry" to create an enquiry from Facebook lead data</span>
                </div>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Form Name</TableHead>
                <TableHead>Lead Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading leads...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No Facebook leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => {
                  // Helper function to get field value for display
                  const getDisplayValue = (fieldName) => {
                    if (!lead.fieldData || !Array.isArray(lead.fieldData)) {
                      return 'N/A';
                    }
                    
                    const field = lead.fieldData.find(f => 
                      f && f.name && (
                        f.name.toLowerCase() === fieldName.toLowerCase() ||
                        f.name.toLowerCase().includes(fieldName.toLowerCase())
                      )
                    );
                    return field && field.value ? field.value : 'N/A';
                  };

                  // Extract name for display
                  const fullName = getDisplayValue('full_name') || 
                                  getDisplayValue('name') || 
                                  getDisplayValue('fullname') ||
                                  `${getDisplayValue('first_name')} ${getDisplayValue('last_name')}`.trim() ||
                                  `${getDisplayValue('firstname')} ${getDisplayValue('lastname')}`.trim();

                  const isConverted = lead.status === 'converted';

                  return (
                    <TableRow key={lead.leadId} className={isConverted ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">
                        {fullName !== 'N/A' ? fullName : 'Unnamed Lead'}
                      </TableCell>
                      <TableCell>
                        {getDisplayValue('phone_number') || getDisplayValue('phone') || getDisplayValue('mobile')}
                      </TableCell>
                      <TableCell>
                        {getDisplayValue('email') || getDisplayValue('email_address')}
                      </TableCell>
                      <TableCell>
                        {lead.rawData?.campaignName || getDisplayValue('business_type') || 'N/A'}
                      </TableCell>
                      <TableCell>{lead.formId || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(lead.createdTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          lead.status === 'new' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          lead.status === 'converted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleConvert(lead)}
                          disabled={isConverted || convertingLeadId === lead.leadId}
                          className={`${
                            isConverted 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : convertingLeadId === lead.leadId
                              ? 'bg-amber-400 text-white cursor-wait'
                              : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl'
                          } transition-all duration-200`}
                          size="sm"
                        >
                          {convertingLeadId === lead.leadId ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Converting...</span>
                            </div>
                          ) : isConverted ? (
                            'Already Converted'
                          ) : (
                            'Convert to Enquiry'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Fetch the latest enquiryId from the new backend endpoint
  useEffect(() => {
    if (activeTab === "create") {
      const fetchNextEnquiryId = async () => {
        try {
          const response = await fetch("/api/enquiries/next-id");
          const data = await response.json();
          if (data.success) {
            const newId = data.nextEnquiryId;
            setNextEnquiryId(newId);
            setValue("enquiryId", newId);
          } else {
            toast({
              title: "Error",
              description: "Could not fetch the next Enquiry ID.",
              variant: "destructive"
            });
          }
        } catch (e) {
          toast({
            title: "Error",
            description: "Could not fetch the next Enquiry ID.",
            variant: "destructive"
          });
          setNextEnquiryId("Error");
        }
      };
      fetchNextEnquiryId();
    }
  }, [activeTab, setValue, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-400/15 to-yellow-400/15 dark:from-amber-400/8 dark:to-yellow-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div> */}

      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
        {/* <BackButton /> */}
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Enquiries
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
            {/* Search bar */}
            {/* <div className="hidden md:flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-full px-4 py-2 shadow-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text" 
                placeholder="Search enquiries..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-40 text-gray-600 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div> */}

            {/* New Enquiry Button */}
            <Button
              onClick={() => setActiveTab("create")}
              className="group relative overflow-hidden bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>New Enquiry</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 dark:text-white ">
        <TabsList className="h-auto flex-wrap justify-start rounded-2xl bg-white p-1  dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-600/50">
            <TabsTrigger value="list" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              All Enquiries
            </TabsTrigger>
            <TabsTrigger value="inhouse" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Inhouse Leads
            </TabsTrigger>
            <TabsTrigger value="facebook" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Facebook Leads
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Active Leads
            </TabsTrigger>
            <TabsTrigger value="new" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              New Leads
            </TabsTrigger>
            <TabsTrigger value="not-connect" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Not Connect
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Confirmed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Cancelled
            </TabsTrigger>
            <TabsTrigger value="off-leads" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Off Leads
            </TabsTrigger>
            <TabsTrigger value="referral" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Referral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {/* Enquiries Table */}
            <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading enquiries...</span>
                    </div>
                  </div>
                ) : enquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No enquiries found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                {enquiry.isClient ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                ) : (
                                  <span
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                      enquiry.enquiryStatus === "New"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                        : enquiry.enquiryStatus === "Contacted"
                                        ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                        : enquiry.enquiryStatus === "Qualified"
                                        ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                        : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    {enquiry.enquiryStatus}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Inhouse Leads Tab */}
          <TabsContent value="inhouse">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading inhouse leads...</span>
                    </div>
                  </div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No inhouse leads found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer border-b border-gray-100 dark:border-gray-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                {enquiry.isClient ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                ) : (
                                  <span
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                      enquiry.enquiryStatus === "New"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                        : enquiry.enquiryStatus === "Contacted"
                                        ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                        : enquiry.enquiryStatus === "Qualified"
                                        ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                        : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    {enquiry.enquiryStatus}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Active Leads Tab */}
          <TabsContent value="active">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading active leads...</span>
                    </div>
                  </div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No active leads found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer border-b border-gray-100 dark:border-gray-800/60 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                {enquiry.isClient ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                ) : (
                                  <span
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                      enquiry.enquiryStatus === "New"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                        : enquiry.enquiryStatus === "Contacted"
                                        ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                        : enquiry.enquiryStatus === "Qualified"
                                        ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                        : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    {enquiry.enquiryStatus}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* New Leads Tab */}
          <TabsContent value="new">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading new leads...</span>
                    </div>
                  </div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No new leads found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer border-b border-gray-100 dark:border-gray-800/60 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                {enquiry.isClient ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                ) : (
                                  <span
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                      enquiry.enquiryStatus === "New"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                        : enquiry.enquiryStatus === "Contacted"
                                        ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                        : enquiry.enquiryStatus === "Qualified"
                                        ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                        : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    {enquiry.enquiryStatus}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Confirmed Tab */}
          <TabsContent value="confirmed">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading confirmed leads...</span>
                    </div>
                  </div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No confirmed leads found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer border-b border-gray-100 dark:border-gray-800/60 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                    enquiry.enquiryStatus === "New"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                      : enquiry.enquiryStatus === "Contacted"
                                      ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                      : enquiry.enquiryStatus === "Qualified"
                                      ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                      : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                  }`}
                                >
                                  {enquiry.enquiryStatus}
                                </span>
                                {enquiry.isClient && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Cancelled Tab */}
          <TabsContent value="cancelled">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading cancelled leads...</span>
                    </div>
                  </div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No cancelled leads found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer border-b border-gray-100 dark:border-gray-800/60 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                    enquiry.enquiryStatus === "New"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                      : enquiry.enquiryStatus === "Contacted"
                                      ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                      : enquiry.enquiryStatus === "Qualified"
                                      ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                      : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                  }`}
                                >
                                  {enquiry.enquiryStatus}
                                </span>
                                {enquiry.isClient && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading referral leads...</span>
                    </div>
                  </div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No referral leads found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer border-b border-gray-100 dark:border-gray-800/60 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                    enquiry.enquiryStatus === "New"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                      : enquiry.enquiryStatus === "Contacted"
                                      ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                      : enquiry.enquiryStatus === "Qualified"
                                      ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                      : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                  }`}
                                >
                                  {enquiry.enquiryStatus}
                                </span>
                                {enquiry.isClient && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Off Leads Tab */}
          <TabsContent value="off-leads">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading off leads...</span>
                    </div>
                  </div>
                ) : filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No off leads found
                    </p>
                    <Button
                      className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
                      onClick={() => setActiveTab("create")}
                    >
                      Create New Enquiry
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Enquiry ID</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Name</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Type</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Visa Country</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Consultant</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Source</th>
                          <th className="text-left py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Created Date</th>
                          <th className="text-center py-4 px-5 text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer border-b border-gray-100 dark:border-gray-800/60 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-colors duration-150"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="py-4 px-5">{enquiry.enquiryId}</td>
                            <td className="py-4 px-5 font-medium">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="py-4 px-5">{enquiry.visaType}</td>
                            <td className="py-4 px-5">{enquiry.destinationCountry}</td>
                            <td className="py-4 px-5">{enquiry.assignedConsultant}</td>
                            <td className="py-4 px-5">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                    enquiry.enquiryStatus === "New"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                                      : enquiry.enquiryStatus === "Contacted"
                                      ? "bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400"
                                      : enquiry.enquiryStatus === "Qualified"
                                      ? "bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-400"
                                      : "bg-gray-100/60 dark:bg-gray-900/40 text-gray-800 dark:text-gray-400"
                                  }`}
                                >
                                  {enquiry.enquiryStatus}
                                </span>
                                {enquiry.isClient && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">Converted to Client</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-5">{enquiry.enquirySource}</td>
                            <td className="py-4 px-5">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 px-5">
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(enquiry._id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="facebook">
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                <FacebookLeadsTable onConvertToEnquiry={handleConvertToEnquiry} />
              </div>
            </div>
          </TabsContent>

          {/* Create Enquiry Tab */}
          <TabsContent value="create">
            <div className="group relative overflow-hidden min-h-[calc(100vh-16rem)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative p-4 md:p-6 max-w-5xl mx-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 overflow-y-visible p-3 sm:p-4 backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-700/50 rounded-2xl shadow-lg">
                  {/* 1. Enquirer Information */}
                  <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-5 rounded-xl mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                    <h3 className="text-lg font-medium mb-3 sm:mb-5 text-gray-800 dark:text-gray-200">1. Enquirer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      {/* Enquiry ID (auto-generated) */}
                      <div className="space-y-2">
                        <Label htmlFor="enquiryId">Enquiry ID *</Label>
                        <Input id="enquiryId" value={nextEnquiryId} readOnly disabled className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed" {...register("enquiryId", { required: true })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" {...register("firstName", { required: "First name is required" })} className={`${errors.firstName ? "border-red-500" : "bg-transparent"}`} />
                        {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" {...register("lastName", { required: "Last name is required" })} className={`${errors.lastName ? "border-red-500" : "bg-transparent"}`} />
                        {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
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
                            className={`${errors.email ? "border-red-500" : "bg-transparent"} pr-10`} 
                          />
                          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <div className="relative">
                          <Input 
                            id="phone" 
                            {...register("phone", { required: "Phone number is required" })} 
                            className={`${errors.phone ? "border-red-500" : "bg-transparent"} pr-10`} 
                          />
                          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternatePhone">Alternate Contact Number</Label>
                        <Input id="alternatePhone" {...register("alternatePhone")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality *</Label>
                        <Input id="nationality" {...register("nationality", { required: "Nationality is required" })} className={`${errors.nationality ? "border-red-500" : "bg-transparent"}`} />
                        {errors.nationality && <p className="text-red-500 text-sm">{errors.nationality.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentCountry">Current Country of Residence *</Label>
                        <Input id="currentCountry" {...register("currentCountry", { required: "Current country is required" })} className={`${errors.currentCountry ? "border-red-500" : "bg-transparent"}`} />
                        {errors.currentCountry && <p className="text-red-500 text-sm">{errors.currentCountry.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                        <Controller name="preferredContactMethod" control={control} defaultValue="Email" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="preferredContactMethod" className="bg-transparent"><SelectValue placeholder="Select contact method" /></SelectTrigger>
                            <SelectContent><SelectItem value="Email">Email</SelectItem><SelectItem value="Phone">Phone</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="SMS">SMS</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferredContactTime">Preferred Contact Time</Label>
                        <Input id="preferredContactTime" {...register("preferredContactTime")} className="bg-transparent" />
                      </div>
                    </div>
                  </div>
                  {/* 2. Visa Enquiry Details */}
                  <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-5 rounded-xl mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                    <h3 className="text-lg font-medium mb-3 sm:mb-5 text-gray-800 dark:text-gray-200">2. Visa Enquiry Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="visaType">Visa Type *</Label>
                        <Controller name="visaType" control={control} defaultValue="Tourist" rules={{ required: "Visa type is required" }} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="visaType" className="bg-transparent"><SelectValue placeholder="Select visa type" /></SelectTrigger>
                            <SelectContent><SelectItem value="Tourist">Tourist</SelectItem><SelectItem value="Student">Student</SelectItem><SelectItem value="Work">Work</SelectItem><SelectItem value="Business">Business</SelectItem><SelectItem value="PR">Permanent Resident</SelectItem><SelectItem value="Dependent">Dependent</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                          </Select>
                        )} />
                        {errors.visaType && <p className="text-red-500 text-sm">{errors.visaType.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="destinationCountry">Destination Country *</Label>
                        <Controller name="destinationCountry" control={control} defaultValue="USA" rules={{ required: "Destination country is required" }} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="destinationCountry" className="bg-transparent"><SelectValue placeholder="Select destination" /></SelectTrigger>
                            <SelectContent><SelectItem value="USA">USA</SelectItem><SelectItem value="Canada">Canada</SelectItem><SelectItem value="UK">UK</SelectItem><SelectItem value="Australia">Australia</SelectItem><SelectItem value="New Zealand">New Zealand</SelectItem><SelectItem value="Schengen">Schengen</SelectItem><SelectItem value="UAE">UAE</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                          </Select>
                        )} />
                        {errors.destinationCountry && <p className="text-red-500 text-sm">{errors.destinationCountry.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purposeOfTravel">Purpose of Travel</Label>
                        <Input id="purposeOfTravel" {...register("purposeOfTravel")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="intendedTravelDate">Intended Travel Date</Label>
                        <Input id="intendedTravelDate" type="date" {...register("intendedTravelDate")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="durationOfStay">Duration of Stay</Label>
                        <Input id="durationOfStay" {...register("durationOfStay")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="previousVisaApplications">Previous Visa Applications</Label>
                        <Controller name="previousVisaApplications" control={control} defaultValue="No" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="previousVisaApplications" className="bg-transparent"><SelectValue placeholder="Select option" /></SelectTrigger>
                            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visaUrgency">Visa Urgency</Label>
                        <Controller name="visaUrgency" control={control} defaultValue="Normal" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="visaUrgency" className="bg-transparent"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                            <SelectContent><SelectItem value="Normal">Normal</SelectItem><SelectItem value="Urgent">Urgent</SelectItem><SelectItem value="Express">Express</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                    </div>
                  </div>
                  {/* 3. Additional Applicant Details */}
                  <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-5 rounded-xl mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                    <h3 className="text-lg font-medium mb-3 sm:mb-5 text-gray-800 dark:text-gray-200">3. Additional Applicant Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="passportNumber">Passport Number *</Label>
                        <Input id="passportNumber" {...register("passportNumber", { required: "Passport number is required" })} className={`${errors.passportNumber ? "border-red-500" : "bg-transparent"}`} />
                        {errors.passportNumber && <p className="text-red-500 text-sm">{errors.passportNumber.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passportExpiryDate">Passport Expiry Date</Label>
                        <Input id="passportExpiryDate" type="date" {...register("passportExpiryDate")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input id="dateOfBirth" type="date" {...register("dateOfBirth", { required: "Date of birth is required" })} className={`${errors.dateOfBirth ? "border-red-500" : "bg-transparent"}`} />
                        {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maritalStatus">Marital Status</Label>
                        <Controller name="maritalStatus" control={control} defaultValue="Single" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="maritalStatus" className="bg-transparent"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem><SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numberOfApplicants">Number of Applicants</Label>
                        <Input id="numberOfApplicants" type="number" {...register("numberOfApplicants")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input id="occupation" {...register("occupation")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="educationLevel">Education Level</Label>
                        <Controller name="educationLevel" control={control} defaultValue="Bachelor's" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="educationLevel" className="bg-transparent"><SelectValue placeholder="Select education level" /></SelectTrigger>
                            <SelectContent><SelectItem value="High School">High School</SelectItem><SelectItem value="Bachelor's">Bachelor's</SelectItem><SelectItem value="Master's">Master's</SelectItem><SelectItem value="PhD">PhD</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                    </div>
                  </div>
                  {/* 4. Source and Marketing Information */}
                  <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-5 rounded-xl mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                    <h3 className="text-lg font-medium mb-3 sm:mb-5 text-gray-800 dark:text-gray-200">4. Source and Marketing Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="enquirySource">Enquiry Source</Label>
                        <Controller name="enquirySource" control={control} defaultValue="Website" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="enquirySource" className="bg-transparent"><SelectValue placeholder="Select source" /></SelectTrigger>
                            <SelectContent><SelectItem value="Website">Website</SelectItem><SelectItem value="Social Media">Social Media</SelectItem><SelectItem value="Referral">Referral</SelectItem><SelectItem value="Walk-in">Walk-in</SelectItem><SelectItem value="Advertisement">Advertisement</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="campaignName">Campaign Name</Label>
                        <Input id="campaignName" {...register("campaignName")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referredBy">Referred By</Label>
                        <Input id="referredBy" {...register("referredBy")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch/Office *</Label>
                        <Controller name="branch" control={control} defaultValue={user?.branch || ""} rules={{ required: "Branch is required" }} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="branch" className={`${errors.branch ? "border-red-500" : "bg-transparent"}`}><SelectValue placeholder="Select branch" /></SelectTrigger>
                            <SelectContent>
                              {(branchesData?.data || []).map((b) => (
                                <SelectItem key={b.branchName} value={b.branchName}>{b.branchName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )} />
                        {errors.branch && <p className="text-red-500 text-sm">{errors.branch.message}</p>}
                      </div>
                    </div>
                  </div>
                  {/* 5. Internal Tracking and Assignment */}
                  <div className="border border-gray-200/70 dark:border-gray-700/70 p-3 sm:p-5 rounded-xl mb-6 shadow-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                    <h3 className="text-lg font-medium mb-3 sm:mb-5 text-gray-800 dark:text-gray-200">5. Internal Tracking and Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="enquiryStatus">Enquiry Status</Label>
                        <Controller name="enquiryStatus" control={control} defaultValue="New" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={selectedEnquiry?.isClient}>
                            <SelectTrigger id="enquiryStatus" className="bg-transparent"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent><SelectItem value="New">New</SelectItem><SelectItem value="Contacted">Contacted</SelectItem><SelectItem value="Qualified">Qualified</SelectItem><SelectItem value="Processing">Processing</SelectItem><SelectItem value="Closed">Closed</SelectItem><SelectItem value="Lost">Lost</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="not connect">Not Connect</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="off leads">Off Leads</SelectItem><SelectItem value="referral">Referral</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignedConsultant">Assigned Consultant</Label>
                        <Input id="assignedConsultant" {...register("assignedConsultant")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="followUpDate">Follow-Up Date</Label>
                        <Input id="followUpDate" type="date" {...register("followUpDate")} className="bg-transparent" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priorityLevel">Priority Level</Label>
                        <Controller name="priorityLevel" control={control} defaultValue="Medium" render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="priorityLevel" className="bg-transparent"><SelectValue placeholder="Select priority" /></SelectTrigger>
                            <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="notes">Notes/Comments</Label>
                        <Textarea id="notes" {...register("notes")} rows={4} className="bg-transparent" />
                      </div>
                    </div>
                  </div>
                  {/* Hidden/auto fields: branchId, facebookLeadId, facebookFormId, facebookRawData, facebookSyncedAt, enquiryId (auto-generated in backend) */}
                  <div className="sticky bottom-0 pt-4 pb-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 rounded-b-xl mt-8">
                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("list")} className="w-full sm:w-auto">Cancel</Button>
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white px-6 w-full sm:w-auto"
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
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {selectedEnquiry && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-[60%] h-[90%] backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg">              
              <DialogHeader>
                <DialogTitle>Edit Enquiry</DialogTitle>
                <DialogDescription>
                  Update the enquiry details for {selectedEnquiry.firstName}
                </DialogDescription>
              </DialogHeader>
              <EditEnquiryForm
                defaultValues={selectedEnquiry}
                onSubmit={handleUpdate}
                onCancel={() => setIsDialogOpen(false)}
                isPending={updateEnquiryMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}

        {viewEnquiry && (
          <Dialog open={!!viewEnquiry} onOpenChange={() => setViewEnquiry(null)}>
            <DialogContent className="max-w-4xl backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
              <DialogHeader>
                <DialogTitle>Enquiry Details</DialogTitle>
                <DialogDescription>
                  All details for {viewEnquiry.firstName || "Unknown"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-h-[70vh] overflow-y-auto py-2">
                {Object.entries(viewEnquiry)
                  .filter(([key]) => key !== "_id")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0"
                    >
                      <span className="font-semibold text-gray-700 capitalize mb-1">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-gray-900">
                        {value &&
                          typeof value === "string" &&
                          value.match(/^\d{4}-\d{2}-\d{2}/)
                          ? new Date(value).toLocaleDateString()
                          : value?.toString() || "-"}
                      </span>
                    </div>
                  ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Duplicate User Dialog */}
        <Dialog
          // open={duplicateUserDialog.isOpen}
          onOpenChange={(open) => {
            // if (!open) {
            //   setDuplicateUserDialog({ isOpen: false, type: null, userData: null });
            // }
          }}
        >
          <DialogContent className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
  <DialogHeader>
    <DialogTitle>Existing User Found</DialogTitle>
    <DialogDescription>
      {/* Additional description if needed */}
    </DialogDescription>
  </DialogHeader>
  <DialogFooter>
    <Button
      variant="outline"
      onClick={() => {
        // You can define a new close handler if needed
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={handleGoToProfile}
      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
    >
      View
    </Button>
  </DialogFooter>
</DialogContent>

        </Dialog>
      </div>
    </div>
  );
}
