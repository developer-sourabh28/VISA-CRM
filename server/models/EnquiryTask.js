import mongoose from 'mongoose';

const EnquiryTaskSchema = new mongoose.Schema({
    enquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enquiry',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['REMINDER', 'FOLLOW_UP', 'DOCUMENTATION', 'NEXT_STEP'],
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    assignedTo: {
        type: String,
        required: true
    },
    checklist: [{
        item: String,
        isCompleted: {
            type: Boolean,
            default: false
        }
    }],
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

export default mongoose.model('EnquiryTask', EnquiryTaskSchema); 