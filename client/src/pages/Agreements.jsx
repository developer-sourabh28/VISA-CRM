import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileText, Trash2, Eye, Download } from 'lucide-react';

const Agreements = () => {
  const [showNewAgreementForm, setShowNewAgreementForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  useEffect(() => {
    if (showNewAgreementForm) {
      fetchBranches();
    }
  }, [showNewAgreementForm]);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/branches');
      const data = await response.json();
      if (response.ok) {
        setBranches(data.branches);
      } else {
        console.error('Failed to fetch branches:', data.message);
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/agreements');
      const data = await response.json();

      if (response.ok) {
        const regularAgreements = data.map((item) => ({
          id: item._id,
          branchName: item.branch_name,
          fileName: item.pdf_url,
          filePath: `/api/agreements/file/${item.pdf_url}`,
          source: 'regular'
        }));

        const enquiryResponse = await fetch('http://localhost:5000/api/enquiries/agreements');
        const enquiryData = await enquiryResponse.json();

        const enquiryAgreements = enquiryData.map((item) => ({
          id: item._id,
          branchName: item.branchName || 'Enquiry Agreement',
          fileName: item.fileName,
          filePath: `/api/enquiries/agreements/file/${item.fileName}`,
          source: 'enquiry'
        }));

        setAgreements([...regularAgreements, ...enquiryAgreements]);
      } else {
        console.error('Failed to fetch agreements:', data.message);
        setAgreements([]);
      }
    } catch (error) {
      console.error('Error fetching agreements:', error);
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    } else {
      alert('Please upload only PDF files');
    }
  };

  const handleSubmitAgreement = async () => {
    if (selectedBranch && uploadedFile) {
      setLoading(true);
      const formData = new FormData();
      formData.append('branchName', selectedBranch);
      formData.append('pdf', uploadedFile);

      try {
        const response = await fetch('http://localhost:5000/api/agreements/agreement', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          alert('Agreement uploaded successfully!');
          await fetchAgreements();
          setShowNewAgreementForm(false);
          setSelectedBranch('');
          setUploadedFile(null);
        } else {
          alert(data.message || 'Upload failed');
        }
      } catch (error) {
        alert('Error uploading agreement');
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please select branch and upload PDF file');
    }
  };

  const handleDeleteAgreement = async (branchName) => {
    if (window.confirm(`Are you sure you want to delete the agreement for ${branchName}?`)) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/agreements/${encodeURIComponent(branchName)}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
          alert('Agreement deleted successfully!');
          await fetchAgreements();
        } else {
          alert(data.message || 'Delete failed');
        }
      } catch (error) {
        alert('Error deleting agreement');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewPDF = (filePath) => {
    window.open(`http://localhost:5000${filePath}`, '_blank');
  };

  const handleDownloadPDF = async (filePath, fileName) => {
    try {
      const response = await fetch(`http://localhost:5000${filePath}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Agreement Management</h1>
          <button
            onClick={() => setShowNewAgreementForm(true)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Agreement
          </button>
        </div>
      </div>

      {showNewAgreementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Agreement</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Branch Name
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading || branchesLoading}
              >
                <option value="">
                  {branchesLoading ? 'Loading branches...' : 'Choose a branch...'}
                </option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch.branchName}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Agreement PDF
              </label>
              <div className="border-2 border-dashed p-6 text-center rounded-lg">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer text-blue-600 font-medium ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  Click to upload PDF file
                </label>
                {uploadedFile && <p className="mt-2 text-sm text-green-600">Selected: {uploadedFile.name}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewAgreementForm(false);
                  setSelectedBranch('');
                  setUploadedFile(null);
                }}
                className="flex-1 px-4 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAgreement}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {loading ? 'Uploading...' : 'Upload Agreement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Branch Agreements</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading agreements...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50 dark:bg-blue-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Branch Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Agreement PDF</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Source</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agreements.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No agreements found.</td>
                    </tr>
                  ) : (
                    agreements.map((agreement) => (
                      <tr key={agreement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">{agreement.branchName}</td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-red-600" />
                          <span>{agreement.fileName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            agreement.source === 'enquiry'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {agreement.source === 'enquiry' ? 'Enquiry' : 'Regular'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewPDF(agreement.filePath)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View PDF"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(agreement.filePath, agreement.fileName)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Download PDF"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAgreement(agreement.branchName)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Agreement"
                              disabled={loading}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agreements;
