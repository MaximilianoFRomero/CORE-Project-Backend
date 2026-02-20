export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  RESET_TOKEN_EXPIRATION: process.env.JWT_RESET_EXPIRATION || '1h',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
};

export const RATE_LIMITING_CONFIG = {
  REFRESH_TOKEN_LIMIT: 5,
  REFRESH_TOKEN_WINDOW_MINUTES: 15,
  LOGIN_LIMIT: 5,
  LOGIN_WINDOW_MINUTES: 15,
  FORGOT_PASSWORD_LIMIT: 3,
  FORGOT_PASSWORD_WINDOW_MINUTES: 60,
};

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_ACTIVE: 'Account is not active',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token has expired',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  UNAUTHORIZED: 'Unauthorized',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
};
