import { QueryClient } from "@tanstack/react-query";

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

  const res = await fetch(url, {
    method,
    headers: data ? { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error Response:", {
      status: res.status,
      statusText: res.statusText,
      body: errorText
    });
    throw new Error(`${res.status}: ${errorText}`);
  }

  return res;
}

export const getQueryFn = ({ on401 }) => async ({ queryKey }) => {
  const res = await fetch(queryKey[0], {
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