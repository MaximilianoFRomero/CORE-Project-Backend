"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_AUTH_CONFIG = exports.AuthEventType = exports.UserRole = void 0;
exports.decodeJwt = decodeJwt;
exports.getTokenExpirationTime = getTokenExpirationTime;
exports.isTokenExpired = isTokenExpired;
exports.getTimeUntilExpiration = getTimeUntilExpiration;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var AuthEventType;
(function (AuthEventType) {
    AuthEventType["LOGIN"] = "auth:login";
    AuthEventType["LOGOUT"] = "auth:logout";
    AuthEventType["TOKEN_EXPIRED"] = "auth:token_expired";
    AuthEventType["SESSION_EXPIRED"] = "auth:session_expired";
    AuthEventType["TOKEN_REFRESHED"] = "auth:token_refreshed";
    AuthEventType["UNAUTHORIZED"] = "auth:unauthorized";
})(AuthEventType || (exports.AuthEventType = AuthEventType = {}));
exports.DEFAULT_AUTH_CONFIG = {
    apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
    accessTokenKey: 'auth:access_token',
    refreshTokenKey: 'auth:refresh_token',
    tokenExpirationWarning: 60000,
    sessionTimeoutWarning: 300000,
    autoRefreshThreshold: 120000,
    tokenRefreshInterval: 30000,
};
function decodeJwt(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const decoded = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return decoded;
    }
    catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}
function getTokenExpirationTime(token) {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp)
        return null;
    return payload.exp * 1000;
}
function isTokenExpired(token, bufferMs = 0) {
    const expirationTime = getTokenExpirationTime(token);
    if (!expirationTime)
        return true;
    return Date.now() >= expirationTime - bufferMs;
}
function getTimeUntilExpiration(token) {
    const expirationTime = getTokenExpirationTime(token);
    if (!expirationTime)
        return -1;
    return expirationTime - Date.now();
}
exports.default = {
    UserRole,
    AuthEventType,
    DEFAULT_AUTH_CONFIG: exports.DEFAULT_AUTH_CONFIG,
    decodeJwt,
    getTokenExpirationTime,
    isTokenExpired,
    getTimeUntilExpiration,
};
//# sourceMappingURL=auth.types.js.map