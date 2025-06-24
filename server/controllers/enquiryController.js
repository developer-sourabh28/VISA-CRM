import Enquiry from '../models/Enquiry.js';
import { createBirthdayReminder } from './reminderController.js';

export const createEnquiry = async (req, res) => {
  try {
    const requiredFields = ['enquiryId', 'firstName', 'lastName', 'email', 'phone', 'nationality', 'currentCountry', 'visaType', 'destinationCountry'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    // Check for duplicate enquiryId
    const existingEnquiryId = await Enquiry.findOne({ enquiryId: req.body.enquiryId });
    if (existingEnquiryId) {
      return res.status(409).json({
        success: false,
        message: 'An enquiry with this Enquiry ID already exists.',
        type: 'enquiry',
        userData: {
          _id: existingEnquiryId._id,
          enquiryId: existingEnquiryId.enquiryId,
          firstName: existingEnquiryId.firstName,
          lastName: existingEnquiryId.lastName,
          email: existingEnquiryId.email,
          phone: existingEnquiryId.phone
        }
      });
    }

    const enquiry = await Enquiry.create(req.body);
    
    // Create birthday reminder if date of birth is provided
    if (enquiry.dateOfBirth) {
      try {
        await createBirthdayReminder(enquiry);
        console.log('Birthday reminder created successfully for:', enquiry.firstName);
      } catch (reminderError) {
        console.error('Error creating birthday reminder:', reminderError);
        // Don't fail the enquiry creation if reminder creation fails
      }
    }

    res.status(201).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error('Error in createEnquiry:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}; 