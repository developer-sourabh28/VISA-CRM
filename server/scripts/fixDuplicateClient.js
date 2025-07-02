import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Client from '../models/Client.js';
import Enquiry from '../models/Enquiry.js';
import EnquiryMeeting from '../models/EnquiryMeeting.js';
import EnquiryPayment from '../models/EnquiryPayment.js';
import EnquiryAgreement from '../models/EnquiryAgreement.js';
import ClientMeeting from '../models/ClientMeeting.js';
import Payment from '../models/Payment.js';
import VisaAgreement from '../models/visaTracker/visaAgreement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const fixDuplicateClient = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohhhh0909:dbpassword@cluster0.2dkkpqi.mongodb.net/VisaCrm');
    console.log('Connected to MongoDB');

    // 1. Find the problematic enquiry by ID
    const enquiryId = process.argv[2];
    if (!enquiryId) {
      console.error('Please provide the enquiry ID as an argument');
      process.exit(1);
    }

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      console.error(`No enquiry found with ID: ${enquiryId}`);
      process.exit(1);
    }

    console.log('Found enquiry:', {
      id: enquiry._id,
      email: enquiry.email,
      firstName: enquiry.firstName,
      lastName: enquiry.lastName
    });

    // 2. Find the existing client with the same email
    const existingClient = await Client.findOne({ email: enquiry.email });
    if (!existingClient) {
      console.error(`No client found with email: ${enquiry.email}`);
      process.exit(1);
    }

    console.log('Found existing client:', {
      id: existingClient._id,
      email: existingClient.email,
      firstName: existingClient.firstName,
      lastName: existingClient.lastName
    });

    // 3. Update client data from enquiry
    const assignedTo = process.argv[3] || existingClient.assignedTo;
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
      assignedTo: assignedTo || existingClient.assignedTo,
      visaType: enquiry.visaType || existingClient.visaType,
      visaCountry: enquiry.visaCountry || enquiry.destinationCountry || existingClient.visaCountry,
      notes: enquiry.notes ? existingClient.notes + '\n\n' + enquiry.notes : existingClient.notes,
      lastUpdated: new Date()
    };

    // Update client
    await Client.findByIdAndUpdate(existingClient._id, { $set: updateFields });
    console.log('Updated client data');

    // 4. Migrate payments
    const enquiryPayments = await EnquiryPayment.find({ enquiryId: enquiry._id });
    console.log(`Found ${enquiryPayments.length} enquiry payments`);

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

      // Insert payments and clean up
      await Payment.insertMany(paymentsToCreate);
      await EnquiryPayment.deleteMany({ enquiryId: enquiry._id });
      console.log(`Migrated ${paymentsToCreate.length} payments`);
    }

    // 5. Migrate agreement
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
      console.log('Migrated agreement');
    } else {
      console.log('No agreement found to migrate');
    }

    // 6. Migrate meetings
    const enquiryMeetings = await EnquiryMeeting.find({ enquiryId: enquiry._id });
    if (enquiryMeetings && enquiryMeetings.length > 0) {
      console.log(`Found ${enquiryMeetings.length} meetings to migrate`);
      
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
      console.log(`Migrated ${enquiryMeetings.length} meetings`);
    } else {
      console.log('No meetings found to migrate');
    }

    // 7. Delete the enquiry
    await Enquiry.findByIdAndDelete(enquiry._id);
    console.log('Deleted the original enquiry');

    console.log('Successfully merged the enquiry data with the existing client');
    process.exit(0);
  } catch (error) {
    console.error('Error in fixDuplicateClient script:', error);
    process.exit(1);
  }
};

fixDuplicateClient(); 