import axios from 'axios';

const rawBaseUrl = (import.meta as any).env?.VITE_API_URL || '';
const baseURL = rawBaseUrl ? `${rawBaseUrl.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
