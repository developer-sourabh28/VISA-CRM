import OtherApplicantDetail from '../models/OtherApplicantDetail.js';
import mongoose from 'mongoose';

// Create new OtherApplicantDetails
export const createOtherApplicantDetail = async (req, res) => {
  try {
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);
    console.log('Files received:', req.files ? req.files.length : 'No files');
    
    const { clientId } = req.body;
    let applicantsData = req.body.applicants;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'clientId is required.' });
    }
    if (!applicantsData) {
      return res.status(400).json({ success: false, message: 'Applicants data is required.' });
    }
    
    // If applicantsData is a string, parse it. This happens with multipart/form-data
    if (typeof applicantsData === 'string') {
      try {
        applicantsData = JSON.parse(applicantsData);
      } catch (e) {
        console.error('Error parsing applicants data:', e);
        return res.status(400).json({ success: false, message: 'Invalid applicants JSON format.' });
      }
    }

    if (!Array.isArray(applicantsData)) {
      return res.status(400).json({ success: false, message: 'Applicants data must be an array.' });
    }

    const files = req.files || [];
    console.log('Processing files:', files.map(f => ({ 
      filename: f.filename,
      originalname: f.originalname
    })));
    
    const createdDetails = [];
    let fileIndex = 0;

    for (let i = 0; i < applicantsData.length; i++) {
      const applicant = applicantsData[i];
      let documentInfo = null;

      // Check the flag from the frontend to see if a file should be associated
      if (applicant.hasDocument) {
        if (files[fileIndex]) {
          const file = files[fileIndex];
          documentInfo = {
            filename: file.filename,
            originalname: file.originalname
          };
          console.log(`Assigning file ${file.filename} to applicant ${i + 1}`);
          fileIndex++;
        } else {
          console.warn(`Expected file for applicant ${i + 1} but none was found`);
        }
      }

      // Remove the temporary flag before saving
      const { hasDocument, ...applicantToSave } = applicant;

      try {
        const newDetail = new OtherApplicantDetail({
          ...applicantToSave,
          clientId: new mongoose.Types.ObjectId(clientId),
          document: documentInfo ? documentInfo.filename : null
        });

        await newDetail.save();
        console.log(`Successfully saved applicant ${i + 1} details:`, {
          id: newDetail._id,
          name: newDetail.name,
          document: newDetail.document
        });
        createdDetails.push(newDetail);
      } catch (saveError) {
        console.error(`Error saving applicant ${i + 1} details:`, saveError);
        // Continue with other applicants even if one fails
        continue;
      }
    }

    if (createdDetails.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to save any applicant details.' 
      });
    }

    if (createdDetails.length < applicantsData.length) {
      return res.status(207).json({
        success: true,
        message: 'Some applicant details were saved successfully, but others failed.',
        data: createdDetails
      });
    }

    res.status(201).json({ 
      success: true, 
      data: createdDetails, 
      message: 'All applicant details saved successfully.' 
    });
  } catch (error) {
    console.error('Error in createOtherApplicantDetail:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while saving applicant details.' 
    });
  }
};

// Get all OtherApplicantDetails for a client
export const getOtherApplicantDetails = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ success: false, message: 'clientId is required' });

    // Use new mongoose.Types.ObjectId(clientId) to avoid ObjectId error
    const details = await OtherApplicantDetail.find({ clientId: new mongoose.Types.ObjectId(clientId) }).sort({ createdAt: -1 });
    res.json({ success: true, data: details });
  } catch (error) {
    console.error('Error in getOtherApplicantDetails:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOtherApplicantDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await OtherApplicantDetail.findById(id);
    
    if (!detail) {
      return res.status(404).json({ 
        success: false, 
        message: 'Detail not found' 
      });
    }

    await detail.deleteOne();
    res.json({ success: true, message: 'OtherApplicantDetail deleted' });
  } catch (error) {
    console.error('Error in deleteOtherApplicantDetail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};