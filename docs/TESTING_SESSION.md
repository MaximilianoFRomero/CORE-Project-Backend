# 🧪 Testing - Sistema de Sesión Expirada

Guía paso a paso para verificar que el sistema de sesión expirada funciona correctamente.

## ✅ Checklist de Testing

### Fase 1: Configuración

- [ ] Backend corriendo en `http://localhost:3001`
- [ ] Base de datos PostgreSQL activa
- [ ] Variables de entorno configuradas (`.env`)
- [ ] JWT_SECRET no es el valor por defecto en producción

### Fase 2: Endpoints Básicos

#### Test 2.1: POST /auth/login

```bash
# Request
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Response esperado (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "firstName": "...",
    "lastName": "...",
    "role": "admin"
  }
}
```

**Validar:**
- ✅ Response 200 OK
- ✅ access_token es un JWT válido
- ✅ refresh_token es un JWT válido
- ✅ expiresIn es 900 (15 minutos en segundos)
- ✅ User data es correcta

#### Test 2.2: POST /auth/validate (Token válido)

```bash
# Usar el access_token del test 2.1
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json"

# Response esperado (200 OK)
{
  "valid": true,
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "admin",
    "firstName": "...",
    "lastName": "..."
  }
}
```

**Validar:**
- ✅ Response 200 OK
- ✅ valid es true
- ✅ User data es correcta

### Fase 3: Manejo de Tokens Expirados

#### Test 3.1: Token Inválido

```bash
# Request con token inválido
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Authorization: Bearer invalid-token-here" \
  -H "Content-Type: application/json"

# Response esperado (401 Unauthorized)
{
  "statusCode": 401,
  "message": "Invalid token signature",
  "error": "Unauthorized"
}
```

**Validar:**
- ✅ Response 401 Unauthorized
- ✅ Mensaje claramente indica el problema

#### Test 3.2: Token Faltante

```bash
# Request sin Authorization header
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Content-Type: application/json"

# Response esperado (401 Unauthorized)
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Validar:**
- ✅ Response 401 Unauthorized

### Fase 4: Refresh Token (⭐ CRÍTICO)

#### Test 4.1: Refresh con Token Válido

```bash
# Usar refresh_token del test 2.1
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token>"
  }'

# Response esperado (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Validar:**
- ✅ Response 200 OK
- ✅ Nuevo access_token es diferente del anterior
- ✅ Nuevo refresh_token es diferente del anterior
- ✅ Token anterior sigue siendo válido (para reintentos en vuelo)

#### Test 4.2: Verificar Nuevo Token Funciona

```bash
# Usar el nuevo access_token del test 4.1
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Authorization: Bearer <nuevo_access_token>" \
  -H "Content-Type: application/json"

# Response esperado (200 OK)
{
  "valid": true,
  "user": { ... }
}
```

**Validar:**
- ✅ Response 200 OK con el nuevo token
- ✅ El nuevo token es funcional inmediatamente

#### Test 4.3: Refresh con Token Inválido

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "invalid-token"
  }'

# Response esperado (401 Unauthorized)
{
  "statusCode": 401,
  "message": "Invalid refresh token signature",
  "error": "Unauthorized"
}
```

**Validar:**
- ✅ Response 401 Unauthorized
- ✅ Mensaje específico "Invalid refresh token"

#### Test 4.4: Refresh con RefreshToken Faltante

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'

# Response esperado (400 Bad Request)
{
  "statusCode": 400,
  "message": "refreshToken should not be empty",
  "error": "Bad Request"
}
```

**Validar:**
- ✅ Response 400 Bad Request

### Fase 5: Logout

#### Test 5.1: Logout Exitoso

```bash
# Usar tokens del test 2.1
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token>"
  }'

# Response esperado (200 OK)
{
  "message": "Logged out successfully"
}
```

**Validar:**
- ✅ Response 200 OK

#### Test 5.2: Refresh Revocado Después de Logout

```bash
# Intentar usar el refresh_token revocado
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token_usado_en_logout>"
  }'

# Response esperado (401 Unauthorized)
{
  "statusCode": 401,
  "message": "Refresh token has been revoked",
  "error": "Unauthorized"
}
```

**Validar:**
- ✅ Response 401 Unauthorized
- ✅ Token revocado no puede ser usado

### Fase 6: Forgot Password

#### Test 6.1: Forgot Password Email Existente

```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'

# Response esperado (200 OK - siempre)
{
  "message": "If an account with this email exists, you will receive a password reset link shortly."
}
```

**Validar:**
- ✅ Response 200 OK
- ✅ Revisar logs para ver que se generó reset token

#### Test 6.2: Forgot Password Email No Existente

```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "noexiste@example.com"
  }'

# Response esperado (200 OK - siempre, por seguridad)
{
  "message": "If an account with this email exists, you will receive a password reset link shortly."
}
```

**Validar:**
- ✅ Response 200 OK (no revela si email existe o no)

#### Test 6.3: Forgot Password Email Inválido

```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "no-es-email"
  }'

# Response esperado (400 Bad Request)
{
  "statusCode": 400,
  "message": "...",
  "error": "Bad Request"
}
```

**Validar:**
- ✅ Response 400 Bad Request (email inválido)

