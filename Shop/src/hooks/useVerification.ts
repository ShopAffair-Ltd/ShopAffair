import { useAuth as useContextAuth } from '../context/AuthContext';

export function useVerification() {
  const { user, updateUser } = useContextAuth();

  return {
    status: user?.verificationStatus || 'GUEST',
    isVerified: user?.verificationStatus === 'VERIFIED',
    isPending: user?.verificationStatus === 'PENDING',
    isUnverified: user?.verificationStatus === 'UNVERIFIED',
    isRejected: user?.verificationStatus === 'REJECTED',
    submitVerification: (bvn: string, idCardName: string) => {
      if (!user) return;
      const updatedUser = {
        ...user,
        verificationStatus: 'PENDING' as const,
        documents: {
          bvn,
          idCardName,
          submittedAt: new Date().toISOString()
        }
      };
      updateUser(updatedUser);
    }
  };
}
