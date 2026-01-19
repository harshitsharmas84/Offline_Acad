import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { user, login, logout, isLoading } = useAuthContext();

  return {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    isLoading,
  };
}
