import EmailTemplate from '../models/emailTemplate.js';

// Get all email templates
export const getEmailTemplates = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const templates = await EmailTemplate.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch email templates',
      error: error.message 
    });
  }
};

// Get email template by type
export const getEmailTemplatesByType = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { type } = req.params;
    const templates = await EmailTemplate.find({ 
      type: type.toUpperCase(),
      isActive: true 
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching email templates by type:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch email templates',
      error: error.message 
    });
  }
};

// Create new email template
export const createEmailTemplate = async (req, res) => {
  try {
    const { name, type, subject, body, variables } = req.body;
    
    // Log the incoming request data
    console.log('Creating template with data:', { 
      name, 
      type, 
      subject, 
      body, 
      variables
    });

    // Validate required fields with detailed messages
    const validationErrors = [];
    if (!name) validationErrors.push('Template name is required');
    if (!type) validationErrors.push('Template type is required');
    if (!subject) validationErrors.push('Subject is required');
    if (!body) validationErrors.push('Body is required');

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Validate type
    const validTypes = ['ENQUIRY', 'DEADLINE', 'APPOINTMENT', 'OTHER'];
    const normalizedType = type.toUpperCase();
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template type',
        validTypes,
        providedType: type
      });
    }

    // Check if template with same name exists (only among active templates)
    const existingTemplate = await EmailTemplate.findOne({ 
      name,
      isActive: true 
    });
    if (existingTemplate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Template with this name already exists' 
      });
    }

    // Create new template
    const template = new EmailTemplate({
      name: name.trim(),
      type: normalizedType,
      subject: subject.trim(),
      body: body, // Store HTML content as is
      variables: Array.isArray(variables) ? variables.map(v => v.trim()) : []
    });

    // Log the template object before saving
    console.log('Template object before save:', template);

    const savedTemplate = await template.save();
    
    // Log the saved template
    console.log('Template saved successfully:', savedTemplate);

    res.status(201).json({ 
      success: true, 
      data: savedTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    // Log the full error
    console.error('Error creating email template:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Check for specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A template with this name already exists'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to create email template',
      error: error.message 
    });
  }
};

// Update email template
export const updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, subject, body, variables, isActive } = req.body;

    // Validate required fields
    if (!name || !type || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if name is being changed and if it already exists (only among active templates)
    if (name) {
      const existingTemplate = await EmailTemplate.findOne({ 
        name, 
        _id: { $ne: id },
        isActive: true 
      });
      if (existingTemplate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Template with this name already exists' 
        });
      }
    }

    const template = await EmailTemplate.findByIdAndUpdate(
      id,
      {
        name,
        type,
        subject,
        body,
        variables: variables || [],
        isActive,
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update email template',
      error: error.message 
    });
  }
};

// Delete email template (soft delete)
export const deleteEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log the delete attempt
    console.log('Attempting to delete template with ID:', id);

    // First check if the template exists
    const existingTemplate = await EmailTemplate.findById(id);
    if (!existingTemplate) {
      console.log('Template not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    // Perform the soft delete
    const template = await EmailTemplate.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      console.log('Failed to update template:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Template not found' 
      });
    }

    console.log('Template successfully deleted:', id);
    res.json({ 
      success: true, 
      message: 'Template deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete email template',
      error: error.message 
    });
  }
};

// Get template variables
export const getTemplateVariables = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { type } = req.params;
    const templates = await EmailTemplate.find({ 
      type: type.toUpperCase(),
      isActive: true 
    }).select('variables');

    const variables = [...new Set(templates.flatMap(t => t.variables))];
    res.json({ success: true, data: variables });
  } catch (error) {
    console.error('Error fetching template variables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch template variables',
      error: error.message 
    });
  }
}; 