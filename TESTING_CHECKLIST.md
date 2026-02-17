# 🧪 TESTING CHECKLIST - Sistema de Sesión Expirada

## Pre-requisitos

- [ ] Backend corriendo en `http://localhost:3001`
- [ ] Base de datos PostgreSQL iniciada
- [ ] Usuario de prueba creado
- [ ] JWT_SECRET configurado en .env
- [ ] CORS habilitado para frontend

## 📋 Testing Manual

### 1. Endpoint POST /auth/login ✅

**Objetivo:** Verificar que login retorna tokens válidos

- [ ] POST a `/auth/login` con credenciales válidas retorna 200
- [ ] Response contiene: `access_token`, `refresh_token`, `expiresIn`, `user`
- [ ] `access_token` es JWT válido
- [ ] `refresh_token` es JWT válido
- [ ] `expiresIn` es 900 (15 minutos en segundos)
- [ ] POST con credenciales inválidas retorna 401
- [ ] POST con email no existente retorna 401
- [ ] POST con email inactivo retorna 401

**Comandos:**

```bash
# Test exitoso
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Expected 200 OK
# {
#   "access_token": "eyJ...",
#   "refresh_token": "eyJ...",
#   "expiresIn": 900,
#   "user": { ... }
# }

# Test fallido
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"wrong"}'

# Expected 401 Unauthorized
# {"statusCode":401,"message":"Invalid credentials"}
```

---

### 2. Endpoint POST /auth/refresh ✅

**Objetivo:** Verificar que refresh genera nuevos tokens

- [ ] POST con `refreshToken` válido retorna 200
- [ ] Response contiene: nuevo `access_token`, nuevo `refresh_token`, `expiresIn`
- [ ] Nuevos tokens son diferentes a los anteriores
- [ ] POST con `refreshToken` expirado retorna 401
- [ ] POST con `refreshToken` inválido retorna 401
- [ ] POST sin `refreshToken` retorna 400
- [ ] Rate limiting: 6to intento en 15min retorna 429

**Comandos:**

```bash
# Obtener tokens
TOKENS=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.access_token, .refresh_token')

ACCESS_TOKEN=$(echo "$TOKENS" | head -n1)
REFRESH_TOKEN=$(echo "$TOKENS" | tail -n1)

# Test refresh válido
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Expected 200 OK
# {
#   "access_token": "eyJ...",
#   "refresh_token": "eyJ...",
#   "expiresIn": 900
# }

# Test refresh inválido
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"invalid.token.here"}'

# Expected 401 Unauthorized
# {"statusCode":401,"message":"Invalid refresh token signature"}
```

---

### 3. Endpoint POST /auth/logout ✅

**Objetivo:** Verificar que logout invalida el token

- [ ] POST sin Authorization header retorna 401
- [ ] POST con token válido retorna 200
- [ ] Response contiene mensaje "Logged out successfully"
- [ ] Refresh token posterior a logout retorna 401 (token revocado)

**Comandos:**

```bash
# Logout sin token
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Expected 401 Unauthorized
# {"statusCode":401,"message":"Unauthorized"}

# Logout con token válido
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Expected 200 OK
# {"message":"Logged out successfully"}

# Intentar usar el token revocado
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Expected 401 Unauthorized
# {"statusCode":401,"message":"Refresh token has been revoked"}
```

---

### 4. Endpoint POST /auth/forgot-password ✅

**Objetivo:** Verificar que forgot-password funciona sin exponer usuarios

- [ ] POST con email existente retorna 200
- [ ] POST con email no existente retorna 200 (no revela si existe)
- [ ] Response mensaje es genérico
- [ ] Rate limiting: 4to intento en 60min retorna 429

**Comandos:**

```bash
# Email existente
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'

# Expected 200 OK
# {
#   "message": "If an account with this email exists, you will receive a password reset link shortly."
# }

# Email no existente
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}'

# Expected 200 OK (mismo mensaje)
# {
#   "message": "If an account with this email exists, you will receive a password reset link shortly."
# }
```

---

### 5. Endpoint POST /auth/validate ✅

**Objetivo:** Verificar que validate retorna datos del usuario

- [ ] POST sin token retorna 401
- [ ] POST con token expirado retorna 401
- [ ] POST con token válido retorna 200
- [ ] Response contiene datos del usuario

**Comandos:**

```bash
# Validate sin token
curl -X POST http://localhost:3001/api/v1/auth/validate

# Expected 401 Unauthorized
# {"statusCode":401,"message":"Unauthorized"}

# Validate con token válido
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected 200 OK
# {
#   "valid": true,
#   "user": {
#     "id": "uuid",
#     "email": "admin@example.com",
#     "firstName": "Admin",
#     "lastName": "User",
#     "role": "super_admin"
#   }
# }
```

