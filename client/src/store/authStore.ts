import { create } from 'zustand';
import { User, RegisterDto, LoginDto, ApiResponse } from '@devconnect/shared';
import { apiClient } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (dto: LoginDto) => {
    const res = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', dto);
    if (res.data.success && res.data.data) {
      set({
        user: res.data.data.user,
        isAuthenticated: true,
      });
    }
  },

  register: async (dto: RegisterDto) => {
    const res = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/register', dto);
    if (res.data.success && res.data.data) {
      set({
        user: res.data.data.user,
        isAuthenticated: true,
      });
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      if (res.data.success && res.data.data) {
        set({
          user: res.data.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      if (res.data.success && res.data.data) {
        set({
          user: res.data.data.user,
          isAuthenticated: true,
        });
      }
    } catch {
      // Keep existing state if transient error
    }
  },

  updateUser: (updatedFields: Partial<User>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updatedFields } });
    }
  },
}));
