import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import axios from 'axios';

// Custom storage que usa cookies para o token
const cookieStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(name);
    return stored;
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: (user, token) => {
        Cookies.set('token', token, { expires: 7, sameSite: 'lax' });
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        Cookies.remove('token');
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },

      // Busca dados atualizados do usuário do backend
      checkAuth: async () => {
        const token = Cookies.get('token');
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        try {
          const response = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          // O backend retorna { success: true, data: { user, onboardingComplete, hpointsBalance } }
          const responseData = response.data.data || response.data;
          const userData = responseData.user || responseData;
          
          set({ user: userData, token, isAuthenticated: true });
        } catch (error) {
          console.error('Error checking auth:', error);
          if (error.response?.status === 401) {
            Cookies.remove('token');
            set({ user: null, token: null, isAuthenticated: false });
          }
        }
      },

      // Sincroniza o estado com o cookie (chamado após hidratação)
      syncWithCookie: () => {
        const cookieToken = Cookies.get('token');
        const state = get();
        
        if (cookieToken && !state.isAuthenticated) {
          // Tem cookie mas não está autenticado no state - restaurar
          set({ token: cookieToken, isAuthenticated: true });
        } else if (!cookieToken && state.isAuthenticated) {
          // Não tem cookie mas está autenticado - limpar
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.syncWithCookie();
      },
    }
  )
);
