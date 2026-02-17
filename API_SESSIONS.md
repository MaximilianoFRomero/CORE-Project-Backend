// API_SESSIONS.md - Documentación del Sistema de Sesiones Expiradas

# 🔐 Sistema de Sesión Expirada - Backend API

## 📋 Descripción General

Este documento describe la implementación del sistema de manejo de sesión expirada en el backend, diseñado para ser integrado con el frontend que implementa patrones SOLID.

El sistema se basa en **JWT (JSON Web Tokens)** con dos tipos de tokens:
- **Access Token**: Corta duración (15 minutos) - para requests normales
- **Refresh Token**: Larga duración (7 días) - para obtener nuevos access tokens

## 🔄 Flujo de Autenticación

### 1. Login Inicial

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

RESPONSE (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,  // en segundos (15 minutos)
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "avatarUrl": "..."
  }
}
```

El frontend debe:
- Guardar `access_token` (en memoria o localStorage)
- Guardar `refresh_token` (en memoria segura, httpOnly cookie es mejor)
- Configurar un timer para expiración

### 2. Request Normal (Con Token Válido)

```
GET /api/v1/projects
Authorization: Bearer <access_token>

RESPONSE (200 OK):
[
  { "id": "...", "name": "Project 1", ... }
]
```

### 3. Token Expirado - Automático Refresh

```
GET /api/v1/projects
Authorization: Bearer <access_token>  // Expirado

RESPONSE (401 Unauthorized):
{
  "statusCode": 401,
  "message": "Token has expired"
}

// Frontend intenta refresh automáticamente:

POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}

RESPONSE (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // NUEVO
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // NUEVO
  "expiresIn": 900
}

// Frontend reintenta el request original con nuevo token:

GET /api/v1/projects
Authorization: Bearer <new_access_token>

RESPONSE (200 OK):
[
  { "id": "...", "name": "Project 1", ... }
]
```

### 4. Sesión Expirada - Nuevo Login Requerido

```
POST /api/v1/auth/refresh
{
  "refreshToken": "<refresh_token>"  // También expiró (+ de 7 días)
}

RESPONSE (401 Unauthorized):
{
  "statusCode": 401,
  "message": "Refresh token has expired"
}

// Frontend dispara evento de sesión expirada
// Limpia tokens locales
// Redirige a /login
// Usuario debe ingresar credenciales nuevamente
```

## 🔌 Endpoints de Autenticación

### POST /auth/login

**Autenticación:** Pública

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "string",
  "refresh_token": "string", 
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "super_admin | admin | user | viewer",
    "avatarUrl": "string"
  }
}
```

**Errores:**
- `401` - Credenciales inválidas
- `400` - Email inactivo
- `429` - Rate limited (máximo 5 intentos en 15 minutos)

---

### POST /auth/refresh

**Autenticación:** Pública

**Descripción:** Obtiene nuevo access_token usando refresh_token

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Errores:**
- `401 "Refresh token has expired"` - Token expiró (> 7 días)
- `401 "Invalid refresh token signature"` - Token manipulado
- `401 "Unauthorized"` - Token revocado/inválido
- `401 "Account is not active"` - Usuario inactivo
- `429` - Rate limited (máximo 5 intentos en 15 minutos)

**Rate Limiting:** 
- Máximo 5 intentos por IP en ventana de 15 minutos
- Previene ataques de fuerza bruta

---

### POST /auth/logout

**Autenticación:** Requerida (JWT)

**Descripción:** Invalida el refresh token del usuario

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Errores:**
- `401` - Token inválido o expirado

**Nota:** El frontend debe limpiar los tokens locales después de recibir 200

---

### POST /auth/forgot-password

**Autenticación:** Pública

**Descripción:** Solicita reset de contraseña. Envía email con link

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK - Siempre):**
```json
{
  "message": "If an account with this email exists, you will receive a password reset link shortly."
}
```

**Rate Limiting:**
- Máximo 3 intentos por IP en ventana de 60 minutos

