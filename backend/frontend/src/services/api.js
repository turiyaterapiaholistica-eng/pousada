// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: window.location.origin + '/api'
});

export default api;