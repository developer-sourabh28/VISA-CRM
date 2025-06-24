// Add base URL constant at the top of the file
export const API_BASE_URL = 'http://localhost:5000';

// Export the apiRequest function
export const apiRequest = async (method, url, data = null, isFormData = false) => {
  try {
    const token = localStorage.getItem('token');
    console.log('Current token:', token ? token.substring(0, 20) + '...' : 'No token found');

    const headers = {
      'Accept': 'application/json'
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const options = {
      method,
      headers,
      credentials: 'include'
    };

    // Always add Authorization header if token exists
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added Authorization header');
    } else {
      console.log('No token available for Authorization header');
    }

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    // Prepend base URL if the URL doesn't start with http
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    console.log('Making API request:', { 
      method, 
      url: fullUrl, 
      headers: options.headers,
      hasData: !!data 
    });

    const response = await fetch(fullUrl, options);
    
    // Log the raw response for debugging
    console.log('Raw response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Try to parse the response as JSON
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      });

      // If unauthorized, clear the token
      if (response.status === 401) {
        console.log('Unauthorized - clearing token');
        localStorage.removeItem('token');
      }

      // For 400 Bad Request, include the error message from the response
      if (response.status === 400) {
        throw new Error(responseData.message || responseData.error || 'Bad Request: Invalid data provided');
      }

      throw new Error(responseData.message || `API request failed with status ${response.status}`);
    }

    return responseData;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export async function login({ email, password }) {
    try {
        console.log('Attempting login with:', { email });
        
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data = await response.json();
        console.log('Login response:', { success: data.success, hasToken: !!data.token });
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        if (data.token) {
            localStorage.setItem('token', data.token);
            console.log('Token stored:', data.token.substring(0, 20) + '...');
        } else {
            console.error('No token received in login response');
            throw new Error('No authentication token received');
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export const register = async (userData) => {
  const data = await apiRequest('POST', '/api/auth/register', userData);
  return data; // Remove the extra .json() call
};

export const logout = async () => {
  const data = await apiRequest('GET', '/api/auth/logout');
  localStorage.removeItem('token');
  return data; // Remove the extra .json() call
};

export const getProfile = async () => {
  const data = await apiRequest('GET', '/api/auth/profile');
  return data; // Remove the extra .json() call
};

// Client API calls
export const getClients = async (branch, month, year) => {
  try {
    const url = `/api/clients?branch=${encodeURIComponent(branch)}&month=${month}&year=${year}`;
    const response = await apiRequest('GET', url);
    return response;
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }
};

//get client by
export const getClient = async (id) => {
  try {
    console.log("Fetching client with ID:", id);
    if (!id) {
      throw new Error("Client ID is required");
    }
    
    const token = localStorage.getItem('token');
    console.log("Auth token present:", !!token);
    
    const response = await apiRequest('GET', `/api/clients/${id}`);
    console.log("Client API Response:", response);
    
    if (!response) {
      throw new Error("No response received from server");
    }
    
    return response;
  } catch (error) {
    console.error("Error in getClient:", error);
    throw error;
  }
};

// Fix the createClient function - remove duplicate response.json()
export const createClient = async (clientData) => {
  console.log("Creating client with data:", clientData);
  
  try {
    const data = await apiRequest('POST', '/api/clients', clientData);
    console.log("Create client API response:", data);
    return data;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};

export const updateClient = async (id, clientData) => {
  const data = await apiRequest('PUT', `/api/clients/${id}`, clientData);
  return data; // Remove the extra .json() call
};

export const deleteClient = async (id) => {
  const data = await apiRequest('DELETE', `/api/clients/${id}`);
  return data; // Remove the extra .json() call
};

//convert to client
export const convertEnquiry = async (id) => {
    try {
        const response = await apiRequest('POST', '/api/clients/convert', { enquiryId: id });
        if (!response.success) {
            throw new Error(response.message || 'Failed to convert enquiry to client');
        }
        return response;
    } catch (error) {
        console.error("Error in convertEnquiry:", error);
        throw error;
    }
};

// Agreement API calls
// export const getAgreements = async (params = {}) => {
//   let url = '/api/agreements';
//   const queryParams = new URLSearchParams();
  
//   for (const [key, value] of Object.entries(params)) {
//     if (value) queryParams.append(key, value);
//   }
  
//   if (queryParams.toString()) {
//     url += `?${queryParams.toString()}`;
//   }
  
//   const res = await apiRequest('GET', url);
//   return await res.json();
// };

export const getAgreement = async (id) => {
  const data = await apiRequest('GET', `/api/agreements/${id}`);
  return data;
};

export const createAgreement = async (agreementData) => {
  const data = await apiRequest('POST', '/api/agreements', agreementData);
  return data;
};

export const updateAgreement = async (id, agreementData) => {
  const data = await apiRequest('PUT', `/api/agreements/${id}`, agreementData);
  return data;
};

export const deleteAgreement = async (id) => {
  const data = await apiRequest('DELETE', `/api/agreements/${id}`);
  return data;
};

export const getClientAgreements = async (clientId) => {
  const data = await apiRequest('GET', `/api/clients/${clientId}/agreements`);
  return data;
};

// Appointment API calls
export const getAppointments = async (branch, month, year) => {
  try {
    const url = `/api/appointments?branch=${encodeURIComponent(branch)}&month=${month}&year=${year}`;
    const response = await apiRequest('GET', url);
    return response;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

export const getUpcomingAppointments = async (days = 7) => {
  try {
    const response = await apiRequest('GET', `/api/appointments/upcoming?days=${days}`);
    return response.data || [];
  } catch (error) {
    console.error("Error in getUpcomingAppointments:", error);
    throw error;
  }
};

export const getAppointment = async (id) => {
  try {
    const response = await apiRequest('GET', `/api/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error in getAppointment:", error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await apiRequest('POST', '/api/appointments', appointmentData);
    return response.data;
  } catch (error) {
    console.error("Error in createAppointment:", error);
    throw error;
  }
};

export const updateAppointment = async (id, appointmentData) => {
  try {
    const response = await apiRequest('PUT', `/api/appointments/${id}`, appointmentData);
    return response.data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

export const deleteAppointment = async (id) => {
  try {
    const response = await apiRequest('DELETE', `/api/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error in deleteAppointment:", error);
    throw error;
  }
};

export const getClientAppointments = async (clientId) => {
  try {
    const response = await apiRequest('GET', `/api/appointments/client/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error in getClientAppointments:", error);
    throw error;
  }
};


// Document API calls
export const getDocuments = async (params = {}) => {
  let url = '/api/documents';
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value) queryParams.append(key, value);
  }
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  
  const data = await apiRequest('GET', url);
  return data;
};

export const getDocument = async (id) => {
  const data = await apiRequest('GET', `/api/documents/${id}`);
  return data;
};

export const createDocument = async (documentData) => {
  const data = await apiRequest('POST', '/api/documents', documentData);
  return data;
};

export const updateDocument = async (id, documentData) => {
  const data = await apiRequest('PUT', `/api/documents/${id}`, documentData);
  return data;
};

export const deleteDocument = async (id) => {
  const data = await apiRequest('DELETE', `/api/documents/${id}`);
  return data;
};

export const getClientDocuments = async (clientId) => {
  const data = await apiRequest('GET', `/api/clients/${clientId}/documents`);
  return data;
};

// Dashboard API calls
export const getDashboardStats = async (branch, month, year) => {
  try {
    const url = `/api/dashboard/stats?branch=${encodeURIComponent(branch)}&month=${month}&year=${year}`;
    console.log('Fetching dashboard stats for branch:', branch, 'URL:', url);
    const response = await apiRequest('GET', url);
    console.log('Dashboard stats response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getApplicationStatusChart = async () => {
  const data = await apiRequest('GET', '/api/dashboard/charts/application-status');
  return data;
};

export const getMonthlyApplicationsChart = async () => {
  const data = await apiRequest('GET', '/api/dashboard/charts/monthly-applications');
  return data;
};

export const getRecentApplications = async () => {
  const data = await apiRequest('GET', '/api/dashboard/recent-applications');
  return data;
};

export const getUpcomingDeadlines = async (branch, month, year) => {
  const data = await apiRequest('GET', `/api/dashboard/upcoming-deadlines?branch=${encodeURIComponent(branch)}&month=${month}&year=${year}`);
  return data;
};

export const getRecentActivities = async () => {
  try {
    const response = await apiRequest('GET', '/api/dashboard/recent-activities');
    console.log("Recent activities API response:", response);
    return response;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};


// File upload
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || res.statusText);
  }
  
  return await res.json();
};

// Enquiry API calls
export const getEnquiries = async (params = {}) => {
  let url = '/api/enquiries';
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value) queryParams.append(key, value);
  }
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }
  
  const data = await apiRequest('GET', url);
  return data;
};
export const getEnquiry = async (id) => {
  if (!id) {
    throw new Error('Enquiry ID is required');
  }

  console.log('Fetching enquiry with ID:', id);
  console.log('Auth token present:', !!localStorage.getItem('token'));

  const response = await apiRequest('GET', `/api/enquiries/${id}`);
  console.log('Enquiry API response:', response);

  if (!response) {
    throw new Error('No response received from server');
  }

  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch enquiry');
  }

  return response;
};

export const createEnquiry = async (enquiryData) => {
  const data = await apiRequest('POST', '/api/enquiries', enquiryData);
  return data;
};

export const updateEnquiry = async (id, enquiryData) => {
  const data = await apiRequest('PUT', `/api/enquiries/${id}`, enquiryData);
  return data;
};

export const deleteEnquiry = async (id) => {
  const data = await apiRequest('DELETE', `/api/enquiries/${id}`);
  return data;
};

export const getEnquiryAgreement = async (enquiryId) => {
    try {
        const response = await apiRequest('GET', `http://localhost:5000/api/enquiries/${enquiryId}/agreement`);
        return response;
    } catch (error) {
        if (error.message.includes('404') || error.message.includes('No agreement found')) {
            console.log("No agreement found for enquiry:", enquiryId);
            return null;
        }
        console.error("Error in getEnquiryAgreement:", error);
        throw error;
    }
};

export const createOrUpdateEnquiryAgreement = async (enquiryId, data) => {
  try {
    const formData = new FormData();
    
    // Add all agreement data to formData
    Object.keys(data).forEach(key => {
      if (key === 'agreementFile' && data[key]) {
        formData.append('pdf', data[key]);
      } else if (key !== 'agreementFile') {
        // Ensure agreementDate is properly formatted
        if (key === 'agreementDate' && data[key]) {
          // Convert to ISO string and take just the date part
          const date = new Date(data[key]);
          formData.append(key, date.toISOString().split('T')[0]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    // Add branch name if not present
    if (!formData.get('branchName')) {
      formData.append('branchName', 'Default Branch');
    }

    // Ensure agreementDate is present and properly formatted
    if (!formData.get('agreementDate')) {
      formData.append('agreementDate', new Date().toISOString().split('T')[0]);
    }

    const response = await fetch(`http://localhost:5000/api/enquiries/${enquiryId}/agreement`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save agreement: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Update the agreementFile in the response to include the file name
    if (result.data && data.agreementFile) {
      result.data.agreementFile = {
        name: data.agreementFile.name,
        url: `/api/enquiries/agreements/file/${data.agreementFile.name}`
      };
    }

    return result;
  } catch (error) {
    console.error("Error in createOrUpdateEnquiryAgreement:", error);
    throw error;
  }
};

export const getEnquiryMeeting = async (enquiryId) => {
    try {
        const response = await apiRequest('GET', `/api/enquiries/${enquiryId}/meeting`);
        return response;
    } catch (error) {
        if (error.message.includes('404') || error.message.includes('No meeting found')) {
            console.log("No meeting found for enquiry:", enquiryId);
            return null;
        }
        console.error("Error in getEnquiryMeeting:", error);
        throw error;
    }
};

export const createOrUpdateEnquiryMeeting = async (enquiryId, data) => {
    const response = await apiRequest('POST', `/api/enquiries/${enquiryId}/meeting`, data);
    return response;
};

export const getBranches = async () => {
  const url = '/api/agreements/branches';

  try {
    const data = await apiRequest('GET', url);
    // You already parse JSON inside apiRequest; no need for response.json()
    console.log("Branches API Response:", data);
    return data;
  } catch (error) {
    console.error("Error in getBranches:", error);
    throw error;
  }
};


// lib/api/agreements.js

export const getVisaTracker = async (clientId) => {
  try {
    console.log('Fetching visa tracker for client:', clientId);
    const response = await apiRequest('GET', `/api/visa-tracker/${clientId}`);
    console.log('Visa tracker API response:', response);
    
    // Return the response data directly since it's already in the correct format
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error in getVisaTracker:', error);
    throw error;
  }
};

// Get agreement by branch name
export const getAgreementByBranch = async (branchName) => {
  try {
    const data = await apiRequest('GET', `/api/visa-tracker/agreement/${branchName}`);
    return data;
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`No agreement found for branch: ${branchName}`);
      return null;
    }
    throw error;
  }
};

// Upload agreement for a specific branch
export const uploadAgreementForBranch = async (clientId, formData) => {
    const url = `/api/visa-tracker/agreement/${clientId}`;

    try {
        const res = await apiRequest('PUT', url, formData, {
            headers: {
                // Don't set Content-Type explicitly; browser will do it correctly with FormData
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} - ${errorText}`);
        }

        return await res.json();
    } catch (error) {
        console.error('Error uploading agreement:', error);
        throw error;
    }
};

// Create or update agreement for a client
export const createOrUpdateAgreement = async (clientId, agreementData) => {
  try {
    const formData = new FormData();
    
    // Add all agreement data to formData
    Object.keys(agreementData).forEach(key => {
      if (key === 'document' && agreementData[key]) {
        formData.append('document', agreementData[key]);
      } else if (key !== 'document') {
        formData.append(key, agreementData[key]);
      }
    });

    const response = await apiRequest('POST', `/api/visa-tracker/agreement/${clientId}`, formData, {
      headers: {
        // Don't set Content-Type, let the browser set it with the boundary
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save agreement: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in createOrUpdateAgreement:", error);
    throw error;
  }
};

// Get agreement for a client
export const getAgreementByClient = async (clientId) => {
  try {
    const data = await apiRequest('GET', `/api/visa-tracker/agreement/${clientId}`);
    return data;
  } catch (error) {
    console.error("Error in getAgreementByClient:", error);
    throw error;
  }
};

// Enquiry Task API calls
export const getEnquiryTasks = async (enquiryId) => {
    try {
        const response = await apiRequest('GET', `/api/enquiries/${enquiryId}/tasks`);
        return response;
    } catch (error) {
        console.error("Error in getEnquiryTasks:", error);
        throw error;
    }
};

export const createEnquiryTask = async (enquiryId, taskData) => {
    try {
        const response = await apiRequest('POST', `/api/enquiries/${enquiryId}/tasks`, taskData);
        return response;
    } catch (error) {
        console.error("Error in createEnquiryTask:", error);
        throw error;
    }
};

export const updateEnquiryTask = async (enquiryId, taskId, taskData) => {
    try {
        const response = await apiRequest('PUT', `/api/enquiries/${enquiryId}/tasks/${taskId}`, taskData);
        return response;
    } catch (error) {
        console.error("Error in updateEnquiryTask:", error);
        throw error;
    }
};

export const deleteEnquiryTask = async (enquiryId, taskId) => {
    try {
        const response = await apiRequest('DELETE', `/api/enquiries/${enquiryId}/tasks/${taskId}`);
        return response;
    } catch (error) {
        console.error("Error in deleteEnquiryTask:", error);
        throw error;
    }
};

export const getClientTasks = async (clientId) => {
    try {
        const response = await apiRequest('GET', `/api/clients/${clientId}/tasks`);
        return response;
    } catch (error) {
        console.error("Error in getClientTasks:", error);
        throw error;
    }
};

export const createClientTask = async (clientId, taskData) => {
    try {
        console.log('Creating client task with data:', { clientId, taskData });
        const response = await apiRequest('POST', `/api/clients/${clientId}/tasks`, taskData);
        console.log('Create client task response:', response);
        
        if (!response) {
            throw new Error('No response received from server');
        }
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to create task');
        }
        
        return response;
    } catch (error) {
        console.error('Error in createClientTask:', error);
        // Rethrow the error with more context
        throw new Error(error.response?.data?.message || error.message || 'Failed to create task');
    }
}

export const updateClientTask = async (clientId, taskId, taskData) => {
    try {
        const response = await apiRequest('PUT', `/api/clients/${clientId}/tasks/${taskId}`, taskData);
        return response;
    } catch (error) {
        console.error("Error in updateClientTask:", error);
        throw error;
    }
}

export const deleteClientTask = async (clientId, taskId) => {
    const data = await apiRequest('DELETE', `/api/clients/${clientId}/tasks/${taskId}`);
    return data;
};

// Update the getAgreements function to include enquiry agreements
export const getAgreements = async (params = {}) => {
  try {
    // Fetch both regular agreements and enquiry agreements
    const [regularAgreements, enquiryAgreements] = await Promise.all([
      apiRequest('GET', '/api/agreements'),
      apiRequest('GET', '/api/enquiries/agreements')
    ]);

    // Combine and format both types of agreements
    const allAgreements = [
      ...(regularAgreements || []).map(agreement => ({
        id: agreement._id,
        branchName: agreement.branch_name,
        fileName: agreement.pdf_url,
        filePath: `/api/agreements/file/${agreement.pdf_url}`,
        source: 'regular'
      })),
      ...(enquiryAgreements || []).map(agreement => ({
        id: agreement._id,
        branchName: agreement.branchName || 'Enquiry Agreement',
        fileName: agreement.fileName,
        filePath: `/api/enquiries/agreements/file/${agreement.fileName}`,
        source: 'enquiry'
      }))
    ];

    return allAgreements;
  } catch (error) {
    console.error("Error in getAgreements:", error);
    throw error;
  }
};

// Add this function to get users (consultants)
export const getUsers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    const url = `/api/users${queryString ? `?${queryString}` : ''}`;
    
    const data = await apiRequest('GET', url);
    return data;
  } catch (error) {
    console.error("Error in getUsers:", error);
    throw error;
  }
};

// Facebook Leads API calls
export const getFacebookLeads = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    const url = `/api/facebook-leads${queryString ? `?${queryString}` : ''}`;
    
    const data = await apiRequest('GET', url);
    return data;
  } catch (error) {
    console.error("Error in getFacebookLeads:", error);
    throw error;
  }
};

export const getFacebookLead = async (id) => {
  try {
    const data = await apiRequest('GET', `/api/facebook-leads/${id}`);
    return data;
  } catch (error) {
    console.error("Error in getFacebookLead:", error);
    throw error;
  }
};

export const updateFacebookLeadStatus = async (leadId, statusData) => {
  try {
    const data = await apiRequest('PATCH', `/api/facebook-leads/${leadId}/status`, statusData);
    return data;
  } catch (error) {
    console.error("Error in updateFacebookLeadStatus:", error);
    throw error;
  }
};

export const syncFacebookLeads = async () => {
  try {
    const data = await apiRequest('GET', '/api/facebook-leads/sync');
    return data;
  } catch (error) {
    console.error("Error in syncFacebookLeads:", error);
    throw error;
  }
};

// Notification API calls
export const getNotifications = async () => {
  try {
    const response = await apiRequest('GET', '/api/notifications');
    return response;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId, type) => {
  try {
    const response = await apiRequest('PUT', `/api/notifications/${notificationId}/read`, { type });
    return response;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getEnquiryHistory = (enquiryId) => {
    if (!enquiryId) throw new Error("Enquiry ID is required to fetch history");
    return apiRequest("GET", `/api/enquiries/${enquiryId}/history`);
};

export const getOtherApplicantDetails = (clientId) => apiRequest('GET', `/api/other-applicant-details/${clientId}`);