**Nota de Seguridad:** 
- Retorna 200 aunque el email no exista (previene enumeración de usuarios)
- Genera token válido por 1 hora
- Email contiene link con token: `frontend_url/reset-password?token=...`

---

### POST /auth/validate

**Autenticación:** Requerida (JWT)

**Descripción:** Valida que el token actual es válido

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
}
```

**Errores:**
- `401` - Token inválido, expirado o no presente

---

### POST /auth/register

**Autenticación:** Pública

**Descripción:** Registra nuevo usuario

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "uuid"
}
```

**Errores:**
- `400` - Email ya existe

---

## ⏱️ Configuración de Tiempos

| Token | TTL | Notas |
|-------|-----|-------|
| Access Token | 15 minutos | Corto, minimiza daño si es comprometido |
| Refresh Token | 7 días | Largo, permite sesiones duraderas |
| Reset Token | 1 hora | Suficiente para cambiar contraseña |

**Variables de Entorno:**
```bash
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m              # Configurable
JWT_REFRESH_EXPIRATION=7d              # Configurable
JWT_RESET_EXPIRATION=1h                # Configurable
```

## 🛡️ Seguridad

### Validaciones en Servidor

✅ **Siempre validado en servidor:**
- Firma JWT (nunca confiar en cliente)
- Tiempo de expiración
- Usuario sigue activo en BD
- Token no está revocado

✅ **Rate Limiting:**
- Login: 5 intentos / 15 minutos
- Refresh: 5 intentos / 15 minutos  
- Forgot Password: 3 intentos / 60 minutos

✅ **Manejo de Errores:**
- Mensajes genéricos para no revelar si usuario existe
- 401 para todo tipo de auth error (para consistencia)
- Logging de intentos fallidos

### Recomendaciones Implementadas

✅ Tokens firmados con JWT
✅ Access tokens cortos (expiración rápida)
✅ Refresh tokens más largos (pero con validación)
✅ Rate limiting en endpoints críticos
✅ CORS configurado
✅ Validación de estado de usuario

### Recomendaciones Adicionales

⚠️ **Para Producción:**
- Usar HTTPS solo (nunca HTTP)
- Guardar refresh_token en httpOnly cookie (no localStorage)
- Implementar Redis para revocación de tokens (blacklist)
- Usar environment variables seguras
- Implementar email para forgot-password
- Considerar 2FA para cuentas críticas
- Rotar refresh tokens en cada refresh (token rotation)
- Logging y monitoreo de intentos fallidos

## 📝 Ejemplos de Testing

### 1. Flujo Normal

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'

# Guardar access_token y refresh_token

# 2. Request protegido
curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer <access_token>"

# Si access_token expiró:
# 3. Refresh token
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

### 2. Token Expirado

```bash
# Esperar a que access_token expire (15 min) o usar token viejo

curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer <expired_token>"

# Response: 401 Unauthorized
# {"statusCode":401,"message":"Token has expired"}

# Entonces refresh:
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'

# Response: 200 OK con nuevos tokens
```

### 3. Rate Limiting

```bash
# Hacer 6 requests seguidos (límite es 5 en 15 min)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/v1/auth/refresh \
    -H "Content-Type: application/json" \
    -d '{"refreshToken":"invalid"}'
done

# 6to request devuelve: 429 Too Many Requests
```

## 🔗 Integración Frontend

El frontend debe implementar:

1. **Auth Guard:** Verificar si hay token válido
2. **Token Interceptor:** Agregar Authorization header
3. **Error Handler:** Detectar 401 y hacer refresh
4. **Retry Logic:** Reintentar request original con nuevo token
5. **Session Manager:** Escuchar eventos de expiración

## 📚 Referencias

- JWT: https://jwt.io/
- Passport Strategy: https://www.passportjs.org/
- NestJS Auth: https://docs.nestjs.com/security/authentication
- OWASP Auth: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
