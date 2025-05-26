// server/controller/agreementController.js
import Agreement from '../models/Agreement.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAgreementByBranch = async (req, res) => {
    try {
        const { branchName } = req.params;

        // Find agreement, but only get branch_name and pdf_url
        const agreement = await Agreement.findOne(
            { branch_name: branchName },
            { branch_name: 1, pdf_url: 1, _id: 0 }
        );

        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        // Send only branch_name and pdf_url
        res.json(agreement);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateAgreementPDF = async (req, res) => {
    try {
        const { branchName } = req.params;
        const file = req.file;

        if (!file) return res.status(400).json({ message: "No file uploaded" });

        const pdfPath = `/uploads/agreements/${file.filename}`;
        let agreement = await Agreement.findOne({ branch_name: branchName });

        if (!agreement) {
            agreement = new Agreement({ branch_name: branchName, pdf_url: pdfPath });
        } else {
            const oldPath = path.join(__dirname, '..', agreement.pdf_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            agreement.pdf_url = pdfPath;
        }

        await agreement.save();
        res.json({ message: 'PDF updated successfully', path: pdfPath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAllAgreements = async (req, res) => {
    try {
        // fetch all agreements, return only branch_name and pdf_url
        const agreements = await Agreement.find({}, { branch_name: 1, pdf_url: 1, _id: 0 });
        res.json(agreements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// create agreemtn
export const createAgreement = async (req, res) => {
    try {
        const { branchName } = req.body;
        const file = req.file;

        if (!branchName || !file) {
            return res.status(400).json({ message: "Branch name and PDF are required" });
        }

        const existing = await Agreement.findOne({ branch_name: branchName });
        if (existing) {
            return res.status(400).json({ message: "Agreement already exists for this branch" });
        }

        const newAgreement = new Agreement({
            branch_name: branchName,
            pdf_file_id: file.id // storing GridFS file ID
        });

        await newAgreement.save();

        res.status(201).json({ message: "Agreement saved to DB with file", agreement: newAgreement });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
