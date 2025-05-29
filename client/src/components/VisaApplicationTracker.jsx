import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/queryClient';
import { getAgreementByClient, createOrUpdateAgreement } from '../lib/api';
import { getVisaTracker } from '../lib/api';
import { uploadAgreementForBranch } from '../lib/api';
import { updateAppointment } from '../lib/api';

import { ChevronDown, Download, Upload, Eye, Calendar, FileText, CreditCard, Building, CheckCircle, Clock, Check, X } from 'lucide-react';
import { useToast } from "../hooks/use-toast";


export default function VisaApplicationTracker({ client }) {
  const { toast } = useToast();
  const [expandedItem, setExpandedItem] = useState(0);
  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Agreement Details State
  const [agreementDetails, setAgreementDetails] = useState({
    type: 'Standard',
    sentDate: '',
    clientSignatureDate: '',
    status: 'DRAFT',
    notes: '',
    document: null
  });

  // Meeting Details State
  const [meetingDetails, setMeetingDetails] = useState({
    type: '',
    scheduledDate: '',
    location: '',
    notes: '',
    followUpActions: []
  });

  // Document Collection State
  const [documentCollection, setDocumentCollection] = useState({
    documents: [],
    collectionStatus: 'PENDING'
  });

  // Visa Application State
  const [visaApplication, setVisaApplication] = useState({
    type: '',
    formFile: null,
    submissionDate: '',
    status: 'NOT_STARTED'
  });

  // Supporting Documents State
  const [supportingDocuments, setSupportingDocuments] = useState({
    documents: [],
    preparationStatus: 'PENDING'
  });

  // Payment Details State
  const [paymentDetails, setPaymentDetails] = useState({
    type: '',
    amount: 0,
    method: '',
    transactionId: '',
    status: 'PENDING',
    dueDate: '',
    paymentDate: ''
  });

  // Appointment Details State
  const [appointmentDetails, setAppointmentDetails] = useState({
    type: '',
    embassy: '',
    dateTime: '',
    confirmationNumber: '',
    status: 'NOT_SCHEDULED',
    notes: ''
  });

  // Visa Outcome State
  const [visaOutcome, setVisaOutcome] = useState({
    status: 'PENDING',
    decisionDate: '',
    visaNumber: '',
    rejectionReason: '',
    notes: ''
  });

  // Get client's branch name from client data
  const clientBranchName = client?.branchName || "indore";

  useEffect(() => {
    if (client?._id) {
      fetchVisaTracker();
      fetchAgreement();
    }
  }, [client?._id]);

  const fetchVisaTracker = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVisaTracker(client._id);
      
      if (data) {
        // Update all state variables with fetched data
        setAgreementDetails({
          ...agreementDetails, // Keep existing local state for document/file if not overwritten
          ...(data.agreement || {}),
          sentDate: data.agreement?.sentDate ? formatDateForInput(data.agreement.sentDate) : '',
          clientSignatureDate: data.agreement?.clientSignatureDate ? formatDateForInput(data.agreement.clientSignatureDate) : ''
        });
        setMeetingDetails({
          ...(data.meeting || {}),
          scheduledDate: data.meeting?.scheduledDate ? data.meeting.scheduledDate.slice(0, 16) : '' // datetime-local format
        });
        setDocumentCollection(data.documentCollection || documentCollection); // Assuming documents array structure matches
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
          })) || [] // Ensure documents is an array
        });
        setPaymentDetails({
          ...(data.payment || {}),
          dueDate: data.payment?.dueDate ? formatDateForInput(data.payment.dueDate) : '',
          paymentDate: data.payment?.paymentDate ? formatDateForInput(data.payment.paymentDate) : ''
        });
        setAppointmentDetails({
          ...(data.appointment || {}),
          dateTime: data.appointment?.dateTime ? data.appointment.dateTime.slice(0, 16) : '' // datetime-local format
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

  const fetchAgreement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAgreementByClient(client._id);
      if (data) {
        setAgreementData(data);
        setAgreementDetails({
          ...agreementDetails, // Keep existing local state for document/file if not overwritten
          ...(data.agreement || {}),
          sentDate: data.agreement?.sentDate ? formatDateForInput(data.agreement.sentDate) : '',
          clientSignatureDate: data.agreement?.clientSignatureDate ? formatDateForInput(data.agreement.clientSignatureDate) : ''
        });
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch agreement data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      
      if (stepId === 1) {
        const formData = new FormData();
        Object.keys(agreementDetails).forEach(key => {
          if (key === 'document' && agreementDetails[key]) {
            formData.append('document', agreementDetails[key]);
          } else if (key !== 'document') {
            formData.append(key, agreementDetails[key]);
          }
        });
        
        const response = await createOrUpdateAgreement(client._id, formData);
        
        if (response.success) {
          toast({
            title: "Success",
            description: "Agreement details saved successfully",
          });
          
          // Refresh the agreement data
          await fetchAgreement();
          
          // Notify the sidebar to refresh its agreements list
          window.dispatchEvent(new CustomEvent('refreshAgreements'));
        }
        return;
      }

      let endpoint = '';
      let data = {};

      switch (stepId) {
        case 2:
          endpoint = `/api/visa-tracker/${client._id}/meeting`;
          data = meetingDetails;
          break;
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
          // Format the appointment date before sending
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
            
            // Refresh the visa tracker data
            await fetchVisaTracker();
            
            // Notify the sidebar to refresh appointments
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

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to save data');
        }

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

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('type', agreementDetails.type);
      formData.append('status', agreementDetails.status);
      formData.append('notes', agreementDetails.notes);
      formData.append('branchName', client.branchName || 'indore');

      const response = await createOrUpdateAgreement(client._id, formData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Agreement uploaded successfully",
        });
        
        // Refresh the agreement data
        await fetchAgreement();
        
        // Notify the sidebar to refresh its agreements list
        window.dispatchEvent(new CustomEvent('refreshAgreements'));
        
        // Clear the selected file
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error uploading agreement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload agreement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to format date for API
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Ensure the date is treated as local before formatting
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
      status: agreementData ? "COMPLETED" : "IN PROGRESS",
      icon: FileText,
      fields: {
        agreementType: '',
        sentDate: '',
        clientSignatureDate: '',
        status: '',
        notes: ''
      }
    },
    {
      id: 2,
      title: "Schedule Meeting",
      status: "NOT STARTED",
      icon: Calendar,
      fields: {
        meetingType: '',
        scheduledDate: '',
        location: '',
        notes: '',
        followUpActions: []
      }
    },
    {
      id: 3,
      title: "Document Collection",
      status: "NOT STARTED",
      icon: FileText,
      fields: {
        documentType: '',
        uploadDate: '',
        verificationStatus: '',
        notes: '',
        collectionStatus: ''
      }
    },
    {
      id: 4,
      title: "Visa Application",
      status: "NOT STARTED",
      icon: FileText,
      fields: {
        visaType: '',
        applicationForm: null,
        submissionDate: '',
        status: ''
      }
    },
    {
      id: 5,
      title: "Supporting Documents",
      status: "NOT STARTED",
      icon: FileText,
      fields: {
        documentType: '',
        preparationDate: '',
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
      }
    },
    {
      id: 6,
      title: "Payment Collection",
      status: "NOT STARTED",
      icon: CreditCard,
      fields: {
        paymentType: '',
        amount: 0,
        method: '',
        transactionId: '',
        status: '',
        dueDate: ''
      }
    },
    {
      id: 7,
      title: "Embassy Appointment",
      status: "NOT STARTED",
      icon: Building,
      fields: {
        appointmentType: '',
        embassy: '',
        dateTime: '',
        confirmationNumber: '',
        status: ''
      }
    },
    {
      id: 8,
      title: "Visa Outcome",
      status: "NOT STARTED",
      icon: CheckCircle,
      fields: {
        status: '',
        decisionDate: '',
        visaNumber: '',
        rejectionReason: '',
        notes: ''
      }
    }
  ];

  const handleToggle = (index) => {
    setExpandedItem(expandedItem === index ? -1 : index);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "IN PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "NOT STARTED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStepIndicatorClass = (index, status) => {
    const baseClass = "flex items-center justify-center w-8 h-8 rounded-full border-2";
    const statusClass = status === "COMPLETED" 
      ? "border-green-500 bg-green-100 text-green-800 dark:border-green-400 dark:bg-green-900 dark:text-green-200"
      : status === "IN PROGRESS"
      ? "border-blue-500 bg-blue-100 text-blue-800 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-200"
      : "border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200";
    
    return `${baseClass} ${statusClass}`;
  };

  const renderStepContent = (step) => {
    switch (step.id) {
      case 1:
        return (
          <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agreement Details</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(agreementData ? "COMPLETED" : "IN PROGRESS")}`}>
                {agreementData ? "Completed" : "In Progress"}
              </span>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center py-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Loading agreement data...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/50 dark:border-red-800 dark:text-red-200">
                <p className="font-medium">Error loading agreement:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agreement Type</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={agreementDetails.type}
                    onChange={(e) => setAgreementDetails({...agreementDetails, type: e.target.value})}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={agreementDetails.status}
                    onChange={(e) => setAgreementDetails({...agreementDetails, status: e.target.value})}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="SIGNED">Signed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sent Date</label>
                  <input 
                    type="date" 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formatDateForInput(agreementDetails.sentDate)}
                    onChange={(e) => setAgreementDetails({...agreementDetails, sentDate: formatDateForAPI(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Signature Date</label>
                  <input 
                    type="date" 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formatDateForInput(agreementDetails.clientSignatureDate)}
                    onChange={(e) => setAgreementDetails({...agreementDetails, clientSignatureDate: formatDateForAPI(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  value={agreementDetails.notes}
                  onChange={(e) => setAgreementDetails({...agreementDetails, notes: e.target.value})}
                  placeholder="Add any special conditions or client comments..."
                />
              </div>

              {agreementData && (
                <div className="bg-green-50 border border-green-200 p-4 rounded dark:bg-green-900/50 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Agreement Available</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Branch: {agreementData.branch_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`http://localhost:5000${agreementData.pdf_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                      >
                        <Eye size={14} />
                        View PDF
                      </a>
                      <a
                        href={`http://localhost:5000${agreementData.pdf_url}`}
                        download
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-4 border-t pt-4 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {agreementData ? 'Upload New Agreement PDF' : 'Upload Agreement PDF'}
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={uploading}
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only PDF files are allowed</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : (agreementData ? 'Update Agreement' : 'Upload Agreement')}
                  </button>
                </div>
              </form>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meeting Details</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(meetingDetails.status)}`}>
                {meetingDetails.status}
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Type</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={meetingDetails.type}
                    onChange={(e) => setMeetingDetails({...meetingDetails, type: e.target.value})}
                  >
                    <option value="">Select Type</option>
                    <option value="INITIAL">Initial Consultation</option>
                    <option value="DOCUMENT_REVIEW">Document Review</option>
                    <option value="FINAL_REVIEW">Final Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={meetingDetails.location}
                    onChange={(e) => setMeetingDetails({...meetingDetails, location: e.target.value})}
                  >
                    <option value="">Select Location</option>
                    <option value="OFFICE">Office</option>
                    <option value="VIRTUAL">Virtual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Date and Time</label>
                <input 
                  type="datetime-local" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={meetingDetails.scheduledDate}
                  onChange={(e) => setMeetingDetails({...meetingDetails, scheduledDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meeting Notes</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  value={meetingDetails.notes}
                  onChange={(e) => setMeetingDetails({...meetingDetails, notes: e.target.value})}
                  placeholder="Add key discussion points..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Follow-up Actions</label>
                <div className="space-y-2">
                  {meetingDetails.followUpActions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={action}
                        onChange={(e) => {
                          const newActions = [...meetingDetails.followUpActions];
                          newActions[index] = e.target.value;
                          setMeetingDetails({...meetingDetails, followUpActions: newActions});
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newActions = meetingDetails.followUpActions.filter((_, i) => i !== index);
                          setMeetingDetails({...meetingDetails, followUpActions: newActions});
                        }}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMeetingDetails({
                      ...meetingDetails, 
                      followUpActions: [...meetingDetails.followUpActions, '']
                    })}
                    className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    + Add Follow-up Action
                  </button>
                </div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Application Form</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(visaApplication.status)}`}>
                {visaApplication.status}
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
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Supporting Documents</h3>
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
      case 6:
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
      case 7:
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
      case 8:
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Visa Application Tracker</h2>
          
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="border border-gray-200 rounded-lg dark:border-gray-700">
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  <div className="flex items-center">
                    <div className={getStepIndicatorClass(index, step.status)}>
                      {step.status === "COMPLETED" ? (
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