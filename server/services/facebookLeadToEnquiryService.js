import Enquiry from '../models/Enquiry.js';

class FacebookLeadToEnquiryService {
  /**
   * Converts a Facebook lead to an enquiry format
   * @param {Object} facebookLead - The Facebook lead data
   * @returns {Object} - Formatted enquiry data
   */
  formatLeadToEnquiry(facebookLead) {
    // Extract field data from Facebook lead
    const getFieldValue = (fieldName) => {
      const field = facebookLead.fieldData.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
      return field ? field.value : null;
    };

    // Map Facebook lead fields to enquiry fields
    return {
      firstName: getFieldValue('first_name') || getFieldValue('firstname') || 'Unknown',
      lastName: getFieldValue('last_name') || getFieldValue('lastname') || 'Unknown',
      email: getFieldValue('email'),
      phone: getFieldValue('phone_number') || getFieldValue('phone'),
      enquirySource: 'Facebook',
      enquiryStatus: 'Unassigned FB Lead',
      visaType: getFieldValue('visa_type') || 'Tourist',
      destinationCountry: getFieldValue('destination_country') || 'USA',
      notes: `Facebook Lead created at ${new Date(facebookLead.createdTime).toLocaleString()}`,
      
      // Facebook specific fields
      facebookLeadId: facebookLead.leadId,
      facebookFormId: facebookLead.formId,
      facebookRawData: facebookLead.rawData,
      facebookSyncedAt: new Date(),
      
      // Set default branch if not specified
      branch: process.env.DEFAULT_BRANCH || 'Main Branch',
    };
  }

  /**
   * Creates or updates an enquiry from a Facebook lead
   * @param {Object} facebookLead - The Facebook lead data
   * @returns {Promise<Object>} - The created or updated enquiry
   */
  async createOrUpdateEnquiryFromLead(facebookLead) {
    try {
      const enquiryData = this.formatLeadToEnquiry(facebookLead);
      
      // Check if an enquiry with this Facebook lead ID already exists
      const existingEnquiry = await Enquiry.findOne({ facebookLeadId: facebookLead.leadId });
      
      if (existingEnquiry) {
        // Update existing enquiry
        const updatedEnquiry = await Enquiry.findByIdAndUpdate(
          existingEnquiry._id,
          {
            ...enquiryData,
            facebookSyncedAt: new Date(),
          },
          { new: true }
        );
        return { enquiry: updatedEnquiry, isNew: false };
      }
      
      // Create new enquiry
      const newEnquiry = await Enquiry.create(enquiryData);
      return { enquiry: newEnquiry, isNew: true };
    } catch (error) {
      console.error('Error creating/updating enquiry from Facebook lead:', error);
      throw error;
    }
  }

  /**
   * Process multiple Facebook leads
   * @param {Array} facebookLeads - Array of Facebook leads
   * @returns {Promise<Object>} - Processing results
   */
  async processLeads(facebookLeads) {
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const lead of facebookLeads) {
      try {
        const { enquiry, isNew } = await this.createOrUpdateEnquiryFromLead(lead);
        results.processed++;
        if (isNew) {
          results.created++;
        } else {
          results.updated++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          leadId: lead.leadId,
          error: error.message,
        });
      }
    }

    return results;
  }
}

export default new FacebookLeadToEnquiryService(); 