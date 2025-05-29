import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const VISA_TYPES = ['Tourist', 'Business', 'Student', 'Work', 'Transit'];
const DOCUMENT_OPTIONS = [
  'Passport Copy',
  'Photograph',
  'Flight Booking',
  'Hotel Booking',
  'Bank Statement',
  'Invitation Letter',
  'Employment Letter',
];

export default function Destination() {
  const [destinations, setDestinations] = useState([]);
  const [formData, setFormData] = useState({
    country: '',
    visaType: VISA_TYPES[0],
    processingTime: '',
    validity: '',
    stayPeriod: '',
    embassyFee: '',
    serviceFee: '',
    requiredDocuments: [],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch destinations on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/destinations')
      .then(res => res.json())
      .then(data => setDestinations(data))
      .catch(() => setDestinations([]));
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox selection
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      requiredDocuments: checked
        ? [...prev.requiredDocuments, value]
        : prev.requiredDocuments.filter(doc => doc !== value),
    }));
  };

  // Submit destination
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save destination');
      }
      const saved = await res.json();
      setDestinations(prev => [...prev, saved]);
      setFormData({
        country: '',
        visaType: VISA_TYPES[0],
        processingTime: '',
        validity: '',
        stayPeriod: '',
        embassyFee: '',
        serviceFee: '',
        requiredDocuments: [],
        notes: '',
      });
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete destination
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this destination?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/destinations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete destination');
      }
      setDestinations(prev => prev.filter(dest => dest._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/destinations/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update destination');
      }
      const updatedDest = await res.json();
      setDestinations(prev => prev.map(dest => (dest._id === editingId ? updatedDest : dest)));
      setShowForm(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        country: '',
        visaType: VISA_TYPES[0],
        processingTime: '',
        validity: '',
        stayPeriod: '',
        embassyFee: '',
        serviceFee: '',
        requiredDocuments: [],
        notes: '',
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  } 

  return (
    <div className="max-w-8xl mx-auto p-6 bg-white rounded shadow">
      {/* Header and Add button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Destinations</h2>
        <button
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
          onClick={() => {
            setShowForm(true);
            setIsEditing(false);
            setFormData({
              country: '',
              visaType: VISA_TYPES[0],
              processingTime: '',
              validity: '',
              stayPeriod: '',
              embassyFee: '',
              serviceFee: '',
              requiredDocuments: [],
              notes: '',
            });
          }}
        >
          Add Destination
        </button>
      </div>

      {/* Add Destination Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Destination' : 'Add New Destination'}</h2>
            <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <input
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
                required
                className="border p-2 rounded"
              />
              <select
                name="visaType"
                value={formData.visaType}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              >
                {VISA_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                name="processingTime"
                placeholder="Processing Time"
                value={formData.processingTime}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                name="validity"
                placeholder="Validity"
                value={formData.validity}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                name="stayPeriod"
                placeholder="Stay Period"
                value={formData.stayPeriod}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                name="embassyFee"
                placeholder="Embassy Fee"
                value={formData.embassyFee}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                name="serviceFee"
                placeholder="Service Fee"
                value={formData.serviceFee}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <div className="md:col-span-2">
                <label className="block font-medium mb-1">Required Documents:</label>
                <div className="flex flex-wrap gap-3">
                  {DOCUMENT_OPTIONS.map(doc => (
                    <label key={doc} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        value={doc}
                        checked={formData.requiredDocuments.includes(doc)}
                        onChange={handleCheckboxChange}
                      />
                      {doc}
                    </label>
                  ))}
                </div>
              </div>
              <textarea
                name="notes"
                placeholder="Notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="border p-2 rounded md:col-span-2"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white py-2 px-4 rounded md:col-span-2 hover:bg-gray-800 transition"
              >
                {loading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Destination' : 'Add Destination')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Destination Table */}
      <h2 className="text-2xl font-semibold mb-4 mt-8">Existing Destinations</h2>
<div className="overflow-x-auto">
  <table className="w-full table-auto border border-gray-300 text-sm text-left">
    <thead className="bg-gray-100">
      <tr>
        <th className="border border-gray-300 px-4 py-2">Country</th>
        <th className="border border-gray-300 px-4 py-2">Visa Type</th>
        <th className="border border-gray-300 px-4 py-2">Processing Time</th>
        <th className="border border-gray-300 px-4 py-2">Validity</th>
        <th className="border border-gray-300 px-4 py-2">Stay Period</th>
        <th className="border border-gray-300 px-4 py-2">Embassy Fee</th>
        <th className="border border-gray-300 px-4 py-2">Service Fee</th>
        <th className="border border-gray-300 px-4 py-2">Required Documents</th>
        <th className="border border-gray-300 px-4 py-2">Notes</th>
        <th className="border border-gray-300 px-4 py-2">Action</th>
      </tr>
    </thead>
    <tbody>
      {destinations.map(dest => (
        <tr key={dest._id} className="hover:bg-gray-50">
          <td className="border border-gray-300 px-4 py-2">{dest.country}</td>
          <td className="border border-gray-300 px-4 py-2">{dest.visaType}</td>
          <td className="border border-gray-300 px-4 py-2">{dest.processingTime}</td>
          <td className="border border-gray-300 px-4 py-2">{dest.validity}</td>
          <td className="border border-gray-300 px-4 py-2">{dest.stayPeriod}</td>
          <td className="border border-gray-300 px-4 py-2">{dest.embassyFee}</td>
          <td className="border border-gray-300 px-4 py-2">{dest.serviceFee}</td>
          <td className="border border-gray-300 px-4 py-2">
            {Array.isArray(dest.requiredDocuments) ? dest.requiredDocuments.join(', ') : dest.requiredDocuments}
          </td>
          <td className="border border-gray-300 px-4 py-2">{dest.notes}</td>
          {/* Add Delete Button */}
          <td className=" px-4 py-2 flex flex-row">
            <button
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              onClick={() => handleDelete(dest._id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 ml-2 transition"
              onClick={() => {
                setShowForm(true);
                setIsEditing(true);
                setEditingId(dest._id);
                setFormData({
                  country: dest.country || '',
                  visaType: dest.visaType || VISA_TYPES[0],
                  processingTime: dest.processingTime || '',
                  validity: dest.validity || '',
                  stayPeriod: dest.stayPeriod || '',
                  embassyFee: dest.embassyFee || '',
                  serviceFee: dest.serviceFee || '',
                  requiredDocuments: Array.isArray(dest.requiredDocuments) ? dest.requiredDocuments : [],
                  notes: dest.notes || '',
                });
              }}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

    </div>
  );
}
