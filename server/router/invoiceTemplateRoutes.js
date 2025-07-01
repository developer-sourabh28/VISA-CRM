import express from 'express';
import {
  getInvoiceTemplates,
  createInvoiceTemplate,
  updateInvoiceTemplate,
  deleteInvoiceTemplate,
  getActiveInvoiceTemplate,
} from '../controllers/invoiceTemplateController.js';
import { isAuthenticated } from '../middleware/auth.js';
import InvoiceTemplate from '../models/invoiceTemplate.js';

const router = express.Router();
router.use(isAuthenticated);

router.get('/', getInvoiceTemplates);
router.post('/', createInvoiceTemplate);
router.put('/:id', updateInvoiceTemplate);
router.delete('/:id', deleteInvoiceTemplate);
router.get('/active', async (req, res) => {
  try {
    const template = await InvoiceTemplate.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!template) {
      return res.status(404).json({ success: false, message: 'No active invoice template found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;