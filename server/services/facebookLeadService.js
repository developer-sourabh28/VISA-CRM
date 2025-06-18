import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

class FacebookLeadService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.formId = process.env.FACEBOOK_FORM_ID;
    
    // Validate configuration on initialization
    this.validateConfig();
  }

  /**
   * Fetches leads from Facebook Lead Ads form
   * @param {Object} options - Query options
   * @param {string} options.since - ISO date string for fetching leads since a specific date
   * @param {number} options.limit - Number of leads to fetch (default: 100)
   * @returns {Promise<Array>} Array of leads
   */
  async fetchFacebookLeads(options = {}) {
    try {
      const { since, limit = 100 } = options;
      
      // Build the query parameters
      const params = new URLSearchParams({
        access_token: this.accessToken,
        limit: limit,
        fields: [
          'id',
          'created_time',
          'field_data',
          'form_id',
          'platform',
          'campaign_name',
          'adset_name',
          'ad_name',
          'ad_id'
        ].join(',')
      });

      // Add since parameter if provided
      if (since) {
        params.append('since', since);
      }

      console.log('Fetching leads from Facebook...');
      console.log('Form ID:', this.formId);
      console.log('Since:', since || 'all time');

      const response = await axios.get(
        `${this.baseUrl}/${this.formId}/leads?${params.toString()}`
      );

      // Log the raw response for debugging
      console.log('Facebook API Response:', JSON.stringify(response.data, null, 2));

      if (!response.data) {
        throw new Error('Empty response from Facebook API');
      }

      if (!response.data.data) {
        console.log('No leads found in the response');
        return []; // Return empty array instead of throwing error
      }

      const normalizedLeads = response.data.data.map(lead => {
        try {
          return this.normalizeLead(lead);
        } catch (error) {
          console.error('Error normalizing lead:', error);
          console.error('Problematic lead data:', JSON.stringify(lead, null, 2));
          return null;
        }
      }).filter(lead => lead !== null); // Remove any leads that failed to normalize

      console.log(`Successfully fetched and normalized ${normalizedLeads.length} leads`);
      return normalizedLeads;

    } catch (error) {
      if (error.response) {
        // Facebook API error
        const apiError = error.response.data.error || {};
        console.error('Facebook API Error:', apiError);
        throw new Error(`Facebook API Error: ${apiError.message || error.message}`);
      }
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Normalizes a lead object from Facebook's format
   * @param {Object} lead - Raw lead data from Facebook
   * @returns {Object} Normalized lead object
   */
  normalizeLead(lead) {
    if (!lead || typeof lead !== 'object') {
      throw new Error('Invalid lead data received');
    }

    if (!Array.isArray(lead.field_data)) {
      console.warn('No field_data array in lead:', lead);
      lead.field_data = []; // Set default empty array
    }

    const fieldData = lead.field_data.map(field => {
      if (!field.values || !Array.isArray(field.values) || field.values.length === 0) {
        return {
          name: field.name?.toLowerCase() || 'unknown',
          value: null
        };
      }
      return {
        name: field.name?.toLowerCase() || 'unknown',
        value: field.values[0]
      };
    });

    return {
      leadId: lead.id || 'unknown',
      formId: lead.form_id || this.formId,
      createdTime: lead.created_time ? new Date(lead.created_time) : new Date(),
      fieldData,
      rawData: {
        platform: lead.platform || 'unknown',
        campaignName: lead.campaign_name || 'unknown',
        adsetName: lead.adset_name || 'unknown',
        adName: lead.ad_name || 'unknown',
        adId: lead.ad_id || 'unknown'
      }
    };
  }

  /**
   * Validates the service configuration
   * @throws {Error} If required configuration is missing
   */
  validateConfig() {
    if (!this.accessToken) {
      throw new Error('Facebook Page Access Token is required');
    }
    if (!this.formId) {
      throw new Error('Facebook Form ID is required');
    }
  }
}

const facebookLeadService = new FacebookLeadService();
export default facebookLeadService; 