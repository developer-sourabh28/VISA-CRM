import Client from '../models/Client.js';
import Enquiry from '../models/Enquiry.js';
import Branch from '../models/Branch.js';
import mongoose from 'mongoose';
import OtherApplicantDetail from '../models/OtherApplicantDetail.js';
import EnquiryPayment from '../models/EnquiryPayment.js';
import Payment from '../models/Payment.js';
import EnquiryAgreement from '../models/EnquiryAgreement.js';
import VisaAgreement from '../models/visaTracker/visaAgreement.js';
import EnquiryMeeting from '../models/EnquiryMeeting.js';
import ClientMeeting from '../models/ClientMeeting.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// @desc    Get all clients
export const getClients = async (req, res) => {
  try {
    const { branch } = req.query;
    
    // Get branch ID from branch name
    let branchFilter = {};
    if (branch) {
      const branchDoc = await Branch.findOne({ branchName: branch });
      if (branchDoc) {
        branchFilter = { branchId: branchDoc._id };
        console.log(`Found branch ID ${branchDoc._id} for branch ${branch}`);
      } else {
        console.log(`Branch not found: ${branch}`);
      }
    }

    console.log('Using branch filter:', branchFilter);

    const clients = await Client.find(branchFilter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error in getClients:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single client
export const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate(
      'assignedConsultant',
      'firstName lastName email'
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new client
export const createClient = async (req, res) => {
  try {
    // Remove createdAt if accidentally sent from client
    if (req.body.createdAt) {
      delete req.body.createdAt;
    }

    // Get user's branch from token
    const userBranch = req.user.branch;
    if (!userBranch) {
      return res.status(400).json({ 
        success: false, 
        message: 'User branch not found in token' 
      });
    }

    // Get branch details
    const userBranchDoc = await Branch.findOne({ branchName: userBranch });
    if (!userBranchDoc) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch not found in database' 
      });
    }

    // Set the branchId based on user's branch
    // If user is from a specific branch, use that branch
    // If user has access to all branches, use the branchId from request or default branch
    let branchId = userBranchDoc._id;
    if (userBranchDoc.branchId === 'all' && req.body.branchId) {
      const requestedBranch = await Branch.findOne({ branchId: req.body.branchId });
      if (requestedBranch) {
        branchId = requestedBranch._id;
      }
    }

    const clientData = {
      ...req.body,
      branchId
    };

    const client = new Client(clientData);
    await client.save();

    // Populate branch details before sending response
    const populatedClient = await Client.findById(client._id)
      .populate('branchId', 'branchName branchLocation branchId')
      .populate('assignedConsultant', 'firstName lastName email');

    res.status(201).json({ success: true, data: populatedClient });
  } catch (error) {
    console.error('Error in createClient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client
export const updateClient = async (req, res) => {
  try {
    let client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName email');

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    await client.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get client statistics
export const getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'Active' });

    const nationalityStats = await Client.aggregate([
      { $group: { _id: '$nationality', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const assignmentStats = await Client.aggregate([
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newClients = await Client.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        totalClients,
        activeClients,
        newClients,
        nationalityStats,
        assignmentStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// get client by id
export const getClientById = async (clientId) => {
  try {
    const response = await fetch(`/api/clients/${clientId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch client details');
    }
    
    const result = await response.json();
    
    // Access the data property as per your API response structure
    return result.data;
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
  }
};


//client convert api

// @desc    Convert enquiry to client
export const convertEnquiryToClient = async (req, res) => {
    try {
        const { enquiryId } = req.body;
        console.log("Converting enquiry to client:", { enquiryId });

        if (!enquiryId) {
            return res.status(400).json({ success: false, message: 'Enquiry ID is required' });
        }

        const enquiry = await Enquiry.findById(enquiryId);
        console.log("Found enquiry:", enquiry);

        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found' });
        }

        // Validate required fields from enquiry
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'passportNumber', 'dateOfBirth', 'nationality'];
        const missingFields = requiredFields.filter(field => !enquiry[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields', 
                errors: missingFields.reduce((acc, field) => {
                    acc[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
                    return acc;
                }, {})
            });
        }

        // Find the branch based on the branch name
        let branch;
        if (enquiry.branchId) {
            branch = await Branch.findById(enquiry.branchId);
            console.log("Found branch by ID:", branch);
        } else {
            branch = await Branch.findOne({ branchName: enquiry.branch });
            console.log("Found branch by name:", branch);
        }

        if (!branch) {
            // If no branch is found, get the default branch
            branch = await Branch.findOne();
            console.log("Using default branch:", branch);
            if (!branch) {
                return res.status(400).json({ success: false, message: 'No branch found in the system' });
            }
        }

        // Check if a client with the same email already exists
        if (!req.body.allowDuplicate) {
            const existingClient = await Client.findOne({ email: enquiry.email });
            if (existingClient) {
                return res.status(409).json({ 
                    success: false, 
                    message: `A client with email ${enquiry.email} already exists. Please use a different email or update the existing client.`,
                    existingClientId: existingClient._id
                });
            }
        }

        // Create new client with validated data
        const newClient = new Client({
            firstName: enquiry.firstName,
            lastName: enquiry.lastName,
            email: enquiry.email,
            phone: enquiry.phone,
            address: enquiry.address || {},
            passportNumber: enquiry.passportNumber,
            dateOfBirth: new Date(enquiry.dateOfBirth) || new Date(),
            nationality: enquiry.nationality,
            profileImage: enquiry.profileImage || '',
            assignedConsultant: enquiry.assignedConsultant || null,
            visaType: enquiry.visaType || 'Other',
            visaCountry: enquiry.visaCountry || enquiry.destinationCountry || 'Not Specified',
            visaStatus: {
                status: 'Active',
                notes: enquiry.notes || '',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            notes: enquiry.notes || '',
            status: "Active",
            branchId: branch._id,
            applicantId: enquiry.enquiryId || `ENQ-${Date.now()}`
        });

        console.log("Created new client object:", newClient);

        // Validate the client data before saving
        const validationError = newClient.validateSync();
        if (validationError) {
            console.log("Client validation error:", validationError);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationError.errors
            });
        }

        await newClient.save();
        console.log("Saved new client:", newClient);

        // Migrate Payments
        const enquiryPayments = await EnquiryPayment.find({ enquiryId: enquiry._id });
        if (enquiryPayments.length > 0) {
            const paymentsToCreate = enquiryPayments.map(p => {
                // Map enquiry payment method to client payment method enum values
                let paymentMethod = 'Other';
                if (p.method) {
                    const method = p.method.toLowerCase();
                    if (method.includes('credit card') || method.includes('card')) {
                        paymentMethod = 'Credit Card';
                    } else if (method.includes('cash')) {
                        paymentMethod = 'Cash';
                    } else if (method.includes('upi')) {
                        paymentMethod = 'UPI';
                    } else if (method.includes('bank') || method.includes('transfer')) {
                        paymentMethod = 'Bank Transfer';
                    } else if (method.includes('cheque')) {
                        paymentMethod = 'Cheque';
                    } else if (method.includes('online')) {
                        paymentMethod = 'Online Transfer';
                    }
                }

                return {
                    clientId: newClient._id,
                    amount: p.amount,
                    date: p.date,
                    paymentMethod: paymentMethod,
                    description: p.description,
                    status: 'Completed',
                    paymentType: 'Full Payment', 
                    dueDate: p.date, 
                    serviceType: 'Consultation', 
                    recordedBy: p.recordedBy
                };
            });
            await Payment.insertMany(paymentsToCreate);
            await EnquiryPayment.deleteMany({ enquiryId: enquiry._id });
        }

        // Migrate Agreement
        const enquiryAgreement = await EnquiryAgreement.findOne({ enquiryId: enquiry._id });
        if (enquiryAgreement) {
            await VisaAgreement.create({
                clientId: newClient._id,
                branchId: newClient.branchId,
                agreement: {
                    type: 'Standard',
                    sentDate: enquiryAgreement.agreementDate,
                    status: enquiryAgreement.agreementStatus === 'SIGNED' ? 'SIGNED' : 'DRAFT',
                    notes: enquiryAgreement.notes,
                    documentUrl: enquiryAgreement.agreementFile
                }
            });
            await EnquiryAgreement.deleteOne({ _id: enquiryAgreement._id });
        }

        // Migrate Meeting
        const enquiryMeeting = await EnquiryMeeting.findOne({ enquiryId: enquiry._id });
        if (enquiryMeeting) {
            const consultant = await User.findOne({ _id: req.user._id });
            if (consultant) {
                await ClientMeeting.create({
                    clientId: newClient._id,
                    meetingType: enquiryMeeting.meetingType || 'INITIAL_CONSULTATION',
                    dateTime: enquiryMeeting.dateTime,
                    platform: enquiryMeeting.platform,
                    status: enquiryMeeting.status,
                    notes: enquiryMeeting.notes,
                    assignedTo: consultant.firstName + ' ' + consultant.lastName
                });
            }
            await EnquiryMeeting.deleteOne({ _id: enquiryMeeting._id });
        }

        // Update related records
        if (enquiry._id) {
            await OtherApplicantDetail.updateMany(
                { clientId: enquiry._id },
                { $set: { clientId: newClient._id } }
            );
        }

        await enquiry.deleteOne();
        console.log("Deleted original enquiry");

        return res.status(201).json({
            success: true,
            message: "Enquiry converted to client successfully.",
            data: newClient
        });

    } catch (error) {
        console.error("Error in convertEnquiryToClient:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getClientPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ clientId: req.params.id });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getClientAgreements = async (req, res) => {
    try {
        const agreements = await VisaAgreement.find({ clientId: req.params.id });
        res.status(200).json({ success: true, data: agreements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getClientAppointments = async (req, res) => {
    try {
        const meetings = await ClientMeeting.find({ clientId: req.params.id });
        res.status(200).json({ success: true, data: meetings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
