import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9999/api'

console.log('[API] Initializing API with base URL:', API_BASE_URL);

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('[API] 📤 Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      hasToken: !!token,
    });
    return config
  },
  (error) => {
    console.error('[API] ❌ Request prep failed:', error)
    return Promise.reject(error)
  }
)

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log('[API] ✅ Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      dataKeys: response.data ? Object.keys(response.data) : 'no data',
    })
    return response
  },
  (error: AxiosError) => {
    console.error('[API] ❌ Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      code: error.code,
      data: error.response?.data,
    })
    
    // Only redirect to login if ALREADY AUTHENTICATED and token expired
    // Don't redirect for login/signup/forgot-password endpoints
    const url = error.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || 
                          url.includes('/auth/signup') || 
                          url.includes('/auth/forgot-password') ||
                          url.includes('/auth/check-email') ||
                          url.includes('/auth/reset-password') ||
                          url.includes('/auth/google-login')
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      console.log('[API] 🔐 Unauthorized (401) - clearing auth tokens')
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface AuthPayload {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      email: string
      name: string
    }
    token: string
  }
}

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
}

export interface UsersResponse {
  success: boolean
  message: string
  data: User[]
}

export interface UserResponse {
  success: boolean
  message: string
  data: User
}

export interface AnalysisPayload {
  fileUrl: string
  modes: string[]
}

export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    console.log('[authAPI] Calling login with email:', credentials.email)
    return api.post<AuthResponse>('/auth/login', credentials)
  },

  signup: (data: { name: string; email: string; password: string }) => {
    console.log('[authAPI] Calling signup with email:', data.email)
    return api.post<AuthResponse>('/auth/signup', data)
  },

  googleLogin: (data: { credential: string }) => {
    console.log('[authAPI] Calling googleLogin with credential')
    return api.post<AuthResponse>('/auth/google-login', data)
  },

  changePassword: (data: { currentPassword?: string; newPassword: string }) => {
    console.log('[authAPI] Calling changePassword')
    return api.post('/auth/change-password', data)
  },

  logout: () => {
    console.log('[authAPI] Clearing auth tokens')
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
  },
}

export const userAPI = {
  getAll: () =>
    api.get<UsersResponse>('/users'),

  getById: (id: string) =>
    api.get<UserResponse>(`/users/${id}`),

  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<UserResponse>('/users', data),

  update: (id: string, data: { name?: string; role?: string; isActive?: boolean }) =>
    api.put<UserResponse>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),
}

export const analysisAPI = {
  create: (data: AnalysisPayload) =>
    api.post('/analyses', data),

  getAll: () =>
    api.get('/analyses'),

  getById: (id: string) =>
    api.get(`/analyses/${id}`),
}

export default api
