import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('astro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('astro_token');
      localStorage.removeItem('astro_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  updateOnboarding: (data) => api.put('/users/onboarding', data),
  getProfile: () => api.get('/users/profile'),
};

// Luck API
export const luckAPI = {
  getToday: () => api.get('/luck/today'),
  getForDate: (date) => api.get(`/luck/date/${date}`),
  getHistory: (limit = 30) => api.get(`/luck/history?limit=${limit}`),
  getWeekForecast: () => api.get('/luck/week'),
};

// Payment API
export const paymentAPI = {
  createCheckout: (originUrl) => api.post('/payments/checkout', { origin_url: originUrl }),
  getStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
  getPremiumStatus: () => api.get('/user/premium-status'),
};

// Locations API
export const locationsAPI = {
  getMyLocations: (category = null) => api.get(`/locations/my-locations${category ? `?category=${category}` : ''}`),
  getCompatibility: (partnerBirthDate, mode = 'romantic') => api.post('/locations/compatibility', {
    partner_birth_date: partnerBirthDate,
    mode: mode
  }),
};

export default api;
