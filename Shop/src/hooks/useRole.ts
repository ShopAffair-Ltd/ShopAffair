import { useAuth as useContextAuth } from '../context/AuthContext';

export function useRole() {
  const { user } = useContextAuth();

  return {
    role: user?.role || 'buyer',
    isBuyer: user?.role === 'buyer',
    isSeller: user?.role === 'seller',
    isAdmin: user?.role === 'admin',
  };
}