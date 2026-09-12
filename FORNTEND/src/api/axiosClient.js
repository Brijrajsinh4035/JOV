import axios from 'axios';
import { APP_CONFIG } from '../utils/constants';
import { storage } from '../utils/storage';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Pre-configured Axios instance with request and response interceptors
 */
export const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = storage.get(APP_CONFIG.TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Normalization & 401 handling
axiosClient.interceptors.response.use(
  (response) => {
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      storage.remove(APP_CONFIG.TOKEN_KEY);
      storage.remove(APP_CONFIG.USER_KEY);
    }

    const customError = {
      status,
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected server error occurred. Please try again.',
      data: error.response?.data || null,
    };

    return Promise.reject(customError);
  }
);

export default axiosClient;
