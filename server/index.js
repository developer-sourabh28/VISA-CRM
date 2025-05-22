import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';


// Routes
import enquiryRoutes from './router/enquiryRoute.js';
import authRoutes from './router/authRoutes.js';
import clientRoutes from './router/clientRoutes.js';
import branchRoutes from './router/branchRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);                                  
  });

// Routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/auth', authRoutes);

// Root Route
app.use('/api/branches', branchRoutes);
 
//client route

app.use('/api/clients',clientRoutes)
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
