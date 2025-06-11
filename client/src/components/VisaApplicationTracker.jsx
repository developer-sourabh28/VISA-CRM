import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest, getVisaTracker } from '../lib/api';
import { ChevronDown, Download, Upload, Eye, Calendar, FileText, CreditCard, Building, CheckCircle, Clock, Check, X } from 'lucide-react';
import { useToast } from './ui/use-toast.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import axios from 'axios';

export default function VisaApplicationTracker({ client }) {
  const { toast } = useToast();
  const [expandedItem, setExpandedItem] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [visaTracker, setVisaTracker] = useState(null);

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
    preparationStatus: 'NOT_STARTED'
  });

  const [paymentDetails, setPaymentDetails] = useState({
    type: '',
    amount: 0,
    method: '',
    transactionId: '',
    status: 'NOT_STARTED',
    dueDate: '',
    paymentDate: '',
    currency: 'INR',
    description: '',
    notes: '',
    serviceType: 'Visa Application'
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

  // Add handleSave function
  const handleSave = async (stepId) => {
    if (!client?._id) {
      toast({
        title: "Error",
        description: "Client ID is required to save changes",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      let endpoint = '';
      let data = {};

      switch (stepId) {
        case 1: // Document Collection
          endpoint = `/api/visa-tracker/document-collection/${client._id}`;
          data = documentCollection;
          break;
        case 2: // Visa Application
          endpoint = `/api/visa-tracker/visa-application/${client._id}`;
          data = visaApplication;
          break;
        case 3: // Supporting Documents
          endpoint = `/api/visa-tracker/supporting-documents/${client._id}`;
          data = supportingDocuments;
          break;
        case 4: // Payment
          endpoint = `/api/visa-tracker/payment/${client._id}`;
          data = paymentDetails;
          
          // Also create/update payment record
          try {
            const paymentData = {
              clientId: client._id,
              amount: paymentDetails.amount,
              method: paymentDetails.method === 'BANK_TRANSFER' ? 'Bank Transfer' : 
                     paymentDetails.method === 'CREDIT_CARD' ? 'Card' :
                     paymentDetails.method === 'CASH' ? 'Cash' :
                     paymentDetails.method === 'UPI' ? 'UPI' : 'Cash',
              type: paymentDetails.type,
              status: paymentDetails.status === 'PENDING' ? 'Pending' :
                     paymentDetails.status === 'RECEIVED' ? 'Completed' :
                     paymentDetails.status === 'OVERDUE' ? 'Failed' :
                     paymentDetails.status === 'PARTIAL' ? 'Pending' : 'Pending',
              paymentDate: paymentDetails.paymentDate,
              dueDate: paymentDetails.dueDate,
              description: paymentDetails.description,
              notes: paymentDetails.notes,
              serviceType: 'Visa Application',
              transactionId: paymentDetails.transactionId,
              currency: paymentDetails.currency || 'INR'
            };
            
            await apiRequest('POST', '/api/payments', paymentData);
          } catch (paymentError) {
            console.error('Error syncing payment:', paymentError);
            // Don't throw here, as we still want to save the visa tracker data
          }
          break;
        case 5: // Appointment
          endpoint = `/api/visa-tracker/appointment/${client._id}`;
          data = appointmentDetails;
          break;
        case 6: // Visa Outcome
          endpoint = `/api/visa-tracker/visa-outcome/${client._id}`;
          data = visaOutcome;
          break;
        default:
          throw new Error('Invalid step ID');
      }

      const response = await apiRequest('POST', endpoint, data);
      
      if (response?.data) {
        toast({
          title: "Success",
          description: "Changes saved successfully",
        });
        // Refresh the data
        await fetchVisaTracker();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Memoize the fetchVisaTracker function
  const fetchVisaTracker = useCallback(async () => {
    if (!client?._id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getVisaTracker(client._id);
      
      if (response?.data) {
        const data = response.data;
        
        // Deduplicate documents before setting state
        const deduplicatedDocumentCollection = {
          documents: Array.from(new Map(
            (data.documentCollection?.documents || []).map(doc => [doc.type, doc])
          ).values()),
          collectionStatus: data.documentCollection?.collectionStatus || 'PENDING'
        };

        const deduplicatedSupportingDocuments = {
          documents: Array.from(new Map(
            (data.supportingDocuments?.documents || []).map(doc => [doc.type, doc])
          ).values()),
          preparationStatus: data.supportingDocuments?.preparationStatus || 'NOT_STARTED'
        };

        // Update all states with deduplicated data
        setVisaTracker(data);
        setDocumentCollection(deduplicatedDocumentCollection);
        setVisaApplication(data.visaApplication || {
          type: '',
          formFile: null,
          submissionDate: '',
          status: 'NOT_STARTED'
        });
        setSupportingDocuments(deduplicatedSupportingDocuments);
        setPaymentDetails(data.payment || {
          type: '',
          amount: 0,
          method: '',
          transactionId: '',
          status: 'NOT_STARTED',
          dueDate: '',
          paymentDate: '',
          currency: 'INR',
          description: '',
          notes: '',
          serviceType: 'Visa Application'
        });
        setAppointmentDetails(data.appointment || {
          type: '',
          embassy: '',
          dateTime: '',
          confirmationNumber: '',
          status: 'NOT_SCHEDULED',
          notes: ''
        });
        setVisaOutcome(data.visaOutcome || {
          status: 'PENDING',
          decisionDate: '',
          visaNumber: '',
          rejectionReason: '',
          notes: ''
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
  }, [client?._id, toast]);

  // Use effect for initial data fetch
  useEffect(() => {
    fetchVisaTracker();
  }, [fetchVisaTracker]);

  // Cleanup function
  useEffect(() => {
    return () => {
      setVisaTracker(null);
      setDocumentCollection({ documents: [], collectionStatus: 'PENDING' });
      setVisaApplication({
        type: '',
        formFile: null,
        submissionDate: '',
        status: 'NOT_STARTED'
      });
      setSupportingDocuments({
        documents: [],
        preparationStatus: 'NOT_STARTED'
      });
      setPaymentDetails({
        type: '',
        amount: 0,
        method: '',
        transactionId: '',
        status: 'NOT_STARTED',
        dueDate: '',
        paymentDate: '',
        currency: 'INR',
        description: '',
        notes: '',
        serviceType: 'Visa Application'
      });
      setAppointmentDetails({
        type: '',
        embassy: '',
        dateTime: '',
        confirmationNumber: '',
        status: 'NOT_SCHEDULED',
        notes: ''
      });
      setVisaOutcome({
        status: 'PENDING',
        decisionDate: '',
        visaNumber: '',
        rejectionReason: '',
        notes: ''
      });
    };
  }, []);

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
      title: "Document Collection",
      status: documentCollection.collectionStatus,
      icon: FileText,
    },
    {
      id: 2,
      title: "Visa Application",
      status: visaApplication.status,
      icon: FileText,
    },
    {
      id: 3,
      title: "Supporting Documents",
      status: supportingDocuments.preparationStatus,
      icon: FileText,
    },
    {
      id: 4,
      title: "Payment Collection",
      status: paymentDetails.status,
      icon: CreditCard,
    },
    {
      id: 5,
      title: "Embassy Appointment",
      status: appointmentDetails.status,
      icon: Building,
    },
    {
      id: 6,
      title: "Visa Outcome",
      status: visaOutcome.status,
      icon: CheckCircle,
    }
  ];

  const getStepStatusText = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return 'N/A';

    switch (stepId) {
      case 1: return documentCollection.collectionStatus;
      case 2: return visaApplication.status;
      case 3: return supportingDocuments.preparationStatus;
      case 4: return paymentDetails.status;
      case 5: return appointmentDetails.status;
      case 6: return visaOutcome.status;
      default: return 'N/A';
    }
  };

  const handleToggle = (index) => {
    setExpandedItem(expandedItem === index ? -1 : index);
  };

  const getStatusClass = (status) => {
    if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    
    switch (status.toUpperCase()) {
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
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStepIndicatorClass = (index, status) => {
    const baseClass = "flex items-center justify-center w-8 h-8 rounded-full border-2";
    if (!status) return `${baseClass} border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200`;
    
    const statusClass = status.toUpperCase() === "COMPLETED" || status.toUpperCase() === "APPROVED" || status.toUpperCase() === "RECEIVED" || status.toUpperCase() === "ATTENDED"
      ? "border-green-500 bg-green-100 text-green-800 dark:border-green-400 dark:bg-green-900 dark:text-green-200"
      : status.toUpperCase() === "IN PROGRESS" || status.toUpperCase() === "PENDING" || status.toUpperCase() === "UNDER_REVIEW" || status.toUpperCase() === "SCHEDULED" || status.toUpperCase() === "PARTIAL"
      ? "border-blue-500 bg-blue-100 text-blue-800 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-200"
      : status.toUpperCase() === "REJECTED" || status.toUpperCase() === "MISSED" || status.toUpperCase() === "OVERDUE"
      ? "border-red-500 bg-red-100 text-red-800 dark:border-red-400 dark:bg-red-900/50 dark:text-red-200"
      : "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200";

    return `${baseClass} ${statusClass}`;
  };

  const renderStatusOptions = (type) => {
    switch (type) {
      case 'document':
        return (
          <>
            <option value="">Select Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </>
        );
      case 'visa':
        return (
          <>
            <option value="">Select Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </>
        );
      case 'payment':
        return (
          <>
            <option value="">Select Status</option>
            <option value="PENDING">Pending</option>
            <option value="RECEIVED">Received</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PARTIAL">Partial</option>
          </>
        );
      case 'appointment':
        return (
          <>
            <option value="">Select Status</option>
            <option value="NOT_SCHEDULED">Not Scheduled</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ATTENDED">Attended</option>
            <option value="MISSED">Missed</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </>
        );
      case 'outcome':
        return (
          <>
            <option value="">Select Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="APPEALED">Appealed</option>
          </>
        );
      default:
        return <option value="">Select Status</option>;
    }
  };

  // Add document type validation
  const validateDocumentType = (type) => {
    const validTypes = ['PASSPORT', 'BANK_STATEMENT', 'INVITATION_LETTER', 'OTHER'];
    return validTypes.includes(type) ? type : 'OTHER';
  };

  // Update the document type handling in your form
  const handleDocumentTypeChange = (index, type) => {
    const newDocs = [...documentCollection.documents];
    newDocs[index].type = validateDocumentType(type);
    setDocumentCollection({...documentCollection, documents: newDocs});
  };

  const validateSupportingDocumentType = (type) => {
    const validTypes = ['HOTEL_BOOKING', 'FLIGHT_BOOKING', 'TRAVEL_INSURANCE', 'BANK_STATEMENT', 'OTHER'];
    return validTypes.includes(type) ? type : 'OTHER';
  };

  const handleSupportingDocumentTypeChange = (index, type) => {
    const newDocs = [...supportingDocuments.documents];
    newDocs[index].type = validateSupportingDocumentType(type);
    setSupportingDocuments({...supportingDocuments, documents: newDocs});
  };

  const renderStepContent = (step) => {
    switch (step.id) {
      case 1:
        return (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Collection</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(documentCollection.collectionStatus)}`}>
                {documentCollection.collectionStatus}
              </span>
            </div>
            <div className="space-y-4">
              {documentCollection.documents && documentCollection.documents.length > 0 ? (
                documentCollection.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
                        <select 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={doc.type || 'OTHER'}
                          onChange={(e) => handleDocumentTypeChange(index, e.target.value)}
                        >
                          <option value="OTHER">Select Type</option>
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
                          {renderStatusOptions('document')}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Document File</label>
                      {doc.fileUrl ? (
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {doc.fileUrl.split('/').pop()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </a>
                              <a 
                                href={doc.fileUrl} 
                                download
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </a>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Uploaded: {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                            <div className="space-y-1 text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 dark:bg-gray-700 dark:text-primary-400">
                                  <span>Upload a file</span>
                                  <input 
                                    type="file" 
                                    className="sr-only"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const newDocs = [...documentCollection.documents];
                                        newDocs[index].file = file;
                                        newDocs[index].fileName = file.name;
                                        newDocs[index].fileType = file.type;
                                        newDocs[index].fileSize = file.size;
                                        setDocumentCollection({...documentCollection, documents: newDocs});
                                      }
                                    }}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PDF, DOC up to 10MB
                              </p>
                            </div>
                          </div>
                          {/* Show selected file if exists */}
                          {doc.file && (
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-5 h-5 text-gray-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {doc.fileName}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                  <button
                                    onClick={() => {
                                      const newDocs = [...documentCollection.documents];
                                      newDocs[index].file = null;
                                      newDocs[index].fileName = null;
                                      newDocs[index].fileType = null;
                                      newDocs[index].fileSize = null;
                                      setDocumentCollection({...documentCollection, documents: newDocs});
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Type: {doc.fileType}
                              </p>
                            </div>
                          )}
                          {/* Show saved document if exists */}
                          {doc._id && (
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-5 h-5 text-gray-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {doc.type} Document
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(doc.verificationStatus)}`}>
                                    {doc.verificationStatus}
                                  </span>
                                </div>
                              </div>
                              {doc.notes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Notes: {doc.notes}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Document ID: {doc._id}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Verification Notes</label>
                      <textarea 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows="2"
                        value={doc.notes || ''}
                        onChange={(e) => {
                          const newDocs = [...documentCollection.documents];
                          newDocs[index].notes = e.target.value;
                          setDocumentCollection({...documentCollection, documents: newDocs});
                        }}
                        placeholder="Add verification notes or reasons for rejection..."
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No documents added yet
                </div>
              )}
              <button
                type="button"
                onClick={() => setDocumentCollection({
                  ...documentCollection,
                  documents: [...documentCollection.documents, {
                    type: 'OTHER',
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
      case 2:
        return (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Application</h3>
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
                  {renderStatusOptions('visa')}
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
                        value={doc.type || 'OTHER'}
                        onChange={(e) => handleSupportingDocumentTypeChange(index, e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="OTHER">Select Type</option>
                        <option value="OTHER">Select Type</option>
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
                    {/* Display existing document if available */}
                    {supportingDocuments.documents[index].existingFile && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Current document:</span> {supportingDocuments.documents[index].existingFile.name}
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <a 
                            href={supportingDocuments.documents[index].existingFile.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Document
                          </a>
                          <span className="text-gray-400">|</span>
                          <span className="text-xs text-gray-500">
                            Uploaded: {new Date(supportingDocuments.documents[index].existingFile.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Display newly selected file */}
                    {supportingDocuments.documents[index].file && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">New file selected:</span> {supportingDocuments.documents[index].file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Size: {(supportingDocuments.documents[index].file.size / 1024).toFixed(2)} KB
                        </p>
                        {supportingDocuments.documents[index].file.type && (
                          <p className="text-xs text-gray-500">
                            Type: {supportingDocuments.documents[index].file.type}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSupportingDocuments({
                  ...supportingDocuments,
                  documents: [...supportingDocuments.documents, {
                    type: 'OTHER',
                    preparationDate: new Date().toISOString().split('T')[0],
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
      case 4:
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
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
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
                {renderStatusOptions('payment')}
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
      case 5:
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
                {renderStatusOptions('appointment')}
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
      case 6:
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
                {renderStatusOptions('outcome')}
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="px-6 py-8 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Visa Application Tracker</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track the progress of {client?.firstName} {client?.lastName}'s visa application
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last Updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 dark:border-gray-700"
              >
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none rounded-t-xl"
                >
                  <div className="flex items-center space-x-4">
                    <div className={getStepIndicatorClass(index, getStepStatusText(step.id))}>
                      {getStepStatusText(step.id) === "COMPLETED" || getStepStatusText(step.id) === "APPROVED" || getStepStatusText(step.id) === "RECEIVED" || getStepStatusText(step.id) === "ATTENDED" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-base font-semibold text-gray-900 dark:text-white">{step.title}</span>
                      <span className={`text-sm mt-1 px-2 py-0.5 rounded-full ${getStatusClass(getStepStatusText(step.id))}`}>
                        {getStepStatusText(step.id)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {getStepStatusText(step.id) === "COMPLETED" ? "Completed" : "In Progress"}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                        expandedItem === index ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
                
                {expandedItem === index && (
                  <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="mt-4">
                      {renderStepContent(step)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl dark:bg-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step) => (
                <div key={step.id} className="bg-white p-4 rounded-lg shadow-sm dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{step.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(step.status)}`}>
                      {step.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className={`h-2 rounded-full ${
                          step.status === "COMPLETED" ? "bg-green-500" :
                          step.status === "IN_PROGRESS" ? "bg-blue-500" :
                          step.status === "PENDING" ? "bg-yellow-500" :
                          "bg-gray-500"
                        }`}
                        style={{ width: step.status === "COMPLETED" ? "100%" : "50%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}