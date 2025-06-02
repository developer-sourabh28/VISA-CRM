import express from 'express';
import {
  getEmailTemplates,
  getEmailTemplatesByType,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getTemplateVariables
} from '../controllers/emailTemplateController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

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

export default router; 