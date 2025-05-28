import VisaTracker from '../models/VisaTracker.js';
import { uploadToGridFS, getFileFromGridFS } from '../utils/gridFsUtils.js';

// Create a new visa tracker for a client
export const createVisaTracker = async (req, res) => {
  try {
    const { clientId, branchId } = req.body;
    
    const existingTracker = await VisaTracker.findOne({ clientId });
    if (existingTracker) {
      return res.status(400).json({ message: 'Visa tracker already exists for this client' });
    }

    const visaTracker = new VisaTracker({
      clientId,
      branchId,
      overallStatus: 'NOT_STARTED',
      progress: {
        completedSteps: 0,
        totalSteps: 7,
        percentage: 0
      }
    });

    await visaTracker.save();
    res.status(201).json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get visa tracker by client ID
export const getVisaTracker = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId })
      .populate('clientId', 'firstName lastName email')
      .populate('branchId', 'name');
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all visa trackers with progress
export const getAllVisaTrackers = async (req, res) => {
  try {
    const visaTrackers = await VisaTracker.find()
      .populate('clientId', 'firstName lastName email')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    res.json(visaTrackers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update agreement details
export const updateAgreement = async (req, res) => {
  try {
    const { clientId } = req.params;
    const agreementData = req.body;
    
    if (req.file) {
      const fileUrl = await uploadToGridFS(req.file);
      agreementData.documentUrl = fileUrl;
    }

    // Mark as completed if status is SIGNED
    if (agreementData.status === 'SIGNED') {
      agreementData.completed = true;
    }

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { $set: { agreement: agreementData } },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update meeting details
export const updateMeeting = async (req, res) => {
  try {
    const { clientId } = req.params;
    const meetingData = req.body;

    // Mark as completed if meeting has been held
    if (meetingData.scheduledDate && new Date(meetingData.scheduledDate) < new Date()) {
      meetingData.completed = true;
    }

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { $set: { meeting: meetingData } },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update document collection
export const updateDocumentCollection = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documents, collectionStatus } = req.body;

    // Handle file uploads if present
    if (req.files) {
      for (let i = 0; i < documents.length; i++) {
        if (req.files[i]) {
          const fileUrl = await uploadToGridFS(req.files[i]);
          documents[i].fileUrl = fileUrl;
        }
      }
    }

    // Mark as completed if all documents are verified
    const allVerified = documents.every(doc => doc.verificationStatus === 'VERIFIED');
    const completed = collectionStatus === 'COMPLETED' && allVerified;

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { 
        $set: { 
          documentCollection: {
            documents,
            collectionStatus,
            completed
          }
        }
      },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update visa application
export const updateVisaApplication = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaApplicationData = req.body;

    if (req.file) {
      const fileUrl = await uploadToGridFS(req.file);
      visaApplicationData.formFileUrl = fileUrl;
    }

    // Mark as completed if application is submitted
    if (visaApplicationData.status === 'SUBMITTED') {
      visaApplicationData.completed = true;
    }

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { $set: { visaApplication: visaApplicationData } },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update supporting documents
export const updateSupportingDocuments = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documents, preparationStatus } = req.body;

    // Handle file uploads if present
    if (req.files) {
      for (let i = 0; i < documents.length; i++) {
        if (req.files[i]) {
          const fileUrl = await uploadToGridFS(req.files[i]);
          documents[i].fileUrl = fileUrl;
        }
      }
    }

    // Mark as completed if all documents are prepared
    const completed = preparationStatus === 'COMPLETED' && documents.length > 0;

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { 
        $set: { 
          supportingDocuments: {
            documents,
            preparationStatus,
            completed
          }
        }
      },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment details
export const updatePayment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const paymentData = req.body;

    // Mark as completed if payment is received
    if (paymentData.status === 'RECEIVED') {
      paymentData.completed = true;
    }

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { $set: { payment: paymentData } },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update embassy appointment
export const updateAppointment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const appointmentData = req.body;

    // Mark as completed if appointment is attended
    if (appointmentData.status === 'ATTENDED') {
      appointmentData.completed = true;
    }

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { $set: { appointment: appointmentData } },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update visa outcome
export const updateVisaOutcome = async (req, res) => {
  try {
    const { clientId } = req.params;
    const outcomeData = req.body;

    // Mark as completed if decision is made
    if (outcomeData.status === 'APPROVED' || outcomeData.status === 'REJECTED') {
      outcomeData.completed = true;
    }

    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { $set: { visaOutcome: outcomeData } },
      { new: true }
    );

    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json(visaTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all visa trackers for a branch
export const getBranchVisaTrackers = async (req, res) => {
  try {
    const { branchId } = req.params;
    const visaTrackers = await VisaTracker.find({ branchId })
      .populate('clientId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json(visaTrackers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 