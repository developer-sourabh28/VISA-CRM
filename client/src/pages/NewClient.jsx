import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { createClient } from '../lib/api.js';
import { useToast } from '../hooks/use-toast';

function NewClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    passportNumber: '',
    dateOfBirth: '',
    nationality: '',
    profileImage: '',
    assignedConsultant: '',
    visaType: '',
    visaStatus: {
      notes: '',
      status: 'Active'
    },
    notes: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      return await createClient(data);
    },
    onSuccess: (response) => {
      toast({
        title: "Client Created",
        description: "New client has been successfully created.",
      });
      setLocation('/clients');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client. Please try again.",
        variant: "destructive"
      });
    }
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.passportNumber.trim()) newErrors.passportNumber = "Passport number is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required";
    if (!formData.visaType) newErrors.visaType = "Visa type is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } 
    // Handle nested visaStatus fields
    else if (name.startsWith('visaStatus.')) {
      const statusField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        visaStatus: {
          ...prev.visaStatus,
          [statusField]: value
        }
      }));
    }
    // Handle regular fields
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      mutate(formData);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/clients" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft size={16} className="mr-1" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">New Client</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Profile Image */}
                <div>
                  <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image URL
                  </label>
                  <input
                    type="text"
                    id="profileImage"
                    name="profileImage"
                    value={formData.profileImage}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Address Information</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Street */}
                <div>
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* State/Province */}
                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="address.state"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Postal Code */}
                  <div>
                    <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="address.postalCode"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Country */}
                  <div>
                    <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      id="address.country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visa Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Visa Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visa Type */}
                <div>
                  <label htmlFor="visaType" className="block text-sm font-medium text-gray-700 mb-1">
                    Visa Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="visaType"
                    name="visaType"
                    value={formData.visaType}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.visaType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Visa Type</option>
                    <option value="Tourist">Tourist Visa</option>
                    <option value="Work">Work Visa</option>
                    <option value="Student">Student Visa</option>
                    <option value="Transit">Transit Visa</option>
                    <option value="Business">Business Visa</option>
                    <option value="PR">Permanent Resident Visa</option>
                    <option value="Dependent">Dependent Visa</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.visaType && (
                    <p className="mt-1 text-sm text-red-500">{errors.visaType}</p>
                  )}
                </div>
                
                {/* Visa Status */}
                <div>
                  <label htmlFor="visaStatus.status" className="block text-sm font-medium text-gray-700 mb-1">
                    Visa Status
                  </label>
                  <select
                    id="visaStatus.status"
                    name="visaStatus.status"
                    value={formData.visaStatus.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nationality */}
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.nationality ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.nationality && (
                    <p className="mt-1 text-sm text-red-500">{errors.nationality}</p>
                  )}
                </div>

                {/* Passport Number */}
                <div>
                  <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Passport Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="passportNumber"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.passportNumber ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.passportNumber && (
                    <p className="mt-1 text-sm text-red-500">{errors.passportNumber}</p>
                  )}
                </div>
              </div>
              
              {/* Visa Status Notes */}
              <div>
                <label htmlFor="visaStatus.notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Visa Status Notes
                </label>
                <textarea
                  id="visaStatus.notes"
                  name="visaStatus.notes"
                  value={formData.visaStatus.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Additional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Client Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Assigned Consultant */}
                <div>
                  <label htmlFor="assignedConsultant" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Consultant
                  </label>
                  <select
                    id="assignedConsultant"
                    name="assignedConsultant"
                    value={formData.assignedConsultant}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Consultant</option>
                    <option value="John Smith">John Smith</option>
                    <option value="Emma Davis">Emma Davis</option>
                    <option value="Michael Wong">Michael Wong</option>
                    <option value="Sarah Johnson">Sarah Johnson</option>
                  </select>
                </div>
              </div>
              
              {/* General Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  General Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <Link href="/clients">
              <button type="button" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Create Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewClient;