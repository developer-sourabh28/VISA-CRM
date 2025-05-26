import React, { useEffect, useState } from 'react';

import { getAgreementByBranch, uploadAgreementForBranch } from '../lib/api';


import { ChevronDown, Download, Upload, Eye } from 'lucide-react';


export default function VisaApplicationTracker({ client }) {
  const [expandedItem, setExpandedItem] = useState(0);
  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Get client's branch name - adjust according to your client data structure
  const clientBranchName = "indore";

  useEffect(() => {
    fetchAgreementData();
  }, [clientBranchName]);

  const fetchAgreementData = async () => {
    if (!clientBranchName || clientBranchName === "default") {
      setError("No branch information found for this client");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching agreement for branch: ${clientBranchName}`);
      const data = await getAgreementByBranch(clientBranchName);
      setAgreementData(data);
      
      if (!data) {
        console.log(`No agreement found for branch: ${clientBranchName}`);
      }
    } catch (err) {
      console.error("Error fetching agreement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    const fileInput = e.target.querySelector('input[type="file"]');
    if (!fileInput.files[0]) {
      alert('Please select a PDF file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('pdf', fileInput.files[0]);

      console.log(`Uploading agreement for branch: ${clientBranchName}`);
      await uploadAgreementForBranch(clientBranchName, formData);
      
      alert('Agreement uploaded successfully!');
      
      // Refresh agreement data
      await fetchAgreementData();
      setUploadMode(false);
      
      // Reset form
      fileInput.value = '';
      
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Send Agreement",
      status: agreementData ? "COMPLETED" : "IN PROGRESS"
    },
    {
      id: 2,
      title: "Schedule Meeting", 
      status: "NOT STARTED"
    },
    {
      id: 3,
      title: "Upload Documents",
      status: "NOT STARTED"
    },
    {
      id: 4,
      title: "Payment Collection",
      status: "NOT STARTED"
    },
    {
      id: 5,
      title: "Appointment Booking",
      status: "NOT STARTED"
    },
    {
      id: 6,
      title: "Final Submission",
      status: "NOT STARTED"
    }
  ];

  const handleToggle = (index) => {
    setExpandedItem(expandedItem === index ? -1 : index);
  };

  const getStatusClass = (status) => {
    switch(status) {
      case "COMPLETED":
        return "bg-green-100 text-green-600";
      case "IN PROGRESS":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getStepIndicatorClass = (index, status) => {
    if (status === "COMPLETED") return 'bg-green-500 text-white';
    if (index === 0) return 'bg-blue-500 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Visa Application Process</h1>
          <p className="text-sm text-gray-600">
            Client: {client?.firstName} {client?.lastName} | Branch: {clientBranchName}
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
          <div 
            className="h-2 bg-blue-500 rounded-full absolute top-0 left-0" 
            style={{ width: agreementData ? '33.33%' : '16.67%' }}
          ></div>

          {/* Step indicators */}
          <div className="flex justify-between -mt-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center mt-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStepIndicatorClass(index, step.status)}`}>
                  {step.id}
                </div>
                <span className="text-xs mt-1 text-gray-600 text-center max-w-16">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps detail */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-md shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => handleToggle(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStepIndicatorClass(index, step.status)}`}>
                    {step.id}
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded px-2 py-1 ${getStatusClass(step.status)}`}>
                    {step.status}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedItem === index ? 'transform rotate-180' : ''}`} />
                </div>
              </div>

              {expandedItem === index && (
                <div className="p-4 border-t border-gray-100">
                  {index === 0 ? (
                    <div className="space-y-4">
                      {/* Loading State */}
                      {loading && (
                        <div className="flex items-center justify-center py-4">
                          <div className="text-sm text-gray-600">Loading agreement data...</div>
                        </div>
                      )}

                      {/* Error State */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                          <p className="font-medium">Error loading agreement:</p>
                          <p className="text-sm">{error}</p>
                        </div>
                      )}

                      {/* No Agreement Found */}
                      {!loading && !error && !agreementData && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                          <p className="font-medium">No Agreement Found</p>
                          <p className="text-sm">No agreement exists for branch: {clientBranchName}</p>
                        </div>
                      )}

                      {/* Existing Agreement Display */}
                      {!loading && agreementData && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-green-800">Agreement Available</p>
                              <p className="text-sm text-green-600">Branch: {agreementData.branch_name}</p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`http://localhost:5000${agreementData.pdf_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <Eye size={14} />
                                View PDF
                              </a>
                              <a
                                href={`http://localhost:5000${agreementData.pdf_url}`}
                                download
                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                              >
                                <Download size={14} />
                                Download
                              </a>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setUploadMode(!uploadMode)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                          >
                            <Upload size={14} />
                            {uploadMode ? 'Cancel Update' : 'Update Agreement'}
                          </button>
                        </div>
                      )}

                      {/* Upload Form */}
                      {(uploadMode || (!loading && !agreementData)) && (
                        <form onSubmit={handleUpload} className="space-y-4 border-t pt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {agreementData ? 'Upload New Agreement PDF' : 'Upload Agreement PDF'}
                            </label>
                            <input
                              type="file"
                              accept=".pdf"
                              className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              disabled={uploading}
                            />
                            <p className="text-xs text-gray-500 mt-1">Only PDF files are allowed</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={uploading}
                              className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Upload size={16} />
                              {uploading ? 'Uploading...' : (agreementData ? 'Update Agreement' : 'Upload Agreement')}
                            </button>
                            
                            {uploadMode && (
                              <button
                                type="button"
                                onClick={() => setUploadMode(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      Content for {step.title} step goes here. This area can be expanded to show detailed information and actions related to this step.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}