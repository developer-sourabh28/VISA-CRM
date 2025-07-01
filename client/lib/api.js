export const getEnquiryTasks = (enquiryId) => apiRequest('GET', `/api/enquiries/${enquiryId}/tasks`);
export const createEnquiryTask = (enquiryId, data) => apiRequest('POST', `/api/enquiries/${enquiryId}/tasks`, data);
export const updateEnquiryTask = (enquiryId, taskId, data) => apiRequest('PUT', `/api/enquiries/${enquiryId}/tasks/${taskId}`, data);
export const deleteEnquiryTask = (enquiryId, taskId) => apiRequest('DELETE', `/api/enquiries/${enquiryId}/tasks/${taskId}`);

export const getEnquiryHistory = (enquiryId) => {
    if (!enquiryId) throw new Error("Enquiry ID is required to fetch history");
    return apiRequest("GET", `/api/enquiries/${enquiryId}/history`);
}; 