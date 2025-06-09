import express from 'express';
import Enquiry from '../models/Enquiry.js';
import Client from '../models/Client.js';

const router = express.Router();

// Add test endpoint to verify duplicate check
router.get('/test-duplicate-check', async (req, res) => {
  try {
    // Get all enquiries and clients for testing
    const allEnquiries = await Enquiry.find({}, 'email phone');
    const allClients = await Client.find({}, 'email phone');

    res.json({
      success: true,
      message: 'Test endpoint working',
      counts: {
        enquiries: allEnquiries.length,
        clients: allClients.length
      },
      sampleData: {
        enquiries: allEnquiries.slice(0, 5), // Show first 5 enquiries
        clients: allClients.slice(0, 5) // Show first 5 clients
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error in test endpoint', 
      error: error.message 
    });
  }
});

// Modify the check-duplicate-user endpoint to add more logging
router.post('/check-duplicate-user', async (req, res) => {
  try {
    const { email, phone } = req.body;
    console.log('Checking for duplicates:', { email, phone });

    if (!email && !phone) {
      return res.status(400).json({
        exists: false,
        message: 'Either email or phone must be provided'
      });
    }

    // Check in enquiries collection
    const existingEnquiry = await Enquiry.findOne({
      $or: [
        { email: email || '' },
        { phone: phone || '' }
      ]
    });

    console.log('Enquiry check result:', existingEnquiry);

    if (existingEnquiry) {
      console.log('Found duplicate in enquiries');
      return res.json({
        exists: true,
        type: 'enquiry',
        userData: {
          _id: existingEnquiry._id,
          firstName: existingEnquiry.firstName,
          lastName: existingEnquiry.lastName,
          email: existingEnquiry.email,
          phone: existingEnquiry.phone
        }
      });
    }

    // Check in clients collection
    const existingClient = await Client.findOne({
      $or: [
        { email: email || '' },
        { phone: phone || '' }
      ]
    });

    console.log('Client check result:', existingClient);

    if (existingClient) {
      console.log('Found duplicate in clients');
      return res.json({
        exists: true,
        type: 'client',
        userData: {
          _id: existingClient._id,
          firstName: existingClient.firstName,
          lastName: existingClient.lastName,
          email: existingClient.email,
          phone: existingClient.phone
        }
      });
    }

    console.log('No duplicates found');
    return res.json({
      exists: false
    });

  } catch (error) {
    console.error('Error checking duplicate user:', error);
    res.status(500).json({ 
      exists: false,
      message: 'Error checking for duplicate user', 
      error: error.message 
    });
  }
});

export default router; 