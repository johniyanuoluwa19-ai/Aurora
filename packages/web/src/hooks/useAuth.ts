import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const store = useAuthStore();

  return {
    user: store.user,
    tokens: store.tokens,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    refresh: store.refresh,
    clearError: store.clearError,
  };
}

export default useAuth;