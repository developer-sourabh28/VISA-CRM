import { apiRequest } from "./queryClient";

export async function login({ username, password, role }) {
    const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
    });

    return await res.json();
}


export const register = async (userData) => {
  const res = await apiRequest('POST', '/api/auth/register', userData);
  return await res.json();
};

export const logout = async () => {
  const res = await apiRequest('GET', '/api/auth/logout');
  localStorage.removeItem('token');
  return await res.json();
};

export const getProfile = async () => {
  const res = await apiRequest('GET', '/api/auth/profile');
  return await res.json();
};

// Client API calls
export const getClients = async (params = {}) => {
  console.log("Getting clients with params:", params);
  
  const queryParams = new URLSearchParams();
  
  // Only add parameters that have values
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  const url = `/api/clients${queryString ? `?${queryString}` : ''}`;
  
  console.log("Client API Request URL:", url);
  
  try {
    const response = await apiRequest('GET', url);
    const data = await response.json();
    console.log("Clients API Response:", data);
    return data;
  } catch (error) {
    console.error("Error in getClients:", error);
    throw error;
  }
};
//get client by
export const getClient = async (id) => {
  try {
    console.log("Fetching client with ID:", id);
    const response = await apiRequest('GET', `/api/clients/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch client details');
    }
    
    const data = await response.json();
    console.log("Client data received:", data);
    return data;
  } catch (error) {
    console.error("Error in getClient:", error);
    throw error;
  }
};

// Add this to your lib/api.js file

export const createClient = async (clientData) => {
  console.log("Creating client with data:", clientData);
  
  try {
    const response = await apiRequest('POST', '/api/clients', clientData);
    const data = await response.json();
    console.log("Create client API response:", data);
    return data;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};

export const updateClient = async (id, clientData) => {
  const res = await apiRequest('PUT', `/api/clients/${id}`, clientData);
  return await res.json();
};

export const deleteClient = async (id) => {
  const res = await apiRequest('DELETE', `/api/clients/${id}`);
  return await res.json();
};

//convert to client
export const convertEnquiry = async (id) => {
    const res = await fetch('/api/clients/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiryId: id })
    });

    if (!res.ok) throw new Error('Failed to convert enquiry');
    return res.json();
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
  const res = await apiRequest('GET', `/api/agreements/${id}`);
  return await res.json();
};

export const createAgreement = async (agreementData) => {
  const res = await apiRequest('POST', '/api/agreements', agreementData);
  return await res.json();
};

export const updateAgreement = async (id, agreementData) => {
  const res = await apiRequest('PUT', `/api/agreements/${id}`, agreementData);
  return await res.json();
};

export const deleteAgreement = async (id) => {
  const res = await apiRequest('DELETE', `/api/agreements/${id}`);
  return await res.json();
};

export const getClientAgreements = async (clientId) => {
  const res = await apiRequest('GET', `/api/clients/${clientId}/agreements`);
  return await res.json();
};

// Appointment API calls
export const getAppointments = async (params = {}) => {
  try {
    const response = await apiRequest('GET', '/api/visa-tracker');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch appointments: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.map(tracker => tracker.appointment).filter(Boolean);
  } catch (error) {
    console.error("Error in getAppointments:", error);
    throw error;
  }
};

export const getUpcomingAppointments = async (days = 7) => {
  try {
    const response = await apiRequest('GET', '/api/visa-tracker');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch upcoming appointments: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return data
      .map(tracker => tracker.appointment)
      .filter(appointment => 
        appointment && 
        appointment.dateTime && 
        new Date(appointment.dateTime) > now && 
        new Date(appointment.dateTime) <= futureDate
      );
  } catch (error) {
    console.error("Error in getUpcomingAppointments:", error);
    throw error;
  }
};

export const getAppointment = async (clientId) => {
  try {
    const response = await apiRequest('GET', `/api/visa-tracker/appointment/${clientId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch appointment: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getAppointment:", error);
    throw error;
  }
};

export const createAppointment = async (clientId, appointmentData) => {
  try {
    const response = await apiRequest('POST', `/api/visa-tracker/appointment/${clientId}`, appointmentData);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create appointment: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in createAppointment:", error);
    throw error;
  }
};

export const updateAppointment = async (clientId, appointmentData) => {
  try {
    const response = await apiRequest('PUT', `/api/visa-tracker/appointment/${clientId}`, appointmentData);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update appointment: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in updateAppointment:", error);
    throw error;
  }
};

export const deleteAppointment = async (clientId) => {
  try {
    const response = await apiRequest('DELETE', `/api/visa-tracker/appointment/${clientId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete appointment: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in deleteAppointment:", error);
    throw error;
  }
};

export const getClientAppointments = async (clientId) => {
  try {
    const response = await apiRequest('GET', `/api/visa-tracker/appointment/${clientId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get appointments: ${response.status} - ${errorText}`);
    }
    return await response.json();
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
  
  const res = await apiRequest('GET', url);
  return await res.json();
};

export const getDocument = async (id) => {
  const res = await apiRequest('GET', `/api/documents/${id}`);
  return await res.json();
};

export const createDocument = async (documentData) => {
  const res = await apiRequest('POST', '/api/documents', documentData);
  return await res.json();
};

export const updateDocument = async (id, documentData) => {
  const res = await apiRequest('PUT', `/api/documents/${id}`, documentData);
  return await res.json();
};

export const deleteDocument = async (id) => {
  const res = await apiRequest('DELETE', `/api/documents/${id}`);
  return await res.json();
};

export const getClientDocuments = async (clientId) => {
  const res = await apiRequest('GET', `/api/clients/${clientId}/documents`);
  return await res.json();
};

// Dashboard API calls
export const getDashboardStats = async () => {
  const res = await apiRequest('GET', '/api/dashboard/stats');
  return await res.json();
};

export const getApplicationStatusChart = async () => {
  const res = await apiRequest('GET', '/api/dashboard/charts/application-status');
  return await res.json();
};

export const getMonthlyApplicationsChart = async () => {
  const res = await apiRequest('GET', '/api/dashboard/charts/monthly-applications');
  return await res.json();
};

export const getRecentApplications = async () => {
  const res = await apiRequest('GET', '/api/dashboard/recent-applications');
  return await res.json();
};

export const getUpcomingDeadlines = async () => {
  const res = await apiRequest('GET', '/api/dashboard/upcoming-deadlines');
  return await res.json();
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
  
  const res = await apiRequest('GET', url);
  return await res.json();
};

export const getEnquiry = async (id) => {
  const res = await apiRequest('GET', `/api/enquiries/${id}`);
  return await res.json();
};

export const createEnquiry = async (enquiryData) => {
  const res = await apiRequest('POST', '/api/enquiries', enquiryData);
  return await res.json();
};

export const updateEnquiry = async (id, enquiryData) => {
  const res = await apiRequest('PUT', `/api/enquiries/${id}`, enquiryData);
  return await res.json();
};

export const deleteEnquiry = async (id) => {
  const res = await apiRequest('DELETE', `/api/enquiries/${id}`);
  return await res.json();
};




export const getBranches = async () => {
  const url = '/api/agreements/branches';

  try {
    const response = await apiRequest('GET', url);
    const data = await response.json(); // or response.data if using axios
    console.log("Branches API Response:", data);
    return data;
  } catch (error) {
    console.error("Error in getBranches:", error);
    throw error;
  }
};

// lib/api/agreements.js

export async function getVisaTracker(clientId) {
  try {
    const res = await apiRequest('GET', `/api/visa-tracker/${clientId}`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch visa tracker: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error in getVisaTracker:', error);
    throw error;
  }
}

// Get agreement by branch name
export const getAgreementByBranch = async (branchName) => {
    const url = `/api/visa-tracker/agreement/${branchName}`;

    const res = await apiRequest('GET', url);

    if (res.status === 404) {
        console.log(`No agreement found for branch: ${branchName}`);
        return null;
    }

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch agreement: ${res.status} - ${errorText}`);
    }

    return await res.json();
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
    const response = await apiRequest('GET', `/api/visa-tracker/agreement/${clientId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get agreement: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getAgreementByClient:", error);
    throw error;
  }
};


