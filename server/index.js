import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Routes
import enquiryRoutes from './router/enquiryRoute.js';
import authRoutes from './router/authRoutes.js';
import clientRoutes from './router/clientRoutes.js';
import branchRoutes from './router/branchRoutes.js';
import visaRoutes from './router/visaRoutes.js';
import agreementRoutes from './router/agreementRoutes.js';
import dashboardRoutes from './router/dashboardRoutes.js';
import deadlineRoutes from './router/deadlineRoute.js';
import teamManagementRoutes from './router/settings/teamManagementRoute.js';
import destinationRoutes from './router/settings/destination.js';
import Currency from './router/settings/currencyRoute.js';
import hotelRoute from "./router/settings/hotelRoute.js";
import flightRoute from "./router/settings/flightRoute.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);                                  
  });




// Routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/team-members', teamManagementRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/currencies', Currency);
app.use("/api/hotels", hotelRoute);
app.use("/api/flights", flightRoute);
 
//client route

app.use('/api/clients',clientRoutes)
app.use('/api', visaRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/agreements', agreementRoutes);
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
