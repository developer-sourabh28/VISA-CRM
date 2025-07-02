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
        const { enquiryId, assignedTo, allowDuplicate } = req.body;
        console.log("Converting enquiry to client:", { enquiryId, assignedTo, allowDuplicate });

        if (!enquiryId) {
            return res.status(400).json({ success: false, message: 'Enquiry ID is required' });
        }

        const enquiry = await Enquiry.findById(enquiryId);
        console.log("Found enquiry:", enquiry ? { 
            id: enquiry._id,
            email: enquiry.email,
            name: `${enquiry.firstName} ${enquiry.lastName}` 
        } : "Not found");

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
            console.log("Found branch by ID:", branch ? branch.branchName : "Not found");
        } else {
            branch = await Branch.findOne({ branchName: enquiry.branch });
            console.log("Found branch by name:", branch ? branch.branchName : "Not found");
        }

        if (!branch) {
            // If no branch is found, get the default branch
            branch = await Branch.findOne();
            console.log("Using default branch:", branch ? branch.branchName : "Not found");
            if (!branch) {
                return res.status(400).json({ success: false, message: 'No branch found in the system' });
            }
        }

        // Check for existing client with the same email
        const existingClient = await Client.findOne({ email: enquiry.email });
        let clientId;
        let wasCreated = false;

        if (existingClient) {
            console.log(`Found existing client with email ${enquiry.email}`, { 
                id: existingClient._id, 
                name: `${existingClient.firstName} ${existingClient.lastName}`
            });
            
            // If duplicate not allowed and not forcing update
            if (!allowDuplicate) {
                return res.status(409).json({ 
                    success: false, 
                    message: `A client with email ${enquiry.email} already exists. Please use a different email or update the existing client.`,
                    existingClientId: existingClient._id
                });
            }

            // Update the existing client with new data from enquiry
            const updateFields = {
                firstName: enquiry.firstName || existingClient.firstName,
                lastName: enquiry.lastName || existingClient.lastName,
                phone: enquiry.phone || existingClient.phone,
                address: enquiry.address || existingClient.address || {},
                passportNumber: enquiry.passportNumber || existingClient.passportNumber,
                dateOfBirth: new Date(enquiry.dateOfBirth) || existingClient.dateOfBirth,
                nationality: enquiry.nationality || existingClient.nationality,
                profileImage: enquiry.profileImage || existingClient.profileImage,
                assignedConsultant: enquiry.assignedConsultant || existingClient.assignedConsultant,
                assignedTo: assignedTo || enquiry.assignedTo || existingClient.assignedTo,
                visaType: enquiry.visaType || existingClient.visaType,
                visaCountry: enquiry.visaCountry || enquiry.destinationCountry || existingClient.visaCountry,
                notes: enquiry.notes ? 
                    (existingClient.notes ? `${existingClient.notes}\n\nAdditional notes from enquiry: ${enquiry.notes}` : enquiry.notes) 
                    : existingClient.notes,
                lastUpdated: new Date()
            };
            
            await Client.findByIdAndUpdate(existingClient._id, { $set: updateFields }, { new: true });
            console.log(`Updated existing client: ${existingClient._id}`);
            clientId = existingClient._id;
            wasCreated = false;
        } else {
            // Create new client if no duplicate exists
            const clientData = {
                firstName: enquiry.firstName,
                lastName: enquiry.lastName,
                email: enquiry.email,
                phone: enquiry.phone,
                address: enquiry.address || {},
                passportNumber: enquiry.passportNumber,
                dateOfBirth: new Date(enquiry.dateOfBirth),
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
            };

            const newClient = new Client(clientData);
            console.log("Creating new client with data:", { 
                email: clientData.email,
                name: `${clientData.firstName} ${clientData.lastName}`
            });
            
            // Save the new client
            const savedClient = await newClient.save();
            console.log(`Created new client: ${savedClient._id}`);
            clientId = savedClient._id;
            wasCreated = true;
        }

        // Get the client object for further operations
        const client = await Client.findById(clientId);

        // Migrate Payments
        const enquiryPayments = await EnquiryPayment.find({ enquiryId: enquiry._id });
        console.log(`Found ${enquiryPayments.length} payments to migrate`);
        
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
                    clientId: client._id,
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
            
            // Insert new payments
            await Payment.insertMany(paymentsToCreate);
            await EnquiryPayment.deleteMany({ enquiryId: enquiry._id });
            console.log(`Migrated ${paymentsToCreate.length} payments`);
        }

        // Migrate Agreement
        const enquiryAgreement = await EnquiryAgreement.findOne({ enquiryId: enquiry._id });
        if (enquiryAgreement) {
            console.log("Migrating agreement");
            await VisaAgreement.create({
                clientId: client._id,
                branchId: client.branchId,
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
            console.log(`Migrating ${enquiryMeetings.length} meetings`);
            let consultantName = "";
            if (req.user && req.user._id) {
                const consultant = await User.findOne({ _id: req.user._id });
                if (consultant) {
                    consultantName = consultant.fullName || `${consultant.firstName || ''} ${consultant.lastName || ''}`.trim();
                }
            } else if (enquiry.assignedConsultant) {
                consultantName = enquiry.assignedConsultant;
            }

            for (const meeting of enquiryMeetings) {
                const clientMeetingData = {
                    clientId: client._id,
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
            const updatedCount = await OtherApplicantDetail.updateMany(
                { clientId: enquiry._id },
                { $set: { clientId: client._id } }
            );
            console.log(`Updated ${updatedCount.modifiedCount} related applicant records`);
        }

        // Delete the original enquiry
        await Enquiry.findByIdAndDelete(enquiry._id);
        console.log("Deleted original enquiry");

        return res.status(201).json({
            success: true,
            message: wasCreated 
                ? "Enquiry converted to client successfully."
                : "Enquiry merged with existing client successfully.",
            data: client
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

// @desc    Check if client email exists
// @route   GET /api/clients/check-email
// @access  Private
export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const client = await Client.findOne({ email });
    
    return res.status(200).json({
      success: true,
      data: {
        exists: !!client,
        clientId: client ? client._id : null
      }
    });
  } catch (error) {
    console.error('Error checking client email:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Fix duplicate client conversion
// @route   POST /api/clients/fix-duplicate-conversion
// @access  Private
export const fixDuplicateConversion = async (req, res) => {
  try {
    const { enquiryId, assignedTo } = req.body;
    
    if (!enquiryId) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry ID is required'
      });
    }
    
    // Find the enquiry
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    
    // Find the existing client
    const existingClient = await Client.findOne({ email: enquiry.email });
    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'No matching client found with this email'
      });
    }
    
    console.log(`Fixing duplicate conversion - Merging enquiry ${enquiryId} with client ${existingClient._id}`);
    
    // Update client data
    const updateFields = {
      firstName: enquiry.firstName || existingClient.firstName,
      lastName: enquiry.lastName || existingClient.lastName,
      phone: enquiry.phone || existingClient.phone,
      address: enquiry.address || existingClient.address || {},
      passportNumber: enquiry.passportNumber || existingClient.passportNumber,
      dateOfBirth: enquiry.dateOfBirth || existingClient.dateOfBirth,
      nationality: enquiry.nationality || existingClient.nationality,
      profileImage: enquiry.profileImage || existingClient.profileImage,
      assignedConsultant: enquiry.assignedConsultant || existingClient.assignedConsultant,
      assignedTo: assignedTo || enquiry.assignedTo || existingClient.assignedTo,
      visaType: enquiry.visaType || existingClient.visaType,
      visaCountry: enquiry.visaCountry || enquiry.destinationCountry || existingClient.visaCountry,
      notes: enquiry.notes ? (existingClient.notes ? existingClient.notes + '\n\n' + enquiry.notes : enquiry.notes) : existingClient.notes,
      lastUpdated: new Date()
    };
    
    await Client.findByIdAndUpdate(existingClient._id, { $set: updateFields });
    
    // Migrate payments
    const enquiryPayments = await EnquiryPayment.find({ enquiryId: enquiry._id });
    if (enquiryPayments.length > 0) {
      const paymentsToCreate = enquiryPayments.map(p => {
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
          clientId: existingClient._id,
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
    
    // Migrate agreement
    const enquiryAgreement = await EnquiryAgreement.findOne({ enquiryId: enquiry._id });
    if (enquiryAgreement) {
      await VisaAgreement.create({
        clientId: existingClient._id,
        branchId: existingClient.branchId,
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
    
    // Migrate meetings
    const enquiryMeetings = await EnquiryMeeting.find({ enquiryId: enquiry._id });
    if (enquiryMeetings && enquiryMeetings.length > 0) {
      for (const meeting of enquiryMeetings) {
        await ClientMeeting.create({
          clientId: existingClient._id,
          meetingType: meeting.meetingType || 'INITIAL_CONSULTATION',
          dateTime: meeting.dateTime,
          platform: meeting.platform,
          status: meeting.status,
          notes: meeting.notes,
          assignedTo: enquiry.assignedConsultant || 'Consultant'
        });
      }
      await EnquiryMeeting.deleteMany({ enquiryId: enquiry._id });
    }
    
    // Delete the enquiry
    await Enquiry.findByIdAndDelete(enquiry._id);
    
    return res.status(200).json({
      success: true,
      message: 'Successfully merged enquiry with existing client',
      data: {
        clientId: existingClient._id
      }
    });
  } catch (error) {
    console.error('Error fixing duplicate conversion:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
