import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: backendUrl ? `${backendUrl}/api` : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config?.url?.includes('/auth/me')) {
        console.warn('Session expired or unauthorized.');
      }
    }
    return Promise.reject(error);
  }
);
