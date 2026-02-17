export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    USER = "user",
    VIEWER = "viewer"
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
export declare enum AuthEventType {
    LOGIN = "auth:login",
    LOGOUT = "auth:logout",
    TOKEN_EXPIRED = "auth:token_expired",
    SESSION_EXPIRED = "auth:session_expired",
    TOKEN_REFRESHED = "auth:token_refreshed",
    UNAUTHORIZED = "auth:unauthorized"
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
export declare const DEFAULT_AUTH_CONFIG: AuthConfig;
export declare function decodeJwt(token: string): JwtPayload | null;
export declare function getTokenExpirationTime(token: string): number | null;
export declare function isTokenExpired(token: string, bufferMs?: number): boolean;
export declare function getTimeUntilExpiration(token: string): number;
declare const _default: {
    UserRole: typeof UserRole;
    AuthEventType: typeof AuthEventType;
    DEFAULT_AUTH_CONFIG: AuthConfig;
    decodeJwt: typeof decodeJwt;
    getTokenExpirationTime: typeof getTokenExpirationTime;
    isTokenExpired: typeof isTokenExpired;
    getTimeUntilExpiration: typeof getTimeUntilExpiration;
};
export default _default;
