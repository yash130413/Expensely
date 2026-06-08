import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: async (userData) => {
    const response = await api.post('/auth/login', userData);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  profile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Expenses API
export const expensesApi = {
  getAll: async () => {
    const response = await api.get('/expenses');
    return response.data;
  },
  
  create: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },
  
  update: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  }
};

// Budgets API
export const budgetsApi = {
  get: async (month) => {
    const response = await api.get(`/budgets${month ? `?month=${month}` : ''}`);
    return response.data;
  },
  
  upsert: async (budgetData) => {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  }
};

// OCR API
export const ocrApi = {
  upload: async (rawText, extractedData) => {
    const response = await api.post('/ocr/upload', { rawText, extractedData });
    return response.data;
  }
};

// Groups API
export const groupsApi = {
  getAll: async (userId) => {
    const response = await api.get(`/groups?userId=${userId}`);
    return response.data;
  },
  
  getOne: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },
  
  create: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },
  
  update: async (groupId, groupData) => {
    const response = await api.put(`/groups/${groupId}`, groupData);
    return response.data;
  },
  
  delete: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },
  
  addMember: async (groupId, memberData) => {
    const response = await api.post(`/groups/${groupId}/members`, memberData);
    return response.data;
  },
  
  removeMember: async (groupId, userId) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  }
};

// Shared Expenses API
export const sharedExpensesApi = {
  getByGroup: async (groupId) => {
    const response = await api.get(`/shared-expenses/group/${groupId}`);
    return response.data;
  },
  
  create: async (expenseData) => {
    const response = await api.post('/shared-expenses', expenseData);
    return response.data;
  },
  
  update: async (expenseId, expenseData) => {
    const response = await api.put(`/shared-expenses/${expenseId}`, expenseData);
    return response.data;
  },
  
  delete: async (expenseId) => {
    const response = await api.delete(`/shared-expenses/${expenseId}`);
    return response.data;
  },
  
  settle: async (groupId) => {
    const response = await api.post(`/shared-expenses/group/${groupId}/settle`);
    return response.data;
  },
  
  getSummary: async (groupId) => {
    const response = await api.get(`/shared-expenses/group/${groupId}/summary`);
    return response.data;
  }
};

export default api;
