import { QueryClient } from "@tanstack/react-query";

const API_BASE_URL = 'http://localhost:5000';

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method, url, data) {
  console.log("Making API request:", {
    method,
    url,
    data,
  });

  const headers = {
    "Accept": "application/json"
  };

  // Add Content-Type header if there's data
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error Response:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText,
        headers: Object.fromEntries(res.headers.entries())
      });
      throw new Error(`${res.status}: ${errorText}`);
    }

    const responseData = await res.json();
    console.log("API Response Data:", responseData);
    return responseData;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

export const getQueryFn = ({ on401 }) => async ({ queryKey }) => {
  const headers = {
    "Accept": "application/json"
  };

  const fullUrl = queryKey[0].startsWith('http') ? queryKey[0] : `${API_BASE_URL}${queryKey[0]}`;
  const res = await fetch(fullUrl, {
    headers,
    credentials: "include",
  });

  if (on401 === "returnNull" && res.status === 401) {
    return null;
  }

  await throwIfResNotOk(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});