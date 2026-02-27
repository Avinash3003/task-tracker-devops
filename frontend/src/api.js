import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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

export const taskAPI = {
  create: (data) => api.post('/tasks', data),
  getAll: () => api.get('/tasks'),
  delete: (id) => api.delete(`/tasks/${id}`),
  restore: (id) => api.put(`/tasks/${id}/restore`),
  search: (params) => api.get('/tasks/search', { params }),
  sort: (params) => api.get('/tasks/sort', { params }),
};

export default api;
