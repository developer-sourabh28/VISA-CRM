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
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status, 
      visaType, 
      consultant, 
      branchId, 
      startDate, 
      endDate,
      visaCountry
    } = req.query;

    const query = {};

    // Filter by branch if specified
    if (branchId && branchId !== 'all') {
      query.branchId = branchId;
    }

    // Filter by user role - admins can see all clients, others can only see assigned clients
    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
    if (!isAdmin && req.user) {
      query.assignedTo = req.user._id;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (visaType) query.visaType = visaType;
    if (visaCountry) query.visaCountry = { $regex: visaCountry, $options: 'i' };
    if (consultant) query.assignedConsultant = consultant;

    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: endOfDay
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $lte: endOfDay };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;

    const total = await Client.countDocuments(query);
    
    const clients = await Client.find(query)
      .populate('branchId', 'branchName')
      .populate('assignedTo', 'fullName employeeId email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: clients,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error in getClients:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get distinct visa countries from clients
export const getDistinctVisaCountries = async (req, res) => {
  try {
    const countries = await Client.distinct('visaCountry');
    const filteredCountries = countries.filter(c => c).sort(); // Filter out null/empty values and sort
    res.status(200).json({
      success: true,
      data: filteredCountries
    });
  } catch (error) {
    console.error('Error fetching distinct visa countries:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get distinct consultants from clients
export const getDistinctConsultants = async (req, res) => {
  try {
    const consultants = await Client.distinct('assignedConsultant');
    const filteredConsultants = consultants.filter(c => c).sort();
    res.status(200).json({
      success: true,
      data: filteredConsultants
    });
  } catch (error) {
    console.error('Error fetching distinct consultants:', error);
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

// @desc    Get client by email
export const getClientByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const client = await Client.findOne({ email }).populate(
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

    // Before updating, remove createdAt if present
    if (req.body.createdAt) {
      delete req.body.createdAt;
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
        const { enquiryId, assignedTo } = req.body;
        console.log("Converting enquiry to client:", { enquiryId, assignedTo });

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

        const nextClientId = await getNextClientId();

        // Create new client with validated data
        const newClient = new Client({
            clientId: nextClientId,
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
            assignedTo: assignedTo || enquiry.assignedTo || null,
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

        console.log("Created new client object with assigned team member:", 
            { assignedTo: newClient.assignedTo, clientId: newClient._id });

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
        const enquiryMeetings = await EnquiryMeeting.find({ enquiryId: enquiry._id });
        if (enquiryMeetings && enquiryMeetings.length > 0) {
            let consultantName = "";
            if (req.user && req.user._id) {
                const consultant = await User.findOne({ _id: req.user._id });
                if (consultant) {
                    consultantName = consultant.firstName + ' ' + consultant.lastName;
                }
            } else if (enquiry.assignedConsultant) {
                consultantName = enquiry.assignedConsultant;
            }

            for (const meeting of enquiryMeetings) {
                const clientMeetingData = {
                    clientId: newClient._id,
                    meetingType: meeting.meetingType || 'INITIAL_CONSULTATION',
                    dateTime: meeting.dateTime,
                    platform: meeting.platform,
                    status: meeting.status,
                    notes: meeting.notes,
                    assignedTo: consultantName
                };
                await ClientMeeting.create(clientMeetingData);
            }
            await EnquiryMeeting.deleteMany({ enquiryId: enquiry._id });
        }

        // Update related records
        if (enquiry._id) {
            await OtherApplicantDetail.updateMany(
                { clientId: enquiry._id },
                { $set: { clientId: newClient._id } }
            );
        }

        // Mark the enquiry as converted to client
        enquiry.isClient = true;
        await enquiry.save();

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

async function getNextClientId() {
  // Find the client with the highest clientId
  const lastClient = await Client.findOne({ clientId: { $regex: /^C\d{6}$/ } })
    .sort({ clientId: -1 })
    .lean();

  let nextNumber = 1;
  if (lastClient && lastClient.clientId) {
    const num = parseInt(lastClient.clientId.slice(1), 10);
    if (!isNaN(num)) nextNumber = num + 1;
  }

  // Ensure uniqueness by checking for existing clientId
  let newClientId;
  let exists = true;
  while (exists) {
    newClientId = `C${String(nextNumber).padStart(6, '0')}`;
    exists = await Client.exists({ clientId: newClientId });
    if (exists) nextNumber++;
  }
  return newClientId;
}
