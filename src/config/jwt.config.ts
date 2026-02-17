/**
 * Configuración de tiempos de expiración de tokens
 * 
 * Estos valores pueden ser sobrescritos mediante variables de entorno
 */
export const JWT_CONFIG = {
  // Tiempo de vida del Access Token
  // Corto para minimizar riesgo si es comprometido
  ACCESS_TOKEN_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  
  // Tiempo de vida del Refresh Token
  // Largo para permitir sesiones duraderas
  REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  
  // Tiempo de vida del Password Reset Token
  RESET_TOKEN_EXPIRATION: process.env.JWT_RESET_EXPIRATION || '1h',
  
  // Secret para firmar tokens
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
};

/**
 * Configuración de Rate Limiting
 * 
 * Previene ataques de fuerza bruta
 */
export const RATE_LIMITING_CONFIG = {
  // Máximo número de intentos de refresh en la ventana de tiempo
  REFRESH_TOKEN_LIMIT: 5,
  
  // Ventana de tiempo en minutos
  REFRESH_TOKEN_WINDOW_MINUTES: 15,
  
  // Máximo número de intentos de login
  LOGIN_LIMIT: 5,
  
  // Ventana de tiempo para login
  LOGIN_WINDOW_MINUTES: 15,
  
  // Máximo número de intentos de forgot password
  FORGOT_PASSWORD_LIMIT: 3,
  
  // Ventana de tiempo para forgot password
  FORGOT_PASSWORD_WINDOW_MINUTES: 60,
};

/**
 * Mensajes de error estandarizados
 */
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
