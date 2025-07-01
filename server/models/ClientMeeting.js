import mongoose from 'mongoose';

const ClientMeetingSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    meetingType: {
        type: String,
        enum: ['INITIAL_CONSULTATION', 'DOCUMENT_REVIEW', 'STATUS_UPDATE', 'VISA_INTERVIEW_PREP', 'OTHER'],
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
    assignedTo: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('ClientMeeting', ClientMeetingSchema); 