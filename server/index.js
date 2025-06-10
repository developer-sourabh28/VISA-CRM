import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

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


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm')
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

//sending email to client whenever there is hotel cancellation or flight cancellation
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body, isHtml } = req.body;
  
  try {
    // Configure your email service (Gmail, SendGrid, etc.)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bansotiyas@gmail.com',
        pass: 'pqlw fykm iads lxfy' // Consider using environment variables for security
      }
    });

    await transporter.sendMail({
      from: 'bansotiyas@gmail.com',
      to: to,
      subject: subject,
      html: body // Use html instead of text to properly render HTML content
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.json({ success: false, message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
