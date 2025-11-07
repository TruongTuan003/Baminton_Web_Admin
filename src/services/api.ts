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
  deleteUser: (id: string) => api.delete(`/user/${id}`),
  getStatistics: () => api.get('/user/statistics'),
  getDashboardStatistics: () => api.get('/user/dashboard'),
  getSystemStatistics: () => api.get('/user/system-statistics'),
};

export const trainingAPI = {
  getAllTrainings: () => api.get('/trainings'),
  getTrainingById: (id: string) => api.get(`/trainings/${id}`),
  getByLevel: (level: string) => api.get(`/trainings/level/${encodeURIComponent(level)}`),
  getByGoal: (goal: string) => api.get(`/trainings/goal/${encodeURIComponent(goal)}`),
  createTraining: (data: any) => api.post('/trainings', data),
  updateTraining: (id: string, data: any) => api.put(`/trainings/${id}`, data),
  deleteTraining: (id: string) => api.delete(`/trainings/${id}`),
};

export const mealAPI = {
  getAllMeals: () => api.get('/meals'),
  getMealById: (id: string) => api.get(`/meals/${id}`),
  getMealsByGoal: (goal: string) => api.get(`/meals/goal/${encodeURIComponent(goal)}`),
  createMeal: (data: any) => api.post('/meals', data),
  updateMeal: (id: string, data: any) => api.put(`/meals/${id}`, data),
  deleteMeal: (id: string) => api.delete(`/meals/${id}`),
};

export default api;

