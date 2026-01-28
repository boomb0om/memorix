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
      const requestUrl = originalRequest.url || '';
      if (requestUrl.includes('/api/users/refresh') || requestUrl.endsWith('/refresh')) {
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
        
        if (!access_token) {
          throw new Error('No access token in refresh response');
        }
        
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

// API для работы с курсами
export const coursesApi = {
  // Получить все доступные курсы пользователя
  getAll: () => api.get('/api/courses'),
  
  // Получить курсы, созданные пользователем
  getMy: () => api.get('/api/courses/my'),
  
  // Получить курс по ID
  getById: (id) => api.get(`/api/courses/${id}`),
  
  // Получить курс с уроками
  getWithLessons: (id) => api.get(`/api/courses/${id}/with-lessons`),
  
  // Создать новый курс
  create: (courseData) => api.post('/api/courses', courseData),
  
  // Обновить курс
  update: (id, courseData) => api.patch(`/api/courses/${id}`, courseData),
  
  // Удалить курс
  delete: (id) => api.delete(`/api/courses/${id}`),
  
  // Сгенерировать план уроков для курса
  generateLessons: (id, data) => api.post(`/api/courses/${id}/generate-lessons`, data || {}),

  // Поиск курсов
  search: (query) => api.get('/api/courses/search', { params: { query } }),

  // Экспортировать курс
  export: (id) => api.post(`/api/courses/${id}/export`, {}, { responseType: 'blob' }),

  // Проанализировать курс
  analyze: (id) => api.post(`/api/courses/${id}/analyze`),

  // Получить историю анализов курса
  getAnalysisHistory: (id) => api.get(`/api/courses/${id}/analysis-history`),
};

// API для работы с уроками
export const lessonsApi = {
  // Получить все уроки курса
  getByCourse: (courseId) => api.get(`/api/courses/${courseId}/lessons`),
  
  // Получить урок по ID
  getById: (courseId, lessonId) => api.get(`/api/courses/${courseId}/lessons/${lessonId}`),
  
  // Создать новый урок
  create: (courseId, lessonData) => api.post(`/api/courses/${courseId}/lessons`, lessonData),
  
  // Обновить урок
  update: (courseId, lessonId, lessonData) => api.patch(`/api/courses/${courseId}/lessons/${lessonId}`, lessonData),
  
  // Удалить урок
  delete: (courseId, lessonId) => api.delete(`/api/courses/${courseId}/lessons/${lessonId}`),
  
  // Изменить позицию урока
  reorder: (courseId, lessonId, newPosition) => api.post(`/api/courses/${courseId}/lessons/${lessonId}/reorder`, { new_position: newPosition }),
  
  // Обновить отдельный блок урока
  updateBlock: (courseId, lessonId, blockId, blockData) => api.patch(`/api/courses/${courseId}/lessons/${lessonId}/blocks/${blockId}`, blockData),
  
  // Изменить позицию блока в уроке
  reorderBlock: (courseId, lessonId, blockId, newPosition) => api.post(`/api/courses/${courseId}/lessons/${lessonId}/blocks/${blockId}/reorder`, { new_position: newPosition }),
  
  // Добавить новый блок к уроку
  addBlock: (courseId, lessonId, blockData, position = null) => {
    const payload = { block: blockData };
    // Явно передаем position, даже если он равен 0 (0 - это валидная позиция)
    // Если position === null или undefined, не включаем его в payload
    if (position !== null && position !== undefined) {
      payload.position = position;
    }
    return api.post(`/api/courses/${courseId}/lessons/${lessonId}/blocks`, payload);
  },
  
  // Удалить блок из урока
  deleteBlock: (courseId, lessonId, blockId) => api.delete(`/api/courses/${courseId}/lessons/${lessonId}/blocks/${blockId}`),
  
  // Проверить ответ на вопрос
  checkAnswer: (courseId, lessonId, blockId, answer) => api.post(`/api/courses/${courseId}/lessons/${lessonId}/blocks/${blockId}/check-answer`, { answer }),
  
  // Сгенерировать контент урока
  generateContent: (courseId, lessonId, data) => api.post(`/api/courses/${courseId}/lessons/${lessonId}/generate-content`, data || {}),
  
  // Сгенерировать или переформулировать контент блока урока
  generateBlockContent: (courseId, lessonId, blockId, data) => api.post(`/api/courses/${courseId}/lessons/${lessonId}/blocks/${blockId}/generate-content`, data || {}),
};

// API для работы с документами
export const documentsApi = {
  // Получить все документы пользователя
  getAll: () => api.get('/api/documents'),
  
  // Получить документ по ID
  getById: (id) => api.get(`/api/documents/${id}`),
  
  // Загрузить новый документ
  create: (formData) => api.post('/api/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;
