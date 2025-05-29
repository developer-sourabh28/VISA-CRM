// Agreement.js - Updated model for GridFS storage
import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema({
    branch_name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    pdf_file_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'agreements.files' // GridFS files collection
    },
    pdf_url: {
        type: String,
        required: true // Store filename for reference
    }
}, {
    timestamps: true
});

// Index for faster queries
agreementSchema.index({ branch_name: 1 });

const Agreement = mongoose.model('Agreement', agreementSchema);

export default Agreement;