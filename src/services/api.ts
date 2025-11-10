import axios from 'axios';

const API_URL = 'http://192.168.1.19:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Nếu là FormData, không set Content-Type để browser tự động set với boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const userAPI = {
  getAllUsers: () => api.get('/user/all'),
  getUserById: (id: string) => api.get(`/user/${id}`),
  updateUser: (id: string, data: any) => api.put(`/user/${id}`, data),
  lockUser: (id: string, action: 'lock' | 'unlock') => api.put(`/user/${id}/lock`, { action }),
  getStatistics: () => api.get('/user/statistics'),
  getDashboardStatistics: () => api.get('/user/dashboard'),
  getSystemStatistics: () => api.get('/user/system-statistics'),
};

export const trainingAPI = {
  getAllTrainings: () => api.get('/trainings'),
  getTrainingById: (id: string) => api.get(`/trainings/${id}`),
  getByLevel: (level: string) => api.get(`/trainings/level/${encodeURIComponent(level)}`),
  getByGoal: (goal: string) => api.get(`/trainings/goal/${encodeURIComponent(goal)}`),
  createTraining: (data: FormData | any) => api.post('/trainings', data),
  updateTraining: (id: string, data: FormData | any) => api.put(`/trainings/${id}`, data),
  deleteTraining: (id: string) => api.delete(`/trainings/${id}`),
};

export const mealAPI = {
  getAllMeals: () => api.get('/meals'),
  getMealById: (id: string) => api.get(`/meals/${id}`),
  getMealsByGoal: (goal: string) => api.get(`/meals/goal/${encodeURIComponent(goal)}`),
  createMeal: (data: FormData | any) => api.post('/meals', data),
  updateMeal: (id: string, data: FormData | any) => api.put(`/meals/${id}`, data),
  deleteMeal: (id: string) => api.delete(`/meals/${id}`),
};

export const mealPlanAPI = {
  getAllMealPlans: () => api.get('/meal-plans'),
  getMealPlanById: (id: string) => api.get(`/meal-plans/${id}`),
  createMealPlan: (data: any) => api.post('/meal-plans', data),
  updateMealPlan: (id: string, data: any) => api.put(`/meal-plans/${id}`, data),
  deleteMealPlan: (id: string) => api.delete(`/meal-plans/${id}`),
};

export default api;

