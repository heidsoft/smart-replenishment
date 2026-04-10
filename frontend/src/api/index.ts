import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (phone: string, password?: string, code?: string) =>
    api.post('/auth/login', { phone, password, code }),
  register: (phone: string, password: string, name?: string) =>
    api.post('/auth/register', { phone, password, name }),
  me: () => api.get('/auth/me'),
};

// Products
export const productApi = {
  list: (params?: { category?: string; lowStock?: boolean }) =>
    api.get('/products', { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  stockIn: (id: number, quantity: number) =>
    api.post(`/products/${id}/stock-in`, { quantity }),
};

// Suppliers
export const supplierApi = {
  list: () => api.get('/suppliers'),
  get: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

// Orders
export const orderApi = {
  list: (params?: { status?: string }) => api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: number, status: string, arrivedDate?: string) =>
    api.put(`/orders/${id}/status`, { status, arrivedDate }),
  cancel: (id: number) => api.delete(`/orders/${id}`),
};

// Sales
export const salesApi = {
  list: (params?: { productId?: number; memberId?: number; startDate?: string; endDate?: string }) =>
    api.get('/sales', { params }),
  create: (data: { productId: number; quantity: number; salePrice: number; memberId?: number }) =>
    api.post('/sales', data),
  batchCreate: (records: any[]) => api.post('/sales/batch', { records }),
  checkout: (data: { items: any[]; memberId?: number; discount?: number; remark?: string }) =>
    api.post('/sales/checkout', data),
};

// Members
export const memberApi = {
  list: (params?: { keyword?: string; level?: string }) =>
    api.get('/members', { params }),
  get: (id: number) => api.get(`/members/${id}`),
  create: (data: any) => api.post('/members', data),
  update: (id: number, data: any) => api.put(`/members/${id}`, data),
  delete: (id: number) => api.delete(`/members/${id}`),
  findByPhone: (phone: string) => api.get(`/members/phone/${phone}`),
  adjustPoints: (id: number, data: { type: string; points: number; remark?: string }) =>
    api.post(`/members/${id}/points`, data),
};

// AI
export const aiApi = {
  getSuggestions: () => api.get('/ai/suggestions'),
  chat: (message: string, useLLM?: boolean) => api.post('/ai/chat', { message, use_llm: useLLM }),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Promotion
export const promotionApi = {
  listCoupons: () => api.get('/promotions/coupons'),
  createCoupon: (data: any) => api.post('/promotions/coupons', data),
  deleteCoupon: (id: number) => api.delete(`/promotions/coupons/${id}`),
  claimCoupon: (id: number) => api.post(`/promotions/coupons/${id}/claim`),
  getMyCoupons: () => api.get('/promotions/my-coupons'),
};
