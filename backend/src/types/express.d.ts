export type AppUserRole = 'buyer' | 'seller' | 'admin';

export interface AuthPayload {
  id: string;
  username: string;
  role: AppUserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}