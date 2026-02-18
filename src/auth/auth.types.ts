/**
 * auth.types.ts
 * 
 * Tipos TypeScript para la API de autenticación
 * Usar en el frontend para type safety
 */

// ===== TIPOS DE USUARIO =====

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
}

// ===== TIPOS DE REQUEST/RESPONSE =====

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expiresIn: number; // en segundos
  user: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expiresIn: number; // en segundos
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user: AuthUser;
}

// ===== TIPOS DE ERROR =====

export interface AuthError {
  statusCode: number;
  message: string;
  error?: string;
}

// ===== TIPOS DE TOKEN =====

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

// ===== TIPOS DE SESIÓN =====

export interface SessionState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  lastActivity: number;
  isExpired: boolean;
}

// ===== TIPOS DE EVENTO =====

export enum AuthEventType {
  LOGIN = 'auth:login',
  LOGOUT = 'auth:logout',
  TOKEN_EXPIRED = 'auth:token_expired',
  SESSION_EXPIRED = 'auth:session_expired',
  TOKEN_REFRESHED = 'auth:token_refreshed',
  UNAUTHORIZED = 'auth:unauthorized',
}

export interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  data?: any;
}

// ===== TIPOS DE CONFIGURACIÓN =====

export interface AuthConfig {
  apiBaseUrl: string;
  accessTokenKey: string;
  refreshTokenKey: string;
  tokenExpirationWarning: number; // ms antes de expiración
  sessionTimeoutWarning: number; // ms para advertencia
  autoRefreshThreshold: number; // ms antes de expiración
  tokenRefreshInterval: number; // ms entre chequeos
}

// ===== CONSTANTS =====

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
  accessTokenKey: 'auth:access_token',
  refreshTokenKey: 'auth:refresh_token',
  tokenExpirationWarning: 60000, // 1 minuto antes
  sessionTimeoutWarning: 300000, // 5 minutos antes
  autoRefreshThreshold: 120000, // 2 minutos antes
  tokenRefreshInterval: 30000, // Chequear cada 30 segundos
};

// ===== FUNCIONES HELPER =====

/**
 * Decodifica un JWT sin verificar la firma
 * (Usar solo en cliente, NUNCA confiar en esto en servidor)
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Calcula cuándo expira un token basado en su payload
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000; // Convertir a ms
}

/**
 * Verifica si un token está expirado
 */
export function isTokenExpired(token: string, bufferMs: number = 0): boolean {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return true;
  return Date.now() >= expirationTime - bufferMs;
}

/**
 * Calcula cuántos ms faltan para que expiren
 */
export function getTimeUntilExpiration(token: string): number {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return -1;
  return expirationTime - Date.now();
}

export default {
  UserRole,
  AuthEventType,
  DEFAULT_AUTH_CONFIG,
  decodeJwt,
  getTokenExpirationTime,
  isTokenExpired,
  getTimeUntilExpiration,
};
