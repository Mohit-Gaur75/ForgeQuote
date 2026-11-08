// client/src/services/api.js
import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL;
const baseURL = !rawBase || rawBase === ''
  ? '/api/v1'
  : rawBase.endsWith('/api/v1')
    ? rawBase
    : `${rawBase.replace(/\/+$/, '')}/api/v1`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network connection failed',
      details: [],
    };
    return Promise.reject(errorData);
  }
);

export default api;
