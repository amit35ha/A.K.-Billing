import { Capacitor } from '@capacitor/core';

// Production EC2 Backend URL
export const EC2_BACKEND_URL = 'http://16.176.132.121:3001';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    // Only in local development Vite server (localhost:5173) do we use relative proxy ''
    if (window.location.hostname === 'localhost' && window.location.port === '5173') {
      return '';
    }
    // Everywhere else (Capacitor Android APK, production web, etc.)
    return EC2_BACKEND_URL;
  }

  return EC2_BACKEND_URL;
};

export const apiUrl = (endpoint) => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};
