import VisaAgreement from "../../models/visaTracker/visaAgreement.js";
import VisaTracker from "../../models/VisaTracker.js";
import { uploadToGridFS } from "../../utils/gridFsUtils.js";
import Client from "../../models/Client.js";
import Branch from "../../models/Branch.js";

export const createOrUpdateAgreement = async (req, res) => {
  try {
    const { clientId } = req.params;
    const agreementData = req.body;

    // Find the client to get their branch
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

    // Handle file upload
    let documentUrl = null;
    if (req.file) {
      documentUrl = await uploadToGridFS(req.file);
    }

    // Prepare agreement data
    const agreementUpdate = {
      type: agreementData.type || 'Standard',
      sentDate: agreementData.sentDate || null,
      clientSignatureDate: agreementData.clientSignatureDate || null,
      status: agreementData.status || 'DRAFT',
      notes: agreementData.notes || '',
      completed: agreementData.status === 'SIGNED'
    };

    // If we have a new document URL, add it to the update
    if (documentUrl) {
      agreementUpdate.documentUrl = documentUrl;
    }

    // Update or create agreement in VisaAgreement collection
    const agreement = await VisaAgreement.findOneAndUpdate(
      { clientId },
      { 
        $set: { 
          clientId,
          branchId: client.branchId,
          agreement: agreementUpdate
        }
      },
      { new: true, upsert: true }
    );

    // Also update the VisaTracker
    const visaTracker = await VisaTracker.findOneAndUpdate(
      { clientId },
      { 
        $set: { 
          agreement: agreementUpdate
        }
      },
      { new: true, upsert: true }
    );

    // Calculate progress if tracker exists
    if (visaTracker) {
      visaTracker.calculateProgress();
      await visaTracker.save();
    }

    res.json({ 
      success: true,
      message: 'Agreement created/updated successfully', 
      agreement: agreement.agreement,
      progress: visaTracker?.progress
    });
  } catch (error) {
    console.error('Error in createOrUpdateAgreement:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getAgreement = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // First check VisaTracker
    const visaTracker = await VisaTracker.findOne({ clientId })
      .populate('branchId', 'branchName');
    
    if (visaTracker?.agreement) {
      return res.json({
        success: true,
        agreement: {
          ...visaTracker.agreement,
          branch_name: visaTracker.branchId?.branchName
        }
      });
    }

    // If not found in VisaTracker, check VisaAgreement
    const agreement = await VisaAgreement.findOne({ clientId })
      .populate('branchId', 'branchName');
    
    if (!agreement) {
      return res.status(404).json({ 
        success: false,
        message: 'Agreement not found' 
      });
    }
    
    res.json({
      success: true,
      agreement: {
        ...agreement.agreement,
        branch_name: agreement.branchId?.branchName
      }
    });
  } catch (error) {
    console.error('Error in getAgreement:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};