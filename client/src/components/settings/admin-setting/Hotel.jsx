import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pencil, Trash } from "lucide-react";

// Use the new GIF as the only background image
const backgroundGif =
  "https://i.pinimg.com/originals/43/b7/ca/43b7ca0c4a18e5a4730141105e5d2c67.gif";

export default function Hotel() {
  const [hotels, setHotels] = useState([]);
  const [form, setForm] = useState({ name: "", location: "", bookingUrl: "" });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Fetch hotels
  useEffect(() => {
    axios.get("/api/hotels").then((res) => setHotels(res.data));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form._id) {
        // EDIT: update existing hotel
        const res = await axios.put(`/api/hotels/${form._id}`, form);
        setHotels((prev) =>
          prev.map((hotel) =>
            hotel._id === form._id ? res.data : hotel
          )
        );
      } else {
        // CREATE: add new hotel
        const res = await axios.post("/api/hotels", form);
        setHotels((prev) => [...prev, res.data]);
      }
      setForm({ name: "", location: "", bookingUrl: "" });
      setShowForm(false);
    } catch (err) {
      alert("Failed to save hotel");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    try {
      await axios.delete(`/api/hotels/${id}`);
      setHotels((prev) => prev.filter((hotel) => hotel._id !== id));
    } catch (err) {
      alert("Failed to delete hotel");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden z-0">
      {/* Background image layer */}
      <div
        className="w-full absolute inset-0 bg-cover bg-center transition-opacity duration-1000 z-[-1]"
        style={{
          backgroundImage: `url(${backgroundGif})`,
        }}
      />

      {/* Overlay to improve readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50 z-0" />

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
            Hotel List
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded shadow w-full sm:w-auto"
          >
            + Add Hotel
          </button>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-2">
            <div className="bg-white text-black p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">
                Add New Hotel
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <input
                  name="name"
                  placeholder="Hotel Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 sm:p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="location"
                  placeholder="Location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 sm:p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="bookingUrl"
                  placeholder="Booking URL"
                  value={form.bookingUrl}
                  onChange={handleChange}
                  required
                  className="w-full border p-2 sm:p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 rounded shadow"
                >
                  {loading ? "Saving..." : "Save Hotel"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Table of Hotels */}
        <div className="backdrop-blur-md bg-white/30 border border-white/30 shadow-md rounded-lg overflow-hidden">
          <h3 className="text-lg sm:text-xl font-semibold p-3 sm:p-4 border-b bg-blur-sm text-white">
            Saved Hotels
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium border-b">
                    Hotel Name
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium border-b">
                    Location
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium border-b">
                    Booking
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 font-medium border-b">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel) => (
                  <tr key={hotel._id} className="bg-blur-sm hover:bg-gray-50 ">
                    <td className="px-3 sm:px-6 py-2 sm:py-4 border-b">
                      {hotel.name}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 border-b">
                      {hotel.location}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 border-b">
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1 rounded shadow">
                          View
                        </button>
                      </a>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 border-b">
                      <div className="flex gap-2">
                        <button
                          className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 sm:px-4 py-1 rounded shadow"
                          onClick={() => {
                            setForm({
                              name: hotel.name,
                              location: hotel.location,
                              bookingUrl: hotel.bookingUrl,
                              _id: hotel._id,
                            });
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1 rounded shadow"
                          onClick={() => handleDelete(hotel._id)}
                        >
                          <Trash className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {hotels.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-3 sm:px-6 py-2 sm:py-4 text-center text-gray-500"
                    >
                      No hotels found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
