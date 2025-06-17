import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../components/ui/use-toast.js";
import { Eye, Edit, RefreshCw, CheckCircle, Trash2 } from "lucide-react";
import { Search, ArrowRight } from "lucide-react";
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
import EditEnquiryForm from "./EditEnquiryForm"; // adjust path if needed
import { useBranch } from '../contexts/BranchContext';
import { useUser } from '../context/UserContext';

export default function Enquiries() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
    type: null, // 'enquiry' or 'client'
    userData: null
  });

  // Add state for auto-fill data
  const [autoFillData, setAutoFillData] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
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

  // Add query for fetching branches
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ["/api/branches"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/branches");
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      const data = await response.json();
      return data;
    },
  });

  console.log("Server response:", enquiriesData);
  const enquiries = enquiriesData?.data || [];
  console.log("Processed enquiries:", enquiries);

  // Create enquiry mutation

  const createEnquiryMutation = useMutation({
    mutationFn: async (data) => {
      // Ensure branch is selected
      if (!data.branch) {
        throw new Error('Please select a branch');
      }
      return await apiRequest("POST", "/api/enquiries", data);
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
      console.error("Error creating enquiry:", error);
    },
  });

  // Update enquiry mutation
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
      console.error("Error updating enquiry:", error);
    },
  });

  // Delete enquiry mutation
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
      console.error("Error deleting enquiry:", error);
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

  // Add effect to handle auto-fill when data is available
  useEffect(() => {
    if (autoFillData) {
      Object.keys(autoFillData).forEach((key) => {
        setValue(key, autoFillData[key]);
      });
      setActiveTab("create");
    }
  }, [autoFillData, setValue]);

  // Add useEffect to set default branch for non-admin users
  useEffect(() => {
    if (!isAdmin && user?.branch) {
      setValue('branch', user.branch);
    }
  }, [isAdmin, user?.branch, setValue]);

  // Filtered enquiries (memoized for performance)
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

  // Add function to handle email/phone field blur
  const handleFieldBlur = async (fieldName, value) => {
    if (!value) return; // Don't check if field is empty

    console.log(`Checking for duplicate ${fieldName}:`, value);

    try {
      // Show loading toast
      toast({
        title: "Checking...",
        description: "Checking for existing user...",
      });

      // Prepare the request data
      let requestData = {
        email: fieldName === 'email' ? value : '',
        phone: fieldName === 'phone' ? value : ''
      };

      // If checking phone, also check without +91 prefix
      if (fieldName === 'phone') {
        // Remove +91 if present
        const phoneWithoutPrefix = value.replace(/^\+91/, '');
        // Add +91 if not present
        const phoneWithPrefix = value.startsWith('+91') ? value : `+91${value}`;
        
        // Check both formats
        const response1 = await apiRequest("POST", "/api/enquiries/check-duplicate-user", {
          email: '',
          phone: phoneWithoutPrefix
        });

        const response2 = await apiRequest("POST", "/api/enquiries/check-duplicate-user", {
          email: '',
          phone: phoneWithPrefix
        });

        // Parse responses
        let data1 = response1 instanceof Response ? await response1.json() : response1;
        let data2 = response2 instanceof Response ? await response2.json() : response2;

        console.log('Phone check responses:', { data1, data2 });

        // If either check finds a duplicate, show the dialog
        if (data1?.exists || data2?.exists) {
          const duplicateData = data1?.exists ? data1 : data2;
          console.log('Duplicate found:', duplicateData);
          setDuplicateUserDialog({
            isOpen: true,
            type: duplicateData.type,
            userData: duplicateData.userData
          });
          return;
        }
      } else {
        // For email, proceed with normal check
        const response = await apiRequest("POST", "/api/enquiries/check-duplicate-user", requestData);
        
        // Parse the response
        let data = response instanceof Response ? await response.json() : response;
        console.log('Parsed API Response:', data);

        if (data?.exists) {
          console.log('Duplicate found:', data);
          setDuplicateUserDialog({
            isOpen: true,
            type: data.type,
            userData: data.userData
          });
          return;
        }
      }

      // If no duplicate found
      console.log('No duplicate found');
      setDuplicateUserDialog({
        isOpen: false,
        type: null,
        userData: null
      });

    } catch (error) {
      console.error("Error checking duplicate user:", error);
      toast({
        title: "Error",
        description: "Failed to check for duplicate user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Modify the form submission to check for duplicates first
  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    const isDuplicate = await checkDuplicateUser(data.email, data.phone);
    console.log('Is duplicate:', isDuplicate);
    if (!isDuplicate) {
      createEnquiryMutation.mutate(data);
    }
  };

  // Update checkDuplicateUser function to handle phone numbers similarly
  const checkDuplicateUser = async (email, phone) => {
    try {
      let response;
      
      if (phone) {
        // Remove +91 if present
        const phoneWithoutPrefix = phone.replace(/^\+91/, '');
        // Add +91 if not present
        const phoneWithPrefix = phone.startsWith('+91') ? phone : `+91${phone}`;
        
        // Check both formats
        const response1 = await apiRequest("POST", "/api/enquiries/check-duplicate-user", {
          email,
          phone: phoneWithoutPrefix
        });

        const response2 = await apiRequest("POST", "/api/enquiries/check-duplicate-user", {
          email,
          phone: phoneWithPrefix
        });

        // Parse responses
        let data1 = response1 instanceof Response ? await response1.json() : response1;
        let data2 = response2 instanceof Response ? await response2.json() : response2;

        // If either check finds a duplicate, show the dialog
        if (data1?.exists || data2?.exists) {
          const duplicateData = data1?.exists ? data1 : data2;
          setDuplicateUserDialog({
            isOpen: true,
            type: duplicateData.type,
            userData: duplicateData.userData
          });
          return true;
        }
      } else {
        response = await apiRequest("POST", "/api/enquiries/check-duplicate-user", {
          email,
          phone: ''
        });
        
        let data = response instanceof Response ? await response.json() : response;
        
        if (data?.exists) {
          setDuplicateUserDialog({
            isOpen: true,
            type: data.type,
            userData: data.userData
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking duplicate user:", error);
      toast({
        title: "Error",
        description: "Failed to check for duplicate user. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle edit enquiry
  const handleEdit = (enquiry) => {
    setSelectedEnquiry(enquiry);
    // Populate the form with existing data
    Object.keys(enquiry).forEach((key) => {
      setValue(key, enquiry[key]);
    });
    setIsDialogOpen(true);
  };

  // Handle update enquiry
  const handleUpdate = (data) => {
    if (selectedEnquiry && selectedEnquiry._id) {
      updateEnquiryMutation.mutate({ id: selectedEnquiry._id, data });
    }
  };

  // Handle delete enquiry
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      deleteEnquiryMutation.mutate(id);
    }
  };

  const handleEnquiryClick = (enquiry) => {
    setSelectedEnquiryId(enquiry._id);
  };

  const handleCloseProfile = () => {
    setSelectedEnquiryId(null);
  };

  // Modify handleGoToProfile to handle auto-fill
  const handleGoToProfile = () => {
    const { type, userData } = duplicateUserDialog;
    if (type === 'enquiry') {
      setSelectedEnquiryId(userData._id);
    } else if (type === 'client') {
      setLocation(`/clients/${userData._id}`);
    }
    setDuplicateUserDialog({ isOpen: false, type: null, userData: null });
  };

  // Add function to handle creating new enquiry from profile
  const handleCreateNewEnquiry = (profileData) => {
    setAutoFillData(profileData);
  };

  return (
    <div className="container p-4 backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
      {selectedEnquiryId ? (
        <EnquiryProfile 
          enquiryId={selectedEnquiryId} 
          onClose={handleCloseProfile}
          onCreateNewEnquiry={handleCreateNewEnquiry}
        />
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">

          </div>

          <div className="flex flex-wrap backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg justify-between items-center gap-4 mb-4">
            <div className="flex flex-wrap backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg items-center gap-4">
              {/* Search Input */}
              <div className="relative w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="search"
                  placeholder="Search Enquires"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Visa Type Filter */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </span>
                <select
                  value={filterVisaType}
                  onChange={(e) => setFilterVisaType(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none bg-white"
                >
                  <option value="">All Visa Types</option>
                  <option value="Tourist">Tourist</option>
                  <option value="Student">Student</option>
                  <option value="Work">Work</option>
                  <option value="Business">Business</option>
                  <option value="PR">Permanent Resident</option>
                  <option value="Dependent">Dependent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md appearance-none bg-white dark:bg-gray-700 w-40 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Processing">Processing</option>
                  <option value="Closed">Closed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>

            {/* New Enquiry Button */}
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => setActiveTab("create")}
            >
              + New Enquiry
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            {/* <TabsList className="mb-4">
              <TabsTrigger value="list">Enquiry List</TabsTrigger>
              <TabsTrigger value="create">New Enquiry</TabsTrigger>
            </TabsList> */}

            <TabsContent value="list">
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">All Enquiries</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    View and manage all visa enquiries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
                      Loading enquiries...
                    </div>
                  ) : filteredEnquiries && filteredEnquiries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-transparent">
                          <TableRow>
                            <TableHead className="text-gray-900 dark:text-white">Enquirer Name</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Visa Type</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Assigned Consultant</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Source</TableHead>
                            <TableHead className="text-center text-gray-900 dark:text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEnquiries.map((enquiry) => (
                            <TableRow 
                              key={enquiry._id}
                              className="cursor-pointer hover:bg-transparent dark:hover:bg-transparent bg-transparent"
                              onClick={() => handleEnquiryClick(enquiry)}
                            >
                              <TableCell className="text-gray-900 dark:text-white bg-transparent">
                                {enquiry.firstName} {enquiry.lastName}
                              </TableCell>
                              <TableCell className="text-gray-900 dark:text-white bg-transparent">{enquiry.visaType}</TableCell>
                              <TableCell className="text-gray-900 dark:text-white bg-transparent">{enquiry.assignedConsultant}</TableCell>
                              <TableCell className="bg-transparent">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    enquiry.enquiryStatus === "New"
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                      : enquiry.enquiryStatus === "In Progress"
                                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                      : enquiry.enquiryStatus === "Closed"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {enquiry.enquiryStatus}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-900 dark:text-white bg-transparent">
                                {enquiry.source || "-"}
                              </TableCell>
                              <TableCell className="bg-transparent">
                                <div className="flex space-x-2 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewEnquiry(enquiry);
                                    }}
                                    title="View Details"
                                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      convertEnquiryMutation.mutate(enquiry._id);
                                    }}
                                    className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                  >
                                    Convert
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(enquiry);
                                    }}
                                    title="Edit"
                                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(enquiry._id);
                                    }}
                                    title="Delete"
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No enquiries found. Create your first enquiry!
                      </p>
                      <Button
                        className="mt-4 bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
                        onClick={() => setActiveTab("create")}
                      >
                        Create Enquiry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create">
              <Card className="bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle>Create New Enquiry</CardTitle>
                  <CardDescription>
                    Add a new visa enquiry to the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* 1. Enquirer Information */}
                    <div className="border-none p-4 rounded-md mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        1. Enquirer Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                      <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            {...register("email", {
                              required: "Email is required",
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address",
                              },
                              onBlur: (e) => handleFieldBlur('email', e.target.value)
                            })}
                            placeholder="example@example.com"
                            className={errors.email ? "border-red-500" : "bg-transparent"}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <div className="flex gap-2">
                            <Input
                              id="countryCode"
                              value={selectedBranch?.countryCode || '+91'}
                              disabled
                              className="w-24 bg-gray-100"
                            />
                            <Input
                              id="phone"
                              {...register("phone", {
                                required: "Phone number is required",
                                onChange: (e) => {
                                  // Remove any existing country code
                                  let phoneNumber = e.target.value;
                                  const countryCode = selectedBranch?.countryCode || '+91';
                                  
                                  // Remove the country code if it exists at the start
                                  if (phoneNumber.startsWith(countryCode)) {
                                    phoneNumber = phoneNumber.slice(countryCode.length);
                                  }
                                  
                                  // Remove any other country code that might be present
                                  phoneNumber = phoneNumber.replace(/^\+\d+/, '');
                                  
                                  // Set the value with the branch's country code
                                  e.target.value = `${countryCode}${phoneNumber}`;
                                }
                              })}
                              placeholder="Enter phone number"
                              className={errors.phone ? "border-red-500" : "bg-transparent"}
                              onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-red-500 text-sm">
                              {errors.phone.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            {...register("firstName", {
                              required: "First name is required",
                            })}
                            placeholder="Enter first name"
                            className={errors.firstName ? "border-red-500" : "bg-transparent"}
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            {...register("lastName", {
                              required: "Last name is required",
                            })}
                            placeholder="Enter last name"
                            className={errors.lastName ? "border-red-500" : "bg-transparent"}
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-sm">{errors.lastName.message}</p>
                          )}
                        </div>



                        <div className="space-y-2">
                          <Label htmlFor="alternatePhone">
                            Alternate Contact Number
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="alternateCountryCode"
                              value={selectedBranch?.countryCode || '+91'}
                              disabled
                              className="w-24 bg-gray-100"
                            />
                            <Input
                              id="alternatePhone"
                              {...register("alternatePhone", {
                                onChange: (e) => {
                                  // Remove any existing country code
                                  let phoneNumber = e.target.value;
                                  const countryCode = selectedBranch?.countryCode || '+91';
                                  
                                  // Remove the country code if it exists at the start
                                  if (phoneNumber.startsWith(countryCode)) {
                                    phoneNumber = phoneNumber.slice(countryCode.length);
                                  }
                                  
                                  // Remove any other country code that might be present
                                  phoneNumber = phoneNumber.replace(/^\+\d+/, '');
                                  
                                  // Set the value with the branch's country code
                                  e.target.value = `${countryCode}${phoneNumber}`;
                                }
                              })}
                              placeholder="Enter alternate phone number"
                              className="bg-transparent"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nationality">Nationality *</Label>
                          <Input
                            id="nationality"
                            {...register("nationality", {
                              required: "Nationality is required",
                            })}
                            placeholder="Enter nationality"
                            className={errors.nationality ? "border-red-500" : "bg-transparent"}
                          />
                          {errors.nationality && (
                            <p className="text-red-500 text-sm">
                              {errors.nationality.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currentCountry">
                            Current Country of Residence *
                          </Label>
                          <Input
                            id="currentCountry"
                            {...register("currentCountry", {
                              required: "Current country is required",
                            })}
                            placeholder="Enter current country"
                            className={
                              errors.currentCountry ? "border-red-500" : "bg-transparent"
                            }
                          />
                          {errors.currentCountry && (
                            <p className="text-red-500 text-sm">
                              {errors.currentCountry.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preferredContactMethod">
                            Preferred Contact Method
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("preferredContactMethod", value)
                            }
                            defaultValue="Email"
                          >
                            <SelectTrigger id="preferredContactMethod" className="bg-transparent">
                              <SelectValue placeholder="Select contact method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="Phone">Phone</SelectItem>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="SMS">SMS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preferredContactTime">
                            Preferred Contact Time
                          </Label>
                          <Input
                            id="preferredContactTime"
                            {...register("preferredContactTime")}
                            placeholder="e.g., Morning, Afternoon, Evening"
                            className="bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Visa Enquiry Details */}
                    <div className="border-none p-4 rounded-md mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        2. Visa Enquiry Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="visaType">Visa Type *</Label>
                          <Controller
                            name="visaType"
                            control={control}
                            defaultValue="Tourist"
                            rules={{ required: "Visa type is required" }}
                            render={({ field: { onChange, value, ref, ...field } }) => (
                              <Select
                                onValueChange={onChange}
                                value={value}
                                defaultValue="Tourist"
                              >
                                <SelectTrigger id="visaType" className="bg-transparent">
                                  <SelectValue placeholder="Select visa type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Tourist">Tourist</SelectItem>
                                  <SelectItem value="Student">Student</SelectItem>
                                  <SelectItem value="Work">Work</SelectItem>
                                  <SelectItem value="Business">Business</SelectItem>
                                  <SelectItem value="PR">Permanent Resident</SelectItem>
                                  <SelectItem value="Dependent">Dependent</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.visaType && (
                            <p className="text-red-500 text-sm">
                              {errors.visaType.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="destinationCountry">
                            Destination Country *
                          </Label>
                          <Controller
                            name="destinationCountry"
                            control={control}
                            defaultValue="USA"
                            rules={{ required: "Destination country is required" }}
                            render={({ field: { onChange, value, ref, ...field } }) => (
                              <Select
                                onValueChange={onChange}
                                value={value}
                                defaultValue="USA"
                              >
                                <SelectTrigger id="destinationCountry" className="bg-transparent">
                                  <SelectValue placeholder="Select destination" />
                                </SelectTrigger>
                                <SelectContent>
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
                            )}
                          />
                          {errors.destinationCountry && (
                            <p className="text-red-500 text-sm">
                              {errors.destinationCountry.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purposeOfTravel">Purpose of Travel</Label>
                          <Input
                            id="purposeOfTravel"
                            {...register("purposeOfTravel")}
                            placeholder="e.g., Tourism, Study, Family Visit"
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="intendedTravelDate">
                            Intended Travel Date
                          </Label>
                          <Input
                            id="intendedTravelDate"
                            type="date"
                            {...register("intendedTravelDate")}
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="durationOfStay">Duration of Stay</Label>
                          <Input
                            id="durationOfStay"
                            {...register("durationOfStay")}
                            placeholder="e.g., 3 months, 2 years"
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="previousVisaApplications">
                            Previous Visa Applications
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("previousVisaApplications", value)
                            }
                            defaultValue="No"
                          >
                            <SelectTrigger id="previousVisaApplications" className="bg-transparent">
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="visaUrgency">Visa Urgency</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("visaUrgency", value)
                            }
                            defaultValue="Normal"
                          >
                            <SelectTrigger id="visaUrgency" className="bg-transparent">
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Normal">Normal</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                              <SelectItem value="Express">Express</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* 3. Additional Applicant Details */}
                    <div className="border-none p-4 rounded-md mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        3. Additional Applicant Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="passportNumber">Passport Number</Label>
                          <Input
                            id="passportNumber"
                            {...register("passportNumber", {
                              required: "Passport number is required",
                            })}
                            placeholder="Enter passport number"
                            className={errors.passportNumber ? "border-red-500" : "bg-transparent"}
                          />
                          {errors.passportNumber && (
                            <p className="text-red-500 text-sm">
                              {errors.passportNumber.message}
                            </p>
                          )}

                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="passportExpiryDate">
                            Passport Expiry Date
                          </Label>
                          <Input
                            id="passportExpiryDate"
                            type="date"
                            {...register("passportExpiryDate")}
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            {...register("dateOfBirth", { required: "Date of Birth is required" })}
                            className="bg-transparent"
                          />

                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maritalStatus">Marital Status</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("maritalStatus", value)
                            }
                            defaultValue="Single"
                          >
                            <SelectTrigger id="maritalStatus" className="bg-transparent">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Married">Married</SelectItem>
                              <SelectItem value="Divorced">Divorced</SelectItem>
                              <SelectItem value="Widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="numberOfApplicants">
                            Number of Applicants
                          </Label>
                          <Input
                            id="numberOfApplicants"
                            type="number"
                            {...register("numberOfApplicants")}
                            placeholder="e.g., 1, 2, 3"
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="occupation">Occupation</Label>
                          <Input
                            id="occupation"
                            {...register("occupation")}
                            placeholder="Enter current occupation"
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="educationLevel">Education Level</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("educationLevel", value)
                            }
                            defaultValue="Bachelor's"
                          >
                            <SelectTrigger id="educationLevel" className="bg-transparent">
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High School">
                                High School
                              </SelectItem>
                              <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                              <SelectItem value="Master's">Master's</SelectItem>
                              <SelectItem value="PhD">PhD</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* 4. Source and Marketing Information */}
                    <div className="border-none p-4 rounded-md mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        4. Source and Marketing Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="enquirySource">Enquiry Source</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("enquirySource", value)
                            }
                            defaultValue="Website"
                          >
                            <SelectTrigger id="enquirySource" className="bg-transparent">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Social Media">
                                Social Media
                              </SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Walk-in">Walk-in</SelectItem>
                              <SelectItem value="Advertisement">
                                Advertisement
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="campaignName">Campaign Name</Label>
                          <Input
                            id="campaignName"
                            {...register("campaignName")}
                            placeholder="Enter campaign name"
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="referredBy">Referred By</Label>
                          <Input
                            id="referredBy"
                            {...register("referredBy")}
                            placeholder="Enter referrer name"
                            className="bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. Internal Tracking and Assignment */}
                    <div className="border-none p-4 rounded-md mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        5. Internal Tracking and Assignment
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="enquiryStatus">Enquiry Status</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("enquiryStatus", value)
                            }
                            defaultValue="New"
                          >
                            <SelectTrigger id="enquiryStatus" className="bg-transparent">
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

                        <div className="space-y-2">
                          <Label htmlFor="assignedConsultant">
                            Assigned Consultant
                          </Label>
                          <Input
                            id="assignedConsultant"
                            {...register("assignedConsultant")}
                            placeholder="Enter consultant name"
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="followUpDate">Follow-Up Date</Label>
                          <Input
                            id="followUpDate"
                            type="date"
                            {...register("followUpDate")}
                            className="bg-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priorityLevel">Priority Level</Label>
                          <Select
                            onValueChange={(value) =>
                              setValue("priorityLevel", value)
                            }
                            defaultValue="Medium"
                          >
                            <SelectTrigger id="priorityLevel" className="bg-transparent">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>


                        <div className="space-y-2">
                          <Label htmlFor="branch">Branch/Office *</Label>
                          {isAdmin ? (
                            <Select
                              onValueChange={(value) => setValue("branch", value)}
                              defaultValue={user?.branch || "default"}
                            >
                              <SelectTrigger id="branch" className={errors.branch ? "border-red-500" : "bg-transparent"}>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                              <SelectContent>
                                {branchesLoading ? (
                                  <SelectItem value="loading">Loading branches...</SelectItem>
                                ) : branchesData?.length > 0 ? (
                                  branchesData.map((branch) => (
                                    <SelectItem key={branch._id} value={branch.branchName || "default"}>
                                      {branch.branchName} - {branch.branchLocation}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no_branches">No branches found</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="branch"
                              value={user?.branch || ''}
                              disabled
                              className="bg-gray-100 dark:bg-gray-700"
                            />
                          )}
                          {errors.branch && (
                            <p className="text-red-500 text-sm mt-1">Please select a branch</p>
                          )}
                        </div>

                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="notes">Notes/Comments</Label>
                          <Textarea
                            id="notes"
                            {...register("notes")}
                            placeholder="Enter any additional notes or special requirements"
                            rows={4}
                            className="bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

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
                        className="bg-blue-600"
                        type="submit"
                        disabled={createEnquiryMutation.isPending}
                      >
                        {createEnquiryMutation.isPending
                          ? "Submitting..."
                          : "Submit Enquiry"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Enquiry Dialog */}
          {selectedEnquiry && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-[60%] h-[90%] backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
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

          {/* View Enquiry Details Dialog */}
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
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await apiRequest("POST", "/api/clients", {
                          firstName: viewEnquiry.firstName?.split(" ")[0] || "",
                          lastName: viewEnquiry.lastName
                            ? viewEnquiry.lastName.split(" ").slice(1).join(" ")
                            : "",
                          email: viewEnquiry.email || "",
                          phone: viewEnquiry.phone || "",
                          passportNumber: viewEnquiry.passportNumber || "",
                          dateOfBirth: viewEnquiry.dateOfBirth || null,
                          nationality: viewEnquiry.nationality || "",
                          visaType: viewEnquiry.visaType,
                          assignedConsultant: viewEnquiry.assignedConsultant,
                          notes: viewEnquiry.notes || "",
                          status: "Active",
                          // removed profileImage
                        });

                        queryClient.invalidateQueries({
                          queryKey: ["/api/clients"],
                        });
                        toast({
                          title: "Success",
                          description: "Enquiry sent to Clients section.",
                        });
                        setViewEnquiry(null);
                      } catch (error) {
                        toast({
                          title: "Error",
                          description:
                            error?.message || "Failed to send to Clients section.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Send to Client Section
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Add Duplicate User Dialog */}
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
                <DialogTitle>User Already Exists</DialogTitle>
                <DialogDescription>
                  A user with this {duplicateUserDialog.type === 'enquiry' ? 'enquiry' : 'client'} already exists in the system.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-500">
                  Name: {duplicateUserDialog.userData?.firstName} {duplicateUserDialog.userData?.lastName}<br />
                  Email: {duplicateUserDialog.userData?.email}<br />
                  Phone: {duplicateUserDialog.userData?.phone}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDuplicateUserDialog({ isOpen: false, type: null, userData: null })}
                >
                  Cancel
                </Button>
                <Button onClick={handleGoToProfile}>
                  Go to Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
