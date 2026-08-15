import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuditLog, UserProfile } from '../types';

interface AdminContextType {
  auditLogs: AuditLog[];
  pendingUsers: UserProfile[];
  addAuditLog: (action: string, details: string, actor?: string) => void;
  submitForVerification: (profile: UserProfile) => void;
  approveUser: (userId: string) => UserProfile | undefined;
  rejectUser: (userId: string, reason: string) => UserProfile | undefined;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);


export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('tesm_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'aud_1',
        action: 'PLATFORM_BOOT',
        actor: 'System Core',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        details: 'Cryptographic multi-sig escrow validator online.'
      }
    ];
  });

  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('tesm_pending_queue');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tesm_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('tesm_pending_queue', JSON.stringify(pendingUsers));
  }, [pendingUsers]);

  const addAuditLog = (action: string, details: string, actor: string = 'System') => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const submitForVerification = (profile: UserProfile) => {
    setPendingUsers((prev) => {
      if (prev.some((p) => p.id === profile.id)) return prev;
      return [profile, ...prev];
    });
    addAuditLog(
      'VERIFICATION_SUBMITTED',
      `${profile.name} uploaded ID & BVN checks. Added to compliance queue.`,
      profile.username
    );
  };

  const approveUser = (userId: string): UserProfile | undefined => {
    const userToVerify = pendingUsers.find((p) => p.id === userId);
    if (!userToVerify) return undefined;

    setPendingUsers((prev) => prev.filter((p) => p.id !== userId));
    addAuditLog(
      'VERIFICATION_APPROVED',
      `Assigned Verified credentials to ${userToVerify.username}.`,
      'Admin Core'
    );

    return { ...userToVerify, verificationStatus: 'VERIFIED', walletBalance: 82000 };
  };

  const rejectUser = (userId: string, reason: string): UserProfile | undefined => {
    const userToReject = pendingUsers.find((p) => p.id === userId);
    if (!userToReject) return undefined;

    setPendingUsers((prev) => prev.filter((p) => p.id !== userId));
    addAuditLog(
      'VERIFICATION_REJECTED',
      `Rejected credentials for ${userToReject.username}. Reason: ${reason}`,
      'Admin Core'
    );

    return { ...userToReject, verificationStatus: 'REJECTED', rejectionReason: reason };
  };

  return (
    <AdminContext.Provider
      value={{ auditLogs, pendingUsers, addAuditLog, submitForVerification, approveUser, rejectUser }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}