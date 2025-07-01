import express from 'express';
import {
  getEmailTemplates,
  getEmailTemplatesByType,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getTemplateVariables,
  sendEmail
} from '../controllers/emailTemplateController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Get all templates
router.get('/', getEmailTemplates);

// Get templates by type
router.get('/type/:type', getEmailTemplatesByType);

// Get template variables by type
router.get('/variables/:type', getTemplateVariables);

// Create new template
router.post('/', createEmailTemplate);

// Update template
router.put('/:id', updateEmailTemplate);

// Delete template
router.delete('/:id', deleteEmailTemplate);

// New route for sending email
router.post('/send-email', sendEmail);

export default router; 