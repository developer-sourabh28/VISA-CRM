const VisaApplication = require('../models/VisaApplication');

exports.uploadAgreements = async (req, res) => {
  try {
    const userId = req.body.userId; // For now, pass userId in request body
    const files = req.files;

    if (!files || files.length !== 2) {
      return res.status(400).json({ message: 'Please upload exactly 2 agreement files.' });
    }

    let application = await VisaApplication.findOne({ userId });

    if (!application) {
      application = new VisaApplication({
        userId,
        steps: [
          { id: 1, title: 'Send Agreement', status: 'IN PROGRESS', files: [] },
          { id: 2, title: 'Schedule Meeting', status: 'NOT STARTED' },
          { id: 3, title: 'Upload Documents', status: 'NOT STARTED' },
          { id: 4, title: 'Payment Collection', status: 'NOT STARTED' },
          { id: 5, title: 'Appointment Booking', status: 'NOT STARTED' },
          { id: 6, title: 'Final Submission', status: 'NOT STARTED' },
        ],
      });
    }

    const stepIndex = application.steps.findIndex((s) => s.id === 1);
    application.steps[stepIndex].files = files.map((f) => f.path);
    application.steps[stepIndex].status = 'COMPLETED';

    // Optionally set next step status to IN PROGRESS
    if (application.steps[stepIndex + 1]) {
      application.steps[stepIndex + 1].status = 'IN PROGRESS';
    }

    await application.save();

    res.status(200).json({ message: 'Agreements uploaded and step updated.', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};
