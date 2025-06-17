import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getEnquiries } from "../lib/api";
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
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [duplicateUserDialog, setDuplicateUserDialog] = useState({
    isOpen: false,
    type: null,
    userData: null
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm();

  const { selectedBranch } = useBranch();
  const { user } = useUser();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';

  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ['/api/enquiries', selectedBranch.branchName],
    queryFn: async () => {
      const url = new URL("/api/enquiries", window.location.origin);
      if (selectedBranch.branchName !== "All Branches") {
        url.searchParams.append('branchId', selectedBranch.branchName);
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
        // Clear the prefill parameter from the URL after using it
        setLocation(window.location.pathname, { replace: true });
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

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      const matchesName =
        !searchName ||
        enquiry.firstName?.toLowerCase().includes(searchName.toLowerCase());
      const matchesVisaType =
        !filterVisaType || enquiry.visaType === filterVisaType;
      const matchesStatus =
        !filterStatus || enquiry.enquiryStatus === filterStatus;
      return matchesName && matchesVisaType && matchesStatus;
    });
  }, [enquiries, searchName, filterVisaType, filterStatus]);

  const handleFieldBlur = async (fieldName, value) => {
    // Only run this logic if the "create" tab is active
    if (activeTab !== 'create') {
      return;
    }

    if (fieldName === 'email' || fieldName === 'phone') {
      // Show a loading toast immediately
      const loadingToast = toast({
        title: "Checking for duplicates...",
        description: "Please wait while we verify if this user already exists.",
        duration: null, // Keep this toast open indefinitely until manually dismissed
      });

      try {
        const response = await axios.post('/api/enquiries/check-duplicate-user', {
          email: fieldName === 'email' ? value : watch('email'),
          phone: fieldName === 'phone' ? value : watch('phone')
        });

        // Dismiss the loading toast once the API call is complete
        dismiss(loadingToast.id);

        if (response.data.exists) {
          setDuplicateUserDialog({
            isOpen: true,
            type: response.data.type,
            userData: response.data.userData
          });
          toast({
            title: "Duplicate Entry",
            description: `An ${response.data.type} with this email or phone already exists.`, // Use backticks for template literal
            variant: "destructive",
          });
        }
      } catch (error) {
        // Dismiss the loading toast even if an error occurs
        dismiss(loadingToast.id);
        console.error('Error checking duplicate:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to check for duplicate user.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data) => {
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

      // Preliminary client-side duplicate check before mutation
      const checkDuplicateResponse = await axios.post('/api/enquiries/check-duplicate-user', {
        email: data.email,
        phone: data.phone
      });

      if (checkDuplicateResponse.data.exists) {
        setDuplicateUserDialog({
          isOpen: true,
          type: checkDuplicateResponse.data.type,
          userData: checkDuplicateResponse.data.userData
        });
        toast({
          title: "Duplicate Entry",
          description: `An ${checkDuplicateResponse.data.type} with this email or phone already exists.`,
          variant: "destructive",
        });
        return;
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
        setDuplicateUserDialog({
          isOpen: true,
          type: error.response.data.type,
          userData: error.response.data.userData
        });
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
    // Ensure duplicate dialog is closed when trying to view an enquiry
    setDuplicateUserDialog({ isOpen: false, type: null, userData: null });
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
    const { type, userData } = duplicateUserDialog;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-400/15 to-yellow-400/15 dark:from-amber-400/8 dark:to-yellow-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-20 p-6 space-y-8">
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
            <div className="hidden md:flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-full px-4 py-2 shadow-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text" 
                placeholder="Search enquiries..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-40 text-gray-600 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-full p-1">
            <TabsTrigger value="list" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              List View
            </TabsTrigger>
            <TabsTrigger value="create" className="rounded-full px-6 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              Create Enquiry
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
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visa Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Consultant</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Source</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enquiry) => (
                          <tr 
                            key={enquiry._id}
                            className="cursor-pointer hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                            onClick={() => handleEnquiryClick(enquiry)}
                          >
                            <td className="text-gray-900 dark:text-white py-3 px-4">
                              {enquiry.firstName} {enquiry.lastName}
                            </td>
                            <td className="text-gray-900 dark:text-white py-3 px-4">{enquiry.visaType}</td>
                            <td className="text-gray-900 dark:text-white py-3 px-4">{enquiry.assignedConsultant}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  enquiry.status === "New"
                                    ? "bg-blue-100/40 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                                    : enquiry.status === "Contacted"
                                    ? "bg-yellow-100/40 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                                    : enquiry.status === "Qualified"
                                    ? "bg-green-100/40 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                    : "bg-gray-100/40 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {enquiry.status}
                              </span>
                            </td>
                            <td className="text-gray-900 dark:text-white py-3 px-4">{enquiry.source}</td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(enquiry);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
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

          <TabsContent value="create">
            {/* Create Enquiry Form */}
            <div className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* 1. Enquirer Information */}
                  <div className="border p-4 rounded-md mb-6 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">1. Enquirer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">First Name *</Label>
                        <Input
                          id="firstName"
                          {...register("firstName", { required: "First name is required" })}
                          className={errors.firstName ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Last Name *</Label>
                        <Input
                          id="lastName"
                          {...register("lastName", { required: "Last name is required" })}
                          className={errors.lastName ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm">{errors.lastName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email *</Label>
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
                          onBlur={(e) => handleFieldBlur('email', e.target.value)}
                          className={errors.email ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Phone *</Label>
                        <Input
                          id="phone"
                          {...register("phone", { required: "Phone number is required" })}
                          onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                          className={errors.phone ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm">{errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alternatePhone" className="text-gray-700 dark:text-gray-300">Alternate Phone</Label>
                        <Input
                          id="alternatePhone"
                          {...register("alternatePhone")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nationality" className="text-gray-700 dark:text-gray-300">Nationality *</Label>
                        <Input
                          id="nationality"
                          {...register("nationality", { required: "Nationality is required" })}
                          className={errors.nationality ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.nationality && (
                          <p className="text-red-500 text-sm">{errors.nationality.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentCountry" className="text-gray-700 dark:text-gray-300">Current Country *</Label>
                        <Input
                          id="currentCountry"
                          {...register("currentCountry", { required: "Current country is required" })}
                          className={errors.currentCountry ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.currentCountry && (
                          <p className="text-red-500 text-sm">{errors.currentCountry.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preferredContactMethod" className="text-gray-700 dark:text-gray-300">Preferred Contact Method</Label>
                        <Select
                          onValueChange={(value) => setValue("preferredContactMethod", value)}
                          defaultValue={watch("preferredContactMethod") || "Email"}
                        >
<SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-200/50 dark:border-gray-600/50">                            <SelectValue placeholder="Select contact method" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Phone">Phone</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="SMS">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preferredContactTime" className="text-gray-700 dark:text-gray-300">Preferred Contact Time</Label>
                        <Input
                          id="preferredContactTime"
                          {...register("preferredContactTime")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Visa Enquiry Details */}
                  <div className="border p-4 rounded-md mb-6 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">2. Visa Enquiry Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="visaType" className="text-gray-700 dark:text-gray-300">Visa Type</Label>
                        <Select
                          onValueChange={(value) => setValue("visaType", value)}
                          defaultValue={watch("visaType") || "Tourist"}
                        >
                          <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select visa type" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                            <SelectItem value="Tourist">Tourist</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="PR">PR</SelectItem>
                            <SelectItem value="Dependent">Dependent</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="destinationCountry" className="text-gray-700 dark:text-gray-300">Destination Country</Label>
                        <Select
                          onValueChange={(value) => setValue("destinationCountry", value)}
                          defaultValue={watch("destinationCountry") || "USA"}
                        >
                          <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                            <SelectItem value="USA">USA</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="UK">UK</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="New Zealand">New Zealand</SelectItem>
                            <SelectItem value="Schengen">Schengen</SelectItem>
                            <SelectItem value="UAE">UAE</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purposeOfTravel" className="text-gray-700 dark:text-gray-300">Purpose of Travel</Label>
                        <Input
                          id="purposeOfTravel"
                          {...register("purposeOfTravel")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="intendedTravelDate" className="text-gray-700 dark:text-gray-300">Intended Travel Date</Label>
                        <Input
                          id="intendedTravelDate"
                          type="date"
                          {...register("intendedTravelDate")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="durationOfStay" className="text-gray-700 dark:text-gray-300">Duration of Stay</Label>
                        <Input
                          id="durationOfStay"
                          {...register("durationOfStay")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="previousVisaApplications" className="text-gray-700 dark:text-gray-300">Previous Visa Applications</Label>
                        <Select
                          onValueChange={(value) => setValue("previousVisaApplications", value)}
                          defaultValue={watch("previousVisaApplications") || "No"}
                        >
                          <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="visaUrgency" className="text-gray-700 dark:text-gray-300">Visa Urgency</Label>
                        <Select
                          onValueChange={(value) => setValue("visaUrgency", value)}
                          defaultValue={watch("visaUrgency") || "Normal"}
                        >
                          <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                            <SelectItem value="Express">Express</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* 3. Additional Applicant Details */}
                  <div className="border p-4 rounded-md mb-6 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">3. Additional Applicant Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="passportNumber" className="text-gray-700 dark:text-gray-300">Passport Number *</Label>
                        <Input
                          id="passportNumber"
                          {...register("passportNumber", { required: "Passport number is required" })}
                          className={errors.passportNumber ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.passportNumber && (
                          <p className="text-red-500 text-sm">{errors.passportNumber.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passportExpiryDate" className="text-gray-700 dark:text-gray-300">Passport Expiry Date</Label>
                        <Input
                          id="passportExpiryDate"
                          type="date"
                          {...register("passportExpiryDate")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="text-gray-700 dark:text-gray-300">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...register("dateOfBirth", { required: "Date of birth is required" })}
                          className={errors.dateOfBirth ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"}
                        />
                        {errors.dateOfBirth && (
                          <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maritalStatus" className="text-gray-700 dark:text-gray-300">Marital Status</Label>
                        <Select
                          onValueChange={(value) => setValue("maritalStatus", value)}
                          defaultValue={watch("maritalStatus") || "Single"}
                        >
                          <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numberOfApplicants" className="text-gray-700 dark:text-gray-300">Number of Applicants</Label>
                        <Input
                          id="numberOfApplicants"
                          type="number"
                          {...register("numberOfApplicants")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="occupation" className="text-gray-700 dark:text-gray-300">Occupation</Label>
                        <Input
                          id="occupation"
                          {...register("occupation")}
                          className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="educationLevel" className="text-gray-700 dark:text-gray-300">Education Level</Label>
                        <Select
                          onValueChange={(value) => setValue("educationLevel", value)}
                          defaultValue={watch("educationLevel") || "Bachelor's"}
                        >
                          <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                            <SelectItem value="High School">High School</SelectItem>
                            <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                            <SelectItem value="Master's">Master's</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Branch Field */}
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-gray-700 dark:text-gray-300">Branch *</Label>
                    {isAdmin ? (
                      <Select
                        onValueChange={(value) => setValue("branch", value)}
                        defaultValue={watch("branch")}
                      >
                        <SelectTrigger className={errors.branch ? "border-red-500" : "bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600"}>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                          {branchesData?.data?.map((branch) => (
                            <SelectItem key={branch._id} value={branch.branchName}>
                              {branch.branchName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="branch"
                        value={user?.branch || ''}
                        disabled
                        className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    )}
                    {errors.branch && (
                      <p className="text-red-500 text-sm">{errors.branch.message}</p>
                    )}
                  </div>

                  {/* Source Field - Added for visibility and data capture */}
                  <div className="space-y-2">
                    <Label htmlFor="enquirySource" className="text-gray-700 dark:text-gray-300">Enquiry Source</Label>
                    <Select
                      onValueChange={(value) => setValue("enquirySource", value)}
                      defaultValue={watch("enquirySource") || "Website"}
                    >
                      <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Advertisement">Advertisement</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assigned Consultant Field - Added for visibility and data capture */}
                  <div className="space-y-2">
                    <Label htmlFor="assignedConsultant" className="text-gray-700 dark:text-gray-300">Assigned Consultant</Label>
                    <Input
                      id="assignedConsultant"
                      {...register("assignedConsultant")}
                      className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {/* Enquiry Status Field - Added for visibility and data capture */}
                  <div className="space-y-2">
                    <Label htmlFor="enquiryStatus" className="text-gray-700 dark:text-gray-300">Enquiry Status</Label>
                    <Select
                      onValueChange={(value) => setValue("enquiryStatus", value)}
                      defaultValue={watch("enquiryStatus") || "New"}
                    >
                      <SelectTrigger className="bg-transparent text-gray-900 dark:text-white dark:placeholder-gray-500 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600">
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes Field - Already exists, ensure dark mode styling is applied */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register("notes")}
                      placeholder="Add any additional notes here..."
                      className="bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setActiveTab("list");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
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
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {selectedEnquiry && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
<DialogContent className="max-w-[60%] h-[90%] backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg">              <DialogHeader>
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
          open={duplicateUserDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDuplicateUserDialog({ isOpen: false, type: null, userData: null });
            }
          }}
        >
          <DialogContent className="backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
            <DialogHeader>
              <DialogTitle>Existing User Found</DialogTitle>
              <DialogDescription>
                A {duplicateUserDialog.type} with this email/phone already exists.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDuplicateUserDialog({ isOpen: false, type: null, userData: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGoToProfile}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white"
              >
                View {duplicateUserDialog.type === 'enquiry' ? 'Enquiry' : 'Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
