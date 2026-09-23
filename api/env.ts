import { requiredEnv } from '../utils/env';

export function apiBaseUrl() {
  return process.env.OPSUI_API_BASE_URL || requiredEnv('OPSUI_BASE_URL');
}

export function apiCredentials() {
  return {
    username: process.env.OPSUI_API_USERNAME || requiredEnv('OPSUI_ADMIN_USERNAME'),
    password: process.env.OPSUI_API_PASSWORD || requiredEnv('OPSUI_ADMIN_PASSWORD'),
    email: requiredEnv('OPSUI_API_EMAIL'),
    userId: process.env.OPSUI_API_USER_ID || process.env.OPSUI_API_USERNAME || requiredEnv('OPSUI_ADMIN_USERNAME')
  };
}
