import InvoiceTemplate from '../models/invoiceTemplate.js';

// Get all templates
export const getInvoiceTemplates = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const templates = await InvoiceTemplate.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoice templates', error: error.message });
  }
};

// Get the active invoice template
export const getActiveInvoiceTemplate = async (req, res) => {
    try {
      const template = await InvoiceTemplate.findOne({ isActive: true }).sort({ createdAt: -1 });
      if (!template) {
        return res.status(404).json({ success: false, message: 'No active invoice template found' });
      }
      res.json({ success: true, data: template });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

// Create template
export const createInvoiceTemplate = async (req, res) => {
  try {
    const { name, body, variables } = req.body;
    if (!name || !body) return res.status(400).json({ success: false, message: 'Name and body are required' });
    const template = new InvoiceTemplate({
      name: name.trim(),
      body,
      variables: Array.isArray(variables) ? variables.map(v => v.trim()) : [],
      createdBy: req.user?._id,
    });
    const saved = await template.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Template with this name already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create invoice template', error: error.message });
  }
};

// Update template
export const updateInvoiceTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, body, variables, isActive } = req.body;
    if (!name || !body) return res.status(400).json({ success: false, message: 'Name and body are required' });
    const template = await InvoiceTemplate.findByIdAndUpdate(
      id,
      { name, body, variables: variables || [], isActive },
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update invoice template', error: error.message });
  }
};

// Delete template (soft delete)
export const deleteInvoiceTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await InvoiceTemplate.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete invoice template', error: error.message });
  }
};