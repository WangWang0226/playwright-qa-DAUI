export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const credentials = {
  admin: {
    username: requiredEnv('OPSUI_ADMIN_USERNAME'),
    password: requiredEnv('OPSUI_ADMIN_PASSWORD'),
    allowSimulationFallback: process.env.OPSUI_ALLOW_SIMULATION_FALLBACK === 'true',
    fallbackQuickSelect: process.env.OPSUI_ADMIN_FALLBACK_QUICK_SELECT || ''
  }
};
