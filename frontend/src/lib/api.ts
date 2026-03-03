import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('access_token', accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string; bio?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: () => api.get('/auth/me'),
};

// Post API
export const postAPI = {
  createPost: (formData: FormData) =>
    api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getPost: (id: string) => api.get(`/posts/${id}`),
  
  getUserPosts: (userId: string, page = 1, limit = 20) =>
    api.get(`/posts/user/${userId}`, { params: { page, limit } }),
  
  getFeed: (page = 1, limit = 20) =>
    api.get('/posts', { params: { page, limit } }),
  
  deletePost: (id: string) => api.delete(`/posts/${id}`),
};

// Comment API
export const commentAPI = {
  createComment: (data: { postId: string; content: string; parentId?: string }) =>
    api.post('/comments', data),
  
  getPostComments: (postId: string, page = 1, limit = 20) =>
    api.get(`/comments/post/${postId}`, { params: { page, limit } }),
  
  getCommentReplies: (commentId: string, page = 1, limit = 10) =>
    api.get(`/comments/${commentId}/replies`, { params: { page, limit } }),
  
  updateComment: (id: string, content: string) =>
    api.put(`/comments/${id}`, { content }),
  
  deleteComment: (id: string) => api.delete(`/comments/${id}`),
};

// Like API
export const likeAPI = {
  likePost: (postId: string) => api.post(`/likes/post/${postId}`),
  unlikePost: (postId: string) => api.delete(`/likes/post/${postId}`),
  likeComment: (commentId: string) => api.post(`/likes/comment/${commentId}`),
  unlikeComment: (commentId: string) => api.delete(`/likes/comment/${commentId}`),
};