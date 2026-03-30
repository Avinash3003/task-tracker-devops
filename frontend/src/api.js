import axios from 'axios';
import { structuredLog } from './logger.js';

// Use the environment variable if present (like for local dev), otherwise fallback to the production /api route
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// crypto.randomUUID() only works in HTTPS or localhost contexts.
// This fallback works in all HTTP environments (e.g. Minikube plain HTTP).
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

api.interceptors.request.use((config) => {
  const correlationId = generateUUID();
  config.headers['X-Correlation-ID'] = correlationId;

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  structuredLog('info', `API Request: ${config.method.toUpperCase()} ${config.url}`, {
    correlation_id: correlationId,
    method: config.method,
    url: config.url
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    structuredLog('info', `API Response Success`, {
      correlation_id: response.config.headers['X-Correlation-ID'],
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    const correlationId = error.config?.headers['X-Correlation-ID'] || 'unknown';
    structuredLog('error', `API Response Error`, {
      correlation_id: correlationId,
      status: error.response?.status,
      error: error.message
    });

    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  forgotPassword: (data) => api.post('/forgot-password', data),
  logout: () => api.post('/logout'),
};

export const userAPI = {
  getAll: (q = '') => api.get('/users' + (q ? `?q=${q}` : '')),
  deleteMe: (password) => api.delete('/users/me', { data: { password } }),
};

export const taskAPI = {
  create: (data) => api.post('/tasks', data),
  getAll: () => api.get('/tasks'),
  delete: (id) => api.delete(`/tasks/${id}`),
  restore: (id) => api.put(`/tasks/${id}/restore`),
  search: (params) => api.get('/tasks/search', { params }),
  sort: (params) => api.get('/tasks/sort', { params }),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  assign: (id, assigned_user_id) => api.put(`/tasks/${id}/assign`, { assigned_user_id }),
};

export default api;
