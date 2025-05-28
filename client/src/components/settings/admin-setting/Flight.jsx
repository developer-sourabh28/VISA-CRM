import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Flight() {
  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState({ name: "", location: "", bookingUrl: "" });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    axios.get("/api/flights").then((res) => setFlights(res.data));
  }, []);

  // ...existing code...
const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this flight?")) return;
  try {
    await axios.delete(`/api/flights/${id}`);
    setFlights((prev) => prev.filter((flight) => flight._id !== id));
  } catch (err) {
    alert("Failed to delete hotel");
  }
};
// ...existing code...

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/flights", form);
      setFlights((prev) => [...prev, res.data]);
      setForm({ name: "", location: "", bookingUrl: "" });
      setShowForm(false);
    } catch (err) {
      alert("Failed to save flight");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Flight List</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow"
        >
          + Add Flight
        </button>
      </div>

      {/* Modal Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Add New Flight
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                placeholder="Flight Name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
                required
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="bookingUrl"
                placeholder="Booking URL"
                value={form.bookingUrl}
                onChange={handleChange}
                required
                className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded shadow"
              >
                {loading ? "Saving..." : "Save Flight"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h3 className="text-xl font-semibold p-4 border-b bg-gray-100 text-gray-700">
          Saved Flights
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="px-6 py-3 font-medium border-b">Flight Name</th>
                <th className="px-6 py-3 font-medium border-b">Location</th>
                <th className="px-6 py-3 font-medium border-b">Booking</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b">{flight.name}</td>
                  <td className="px-6 py-4 border-b">{flight.location}</td>
                  <td className="px-6 py-4 border-b">
                    <a
                      href={flight.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded shadow">
                        View
                      </button>
                    </a>
                  </td>
                  <td className="px-6 py-4 border-b">
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded shadow"
          onClick={() => handleDelete(flight._id)}
        >
          Delete
        </button>
      </td>
                </tr>
              ))}
              {flights.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No flights found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
