import mongoose from "mongoose";

const flightSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  bookingUrl: { type: String, required: true },
});

const Flight = mongoose.model("Flight", flightSchema);
export default Flight;