// server/models/Agreement.js
import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema({
    branch_name: { type: String, required: true, unique: true },
    pdf_file_id: { type: mongoose.Schema.Types.ObjectId, required: true } // reference to GridFS file
});

export default mongoose.model('Agreement', agreementSchema);
