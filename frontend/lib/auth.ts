import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  if (response.data.token) {
    Cookies.set('token', response.data.token, { expires: 7 });
  }
  return response.data;
};

export const logout = () => {
  Cookies.remove('token');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data.user;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!Cookies.get('token');
};

