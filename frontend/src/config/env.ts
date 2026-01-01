// Environment Variable Validation
// This file validates required environment variables at build time

interface EnvironmentConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
  VITE_API_BASE_URL: string;
}

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_API_BASE_URL'
] as const;

// Validate all required environment variables
function validateEnvironment(): EnvironmentConfig {
  const missingVars: string[] = [];

  requiredEnvVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  };
}

// Export validated config
export const env = validateEnvironment();

// Optional environment variables with defaults
export const optionalEnv = {
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  VITE_GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI || '',
  VITE_LINKEDIN_CLIENT_ID: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
  VITE_LINKEDIN_REDIRECT_URI: import.meta.env.VITE_LINKEDIN_REDIRECT_URI || '',
};
