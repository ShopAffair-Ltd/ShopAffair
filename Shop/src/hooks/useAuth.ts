import { useAuth as useContextAuth } from '../context/AuthContext';

export function useAuth() {
  const { user, login, logout, updateUser } = useContextAuth();
  
  return {
    user,
    isAuthenticated: user && user.verificationStatus !== 'GUEST',
    login,
    logout,
    updateUser,
  };
}
