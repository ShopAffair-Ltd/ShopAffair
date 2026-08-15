import 'dotenv/config';

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CLIENT_URL: string;
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  KUDA_API_KEY: string;
  KUDA_CLIENT_SECRET: string;
  KUDA_CLIENT_ID: string;
}

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
  PAYSTACK_SECRET_KEY: requireEnv('PAYSTACK_SECRET_KEY'),
  PAYSTACK_PUBLIC_KEY: requireEnv('PAYSTACK_PUBLIC_KEY'),
  KUDA_API_KEY: requireEnv('KUDA_API_KEY'),
  KUDA_CLIENT_SECRET: requireEnv('KUDA_CLIENT_SECRET'),
  KUDA_CLIENT_ID: requireEnv('KUDA_CLIENT_ID')
};