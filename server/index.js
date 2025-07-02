import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import facebookLeadRoutes from './routes/facebookLeadRoutes.js';
import reportsRoutes from './routes/reports.js';
import connectDB from './config/db.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import User from './models/User.js';

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
import invoiceTemplateRoutes from './router/invoiceTemplateRoutes.js';
import notificationRoutes from './router/notificationRoutes.js';
import otherApplicantDetailRoutes from './router/otherApplicantDetailRoutes.js';
import adminRoutes from './router/adminRoutes.js';
import upload from './middleware/upload.js';


// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO server
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
});

// Online users map: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  // Listen for user login event
  socket.on('user-online', (user) => {
    if (user && user.userId) {
      onlineUsers.set(user.userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
    }
  });

  // Listen for user disconnect
  socket.on('disconnect', () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });

  // Listen for private messages
  socket.on('private-message', ({ senderId, recipientId, message }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private-message', { senderId, message });
    }
  });
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json());

// Connect to MongoDB
connectDB(); // Just connect, don't use the returned db

const dbPromise = new Promise((resolve, reject) => {
  mongoose.connection.once('open', () => resolve(mongoose.connection.db));
  mongoose.connection.on('error', reject);
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
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoice-templates', invoiceTemplateRoutes);
app.use('/api/admin', adminRoutes);

//sending email to client whenever there is hotel cancellation or flight cancellation
// REMOVED: Redundant email sending endpoint moved to emailTemplateController.js

app.post('/api/test-upload', upload.array('documents'), (req, res) => {
  console.log('Files:', req.files);
  res.json({ success: true, files: req.files });
});

// Use this:
app.use('/api/other-applicant-details', otherApplicantDetailRoutes);

// Replace app.listen with server.listen
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
