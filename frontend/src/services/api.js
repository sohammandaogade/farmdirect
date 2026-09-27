import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('farmdirect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear token only if on a protected screen
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('farmdirect_token');
        localStorage.removeItem('farmdirect_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const farmerAPI = {
  getProfile: () => api.get('/farmers/profile'),
  updateProfile: (data) => api.put('/farmers/profile', data),
  getListings: (status) => api.get(`/farmers/listings${status ? `?status=${status}` : ''}`),
  createListing: (data) => api.post('/farmers/listings', data),
  getListing: (id) => api.get(`/farmers/listings/${id}`),
  updateListing: (id, data) => api.put(`/farmers/listings/${id}`, data),
  toggleStatus: (id, status) => api.put(`/farmers/listings/${id}/status`, { status }),
  deleteListing: (id) => api.delete(`/farmers/listings/${id}`),
};

export const buyerAPI = {
  getProfile: () => api.get('/buyers/profile'),
  updateProfile: (data) => api.put('/buyers/profile', data),
};

export const marketplaceAPI = {
  getListings: (params = {}) => api.get('/marketplace', { params }),
  getListing: (id) => api.get(`/marketplace/${id}`),
};

export const matchingAPI = {
  findMatches: (requirements) => api.post('/matching', requirements),
};

export const requestsAPI = {
  createRequest: (data) => api.post('/requests', data),
  getRequests: (status) => api.get(`/requests${status ? `?status=${status}` : ''}`),
  getRequest: (id) => api.get(`/requests/${id}`),
  cancelRequest: (id) => api.put(`/requests/${id}/cancel`),
};

export const negotiationsAPI = {
  getTimeline: (requestId) => api.get(`/negotiations/${requestId}`),
  counter: (requestId, data) => api.post(`/negotiations/${requestId}/counter`, data),
  accept: (requestId) => api.post(`/negotiations/${requestId}/accept`),
  reject: (requestId, data) => api.post(`/negotiations/${requestId}/reject`, data),
};

export const ordersAPI = {
  getOrders: (status) => api.get(`/orders${status ? `?status=${status}` : ''}`),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  getHistory: (id) => api.get(`/orders/${id}/history`),
};

export const priceAPI = {
  getInsight: (crop, region, price) => api.get(`/price-reference/${crop}`, { params: { region, price } }),
  getAll: () => api.get('/price-reference'),
};

export const logisticsAPI = {
  estimate: (data) => api.post('/logistics/estimate', data),
};

export const analyticsAPI = {
  getFarmer: () => api.get('/analytics/farmer'),
  getBuyer: () => api.get('/analytics/buyer'),
  getAdmin: () => api.get('/analytics/admin'),
};

export const adminAPI = {
  getUsers: (role) => api.get(`/admin/users${role ? `?role=${role}` : ''}`),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getListings: () => api.get('/admin/listings'),
  removeListing: (id) => api.delete(`/admin/listings/${id}`),
  getOrders: () => api.get('/admin/orders'),
  getAnalytics: () => api.get('/admin/analytics'),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/mark-read'),
  markOneRead: (id) => api.put(`/notifications/${id}/read`),
};

export const aiAPI = {
  getHybridMatches: (data) => api.post('/ai/hybrid-match', data),
  getDemand: (crop = 'Tomato', region = 'Pune') =>
    api.get('/ai/demand', { params: { crop, region } }),
  getPriceForecast: (crop = 'Tomato', region = 'Pune', quantity = 1000) =>
    api.get('/ai/price-forecast', { params: { crop, region, quantity } }),
  calculateProfit: (data) => api.post('/ai/profit-calculator', data),
  getSmartSelling: (data) => api.post('/ai/smart-selling', data),
  getNegotiationCopilot: (requestId, role = 'farmer') =>
    api.post('/ai/negotiation-copilot', { request_id: requestId, role }),
  optimizeProcurement: (data) => api.post('/ai/procurement-optimizer', data),
  checkDuplicate: (data) => api.post('/ai/duplicate-check', data),
};

export const copilotAPI = {
  askFarmer: (query) => api.post('/copilot/farmer', { query }),
  askBuyer: (query) => api.post('/copilot/buyer', { query }),
  voiceAssistant: (transcript) => api.post('/copilot/voice-command', { transcript }),
  generateListing: (prompt) => api.post('/copilot/generate-listing', { prompt }),
};

export const digitalTwinAPI = {
  getTwin: (farmerId) => api.get(`/digital-twin/farmer/${farmerId}`),
  getInventoryIntelligence: () => api.get('/digital-twin/inventory-intelligence'),
  updateSoil: (data) => api.post('/digital-twin/soil', data),
};

export const wasteAPI = {
  getListings: (params = {}) => api.get('/waste/listings', { params }),
  createListing: (data) => api.post('/waste/listings', data),
  getMyListings: () => api.get('/waste/my-listings'),
  createOrder: (data) => api.post('/waste/orders', data),
};

export const commandCenterAPI = {
  getMetrics: () => api.get('/command-center/metrics'),
  getHeatmap: (layer = 'supply') => api.get('/command-center/heatmap', { params: { layer } }),
  simulate: (data) => api.post('/command-center/simulate', data),
  getAnomalies: (status) => api.get('/command-center/anomalies', { params: { status } }),
  updateAnomaly: (id, data) => api.put(`/command-center/anomalies/${id}`, data),
};

export const qualityAPI = {
  uploadAndInspect: (formData) =>
    api.post('/quality/upload-inspect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
