import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileText, Trash2, Eye, Download } from 'lucide-react';

const Agreements = () => {
  const [showNewAgreementForm, setShowNewAgreementForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]); // Add this line
  const [branchesLoading, setBranchesLoading] = useState(false); // Add this line

  // Add this useEffect after the existing one:
  useEffect(() => {
    if (showNewAgreementForm) {
      fetchBranches();
    }
  }, [showNewAgreementForm]);
  // Add this function after fetchAgreements:
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
  // Fetch all agreements on component mount
  useEffect(() => {
    fetchAgreements();
  }, []);
  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/agreements');
      const data = await response.json();

      if (response.ok) {
        // API returns an array, so map it to your expected structure
        const formattedAgreements = data.map((item, index) => ({
          id: index, // or if your API has an ID, use that instead
          branchName: item.branch_name,
          fileName: item.pdf_url,
          filePath: '/' + item.pdf_url // adjust if your file path needs a prefix
        }));

        setAgreements(formattedAgreements);
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
          // Refresh the agreements list
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

  const handleDeleteAgreement = async (agreementId, branchName) => {
    if (window.confirm(`Are you sure you want to delete the agreement for ${branchName}?`)) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/agreements/${agreementId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
          alert('Agreement deleted successfully!');
          // Refresh the agreements list
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

  const handleViewPDF = (filePath, fileName) => {
    // Open PDF in new tab
    window.open(`http://localhost:5000${filePath}`, '_blank');
  };

  const handleDownloadPDF = (filePath, fileName) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000${filePath}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Agreement Management</h1>
            <button
              onClick={() => setShowNewAgreementForm(true)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={20} />
              New Agreement
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* New Agreement Form Modal */}
        {showNewAgreementForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Agreement</h2>

              {/* Branch Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Branch Name
                </label>
               
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Agreement PDF
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer text-blue-600 hover:text-blue-800 font-medium ${loading ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Click to upload PDF file
                  </label>
                  {uploadedFile && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewAgreementForm(false);
                    setSelectedBranch('');
                    setUploadedFile(null);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAgreement}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors"
                >
                  {loading ? 'Uploading...' : 'Upload Agreement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agreements Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Branch Agreements</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading agreements...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Branch Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Agreement PDF</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {agreements.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                        No agreements found. Upload your first agreement to get started.
                      </td>
                    </tr>
                  ) : (
                    agreements.map((agreement) => (
                      <tr key={agreement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{agreement.branchName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            <span className="text-sm text-gray-700">{agreement.fileName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewPDF(agreement.filePath, agreement.fileName)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View PDF"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(agreement.filePath, agreement.fileName)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAgreement(agreement.id, agreement.branchName)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Agreement"
                              disabled={loading}
                            >
                              <Trash2 size={16} />
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

        {/* Summary Card */}
        <div className="mt-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Agreements</p>
                <p className="text-2xl font-bold text-gray-900">{agreements.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agreements;