import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory storage for enquiries
let enquiries = [];
let nextId = 1;

// Routes

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints

// GET all enquiries
app.get('/enquiries', (req, res) => {
  res.json(enquiries);
});

// POST a new enquiry
app.post('/enquiries', (req, res) => {
  const newEnquiry = {
    id: nextId++,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    nationality: req.body.nationality || '',
    visaType: req.body.visaType,
    destinationCountry: req.body.destinationCountry || '',
    enquirySource: req.body.enquirySource,
    enquiryStatus: req.body.enquiryStatus || 'New',
    assignedConsultant: req.body.assignedConsultant || '',
    enquiryDate: req.body.enquiryDate || new Date().toISOString().split('T')[0],
    followUpDate: req.body.followUpDate || '',
    priorityLevel: req.body.priorityLevel || 'Medium',
    notes: req.body.notes || ''
  };

  // Validation
  if (!newEnquiry.fullName || !newEnquiry.email || !newEnquiry.phone) {
    return res.status(400).json({ error: 'Full name, email and phone are required fields' });
  }

  enquiries.push(newEnquiry);
  res.status(201).json(newEnquiry);
});

// PUT (update) an enquiry
app.put('/enquiries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = enquiries.findIndex(enquiry => enquiry.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  // Validation
  if (!req.body.fullName || !req.body.email || !req.body.phone) {
    return res.status(400).json({ error: 'Full name, email and phone are required fields' });
  }

  const updatedEnquiry = {
    ...enquiries[index],
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    nationality: req.body.nationality || enquiries[index].nationality,
    visaType: req.body.visaType,
    destinationCountry: req.body.destinationCountry || enquiries[index].destinationCountry,
    enquirySource: req.body.enquirySource,
    enquiryStatus: req.body.enquiryStatus || enquiries[index].enquiryStatus,
    assignedConsultant: req.body.assignedConsultant || enquiries[index].assignedConsultant,
    followUpDate: req.body.followUpDate || enquiries[index].followUpDate,
    priorityLevel: req.body.priorityLevel || enquiries[index].priorityLevel,
    notes: req.body.notes || enquiries[index].notes
  };

  enquiries[index] = updatedEnquiry;
  res.json(updatedEnquiry);
});

// DELETE an enquiry
app.delete('/enquiries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = enquiries.findIndex(enquiry => enquiry.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  const deletedEnquiry = enquiries[index];
  enquiries.splice(index, 1);
  res.json(deletedEnquiry);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});