import Enquiry from '../models/Enquiry.js';
import { createBirthdayReminder } from './reminderController.js';

export const createEnquiry = async (req, res) => {
  try {
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