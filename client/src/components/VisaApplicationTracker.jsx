import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/queryClient';
import { getVisaTracker } from '../lib/api';
import { updateAppointment } from '../lib/api';

import { ChevronDown, Download, Upload, Eye, Calendar, FileText, CreditCard, Building, CheckCircle, Clock, Check, X } from 'lucide-react';
import { useToast } from "../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";

export default function VisaApplicationTracker({ client }) {
  const { toast } = useToast();
  const [expandedItem, setExpandedItem] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [documentCollection, setDocumentCollection] = useState({
    documents: [],
    collectionStatus: 'PENDING'
  });

  const [visaApplication, setVisaApplication] = useState({
    type: '',
    formFile: null,
    submissionDate: '',
    status: 'NOT_STARTED'
  });

  const [supportingDocuments, setSupportingDocuments] = useState({
    documents: [],
    preparationStatus: 'PENDING'
  });

  const [paymentDetails, setPaymentDetails] = useState({
    type: '',
    amount: 0,
    method: '',
    transactionId: '',
    status: 'PENDING',
    dueDate: '',
    paymentDate: ''
  });

  const [appointmentDetails, setAppointmentDetails] = useState({
    type: '',
    embassy: '',
    dateTime: '',
    confirmationNumber: '',
    status: 'NOT_SCHEDULED',
    notes: ''
  });

  const [visaOutcome, setVisaOutcome] = useState({
    status: 'PENDING',
    decisionDate: '',
    visaNumber: '',
    rejectionReason: '',
    notes: ''
  });

  const clientBranchName = client?.branchName || "indore";

  useEffect(() => {
    if (client?._id) {
      fetchVisaTracker();
    }
  }, [client?._id]);

  const fetchVisaTracker = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVisaTracker(client._id);
      
      if (data) {
        setDocumentCollection(data.documentCollection || documentCollection);
        setVisaApplication({
          ...(data.visaApplication || {}),
          submissionDate: data.visaApplication?.submissionDate ? formatDateForInput(data.visaApplication.submissionDate) : ''
        });
        setSupportingDocuments({
          ...(data.supportingDocuments || {}),
          documents: data.supportingDocuments?.documents.map(doc => ({
            ...doc,
            preparationDate: doc.preparationDate ? formatDateForInput(doc.preparationDate) : '',
            bookingDetails: {
              ...(doc.bookingDetails || {}),
              checkInDate: doc.bookingDetails?.checkInDate ? formatDateForInput(doc.bookingDetails.checkInDate) : '',
              checkOutDate: doc.bookingDetails?.checkOutDate ? formatDateForInput(doc.bookingDetails.checkOutDate) : '',
              cancellationDate: doc.bookingDetails?.cancellationDate ? formatDateForInput(doc.bookingDetails.cancellationDate) : ''
            }
          })) || []
        });
        setPaymentDetails({
          ...(data.payment || {}),
          dueDate: data.payment?.dueDate ? formatDateForInput(data.payment.dueDate) : '',
          paymentDate: data.payment?.paymentDate ? formatDateForInput(data.payment.paymentDate) : ''
        });
        setAppointmentDetails({
          ...(data.appointment || {}),
          dateTime: data.appointment?.dateTime ? data.appointment.dateTime.slice(0, 16) : ''
        });
        setVisaOutcome({
          ...(data.visaOutcome || {}),
          decisionDate: data.visaOutcome?.decisionDate ? formatDateForInput(data.visaOutcome.decisionDate) : ''
        });
      }
    } catch (error) {
      console.error('Error fetching visa tracker:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch visa tracker data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const steps = [
    {
      id: 1,
      title: "Send Agreement",
      status: "NOT STARTED",
      icon: FileText,
    },
    {
      id: 2,
      title: "Schedule Meeting",
      status: "NOT STARTED",
      icon: Calendar,
    },
    {
      id: 3,
      title: "Document Collection",
      status: documentCollection.collectionStatus,
      icon: FileText,
    },
    {
      id: 4,
      title: "Visa Application",
      status: visaApplication.status,
      icon: FileText,
    },
    {
      id: 5,
      title: "Supporting Documents",
      status: supportingDocuments.preparationStatus,
      icon: FileText,
    },
    {
      id: 6,
      title: "Payment Collection",
      status: paymentDetails.status,
      icon: CreditCard,
    },
    {
      id: 7,
      title: "Embassy Appointment",
      status: appointmentDetails.status,
      icon: Building,
    },
    {
      id: 8,
      title: "Visa Outcome",
      status: visaOutcome.status,
      icon: CheckCircle,
    }
  ];

  const getStepStatusText = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return 'N/A';

    switch (stepId) {
      case 1:
        return "NOT STARTED";
      case 2:
        return "NOT STARTED";
      case 3: return documentCollection.collectionStatus;
      case 4: return visaApplication.status;
      case 5: return supportingDocuments.preparationStatus;
      case 6: return paymentDetails.status;
      case 7: return appointmentDetails.status;
      case 8: return visaOutcome.status;
      default: return 'N/A';
    }
  };

  const handleToggle = (index) => {
    setExpandedItem(expandedItem === index ? -1 : index);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
      case "RECEIVED":
      case "ATTENDED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "IN PROGRESS":
      case "PENDING":
      case "UNDER_REVIEW":
      case "SCHEDULED":
      case "PARTIAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "REJECTED":
      case "MISSED":
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
      case "NOT STARTED":
      case "NOT_SCHEDULED":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStepIndicatorClass = (index, status) => {
    const baseClass = "flex items-center justify-center w-8 h-8 rounded-full border-2";
    const statusClass = status === "COMPLETED" || status === "APPROVED" || status === "RECEIVED" || status === "ATTENDED"
      ? "border-green-500 bg-green-100 text-green-800 dark:border-green-400 dark:bg-green-900 dark:text-green-200"
      : status === "IN PROGRESS" || status === "PENDING" || status === "UNDER_REVIEW" || status === "SCHEDULED" || status === "PARTIAL"
      ? "border-blue-500 bg-blue-100 text-blue-800 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-200"
      : status === "REJECTED" || status === "MISSED" || status === "OVERDUE"
      ? "border-red-500 bg-red-100 text-red-800 dark:border-red-400 dark:bg-red-900/50 dark:text-red-200"
      : "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200";

    return `${baseClass} ${statusClass}`;
  };

  const renderStepContent = (step) => {
    switch (step.id) {
      case 1:
        return (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Application Form</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(getStepStatusText(step.id))}`}>
                {getStepStatusText(step.id)}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={visaApplication.type}
                  onChange={(e) => setVisaApplication({ ...visaApplication, type: e.target.value })}
                >
                  <option value="">Select Visa Type</option>
                  <option value="TOURIST">Tourist</option>
                  <option value="STUDENT">Student</option>
                  <option value="WORK">Work</option>
                  <option value="BUSINESS">Business</option>
                  <option value="MEDICAL">Medical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Submission Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={visaApplication.submissionDate}
                  onChange={(e) => setVisaApplication({ ...visaApplication, submissionDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Application Form
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 dark:bg-gray-700 dark:text-primary-400">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Application Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={visaApplication.status}
                  onChange={(e) => setVisaApplication({ ...visaApplication, status: e.target.value })}
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(step.id)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Application Form</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(getStepStatusText(step.id))}`}>
                {getStepStatusText(step.id)}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={visaApplication.type}
                  onChange={(e) => setVisaApplication({ ...visaApplication, type: e.target.value })}
                >
                  <option value="">Select Visa Type</option>
                  <option value="TOURIST">Tourist</option>
                  <option value="STUDENT">Student</option>
                  <option value="WORK">Work</option>
                  <option value="BUSINESS">Business</option>
                  <option value="MEDICAL">Medical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Submission Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={visaApplication.submissionDate}
                  onChange={(e) => setVisaApplication({ ...visaApplication, submissionDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Application Form
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 dark:bg-gray-700 dark:text-primary-400">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Application Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={visaApplication.status}
                  onChange={(e) => setVisaApplication({ ...visaApplication, status: e.target.value })}
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(step.id)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Collection</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(documentCollection.collectionStatus)}`}>
                {documentCollection.collectionStatus}
              </span>
            </div>
            <div className="space-y-4">
              {documentCollection.documents.map((doc, index) => (
                <div key={index} className="border rounded-lg p-4 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
                      <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={doc.type}
                        onChange={(e) => {
                          const newDocs = [...documentCollection.documents];
                          newDocs[index].type = e.target.value;
                          setDocumentCollection({...documentCollection, documents: newDocs});
                        }}
                      >
                        <option value="">Select Type</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="BANK_STATEMENT">Bank Statement</option>
                        <option value="INVITATION_LETTER">Invitation Letter</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verification Status</label>
                      <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={doc.verificationStatus}
                        onChange={(e) => {
                          const newDocs = [...documentCollection.documents];
                          newDocs[index].verificationStatus = e.target.value;
                          setDocumentCollection({...documentCollection, documents: newDocs});
                        }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Document File</label>
                    <input 
                      type="file" 
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      onChange={(e) => {
                        const newDocs = [...documentCollection.documents];
                        newDocs[index].file = e.target.files[0];
                        setDocumentCollection({...documentCollection, documents: newDocs});
                      }}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Verification Notes</label>
                    <textarea 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows="2"
                      value={doc.notes}
                      onChange={(e) => {
                        const newDocs = [...documentCollection.documents];
                        newDocs[index].notes = e.target.value;
                        setDocumentCollection({...documentCollection, documents: newDocs});
                      }}
                      placeholder="Add verification notes or reasons for rejection..."
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDocumentCollection({
                  ...documentCollection,
                  documents: [...documentCollection.documents, {
                    type: '',
                    file: null,
                    verificationStatus: 'PENDING',
                    notes: ''
                  }]
                })}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300"
              >
                + Add Document
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(step.id)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supporting Documents</h3>
              <span className={`text-sm px-2 py-1 rounded ${
                supportingDocuments.preparationStatus === 'COMPLETED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {supportingDocuments.preparationStatus}
              </span>
            </div>

            <div className="space-y-4">
              {supportingDocuments.documents.map((doc, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Document Type</label>
                      <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={doc.type}
                        onChange={(e) => {
                          const newDocs = [...supportingDocuments.documents];
                          newDocs[index].type = e.target.value;
                          setSupportingDocuments({...supportingDocuments, documents: newDocs});
                        }}
                      >
                        <option value="">Select Type</option>
                        <option value="FLIGHT_ITINERARY">Flight Itinerary</option>
                        <option value="HOTEL_BOOKING">Hotel Booking</option>
                        <option value="INVITATION_LETTER">Invitation Letter</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preparation Date</label>
                      <input 
                        type="date" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={doc.preparationDate}
                        onChange={(e) => {
                          const newDocs = [...supportingDocuments.documents];
                          newDocs[index].preparationDate = e.target.value;
                          setSupportingDocuments({...supportingDocuments, documents: newDocs});
                        }}
                      />
                    </div>
                  </div>

                  {doc.type === 'HOTEL_BOOKING' && (
                    <div className="mt-4 space-y-4">
                      <h4 className="font-medium text-gray-700">Booking Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Booking Portal</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.portal}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.portal = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Booking ID</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.bookingId}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.bookingId = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.hotelName}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.hotelName = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Lead Passenger</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.leadPassenger}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.leadPassenger = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                          <input 
                            type="date" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.checkInDate}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.checkInDate = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                          <input 
                            type="date" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.checkOutDate}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.checkOutDate = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cancellation Date</label>
                          <input 
                            type="date" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.cancellationDate}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.cancellationDate = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Booking Amount</label>
                          <input 
                            type="number" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.amount}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.amount = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cancellation Charges</label>
                          <input 
                            type="number" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={doc.bookingDetails.cancellationCharges}
                            onChange={(e) => {
                              const newDocs = [...supportingDocuments.documents];
                              newDocs[index].bookingDetails.cancellationCharges = e.target.value;
                              setSupportingDocuments({...supportingDocuments, documents: newDocs});
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Document File</label>
                    <input 
                      type="file" 
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const newDocs = [...supportingDocuments.documents];
                        newDocs[index].file = e.target.files[0];
                        setSupportingDocuments({...supportingDocuments, documents: newDocs});
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSupportingDocuments({
                  ...supportingDocuments,
                  documents: [...supportingDocuments.documents, {
                    type: '',
                    preparationDate: '',
                    file: null,
                    bookingDetails: {
                      portal: '',
                      bookingId: '',
                      hotelName: '',
                      checkInDate: '',
                      checkOutDate: '',
                      cancellationDate: '',
                      leadPassenger: '',
                      creditCard: '',
                      amount: 0,
                      cancellationCharges: 0
                    }
                  }]
                })}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
              >
                + Add Supporting Document
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(step.id)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Payment Collection</h3>
              <span className={`text-sm px-2 py-1 rounded ${
                paymentDetails.status === 'RECEIVED' 
                  ? 'bg-green-100 text-green-800' 
                  : paymentDetails.status === 'OVERDUE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {paymentDetails.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={paymentDetails.type}
                  onChange={(e) => setPaymentDetails({...paymentDetails, type: e.target.value})}
                >
                  <option value="">Select Type</option>
                  <option value="VISA_FEE">Visa Fee</option>
                  <option value="SERVICE_FEE">Service Fee</option>
                  <option value="DOCUMENTATION_FEE">Documentation Fee</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={paymentDetails.method}
                  onChange={(e) => setPaymentDetails({...paymentDetails, method: e.target.value})}
                >
                  <option value="">Select Method</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input 
                  type="number" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={paymentDetails.amount}
                  onChange={(e) => setPaymentDetails({...paymentDetails, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-gray-700">Transaction ID</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={paymentDetails.transactionId}
                  onChange={(e) => setPaymentDetails({...paymentDetails, transactionId: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                <input 
                  type="date" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={paymentDetails.paymentDate}
                  onChange={(e) => setPaymentDetails({...paymentDetails, paymentDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input 
                  type="date" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={paymentDetails.dueDate}
                  onChange={(e) => setPaymentDetails({...paymentDetails, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Status</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={paymentDetails.status}
                onChange={(e) => setPaymentDetails({...paymentDetails, status: e.target.value})}
              >
                <option value="PENDING">Pending</option>
                <option value="RECEIVED">Received</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(step.id)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Embassy Appointment</h3>
              <span className={`text-sm px-2 py-1 rounded ${
                appointmentDetails.status === 'ATTENDED' 
                  ? 'bg-green-100 text-green-800' 
                  : appointmentDetails.status === 'MISSED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {appointmentDetails.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Appointment Type</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={appointmentDetails.type}
                  onChange={(e) => setAppointmentDetails({...appointmentDetails, type: e.target.value})}
                >
                  <option value="">Select Type</option>
                  <option value="VISA_INTERVIEW">Visa Interview</option>
                  <option value="BIOMETRICS">Biometrics</option>
                  <option value="DOCUMENT_SUBMISSION">Document Submission</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Embassy/Consulate</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={appointmentDetails.embassy}
                  onChange={(e) => setAppointmentDetails({...appointmentDetails, embassy: e.target.value})}
                  placeholder="Enter embassy or consulate name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Appointment Date and Time</label>
                <input 
                  type="datetime-local" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={appointmentDetails.dateTime}
                  onChange={(e) => setAppointmentDetails({...appointmentDetails, dateTime: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmation Number</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={appointmentDetails.confirmationNumber}
                  onChange={(e) => setAppointmentDetails({...appointmentDetails, confirmationNumber: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Status</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={appointmentDetails.status}
                onChange={(e) => setAppointmentDetails({...appointmentDetails, status: e.target.value})}
              >
                <option value="NOT_SCHEDULED">Not Scheduled</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ATTENDED">Attended</option>
                <option value="MISSED">Missed</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
                value={appointmentDetails.notes}
                onChange={(e) => setAppointmentDetails({...appointmentDetails, notes: e.target.value})}
                placeholder="Add any special instructions or notes..."
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(step.id)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Visa Outcome</h3>
              <span className={`text-sm px-2 py-1 rounded ${
                visaOutcome.status === 'APPROVED' 
                  ? 'bg-green-100 text-green-800' 
                  : visaOutcome.status === 'REJECTED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {visaOutcome.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Decision Date</label>
                <input 
                  type="date" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={visaOutcome.decisionDate}
                  onChange={(e) => setVisaOutcome({...visaOutcome, decisionDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visa Number</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={visaOutcome.visaNumber}
                  onChange={(e) => setVisaOutcome({...visaOutcome, visaNumber: e.target.value})}
                  disabled={visaOutcome.status !== 'APPROVED'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Visa Status</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={visaOutcome.status}
                onChange={(e) => setVisaOutcome({...visaOutcome, status: e.target.value})}
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="APPEALED">Appealed</option>
              </select>
            </div>

            {visaOutcome.status === 'REJECTED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                  value={visaOutcome.rejectionReason}
                  onChange={(e) => setVisaOutcome({...visaOutcome, rejectionReason: e.target.value})}
                  placeholder="Enter the reason for visa rejection..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
                value={visaOutcome.notes}
                onChange={(e) => setVisaOutcome({...visaOutcome, notes: e.target.value})}
                placeholder="Add any additional notes or next steps..."
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(step.id)}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <p className="text-gray-600 text-sm">
            Content for {step.title} step goes here. This area can be expanded to show detailed information and actions related to this step.
          </p>
        );
    }
  };

  const handleSave = async (stepId) => {
    if (!client?._id) {
      toast({
        title: "Error",
        description: "Client ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      let endpoint = '';
      let data = {};

      switch (stepId) {
        case 3:
          endpoint = `/api/visa-tracker/${client._id}/documents`;
          data = documentCollection;
          break;
        case 4:
          endpoint = `/api/visa-tracker/${client._id}/application`;
          data = visaApplication;
          break;
        case 5:
          endpoint = `/api/visa-tracker/${client._id}/supporting-docs`;
          data = supportingDocuments;
          break;
        case 6:
          endpoint = `/api/visa-tracker/${client._id}/payment`;
          data = paymentDetails;
          break;
        case 7:
          const formattedAppointmentData = {
            ...appointmentDetails,
            dateTime: appointmentDetails.dateTime ? formatDateForAPI(appointmentDetails.dateTime) : null
          };
          const response = await updateAppointment(client._id, formattedAppointmentData);
          
          if (response.success) {
             toast({
              title: "Success",
              description: "Appointment details saved successfully",
            });
            await fetchVisaTracker();
            window.dispatchEvent(new CustomEvent('refreshAppointments'));
          }
          return;
        case 8:
          endpoint = `/api/visa-tracker/${client._id}/outcome`;
          data = visaOutcome;
          break;
        default:
          console.warn("Invalid stepId provided:", stepId);
          return;
      }

      if (endpoint) {
        const response = await apiRequest('POST', endpoint, data);

        toast({
          title: "Success",
          description: "Data saved successfully",
        });

        await fetchVisaTracker();
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Visa Application Tracker</h2>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="border border-gray-200 rounded-lg dark:border-gray-700">
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  <div className="flex items-center">
                    <div className={getStepIndicatorClass(index, getStepStatusText(step.id))}>
                      {getStepStatusText(step.id) === "COMPLETED" || getStepStatusText(step.id) === "APPROVED" || getStepStatusText(step.id) === "RECEIVED" || getStepStatusText(step.id) === "ATTENDED" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">{step.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedItem === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                {expandedItem === index && (
                  <div className="px-4 pb-4">
                    {renderStepContent(step)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}