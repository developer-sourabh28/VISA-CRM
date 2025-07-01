import WhatsAppTemplate from '../models/whatsappTemplate.js';

// Get all WhatsApp templates
export const getWhatsAppTemplates = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const templates = await WhatsAppTemplate.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WhatsApp templates',
      error: error.message
    });
  }
};

// Get WhatsApp template by type
export const getWhatsAppTemplatesByType = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { type } = req.params;
    const templates = await WhatsAppTemplate.find({
      type: type.toUpperCase(),
      isActive: true
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching WhatsApp templates by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WhatsApp templates',
      error: error.message
    });
  }
};

// Create new WhatsApp template
export const createWhatsAppTemplate = async (req, res) => {
  try {
    const { name, type, subject, body, variables } = req.body;

    // Log the incoming request data
    console.log('Creating WhatsApp template with data:', {
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
    const validTypes = ['ENQUIRY', 'DEADLINE', 'APPOINTMENT', 'CLIENT', 'OTHER', 'HOTEL', 'FLIGHT', 'BIRTHDAY'];
    const normalizedType = type.toUpperCase();
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template type',
        validTypes,
        providedType: type
      });
    }

    // Check if template with same name exists (active or inactive)
    const existingTemplate = await WhatsAppTemplate.findOne({
      name,
    });

    if (existingTemplate) {
      if (existingTemplate.isActive) {
        return res.status(400).json({
          success: false,
          message: 'A template with this name already exists and is active.'
        });
      } else {
        // If template exists but is inactive, reactivate and update it
        existingTemplate.type = normalizedType;
        existingTemplate.subject = subject.trim();
        existingTemplate.body = body;
        existingTemplate.variables = Array.isArray(variables) ? variables.map(v => v.trim()) : [];
        existingTemplate.isActive = true;

        const reactivatedTemplate = await existingTemplate.save();

        console.log('WhatsApp template reactivated and updated successfully:', reactivatedTemplate);
        return res.status(200).json({
          success: true,
          data: reactivatedTemplate,
          message: 'Template reactivated and updated successfully'
        });
      }
    }

    // Create new template
    const template = new WhatsAppTemplate({
      name: name.trim(),
      type: normalizedType,
      subject: subject.trim(),
      body: body,
      variables: Array.isArray(variables) ? variables.map(v => v.trim()) : []
    });

    // Log the template object before saving
    console.log('WhatsApp template object before save:', template);

    const savedTemplate = await template.save();

    // Log the saved template
    console.log('WhatsApp template saved successfully:', savedTemplate);

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    // Log the full error
    console.error('Error creating WhatsApp template:', {
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
      message: 'Failed to create WhatsApp template',
      error: error.message
    });
  }
};

// Update WhatsApp template
export const updateWhatsAppTemplate = async (req, res) => {
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
      const existingTemplate = await WhatsAppTemplate.findOne({
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

    const template = await WhatsAppTemplate.findByIdAndUpdate(
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
    console.error('Error updating WhatsApp template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update WhatsApp template',
      error: error.message
    });
  }
};

// Delete WhatsApp template (soft delete)
export const deleteWhatsAppTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Log the delete attempt
    console.log('Attempting to delete WhatsApp template with ID:', id);

    // First check if the template exists
    const existingTemplate = await WhatsAppTemplate.findById(id);
    if (!existingTemplate) {
      console.log('WhatsApp template not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Perform the soft delete
    const template = await WhatsAppTemplate.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      console.log('Failed to update WhatsApp template:', id);
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    console.log('WhatsApp template successfully deleted:', id);
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting WhatsApp template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete WhatsApp template',
      error: error.message
    });
  }
};

// Get template variables
export const getWhatsAppTemplateVariables = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { type } = req.params;
    const templates = await WhatsAppTemplate.find({
      type: type.toUpperCase(),
      isActive: true
    }).select('variables');

    const variables = [...new Set(templates.flatMap(t => t.variables))];
    res.json({ success: true, data: variables });
  } catch (error) {
    console.error('Error fetching WhatsApp template variables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WhatsApp template variables',
      error: error.message
    });
  }
};

// Send WhatsApp message using a template
export const sendWhatsAppMessageFromTemplate = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { type, deadline } = req.body;

    if (!type || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Template type and deadline data are required.'
      });
    }

    const template = await WhatsAppTemplate.findOne({ type: type.toUpperCase(), isActive: true });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `No active WhatsApp template found for type: ${type}`
      });
    }

    let messageBody = template.body;

    // Populate variables in the message body
    if (template.variables && template.variables.length > 0) {
      template.variables.forEach(variable => {
        const placeholder = new RegExp(`{{${variable}}}`, 'g');
        let value = deadline[variable] || `{{${variable}}}`;

        // Format date variables if they look like dates
        if (variable.toLowerCase().includes('date') && value instanceof Date) {
          value = value.toLocaleDateString(); // Or any desired date format
        }

        messageBody = messageBody.replace(placeholder, value);
      });
    }

    // Construct WhatsApp URL (replace 'phone' with actual client phone number from deadline)
    // Assuming deadline.clientPhone exists and is in a format suitable for WhatsApp
    const clientPhone = deadline.clientPhone; // Need to ensure this is available in the deadline object
    if (!clientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Client phone number not available for this deadline.'
      });
    }

    const encodedMessage = encodeURIComponent(messageBody);
    const whatsappUrl = `https://wa.me/${clientPhone}?text=${encodedMessage}`;

    res.json({
      success: true,
      url: whatsappUrl,
      message: 'WhatsApp URL generated successfully'
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp message',
      error: error.message
    });
  }
}; 