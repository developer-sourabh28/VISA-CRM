import mongoose from 'mongoose';

const EnquiryAgreementSchema = new mongoose.Schema({
    enquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enquiry',
        required: true
    },
    agreementDate: {
        type: Date,
        required: true
    },
    agreementStatus: {
        type: String,
        enum: ['NOT_SENT', 'SENT', 'RECEIVED', 'SIGNED', 'CANCELLED'],
        default: 'NOT_SENT'
    },
    agreementFile: {
        name: String,
        url: String
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('EnquiryAgreement', EnquiryAgreementSchema); 