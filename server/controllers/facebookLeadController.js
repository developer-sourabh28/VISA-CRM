import FacebookLead from '../models/FacebookLead.js';
import facebookLeadService from '../services/facebookLeadService.js';
import facebookLeadToEnquiryService from '../services/facebookLeadToEnquiryService.js';
import cron from 'node-cron';

class FacebookLeadController {
  /**
   * Syncs leads from Facebook to the database and creates enquiries
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync results
   */
  async syncFacebookLeads(options = {}) {
    try {
      console.log('Starting Facebook lead sync...');
      
      // Validate Facebook API configuration
      facebookLeadService.validateConfig();

      // Get the timestamp of the last synced lead
      const lastLead = await FacebookLead.findOne({}, { createdTime: 1 })
        .sort({ createdTime: -1 })
        .lean();

      console.log('Last synced lead time:', lastLead?.createdTime || 'No previous leads');

      // If we have a last lead, fetch only newer leads
      const syncOptions = {
        ...options,
        since: lastLead ? lastLead.createdTime.toISOString() : undefined
      };

      // Fetch leads from Facebook
      const leads = await facebookLeadService.fetchFacebookLeads(syncOptions);

      // Initialize results
      const results = {
        totalFetched: 0,
        inserted: 0,
        enquiriesCreated: 0,
        enquiriesUpdated: 0,
        errors: [],
      };

      // If no leads were returned, return early with empty results
      if (!leads || !Array.isArray(leads)) {
        console.log('No leads returned from Facebook API');
        return results;
      }

      // Update total fetched
      results.totalFetched = leads.length;
      console.log(`Processing ${leads.length} leads...`);

      // Process each lead
      for (const lead of leads) {
        try {
          console.log(`Processing lead ID: ${lead.leadId}`);
          
          // Try to insert the lead, skip if it already exists
          const savedLead = await FacebookLead.findOneAndUpdate(
            { leadId: lead.leadId },
            {
              ...lead,
              lastSyncedAt: new Date()
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );
          
          console.log(`Lead ${lead.leadId} saved to database`);
          results.inserted++;

          // Convert lead to enquiry
          console.log(`Converting lead ${lead.leadId} to enquiry...`);
          const enquiryResult = await facebookLeadToEnquiryService.createOrUpdateEnquiryFromLead(lead);
          
          if (enquiryResult.isNew) {
            console.log(`Created new enquiry for lead ${lead.leadId}`);
            results.enquiriesCreated++;
          } else {
            console.log(`Updated existing enquiry for lead ${lead.leadId}`);
            results.enquiriesUpdated++;
          }
        } catch (error) {
          console.error(`Error processing lead ${lead.leadId}:`, error);
          results.errors.push({
            leadId: lead.leadId,
            error: error.message
          });
        }
      }

      console.log('Sync results:', results);
      return results;
    } catch (error) {
      console.error('Lead sync failed:', error);
      throw new Error(`Lead sync failed: ${error.message}`);
    }
  }

  /**
   * Express route handler for manual sync
   */
  async handleManualSync(req, res) {
    try {
      // Validate Facebook API configuration
      facebookLeadService.validateConfig();

      // Get the timestamp of the last synced lead
      const lastLead = await FacebookLead.findOne({}, { createdTime: 1 })
        .sort({ createdTime: -1 })
        .lean();

      // Fetch leads from Facebook
      const leads = await facebookLeadService.fetchFacebookLeads({
        since: lastLead ? lastLead.createdTime.toISOString() : undefined
      });

      // Process results
      const results = {
        totalFetched: leads.length,
        leadsProcessed: 0,
        enquiriesCreated: 0,
        enquiriesUpdated: 0,
        errors: []
      };

      // Process each lead
      for (const lead of leads) {
        try {
          // Save lead to database
          await FacebookLead.findOneAndUpdate(
            { leadId: lead.leadId },
            {
              ...lead,
              lastSyncedAt: new Date()
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );

          // Convert lead to enquiry
          const enquiryResult = await facebookLeadToEnquiryService.createOrUpdateEnquiryFromLead(lead);
          
          results.leadsProcessed++;
          if (enquiryResult.isNew) {
            results.enquiriesCreated++;
          } else {
            results.enquiriesUpdated++;
          }
        } catch (error) {
          results.errors.push({
            leadId: lead.leadId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        ...results
      });
    } catch (error) {
      console.error('Error syncing Facebook leads:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to sync Facebook leads'
      });
    }
  }

  /**
   * Starts the cron job for automatic lead syncing
   */
  startCronJob() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Starting automated Facebook lead sync...');
        await this.syncFacebookLeads();
        console.log('Facebook lead sync completed');
      } catch (error) {
        console.error('Facebook lead sync failed:', error);
      }
    });
  }

  /**
   * Get all Facebook leads with pagination
   */
  async getLeads(req, res) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = req.query;
      const query = {};

      // Add date range filter if provided
      if (startDate || endDate) {
        query.createdTime = {};
        if (startDate) query.createdTime.$gte = new Date(startDate);
        if (endDate) query.createdTime.$lte = new Date(endDate);
      }

      const leads = await FacebookLead.find(query)
        .sort({ createdTime: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const count = await FacebookLead.countDocuments(query);

      res.json({
        success: true,
        data: leads,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      });
    } catch (error) {
      console.error('Error fetching Facebook leads:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Facebook leads'
      });
    }
  }

  /**
   * Get a specific Facebook lead by ID
   */
  async getLead(req, res) {
    try {
      const lead = await FacebookLead.findOne({ leadId: req.params.id }).lean();
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Facebook lead not found'
        });
      }

      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      console.error('Error fetching Facebook lead:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Facebook lead'
      });
    }
  }

  /**
   * Updates a lead's status
   */
  async updateLeadStatus(req, res) {
    try {
      const { leadId } = req.params;
      const { status, notes } = req.body;

      const lead = await FacebookLead.findOneAndUpdate(
        { leadId },
        { status, notes },
        { new: true }
      );

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found'
        });
      }

      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

// Create and export a singleton instance
const controller = new FacebookLeadController();

// Start the cron job when the controller is initialized
controller.startCronJob();

export default controller; 