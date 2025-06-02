import VisaTracker from '../models/VisaTracker.js';
import { uploadToGridFS, getFileFromGridFS } from '../utils/gridFsUtils.js';
import mongoose from 'mongoose';
import Client from '../models/client.js';
import Branch from '../models/Branch.js';

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
    
    // Find the client first to get their branch
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // If client doesn't have a branch, assign the default branch
    if (!client.branchId) {
      const defaultBranch = await Branch.findOne();
      if (!defaultBranch) {
        return res.status(500).json({ message: 'No default branch found in the system' });
      }
      client.branchId = defaultBranch._id;
      await client.save();
    }

    // Now find or create the visa tracker
    let visaTracker = await VisaTracker.findOne({ clientId })
      .populate('clientId', 'firstName lastName email branchId')
      .populate('branchId', 'branchName branchLocation');

    if (!visaTracker) {
      visaTracker = new VisaTracker({
        clientId,
        branchId: client.branchId,
        overallStatus: 'NOT_STARTED',
        agreement: {
          type: 'Standard',
          status: 'DRAFT',
          completed: false
        },
        progress: {
          completedSteps: 0,
          totalSteps: 7,
          percentage: 0
        }
      });
      await visaTracker.save();
    }

    res.json(visaTracker);
  } catch (error) {
    console.error('Error in getVisaTracker:', error);
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

// ============= AGREEMENT SECTION =============

// Create/Update agreement details
export const createAgreement = async (req, res) => {
  try {
    const { clientId } = req.params;
    const agreementData = req.body;

    // Handle file upload
    if (req.file) {
      const fileUrl = await uploadToGridFS(req.file);
      agreementData.documentUrl = fileUrl;
    }

    // Mark as completed if status is SIGNED
    if (agreementData.status === 'SIGNED') {
      agreementData.completed = true;
    }

    // Fetch the tracker first
    const visaTracker = await VisaTracker.findOne({ clientId });
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Merge new data with existing agreement (if any)
    visaTracker.agreement = {
      ...((visaTracker.agreement && visaTracker.agreement.toObject) ? visaTracker.agreement.toObject() : visaTracker.agreement || {}),
      ...agreementData
    };

    // Calculate progress after update
    visaTracker.calculateProgress();
    await visaTracker.save();

    res.json({ message: 'Agreement created/updated successfully', agreement: visaTracker.agreement });
  } catch (error) {
    console.error('Error in createAgreement:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get agreement details
export const getAgreement = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.agreement);
  } catch (error) {
    console.error('Error in getAgreement:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============= MEETING SECTION =============

// Create/Update meeting details
export const createMeeting = async (req, res) => {
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

    res.json({ message: 'Meeting created/updated successfully', meeting: visaTracker.meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get meeting details
export const getMeeting = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= DOCUMENT COLLECTION SECTION =============

// Create/Update document collection
export const createDocumentCollection = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documents, collectionStatus } = req.body;

    // Handle file uploads if present
    if (req.files) {
      for (let i = 0; i < documents.length; i++) {
        if (req.files[i]) {
          const fileUrl = await uploadToGridFS(req.files[i]);
          documents[i].fileUrl = fileUrl;
          documents[i].uploadDate = new Date();
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

    res.json({ message: 'Document collection created/updated successfully', documentCollection: visaTracker.documentCollection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get document collection details
export const getDocumentCollection = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.documentCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= VISA APPLICATION SECTION =============

// Create/Update visa application
export const createVisaApplication = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaApplicationData = req.body;

    // Debug logs
    console.log('Searching for clientId:', clientId);

    const tracker = await VisaTracker.findOne({ clientId });

    console.log('Found tracker:', tracker);

    if (!tracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    // Handle file upload
    if (req.file) {
      const fileUrl = await uploadToGridFS(req.file);
      visaApplicationData.formFileUrl = fileUrl;
    }

    // Mark as completed if status is SUBMITTED
    if (visaApplicationData.status === 'SUBMITTED') {
      visaApplicationData.completed = true;
      visaApplicationData.submissionDate = new Date();
    }

    // Update visa application data
    tracker.visaApplication = visaApplicationData;

    // Recalculate progress
    tracker.calculateProgress();

    await tracker.save();

    res.json({
      message: 'Visa application created/updated successfully',
      visaApplication: tracker.visaApplication
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateVisaTrackerStep = async (req, res) => {
  const { clientId, step } = req.params;
  const { status, date } = req.body;

  try {
    const visaTracker = await VisaTracker.findOne({ clientId });

    if (!visaTracker) {
      return res.status(404).json({ error: 'Visa tracker not found for the given client' });
    }

    if (!visaTracker.steps.hasOwnProperty(step)) {
      return res.status(400).json({ error: 'Invalid step name' });
    }

    visaTracker.steps[step] = {
      status: status || visaTracker.steps[step].status,
      date: date || visaTracker.steps[step].date,
    };

    await visaTracker.save();

    res.status(200).json(visaTracker);
  } catch (error) {
    console.error('Error updating visa tracker step:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Get visa application details
export const getVisaApplication = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.visaApplication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= SUPPORTING DOCUMENTS SECTION =============

// Create/Update supporting documents
export const createSupportingDocuments = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documents, preparationStatus } = req.body;

    // Handle file uploads if present
    if (req.files) {
      for (let i = 0; i < documents.length; i++) {
        if (req.files[i]) {
          const fileUrl = await uploadToGridFS(req.files[i]);
          documents[i].fileUrl = fileUrl;
          documents[i].preparationDate = new Date();
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

    res.json({ message: 'Supporting documents created/updated successfully', supportingDocuments: visaTracker.supportingDocuments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get supporting documents details
export const getSupportingDocuments = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.supportingDocuments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= PAYMENT SECTION =============

// Create/Update payment details
export const createPayment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const paymentData = req.body;

    // Mark as completed if payment is received
    if (paymentData.status === 'RECEIVED') {
      paymentData.completed = true;
      paymentData.paymentDate = new Date();
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

    res.json({ message: 'Payment created/updated successfully', payment: visaTracker.payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment details
export const getPayment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= APPOINTMENT SECTION =============

// Create/Update embassy appointment
export const createAppointment = async (req, res) => {
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

    res.json({ message: 'Appointment created/updated successfully', appointment: visaTracker.appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get appointment details
export const getAppointment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= VISA OUTCOME SECTION =============

// Create/Update visa outcome
export const createVisaOutcome = async (req, res) => {
  try {
    const { clientId } = req.params;
    const outcomeData = req.body;

    // Mark as completed if decision is made
    if (outcomeData.status === 'APPROVED' || outcomeData.status === 'REJECTED') {
      outcomeData.completed = true;
      outcomeData.decisionDate = new Date();
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

    res.json({ message: 'Visa outcome created/updated successfully', visaOutcome: visaTracker.visaOutcome });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get visa outcome details
export const getVisaOutcome = async (req, res) => {
  try {
    const { clientId } = req.params;
    const visaTracker = await VisaTracker.findOne({ clientId });
    
    if (!visaTracker) {
      return res.status(404).json({ message: 'Visa tracker not found' });
    }

    res.json(visaTracker.visaOutcome);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= LEGACY UPDATE METHODS (for backward compatibility) =============

// export const updateAgreement = async (req, res) => {
//   return await createAgreement(req, res);
// };

export const updateMeeting = async (req, res) => {
  return await createMeeting(req, res);
};

export const updateDocumentCollection = async (req, res) => {
  return await createDocumentCollection(req, res);
};

export const updateVisaApplication = async (req, res) => {
  return await createVisaApplication(req, res);
};

export const updateSupportingDocuments = async (req, res) => {
  return await createSupportingDocuments(req, res);
};

export const updatePayment = async (req, res) => {
  return await createPayment(req, res);
};

export const updateAppointment = async (req, res) => {
  return await createAppointment(req, res);
};

export const updateVisaOutcome = async (req, res) => {
  return await createVisaOutcome(req, res);
};