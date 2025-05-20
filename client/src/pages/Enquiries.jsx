import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { toast } from "../hooks/use-toast";

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

export default function Enquiries() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewEnquiry, setViewEnquiry] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [filterVisaType, setFilterVisaType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
  } = useForm();

  // Fetch enquiries
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/enquiries"],
    refetchOnWindowFocus: false,
  });

  console.log("Server response:", response);
  const enquiries = response?.data || [];
  console.log("Processed enquiries:", enquiries);

  // Create enquiry mutation

  const createEnquiryMutation = useMutation({
    mutationFn: async (data) =>
      await apiRequest("POST", "/api/enquiries", data),
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
        description:
          error?.response?.data?.message ||
          "Failed to create enquiry. Please try again.",
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

  // Filtered enquiries (memoized for performance)
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      const matchesName =
        !searchName ||
        enquiry.fullName?.toLowerCase().includes(searchName.toLowerCase());
      const matchesVisaType =
        !filterVisaType || enquiry.visaType === filterVisaType;
      const matchesStatus =
        !filterStatus || enquiry.enquiryStatus === filterStatus;
      return matchesName && matchesVisaType && matchesStatus;
    });
  }, [enquiries, searchName, filterVisaType, filterStatus]);

  // Handle form submission
  const onSubmit = (data) => {
    // Log the data being sent
    console.log("Form data being submitted:", data);
    // Send all form fields to the backend
    createEnquiryMutation.mutate(data);
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

  return (
    <div className="container mx-auto p-4 mt-24">
      <h1 className="text-3xl font-bold mb-8">Visa Enquiries Management</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          type="search"
          placeholder="Enter Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-64 rounded-3xl  border-gray-300"
        />

        <select
          value={filterVisaType}
          onChange={(e) => setFilterVisaType(e.target.value)}
          className="border rounded-3xl border-gray-300 px-2 py-1"
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

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-3xl border-gray-300 px-2 py-1"
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Enquiry List</TabsTrigger>
          <TabsTrigger value="create">New Enquiry</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Enquiries</CardTitle>
              <CardDescription>
                View and manage all visa enquiries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  Loading enquiries...
                </div>
              ) : filteredEnquiries && filteredEnquiries.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Visa Type</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned to</TableHead>
                        <TableHead>Travel Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnquiries.map((enquiry) => (
                        <TableRow key={enquiry._id}>
                          <TableCell
                            className="font-medium cursor-pointer text-blue-700 underline"
                            onClick={() => setViewEnquiry(enquiry)}
                          >
                            {enquiry.fullName}
                          </TableCell>
                          <TableCell>{enquiry.nationality}</TableCell>
                          <TableCell>{enquiry.visaType}</TableCell>
                          <TableCell>{enquiry.destinationCountry}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                enquiry.enquiryStatus === "New"
                                  ? "bg-blue-100 text-blue-800"
                                  : enquiry.enquiryStatus === "Contacted"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : enquiry.enquiryStatus === "Qualified"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {enquiry.enquiryStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            {enquiry.assignedConsultant || "-"}
                          </TableCell>
                          <TableCell>
                            {enquiry.intendedTravelDate
                              ? new Date(
                                  enquiry.intendedTravelDate
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(enquiry)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(enquiry._id)}
                              >
                                Delete
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
                  <p className="text-gray-500">
                    No enquiries found. Create your first enquiry!
                  </p>
                  <Button
                    className="mt-4 bg-blue-600"
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
          <Card>
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
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        {...register("fullName", {
                          required: "Full name is required",
                        })}
                        placeholder="Enter full name"
                        className={errors.fullName ? "border-red-500" : ""}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

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
                        })}
                        placeholder="example@example.com"
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        {...register("phone", {
                          required: "Phone number is required",
                        })}
                        placeholder="+1 234 567 8900"
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alternatePhone">
                        Alternate Contact Number
                      </Label>
                      <Input
                        id="alternatePhone"
                        {...register("alternatePhone")}
                        placeholder="+1 234 567 8900 (optional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality *</Label>
                      <Input
                        id="nationality"
                        {...register("nationality", {
                          required: "Nationality is required",
                        })}
                        placeholder="Enter nationality"
                        className={errors.nationality ? "border-red-500" : ""}
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
                          errors.currentCountry ? "border-red-500" : ""
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
                        <SelectTrigger id="preferredContactMethod">
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
                        render={({ field }) => (
                          <Select
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue="Tourist"
                          >
                            <SelectTrigger id="visaType">
                              <SelectValue placeholder="Select visa type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Tourist">Tourist</SelectItem>
                              <SelectItem value="Student">Student</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Business">Business</SelectItem>
                              <SelectItem value="PR">
                                Permanent Resident
                              </SelectItem>
                              <SelectItem value="Dependent">
                                Dependent
                              </SelectItem>
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
                        render={({ field }) => (
                          <Select
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue="USA"
                          >
                            <SelectTrigger id="destinationCountry">
                              <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USA">USA</SelectItem>
                              <SelectItem value="Canada">Canada</SelectItem>
                              <SelectItem value="UK">UK</SelectItem>
                              <SelectItem value="Australia">
                                Australia
                              </SelectItem>
                              <SelectItem value="New Zealand">
                                New Zealand
                              </SelectItem>
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="durationOfStay">Duration of Stay</Label>
                      <Input
                        id="durationOfStay"
                        {...register("durationOfStay")}
                        placeholder="e.g., 3 months, 2 years"
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
                        <SelectTrigger id="previousVisaApplications">
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
                        <SelectTrigger id="visaUrgency">
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
                        {...register("passportNumber")}
                        placeholder="Enter passport number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passportExpiryDate">
                        Passport Expiry Date
                      </Label>
                      <Input
                        id="passportExpiryDate"
                        type="date"
                        {...register("passportExpiryDate")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...register("dateOfBirth")}
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
                        <SelectTrigger id="maritalStatus">
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        {...register("occupation")}
                        placeholder="Enter current occupation"
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
                        <SelectTrigger id="educationLevel">
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
                        <SelectTrigger id="enquirySource">
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referredBy">Referred By</Label>
                      <Input
                        id="referredBy"
                        {...register("referredBy")}
                        placeholder="Enter referrer name"
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
                        <SelectTrigger id="enquiryStatus">
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="followUpDate">Follow-Up Date</Label>
                      <Input
                        id="followUpDate"
                        type="date"
                        {...register("followUpDate")}
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
                        <SelectTrigger id="priorityLevel">
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
                      <Label htmlFor="branch">Branch/Office</Label>
                      <Select
                        onValueChange={(value) => setValue("branch", value)}
                        defaultValue="Main Office"
                      >
                        <SelectTrigger id="branch">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Abu Dhabi">
                            Abu Dhabi
                          </SelectItem>
                          <SelectItem value="New York">
                            New York
                          </SelectItem>
                          {/* <SelectItem value="South Branch">
                            South Branch
                          </SelectItem>
                          <SelectItem value="East Branch">
                            East Branch
                          </SelectItem>
                          <SelectItem value="West Branch">
                            West Branch
                          </SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="notes">Notes/Comments</Label>
                      <Textarea
                        id="notes"
                        {...register("notes")}
                        placeholder="Enter any additional notes or special requirements"
                        rows={4}
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Enquiry</DialogTitle>
              <DialogDescription>
                Update the enquiry details for {selectedEnquiry.fullName}
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
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Enquiry Details</DialogTitle>
              <DialogDescription>
                All details for {viewEnquiry.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-h-[70vh]  overflow-y-auto py-2">
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
              <Button onClick={() => setViewEnquiry(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