---

### 6. Endpoints Protegidos (GET /projects, etc) ✅

**Objetivo:** Verificar que endpoints protegidos requieren token válido

- [ ] GET sin token retorna 401
- [ ] GET con token expirado retorna 401
- [ ] GET con token inválido retorna 401
- [ ] GET con token válido retorna 200

**Comandos:**

```bash
# Sin token
curl -X GET http://localhost:3001/api/v1/projects

# Expected 401 Unauthorized
# {"statusCode":401,"message":"Unauthorized"}

# Con token válido
curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected 200 OK
# [ ... proyectos ... ]
```

---

## 🔄 Flujo Completo de Sesión Expirada

**Objetivo:** Verificar que el flujo completo funciona como se espera

### Paso a Paso

1. [ ] **Login:** POST `/auth/login` → obtener tokens
2. [ ] **Usar token:** GET `/api/v1/projects` con `access_token` → 200 OK
3. [ ] **Esperar expiración:** Esperar 15+ minutos O simular token expirado
4. [ ] **Request con token expirado:** GET `/api/v1/projects` → 401
5. [ ] **Refresh:** POST `/auth/refresh` con `refresh_token` → nuevos tokens
6. [ ] **Reintentar:** GET `/api/v1/projects` con nuevo `access_token` → 200 OK
7. [ ] **Logout:** POST `/auth/logout` → 200 OK
8. [ ] **Usar token revocado:** POST `/auth/refresh` → 401 (revocado)

### Script Automatizado

```bash
#!/bin/bash

# 1. Login
echo "1️⃣ Haciendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refresh_token')

echo "✅ Access Token: ${ACCESS_TOKEN:0:20}..."
echo "✅ Refresh Token: ${REFRESH_TOKEN:0:20}..."

# 2. Usar token
echo ""
echo "2️⃣ Usando access_token para GET /projects..."
PROJECTS=$(curl -s -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "✅ Projects: $(echo $PROJECTS | jq 'length') items"

# 3. Simular token expirado (copiar y modificar token)
echo ""
echo "3️⃣ Simulando token expirado..."
EXPIRED_TOKEN="${ACCESS_TOKEN:0:-10}malformed"

EXPIRED_RESPONSE=$(curl -s -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $EXPIRED_TOKEN")

echo "✅ Response con token expirado: $(echo $EXPIRED_RESPONSE | jq '.message')"

# 4. Refresh token
echo ""
echo "4️⃣ Refrescando token..."
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.access_token')
NEW_REFRESH_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.refresh_token')

echo "✅ Nuevo Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
echo "✅ Nuevo Refresh Token: ${NEW_REFRESH_TOKEN:0:20}..."

# 5. Reintentar con nuevo token
echo ""
echo "5️⃣ Reintentando con nuevo token..."
NEW_PROJECTS=$(curl -s -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

echo "✅ Projects: $(echo $NEW_PROJECTS | jq 'length') items"

# 6. Logout
echo ""
echo "6️⃣ Haciendo logout..."
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$NEW_REFRESH_TOKEN\"}")

echo "✅ Logout: $(echo $LOGOUT_RESPONSE | jq '.message')"

# 7. Intentar usar token revocado
echo ""
echo "7️⃣ Intentando usar token revocado..."
REVOKED_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$NEW_REFRESH_TOKEN\"}")

echo "✅ Response: $(echo $REVOKED_RESPONSE | jq '.message')"

echo ""
echo "🎉 Flujo completo ejecutado!"
```

---

## 🐛 Debugging

### Debug Token JWT

```bash
# Decodificar token (sin verificar firma)
echo "ACCESS_TOKEN: $(echo $ACCESS_TOKEN | jq -R 'split(".") | .[1] | @base64d | fromjson')"

# O usar jwt-cli
npm install -g jwt-cli
jwt decode $ACCESS_TOKEN
```

### Ver Headers

```bash
curl -v -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' 2>&1 | grep "< HTTP"
```

### Logs del Backend

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# O usar npm con debug
DEBUG=* npm run start:dev
```

---

## ✅ Checklist Final

- [ ] Todos los endpoints retornan status correcto
- [ ] JWT Guard maneja errores correctamente
- [ ] Rate limiting funciona
- [ ] Tokens se generan con TTL correcto
- [ ] Refresh retorna nuevos tokens
- [ ] Tokens revocados no funcionan
- [ ] Endpoints protegidos retornan 401 sin token
- [ ] Frontend puede hacer login y refresh
- [ ] Documentación está completa

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica que JWT_SECRET está configurado
2. Verifica que los tiempos de expiración son correctos
3. Verifica logs del backend
4. Verifica que CORS está habilitado
5. Verifica que el usuario existe y está ACTIVE
6. Verifica que no estás rate limited
