import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://websubastasilenciosa-production.up.railway.app';

// Configurar axios con credenciales
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT de NextAuth a cada petición
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const session = await getSession();
    if (session?.backendToken) {
      config.headers.Authorization = `Bearer ${session.backendToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Funciones de API para autenticación
export const authAPI = {
  // Métodos específicos de autenticación
  login: (email: string, password: string) => 
    apiClient.post('/api/admin/auth/login', { email, password }),
  
  logout: () => 
    apiClient.post('/api/admin/auth/logout'),
  
  getProfile: () => 
    apiClient.get('/api/admin/auth/profile'),
  
  verifySession: () => 
    apiClient.get('/api/admin/auth/verify'),
  
  // Métodos genéricos para otros endpoints
  get: (url: string, config?: any) => apiClient.get(url, config),
  post: (url: string, data?: any, config?: any) => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiClient.put(url, data, config),
  delete: (url: string, config?: any) => apiClient.delete(url, config),
  patch: (url: string, data?: any, config?: any) => apiClient.patch(url, data, config),
};