### Fase 7: Rate Limiting

#### Test 7.1: Rate Limit en /auth/login

```bash
# Hacer 5 requests exitosos
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@example.com", "password": "admin123"}'
done

# El 6to request debería retornar 429
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Response esperado (429 Too Many Requests)
{
  "statusCode": 429,
  "message": "Too many requests from <IP>. Please try again later.",
  "error": "Too Many Requests"
}
```

**Validar:**
- ✅ 5 primeros requests: 200 OK
- ✅ 6to request: 429 Too Many Requests
- ✅ Después de 15 minutos, vuelve a funcionar

#### Test 7.2: Rate Limit en /auth/refresh

```bash
# Hacer 5 requests exitosos con refresh_token válido
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/v1/auth/refresh \
    -H "Content-Type: application/json" \
    -d '{"refreshToken": "<refresh_token>"}'
done

# El 6to request debería retornar 429
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token>"}'

# Response esperado (429 Too Many Requests)
```

**Validar:**
- ✅ Rate limiting aplicado correctamente
- ✅ Límite es de 5 intentos en 15 minutos

### Fase 8: Endpoints Protegidos

#### Test 8.1: GET /api/v1/projects sin token

```bash
curl -X GET http://localhost:3001/api/v1/projects

# Response esperado (401 Unauthorized)
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Validar:**
- ✅ Response 401 Unauthorized

#### Test 8.2: GET /api/v1/projects con token válido

```bash
curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer <access_token>"

# Response esperado (200 OK)
[ ... projects data ... ]
```

**Validar:**
- ✅ Response 200 OK
- ✅ Retorna datos del usuario autenticado

---

## 📊 Casos de Uso del Frontend

### Caso 1: Usuario Abre App

```javascript
// 1. App intenta cargar datos
const response = await fetch('/api/v1/projects', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

if (response.status === 401) {
  // 2. Token expiró, intentar refresh
  const newTokens = await refreshAccessToken();
  
  if (newTokens) {
    // 3. Reintentar con nuevo token
    const retryResponse = await fetch('/api/v1/projects', {
      headers: { 'Authorization': `Bearer ${newTokens.access_token}` }
    });
  } else {
    // 4. Session expirada, ir a login
    redirectToLogin();
  }
}
```

### Caso 2: Usuario Hace Muchas Requests

```javascript
// El frontend debe manejar estos casos:
// - Algunos requests pueden fallar con 401
// - El refresh puede ser llamado múltiples veces simultáneamente
// - Usar una cola de requests pendientes para retry después de refresh
```

### Caso 3: Usuario Cierra Session Manualmente

```javascript
// Cuando el usuario hace click en "Logout":
await fetch('/api/v1/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: JSON.stringify({ refreshToken })
});

// Limpiar tokens locales
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// Redirigir a login
redirectToLogin();
```

---

## 🔍 Debug Checklist

Si los tests fallan, revisar:

- [ ] ¿La BD está corriendo? (`docker-compose up`)
- [ ] ¿El backend está corriendo? (`npm run dev`)
- [ ] ¿Las variables de entorno están configuradas? (`.env`)
- [ ] ¿El JWT_SECRET es el mismo? (no fue cambiado entre requests)
- [ ] ¿Los tokens son strings válidos? (sin quotes adicionales)
- [ ] ¿El Authorization header es correcto? (`Bearer <token>`)
- [ ] ¿El usuario existe en la BD?
- [ ] ¿La cuenta está ACTIVE? (no PENDING o SUSPENDED)
- [ ] ¿Está dentro de la ventana de rate limiting?
- [ ] ¿Los logs del servidor muestran errores?

## 📝 Logs Importantes

En el servidor, buscar estos logs:

```
🔐 Validando usuario: admin@example.com
🔐 Usuario encontrado en DB
🔐 Resultado comparación: true
🚀 Backend running on http://localhost:3001/api/v1
```

Para debug, activar logs en [auth.service.ts](../src/modules/auth/auth.service.ts)

---

## 🚀 Performance

Tests recomendados para verificar performance:

```bash
# Hacer 100 requests concurrentes a /auth/login
ab -n 100 -c 10 -p credentials.json http://localhost:3001/api/v1/auth/login

# Hacer 1000 requests a endpoint protegido
ab -n 1000 -c 100 \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/v1/projects

# Resultado esperado: <200ms por request
```

---

## 📄 Herramientas Recomendadas

- **Postman** - Interfaz gráfica para requests HTTP
- **Insomnia** - Alternative a Postman
- **Thunder Client** - Extension para VS Code
- **curl** - Command line (usado en estos ejemplos)
- **jq** - Parse JSON en terminal: `curl ... | jq .`

---

## 🎯 Próximos Pasos

Después de validar todos los tests:

1. [ ] Integrar con frontend
2. [ ] Implementar interceptor de HTTP para refresh automático
3. [ ] Configurar httpOnly cookies en producción
4. [ ] Integrar con servicio de email para forgot-password
5. [ ] Agregar 2FA
6. [ ] Implementar Redis para persistencia de blacklist
7. [ ] Monitorear intentos fallidos y disparar alertas

---

**Última actualización:** 17 de Febrero de 2026
