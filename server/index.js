import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import facebookLeadRoutes from './routes/facebookLeadRoutes.js';
import reportsRoutes from './routes/reports.js';

import path from 'path';
import { fileURLToPath } from 'url';
import { createDefaultBranch } from './controllers/branchController.js';

// Utils
import { initGridFS } from './utils/gridFsUtils.js';

// Routes
import enquiryRoutes from './router/enquiryRoute.js';
import authRoutes from './router/authRoutes.js';
import clientRoutes from './router/clientRoutes.js';
import branchRoutes from './router/branchRoutes.js';
import visaRoutes from './router/visaRoutes.js';
import agreementRoutes from './router/agreementRoutes.js';
import dashBoardRoutes from './router/dashBoardRoutes.js';
import deadlineRoutes from './router/deadlineRoute.js';
import teamManagementRoutes from './router/settings/teamManagementRoute.js';
import destinationRoutes from './router/settings/destination.js';
import Currency from './router/settings/currencyRoute.js';
import hotelRoute from "./router/settings/hotelRoute.js";
import flightRoute from "./router/settings/flightRoute.js";
import reminderRouter from "./router/reminderRouter.js";
import visaAgreementRoutes from "./router/visaTracker/visaAgreementRoutes.js";
import visaTrackerRoutes from "./router/visaTrackerRouter.js";
import emailTemplateRoutes from './router/emailTemplateRoutes.js';
import roleRoutes from './router/settings/roleRoute.js';
import messagesRouter from './routes/messages.js';
import appointmentRoutes from './router/appointmentRoutes.js';
import paymentRoutes from './routes/payments.js';
import whatsappTemplateRoutes from './router/whatsappTemplateRoutes.js';


// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Collections:', await mongoose.connection.db.listCollections().toArray());
    
    // Initialize GridFS
    initGridFS();
    // Create default branch if none exists
    try {
      await createDefaultBranch();
    } catch (error) {
      console.error('Error creating default branch:', error);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    console.error('Please check your MongoDB connection string in .env file');
    process.exit(1);
  });

// Routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/dashboard', dashBoardRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/team-members', teamManagementRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/currencies', Currency);
app.use("/api/hotels", hotelRoute);
app.use("/api/flights", flightRoute);
app.use("/api/reminders", reminderRouter);
app.use("/api/visa-trackers", visaAgreementRoutes);
app.use("/api/visa-tracker", visaTrackerRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/messages', messagesRouter);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/whatsapp-templates', whatsappTemplateRoutes);
app.use('/api/facebook-leads', facebookLeadRoutes);
app.use('/api/reports', reportsRoutes);

//sending email to client whenever there is hotel cancellation or flight cancellation
// REMOVED: Redundant email sending endpoint moved to emailTemplateController.js

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
