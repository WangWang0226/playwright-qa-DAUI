export function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const credentials = {
  admin: {
    username: requiredEnv('DAMUI_ADMIN_USERNAME', 'ops.admin'),
    password: requiredEnv('DAMUI_ADMIN_PASSWORD', 'password'),
    allowSimulationFallback: process.env.DAMUI_ALLOW_SIMULATION_FALLBACK === 'true',
    fallbackQuickSelect: process.env.DAMUI_ADMIN_FALLBACK_QUICK_SELECT || 'MOCK - Test User'
  }
};
