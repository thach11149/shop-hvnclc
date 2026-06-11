import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

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
        if (!['SELLER_OWNER', 'SELLER_STAFF'].includes(user.role)) {
          throw new Error('Not a seller account');
        }
        localStorage.setItem('seller_accessToken', accessToken);
        localStorage.setItem('seller_refreshToken', refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('seller_accessToken');
        localStorage.removeItem('seller_refreshToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'seller-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
