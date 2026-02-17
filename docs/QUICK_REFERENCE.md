# 🚀 QUICK REFERENCE - Sistema de Sesión Expirada

**Tabla rápida de referencia para el sistema implementado**

---

## ⚡ Endpoints Principales

| Endpoint | Método | Auth | Descripción | Status |
|----------|--------|------|-------------|--------|
| `/auth/login` | POST | ❌ | Autenticar usuario | 200 / 401 |
| `/auth/refresh` | POST | ❌ | Renovar access_token | 200 / 401 |
| `/auth/logout` | POST | ✅ | Cerrar sesión | 200 / 401 |
| `/auth/forgot-password` | POST | ❌ | Reset de password | 200 / 400 |
| `/auth/validate` | POST | ✅ | Validar token actual | 200 / 401 |
| `/auth/register` | POST | ❌ | Registrar usuario | 201 / 400 |

---

## 🔑 Request/Response Rápido

### Login
```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

RESPONSE (200)
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": { "id", "email", "firstName", "lastName", "role" }
}
```

### Refresh Token ⭐
```json
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

RESPONSE (200)
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### Error 401
```json
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "Unauthorized"
}
```

---

## ⏱️ Tiempos

| Token | TTL | Renovación |
|-------|-----|-----------|
| Access | 15 minutos | Automática |
| Refresh | 7 días | Manual |
| Reset Password | 1 hora | N/A |

---

## 🔒 Headers Requeridos

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 🛡️ Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/auth/login` | 5 intentos | 15 minutos |
| `/auth/refresh` | 5 intentos | 15 minutos |
| `/auth/forgot-password` | 3 intentos | 60 minutos |

---

## 📝 Flujo Frontend (Pseudo-código)

```javascript
// 1. Usuario hace login
login() → recibe access_token + refresh_token

// 2. Usuario hace request
GET /api/projects
  Authorization: Bearer <access_token>

// 3. Token expira después de 15 min
  ↓ Response 401

// 4. Frontend intercepta 401
  ↓ POST /auth/refresh
    { refreshToken: "..." }

// 5. Backend valida y emite nuevo token
  ↓ Response 200
    { access_token: "nuevo", refresh_token: "nuevo" }

// 6. Frontend reintenta request original
  GET /api/projects
    Authorization: Bearer <nuevo_access_token>
    ↓ Response 200 ✅

// O si refresh también expira...
// 7. Frontend redirige a /login
```

---

## 🔑 Almacenamiento de Tokens

```javascript
// GUARDAR después de login
localStorage.setItem('accessToken', response.access_token);
localStorage.setItem('refreshToken', response.refresh_token);

// USAR en requests
Authorization: `Bearer ${localStorage.getItem('accessToken')}`

// LIMPIAR en logout
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

---

## 🧪 Testing Rápido con cURL

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Refresh
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<token>"}'
```

### Endpoint Protegido
```bash
curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer <token>"
```

---

## 📁 Archivos Clave

| Archivo | Descripción |
|---------|------------|
| `src/modules/auth/auth.service.ts` | Lógica de autenticación |
| `src/modules/auth/auth.controller.ts` | Endpoints |
| `src/modules/auth/guards/jwt-auth.guard.ts` | Protección de rutas |
| `src/config/jwt.config.ts` | Configuración |
| `docs/AUTH_SESSION_API.md` | Documentación completa |
| `docs/TESTING_SESSION.md` | Guía de testing |
| `docs/FRONTEND_INTEGRATION.md` | Ejemplos para frontend |

---

## ✅ Checklist de Implementación

- [x] Endpoints implementados
- [x] Validaciones de JWT
- [x] Rate limiting
- [x] Manejo de errores
- [x] Documentación
- [x] Testing
- [x] Servidor corriendo

---

## 🔴 Errores Comunes

### Error: "Unknown token"
```
Causa: Token expirado o inválido
Solución: Renovar con /auth/refresh
```

### Error: 429 Too Many Requests
```
Causa: Demasiados intentos en corto tiempo
Solución: Esperar 15 minutos
```

### Error: "Account is not active"
```
Causa: Cuenta suspendida o pendiente
Solución: Contactar al admin
```

### Error: "Refresh token has been revoked"
```
Causa: Token fue bloqueado (logout previo)
Solución: Hacer login nuevamente
```

---

## 💡 Tips

1. **El interceptor HTTP es CRÍTICO**
   - Debe ser el primer middleware configurado
   - Debe manejar 401 automáticamente

2. **Manejo de concurrencia**
   - Si múltiples requests fallan al mismo tiempo
   - Solo hacer UNO refresh
   - Meter otros en cola y reintentarlos después

3. **localStorage vs cookies**
   - Desarrollo: localStorage está OK
   - Producción: httpOnly cookies (más seguro)

4. **Logout limpia todo**
   - Revoca token en servidor
   - Limpia localStorage en cliente
   - Redirige a /login

5. **No confiar en JWT del cliente**
   - Siempre validar en servidor
   - Verificar firma
   - Verificar expiración
   - Verificar usuario existe

---

## 🌐 Variables de Entorno Importantes

```env
JWT_SECRET=your-super-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

---

## 📞 Soporte Rápido

### ¿Cómo renovar un token?
```typescript
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
});
```

### ¿Cómo verificar que el token es válido?
```bash
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Authorization: Bearer <token>"
```

### ¿Cómo hacer logout?
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -d '{"refreshToken":"<refresh_token>"}'
```

---

## 🎯 Próximos Pasos

1. ✅ Backend implementado
2. ⏭️ Integrar interceptor HTTP en frontend
3. ⏭️ Implementar ProtectedRoute
4. ⏭️ Configurar httpOnly cookies para producción
5. ⏭️ Agregar 2FA

---

**Última actualización:** 17 de Febrero de 2026  
**Versión:** 1.0  
**Status:** ✅ PRODUCCIÓN
