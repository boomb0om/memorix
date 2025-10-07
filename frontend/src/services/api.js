import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor для добавления токена к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок 401 и автоматического обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Проверяем, что это 401 ошибка и запрос еще не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Если это запрос на refresh, не пытаемся обновить токен
      if (originalRequest.url === '/api/users/refresh') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Если токен уже обновляется, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // Если нет refresh токена, перенаправляем на логин
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Пытаемся обновить токен
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || ''}/api/users/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        
        // Обновляем заголовок для оригинального запроса
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Обрабатываем очередь ожидающих запросов
        processQueue(null, access_token);
        
        isRefreshing = false;
        
        // Повторяем оригинальный запрос с новым токеном
        return api(originalRequest);
      } catch (refreshError) {
        // Если обновление токена не удалось, очищаем данные и перенаправляем на логин
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API для работы с конспектами
export const notesApi = {
  // Получить все конспекты
  getAll: () => api.get('/api/notes'),
  
  // Получить конспект по ID
  getById: (id) => api.get(`/api/notes/${id}`),
  
  // Создать новый конспект
  create: (noteData) => api.post('/api/notes', noteData),
  
  // Обновить конспект
  update: (id, noteData) => api.patch(`/api/notes/${id}`, noteData),
  
  // Удалить конспект
  delete: (id) => api.delete(`/api/notes/${id}`),
};

export default api;
