import mongoose from "mongoose";

const currency = new mongoose.Schema({
  label: String,
  value: String,
  amount: Number,
  fromCurrency: String,
  toCurrency: String,
  convertedAmount: String,
  date: String,
});

const Currency = mongoose.model('Currrency', currency);
export default Currency;
