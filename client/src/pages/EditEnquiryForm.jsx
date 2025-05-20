import React from "react";
import { useForm, Controller } from "react-hook-form";
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

export default function EditEnquiryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending = false,
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
      {/* 1. Enquirer Information */}
      <div className="border p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium mb-4">1. Enquirer Information</h3>
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
              <p className="text-red-500 text-sm">{errors.fullName.message}</p>
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
              <p className="text-red-500 text-sm">{errors.email.message}</p>
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
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternatePhone">Alternate Contact Number</Label>
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
              className={errors.currentCountry ? "border-red-500" : ""}
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
            <Controller
              name="preferredContactMethod"
              control={control}
              defaultValue={defaultValues.preferredContactMethod || "Email"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
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
      <div className="border p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium mb-4">2. Visa Enquiry Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="visaType">Visa Type *</Label>
            <Controller
              name="visaType"
              control={control}
              defaultValue={defaultValues.visaType || "Tourist"}
              rules={{ required: "Visa type is required" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="visaType">
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
              defaultValue={defaultValues.destinationCountry || "USA"}
              rules={{ required: "Destination country is required" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="destinationCountry">
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
            <Controller
              name="previousVisaApplications"
              control={control}
              defaultValue={defaultValues.previousVisaApplications || "No"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="previousVisaApplications">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visaUrgency">Visa Urgency</Label>
            <Controller
              name="visaUrgency"
              control={control}
              defaultValue={defaultValues.visaUrgency || "Normal"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
          </div>
        </div>
      </div>

      {/* 3. Additional Applicant Details */}
      <div className="border p-4 rounded-md mb-6">
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
            <Controller
              name="maritalStatus"
              control={control}
              defaultValue={defaultValues.maritalStatus || "Single"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
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
            <Controller
              name="educationLevel"
              control={control}
              defaultValue={defaultValues.educationLevel || "Bachelor's"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
          </div>
        </div>
      </div>

      {/* 4. Source and Marketing Information */}
      <div className="border p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium mb-4">
          4. Source and Marketing Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="enquirySource">Enquiry Source</Label>
            <Controller
              name="enquirySource"
              control={control}
              defaultValue={defaultValues.enquirySource || "Website"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
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

          <div className="space-y-2">
            <Label htmlFor="branch">Branch/Office</Label>
            <Controller
              name="branch"
              control={control}
              defaultValue={defaultValues.branch || "Main Office"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
          </div>
        </div>
      </div>

      {/* 5. Internal Tracking and Assignment */}
      <div className="border p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium mb-4">
          5. Internal Tracking and Assignment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="enquiryStatus">Enquiry Status</Label>
            <Controller
              name="enquiryStatus"
              control={control}
              defaultValue={defaultValues.enquiryStatus || "New"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
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
            <Controller
              name="priorityLevel"
              control={control}
              defaultValue={defaultValues.priorityLevel || "Medium"}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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
              )}
            />
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

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="bg-blue-600"
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}