import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./ui/use-toast.js";
import { Eye, Edit, RefreshCw, CheckCircle, Trash2, Search, Plus, Mail, Phone, Calendar, Filter } from "lucide-react";
import { convertEnquiry } from "../lib/api";
import axios from "axios";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const Enquiries = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    setError,
    clearErrors,
    watch,
  } = useForm();

  const createEnquiryMutation = useMutation({
    mutationFn: async (data) => {
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

  const onSubmit = async (data) => {
    try {
      await createEnquiryMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating enquiry:', error);
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

  const handleDuplicateCheck = async (fieldName, value) => {
    if (!value) return;
    try {
      const payload = {};
      if (fieldName === 'email') {
        payload.email = value;
        payload.phone = watch('phone') || '';
      } else {
        payload.phone = value;
        payload.email = watch('email') || '';
      }
      const response = await axios.post('/api/enquiries/check-duplicate-user', payload);
      if (response.data.exists) {
        setError(fieldName, {
          type: "manual",
          message: `A ${response.data.type} with this ${fieldName} already exists.`
        });
      } else {
        clearErrors(fieldName);
      }
    } catch (error) {
      // Optionally handle error
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-full px-4 py-2 shadow-lg">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text" 
            placeholder="Search enquiries..." 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-40 text-gray-600 dark:text-gray-300 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-4">
          <Select
            value={filterVisaType}
            onValueChange={setFilterVisaType}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by visa type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visa Types</SelectItem>
              <SelectItem value="student">Student Visa</SelectItem>
              <SelectItem value="work">Work Visa</SelectItem>
              <SelectItem value="tourist">Tourist Visa</SelectItem>
              <SelectItem value="business">Business Visa</SelectItem>
              <SelectItem value="family">Family Visa</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="relative p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visa Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Consultant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Source</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Table rows will be populated by the parent component */}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Enquiry Form */}
      <div className="group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="relative p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Form sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="space-y-4">
                <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        // pattern: {
                        //   value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        //   message: "Invalid email address"
                        // }
                      })}
                      onChange={e => {
                        clearErrors("email");
                        handleDuplicateCheck('email', e.target.value);
                      }}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      {...register("phone", {
                        required: "Phone number is required",
                        // pattern: {
                        //   value: /^\+?[1-9]\d{1,14}$/,
                        //   message: "Invalid phone number"
                        // }
                      })}
                      onChange={e => {
                        clearErrors("phone");
                        handleDuplicateCheck('phone', e.target.value);
                      }}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register("firstName", { required: "First name is required" })}
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register("lastName", { required: "Last name is required" })}
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                  
                </div>
              </div>

              {/* Visa Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Visa Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="visaType">Visa Type *</Label>
                    <Select
                      onValueChange={(value) => setValue("visaType", value)}
                      defaultValue=""
                    >
                      <SelectTrigger className={errors.visaType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select visa type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student Visa</SelectItem>
                        <SelectItem value="work">Work Visa</SelectItem>
                        <SelectItem value="tourist">Tourist Visa</SelectItem>
                        <SelectItem value="business">Business Visa</SelectItem>
                        <SelectItem value="family">Family Visa</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.visaType && (
                      <p className="text-red-500 text-sm mt-1">{errors.visaType.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination Country *</Label>
                    <Input
                      id="destination"
                      {...register("destination", { required: "Destination country is required" })}
                      className={errors.destination ? "border-red-500" : ""}
                    />
                    {errors.destination && (
                      <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="branch">Branch *</Label>
                    <Select
                      onValueChange={(value) => setValue("branch", value)}
                      defaultValue=""
                    >
                      <SelectTrigger className={errors.branch ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Branch options will be populated by the parent component */}
                      </SelectContent>
                    </Select>
                    {errors.branch && (
                      <p className="text-red-500 text-sm mt-1">{errors.branch.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      {...register("source")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Add any additional notes here..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
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

      {/* Edit Dialog */}
      {selectedEnquiry && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[60%] h-[90%] backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/30 rounded-xl shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Enquiry</DialogTitle>
              <DialogDescription>
                Update the enquiry details for {selectedEnquiry.firstName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleUpdate)} className="space-y-6">
              {/* Form fields will be populated with selectedEnquiry data */}
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
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
    </div>
  );
};

export default Enquiries;