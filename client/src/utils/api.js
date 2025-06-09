export const apiRequest = async (method, endpoint, data = null, isFormData = false) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    // Only add Content-Type header if not FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      method,
      headers,
      credentials: 'include',
    };

    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    console.log('Making API request:', {
      method,
      endpoint,
      headers,
      body: isFormData ? 'FormData' : data
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    console.log('API Response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || 'API request failed');
    }

    return responseData;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}; 