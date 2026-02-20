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


export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expiresIn: number;
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

export interface AuthError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export interface SessionState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  lastActivity: number;
  isExpired: boolean;
}

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

export interface AuthConfig {
  apiBaseUrl: string;
  accessTokenKey: string;
  refreshTokenKey: string;
  tokenExpirationWarning: number;
  sessionTimeoutWarning: number;
  autoRefreshThreshold: number;
  tokenRefreshInterval: number;
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
  accessTokenKey: 'auth:access_token',
  refreshTokenKey: 'auth:refresh_token',
  tokenExpirationWarning: 60000,
  sessionTimeoutWarning: 300000,
  autoRefreshThreshold: 120000,
  tokenRefreshInterval: 30000,
};

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

export function getTokenExpirationTime(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
}

export function isTokenExpired(token: string, bufferMs: number = 0): boolean {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return true;
  return Date.now() >= expirationTime - bufferMs;
}

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
