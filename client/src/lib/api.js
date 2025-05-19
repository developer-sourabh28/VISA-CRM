import { apiRequest } from "./queryClient";

// Auth API calls
export const login = async (credentials) => {
  const res = await apiRequest('POST', '/api/auth/login', credentials);
  return await res.json();
};

export const register = async (userData) => {
  const res = await apiRequest('POST', '/api/auth/register', userData);
  return await res.json();
};

export const logout = async () => {
  const res = await apiRequest('GET', '/api/auth/logout');
  return await res.json();
};

export const getProfile = async () => {
  const res = await apiRequest('GET', '/api/auth/profile');
  return await res.json();
};

// Client API calls
export const getClients = async (params = {}) => {
  let url = '/api/clients';
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

export const getClient = async (id) => {
  const res = await apiRequest('GET', `/api/clients/${id}`);
  return await res.json();
};

export const createClient = async (clientData) => {
  const res = await apiRequest('POST', '/api/clients', clientData);
  return await res.json();
};

export const updateClient = async (id, clientData) => {
  const res = await apiRequest('PUT', `/api/clients/${id}`, clientData);
  return await res.json();
};

export const deleteClient = async (id) => {
  const res = await apiRequest('DELETE', `/api/clients/${id}`);
  return await res.json();
};

// Agreement API calls
export const getAgreements = async (params = {}) => {
  let url = '/api/agreements';
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
  let url = '/api/appointments';
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

export const getUpcomingAppointments = async (days = 7) => {
  const res = await apiRequest('GET', `/api/appointments/upcoming?days=${days}`);
  return await res.json();
};

export const getAppointment = async (id) => {
  const res = await apiRequest('GET', `/api/appointments/${id}`);
  return await res.json();
};

export const createAppointment = async (appointmentData) => {
  const res = await apiRequest('POST', '/api/appointments', appointmentData);
  return await res.json();
};

export const updateAppointment = async (id, appointmentData) => {
  const res = await apiRequest('PUT', `/api/appointments/${id}`, appointmentData);
  return await res.json();
};

export const deleteAppointment = async (id) => {
  const res = await apiRequest('DELETE', `/api/appointments/${id}`);
  return await res.json();
};

export const getClientAppointments = async (clientId) => {
  const res = await apiRequest('GET', `/api/clients/${clientId}/appointments`);
  return await res.json();
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
