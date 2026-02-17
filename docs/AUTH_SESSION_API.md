# 🔐 Documentación de Endpoints de Autenticación y Sesión

## Resumen

Este documento describe los endpoints de autenticación implementados para soportar el sistema robusto de manejo de sesión expirada en el frontend.

---

## 📋 Tabla de Contenidos

1. [POST /auth/login](#post-authlogin)
2. [POST /auth/refresh](#post-authrefresh)
3. [POST /auth/logout](#post-authlogout)
4. [POST /auth/forgot-password](#post-authforgot-password)
5. [POST /auth/validate](#post-authvalidate)
6. [POST /auth/register](#post-authregister)
7. [Configuración de Tiempos](#configuración-de-tiempos)
8. [Flujo de Renovación de Token](#flujo-de-renovación-de-token)
9. [Manejo de Errores](#manejo-de-errores)
10. [Rate Limiting](#rate-limiting)

---

## POST /auth/login

**Autentica un usuario y retorna tokens JWT.**

### Request

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "mi-contraseña"
}
```

### Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "user",
    "avatarUrl": "https://..."
  }
}
```

### Status Codes

- **200 OK**: Autenticación exitosa
- **400 Bad Request**: Email o contraseña faltantes
- **401 Unauthorized**: Email o contraseña inválidos
- **429 Too Many Requests**: Demasiados intentos de login

### Notas

- El `access_token` es válido por **15 minutos**
- El `refresh_token` es válido por **7 días**
- Se recomienda guardar ambos en el frontend:
  - `access_token` → localStorage o memoria
  - `refresh_token` → localStorage o sessionStorage

---

## POST /auth/refresh

**⭐ ENDPOINT CRÍTICO - Obtiene un nuevo access_token usando el refresh_token**

Este es el punto central del sistema de sesión expirada. Cuando el access_token expira, el frontend debe usar este endpoint para obtener uno nuevo sin requiero que el usuario inicie sesión nuevamente.

### Request

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### Status Codes

- **200 OK**: Token renovado exitosamente
- **400 Bad Request**: refreshToken faltante
- **401 Unauthorized**: 
  - Refresh token expirado
  - Refresh token inválido/manipulado
  - Cuenta de usuario no activa
  - Token revocado/bloqueado
- **429 Too Many Requests**: Demasiados intentos de refresh

### Validaciones

El backend valida:

✅ Que el token tiene una firma JWT válida
✅ Que el token no ha expirado
✅ Que no ha sido revocado/bloqueado
✅ Que la cuenta del usuario sigue activa
✅ Que el usuario existe en la BD

### Flujo Esperado del Frontend

```
Usuario hace request a endpoint protegido
  ↓
Backend retorna 401 (token expirado)
  ↓
Frontend intercepta 401
  ↓
Frontend intenta POST /auth/refresh con refreshToken
  ↓
¿Refresh token válido?
  ├─ SÍ: Retorna nuevo access_token
  │      Frontend reintenta request original
  │      Request tiene éxito ✅
  │
  └─ NO: Retorna 401
         Frontend dispara evento de sesión expirada
         Redirige a /login
         Usuario debe autenticarse nuevamente
```

---

## POST /auth/logout

**Invalida el refresh_token del usuario.**

### Request

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 OK)

```json
{
  "message": "Logged out successfully"
}
```

### Status Codes

- **200 OK**: Logout exitoso
- **401 Unauthorized**: Access token faltante o inválido
- **429 Too Many Requests**: Rate limiting

### Notas

- Requiere autenticación (Authorization header con access_token válido)
- El frontend debe limpiar los tokens locales después
- El refresh_token es bloqueado en el servidor
- En producción, usar Redis para mantener lista de tokens revocados

---

## POST /auth/forgot-password

**Solicita un reset de contraseña.**

### Request

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

### Response (200 OK)

```json
{
  "message": "If an account with this email exists, you will receive a password reset link shortly."
}
```

### Status Codes

- **200 OK**: Siempre retorna 200 (por seguridad, no revela si email existe)
- **400 Bad Request**: Email inválido
- **429 Too Many Requests**: Demasiados intentos

### Notas

- **No revela** si el email existe o no (previene enumeración)
- Genera un token de reset válido por **1 hora**
- TODO: Enviar email con link de reset (integración con servicio de mail)
- El token debe ser incluido en la URL: `https://frontend.com/reset-password?token=<token>`

---

## POST /auth/validate

**Valida que el token actual es válido.**

### Request

```http
POST /api/v1/auth/validate
Authorization: Bearer <access_token>
```

### Response (200 OK)

```json
{
  "valid": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "role": "user",
    "firstName": "Juan",
    "lastName": "Pérez"
  }
}
```

### Status Codes

- **200 OK**: Token válido
- **401 Unauthorized**: Token faltante, expirado o inválido

### Uso

Útil para verificar que el token sigue siendo válido en startup o después de cambios.

---

## POST /auth/register

**Registra un nuevo usuario.**

### Request

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "nuevo@ejemplo.com",
  "password": "mi-contraseña-segura",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

### Response (201 Created)

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Status Codes

- **201 Created**: Registro exitoso
- **400 Bad Request**: Email ya existe o datos inválidos

---

## Configuración de Tiempos

Los tiempos de expiración están configurados en [src/config/jwt.config.ts](src/config/jwt.config.ts):

```typescript
ACCESS_TOKEN_EXPIRATION: '15m'        // 15 minutos
REFRESH_TOKEN_EXPIRATION: '7d'        // 7 días
RESET_TOKEN_EXPIRATION: '1h'          // 1 hora
```

Pueden ser sobrescritos mediante variables de entorno en `.env`:

```env
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_RESET_EXPIRATION=1h
```

### Recomendaciones

- **Access Token corto (15-30 min)**: Minimiza riesgo si es comprometido
- **Refresh Token largo (7 días - 30 días)**: Permite sesiones duraderas
- **Usar HTTPS en producción**: Tokens nunca en HTTP

---

## Flujo de Renovación de Token

### Diagrama de Secuencia

```
┌─────────────┐                         ┌────────────┐
│   Frontend  │                         │   Backend  │
└──────┬──────┘                         └────────┬───┘
       │                                         │
       │ 1. GET /api/v1/projects                │
       │ Header: Authorization: Bearer <access> │
       ├─────────────────────────────────────────>
       │                                         │
       │                    2. Token expirado    │
       │                    Status: 401         │
       │<─────────────────────────────────────────
       │                                         │
       │ 3. POST /auth/refresh                  │
       │ Body: { refreshToken: "..." }         │
       ├─────────────────────────────────────────>
       │                                         │
       │ 4. Validar refresh token               │
       │    - Verificar firma JWT               │
       │    - Verificar expiration              │
       │    - Verificar no esté revocado       │
       │    - Verificar cuenta activa          │
       │                                         │
       │     5. Retorna nuevo access_token      │
       │        Status: 200                    │
       │<─────────────────────────────────────────
       │                                         │
       │ 6. GET /api/v1/projects                │
       │    Header: Authorization: Bearer <new> │
       ├─────────────────────────────────────────>
       │                                         │
       │     7. Request OK                      │
       │        Status: 200                    │
       │<─────────────────────────────────────────
```

---

## Manejo de Errores

### Errores de Autenticación (401 Unauthorized)

El backend retorna **siempre 401** cuando hay problemas con tokens:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Posibles causas:**

- Token faltante en Authorization header
- Token expirado
- Token inválido/manipulado (firma incorrecta)
- Refresh token revocado/bloqueado
- Cuenta de usuario no activa
- Usuario no existe

### Estrategia del Frontend

```typescript
// Interceptor HTTP
if (response.status === 401) {
  // 1. Intentar renovar token
  const newAccessToken = await refreshToken();
  
  if (newAccessToken) {
    // 2. Reintentar request original con nuevo token
    return retryOriginalRequest(newAccessToken);
  } else {
    // 3. Session expired - redirigir a login
    redirectToLogin();
  }
}
```

### Rate Limiting (429 Too Many Requests)

```json
{
  "statusCode": 429,
  "message": "Too many requests from 192.168.1.100. Please try again later."
}
```

**Limites por endpoint:**

- `/auth/login`: 5 intentos cada 15 minutos
- `/auth/refresh`: 5 intentos cada 15 minutos
- `/auth/forgot-password`: 3 intentos cada 60 minutos

---

## Rate Limiting

Implementado en [src/modules/auth/middleware/rate-limit.middleware.ts](src/modules/auth/middleware/rate-limit.middleware.ts)

### Configuración

```typescript
REFRESH_TOKEN_LIMIT: 5              // Max 5 intentos
REFRESH_TOKEN_WINDOW_MINUTES: 15    // En 15 minutos

LOGIN_LIMIT: 5
LOGIN_WINDOW_MINUTES: 15

FORGOT_PASSWORD_LIMIT: 3
FORGOT_PASSWORD_WINDOW_MINUTES: 60
```

### Implementación Actual

- **En memoria** para desarrollo
- En producción: usar **Redis** para persistencia

### Mejora Futura

```typescript
// Configuración recomendada para producción
import * as RedisStore from 'rate-limit-redis';
import * as redis from 'redis';

const client = redis.createClient();

const limiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
});
```

---

## Headers Importantes

### Authorization Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Formato:** `Bearer <token>`

### CORS Headers

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Testing Checklist

### 1. Login Básico ✓
- [ ] POST /auth/login con credenciales válidas retorna 200
- [ ] Response incluye access_token y refresh_token
- [ ] Tokens son JWTs válidos

### 2. Refresh Token ✓
- [ ] POST /auth/refresh con refresh_token válido retorna 200
- [ ] Retorna nuevo access_token válido
- [ ] Tokens anteriores funcionan para un corto período

### 3. Token Expirado ✓
- [ ] Esperar 15+ minutos
- [ ] GET /api/v1/projects con access_token expirado retorna 401
- [ ] POST /auth/refresh todavía funciona si refresh_token válido

### 4. Refresh Token Expirado ✓
- [ ] Esperar 7+ días
- [ ] POST /auth/refresh retorna 401
- [ ] Frontend redirige a /login

### 5. Logout ✓
- [ ] POST /auth/logout con refresh_token retorna 200
- [ ] POST /auth/refresh con mismo token revocado retorna 401

### 6. Forgot Password ✓
- [ ] POST /auth/forgot-password retorna 200 siempre
- [ ] Email existe → envía email (verificar en logs)
- [ ] Email no existe → retorna 200 igual (por seguridad)

### 7. Rate Limiting ✓
- [ ] 6 intentos en /auth/login → 429 Too Many Requests
- [ ] Ventana de tiempo se respeta
- [ ] IP diferente no es afectada

### 8. Validación ✓
- [ ] POST /auth/validate con token válido retorna true
- [ ] POST /auth/validate con token inválido retorna 401

---

## Seguridad

### ✅ Implementado

- [x] Validación de firma JWT en servidor
- [x] Tokens nunca confiados desde cliente
- [x] CORS configurado
- [x] Rate limiting en endpoints críticos
- [x] Tokens con expiración
- [x] Refresh tokens revocables
- [x] No revela si email existe (forgot-password)
- [x] Error messages genéricos

### 🔒 Recomendaciones para Producción

- [ ] HTTPS obligatorio
- [ ] httpOnly cookies en lugar de localStorage
- [ ] Signed cookies con CSRF token
- [ ] Redis para blacklist de tokens
- [ ] Logging y monitoring de intentos fallidos
- [ ] 2FA (two-factor authentication)
- [ ] IP whitelisting opcional
- [ ] Rotación regular de JWT_SECRET

---

## Ejemplos con cURL

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Refresh Token

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Endpoint Protegido

```bash
curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Logout

```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## Archivos Relacionados

- [auth.service.ts](src/modules/auth/auth.service.ts) - Lógica de autenticación
- [auth.controller.ts](src/modules/auth/auth.controller.ts) - Endpoints
- [jwt.strategy.ts](src/modules/auth/strategies/jwt.strategy.ts) - Estrategia JWT
- [jwt-auth.guard.ts](src/modules/auth/guards/jwt-auth.guard.ts) - Guard para proteger rutas
- [jwt.config.ts](src/config/jwt.config.ts) - Configuración de tiempos
- [rate-limit.middleware.ts](src/modules/auth/middleware/rate-limit.middleware.ts) - Rate limiting

---

## FAQ

### P: ¿Cada cuánto debo renovar el token?

R: El frontend debe renovar el token automáticamente cuando reciba un 401, o proactivamente 1-2 minutos antes de que expire (con un timer).

### P: ¿Dónde debo guardar los tokens?

R: 
- **Desarrollo:** localStorage está ok
- **Producción:** usar httpOnly cookies (más seguro contra XSS)

### P: ¿Qué pasa si ambos tokens expiran?

R: El usuario debe hacer login nuevamente. El frontend debe redirigir a `/login`.

### P: ¿Es seguro el refresh token en localStorage?

R: En localStorage es vulnerable a XSS. Mejor usar httpOnly cookies + CSRF token en producción.

### P: ¿Puedo desloguear un usuario desde el servidor?

R: Sí, bloqueando su refresh_token en la blacklist (Redis).

---

**Última actualización:** 17 de Febrero de 2026

**Versión:** 1.0
