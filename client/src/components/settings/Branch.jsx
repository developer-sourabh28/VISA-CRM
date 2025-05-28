import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    branchName: '',
    branchLocation: '',
    branchId: '',
    email: '',
    contactNo: '',
    head: {
      name: '',
      contactNo: '',
      email: '',
      gender: 'Male',
    }
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        } else if (Array.isArray(data.branches)) {
          setBranches(data.branches);
        } else {
          console.error('Invalid branches data:', data);
          setBranches([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch branches:', err);
        setBranches([]);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('head.')) {
      const headKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        head: {
          ...prev.head,
          [headKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Branch?")) return;
    console.log("Deleting branch with id:", id);
    try {
      await axios.delete(`/api/branches/${id}`);
      setBranches((prev) => prev.filter((branch) => branch._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete Branch");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to add branch');
      const saved = await res.json();
      setBranches(prev => [...prev, saved]);
      setFormData({
        branchName: '',
        branchLocation: '',
        branchId: '',
        email: '',
        contactNo: '',
        head: {
          name: '',
          contactNo: '',
          email: '',
          gender: 'Male',
        }
      });
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Branches</h2>
        <button
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
          onClick={() => setShowForm(true)}
        >
          Add Branch
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Add New Branch</h2>
            <form onSubmit={handleSubmit} className="space-y-3 max-h-[75vh] overflow-y-auto">
              <input
                name="branchName"
                placeholder="Branch Name"
                value={formData.branchName}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="branchLocation"
                placeholder="Location"
                value={formData.branchLocation}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="branchId"
                placeholder="Branch ID"
                value={formData.branchId}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="email"
                placeholder="Branch Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="contactNo"
                placeholder="Branch Contact No"
                value={formData.contactNo}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />

              <hr />
              <h3 className="font-semibold">Head Information</h3>
              <input
                name="head.name"
                placeholder="Head Name"
                value={formData.head.name}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="head.email"
                placeholder="Head Email"
                value={formData.head.email}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="head.contactNo"
                placeholder="Head Contact No"
                value={formData.head.contactNo}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <select
                name="head.gender"
                value={formData.head.gender}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white py-2 px-4 rounded w-full hover:bg-gray-800 transition"
              >
                {loading ? 'Saving...' : 'Add Branch'}
              </button>
            </form>
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-3">Existing Branches</h3>
      <div className="overflow-x-auto rounded shadow">
        {Array.isArray(branches) && branches.length > 0 ? (
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-4 py-2 text-left font-medium min-w-[140px]">Branch Name</th>
                <th className="border px-4 py-2 text-left font-medium min-w-[140px]">Location</th>
                <th className="border px-4 py-2 text-left font-medium min-w-[180px]">Email</th>
                <th className="border px-4 py-2 text-left font-medium min-w-[120px]">Contact</th>
                <th className="border px-4 py-2 text-left font-medium min-w-[120px]">Head</th>
                <th className="border px-4 py-2 text-left font-medium min-w-[120px]">Head Contact</th>
                <th className="border px-4 py-2 text-left font-medium min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch._id} className="even:bg-gray-50">
                  <td className="border px-4 py-2">{branch.branchName}</td>
                  <td className="border px-4 py-2">{branch.branchLocation}</td>
                  <td className="border px-4 py-2">{branch.email}</td>
                  <td className="border px-4 py-2">{branch.contactNo}</td>
                  <td className="border px-4 py-2">{branch.head?.name}</td>
                  <td className="border px-4 py-2">{branch.head?.contactNo}</td>
                  <td className="border px-4 py-2">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      onClick={() => handleDelete(branch._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No branches available.</p>
        )}
      </div>
    </div>
  );
}
