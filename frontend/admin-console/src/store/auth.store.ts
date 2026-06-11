import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_OPERATOR', 'ADMIN_FINANCE', 'ADMIN_CONTENT'];

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = data.data;
        if (!ADMIN_ROLES.includes(user.role)) {
          throw new Error('Not an admin account');
        }
        localStorage.setItem('admin_accessToken', accessToken);
        localStorage.setItem('admin_refreshToken', refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('admin_accessToken');
        localStorage.removeItem('admin_refreshToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'admin-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
