import express from 'express';
import {
  getWhatsAppTemplates,
  getWhatsAppTemplatesByType,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
  getWhatsAppTemplateVariables,
  sendWhatsAppMessageFromTemplate
} from '../controllers/whatsappTemplateController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all templates
router.get('/', getWhatsAppTemplates);

// Get templates by type
router.get('/type/:type', getWhatsAppTemplatesByType);

// Get template variables by type
router.get('/variables/:type', getWhatsAppTemplateVariables);

// Create new template
router.post('/', createWhatsAppTemplate);

// Update template
router.put('/:id', updateWhatsAppTemplate);

// Delete template
router.delete('/:id', deleteWhatsAppTemplate);

// Send WhatsApp message from template
router.post('/send-message', sendWhatsAppMessageFromTemplate);

export default router; 