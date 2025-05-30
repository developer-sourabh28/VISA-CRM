import mongoose from 'mongoose';

const EnquiryMeetingSchema = new mongoose.Schema({
    enquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enquiry',
        required: true
    },
    meetingType: {
        type: String,
        enum: ['INITIAL_CONSULTATION', 'DOCUMENT_REVIEW', 'STATUS_UPDATE', 'OTHER'],
        required: true
    },
    dateTime: {
        type: Date,
        required: true
    },
    platform: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['NOT_SCHEDULED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
        default: 'NOT_SCHEDULED'
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

export default mongoose.model('EnquiryMeeting', EnquiryMeetingSchema); 