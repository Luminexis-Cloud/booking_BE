require('dotenv').config();

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 3000,

  // Database Configuration
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:h12345678@database-1.cmzi8yyaw7gx.us-east-1.rds.amazonaws.com:5432/agenda_appointment_db?schema=public',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || [
    'http://localhost:4200', // Angular local dev
    'http://localhost:3000', // React local dev
    'https://ec2-54-147-44-85.compute-1.amazonaws.com', // your backend domain/IP
  ],

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// Warn if critical envs are using defaults
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && config[envVar].includes('change-this')) {
    console.warn(`⚠️  Warning: ${envVar} is using a default value. Set it in your .env file.`);
  }
}

module.exports = config;
