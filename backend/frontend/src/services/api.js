import axios from 'axios';

// Create axios instance with proper baseURL
const api = axios.create({
  baseURL: '/api', // Use only one /api prefix
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Add response interceptor for easier error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

const apiService = {
  // Authentication methods
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    return response;
  },

  logout: async () => {
    const response = await api.post('/auth/logout/');
    return response;
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/user/');
      return response;
    } catch (error) {
      return null;
    }
  },

  // Room management methods
  getRooms: async () => {
    return await api.get('/quartos/');
  },

  getRoom: async (id) => {
    return await api.get(`/quartos/${id}/`);
  },

  createRoom: async (roomData) => {
    return await api.post('/quartos/', roomData);
  },

  updateRoom: async (id, roomData) => {
    return await api.put(`/quartos/${id}/`, roomData);
  },

  deleteRoom: async (id) => {
    return await api.delete(`/quartos/${id}/`);
  },

  // Generic CRUD methods
  get: async (url, config = {}) => {
    return await api.get(url, config);
  },
  
  post: async (url, data, config = {}) => {
    return await api.post(url, data, config);
  },
  
  put: async (url, data, config = {}) => {
    return await api.put(url, data, config);
  },

  patch: async (url, data, config = {}) => {
    return await api.patch(url, data, config);
  },
  
  delete: async (url, config = {}) => {
    return await api.delete(url, config);
  },
};

export default apiService;
