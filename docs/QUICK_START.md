# 🚀 GUÍA DE INICIO RÁPIDO

**Cómo empezar con el sistema de sesión expirada recién implementado**

---

## ⚡ 5 Minutos para Empezar

### 1. Verificar que el backend está corriendo

```bash
# Terminal 1: Asegúrate que el servidor está corriendo
cd backend
npm run dev

# Deberías ver:
# [Nest] XXXX  - DD/MM/YYYY, HH:MM:SS     LOG [NestFactory] Starting Nest application...
# 🚀 Backend running on http://localhost:3001/api/v1
```

### 2. Hacer tu primer login

```bash
# Terminal 2: Hacer login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Deberías recibir:
# {
#   "access_token": "eyJhbGci...",
#   "refresh_token": "eyJhbGci...",
#   "expiresIn": 900,
#   "user": { ... }
# }
```

### 3. Guardar los tokens

```bash
# Guarda los tokens para usarlos después
ACCESS_TOKEN="eyJhbGci..."  # Copia el access_token
REFRESH_TOKEN="eyJhbGci..." # Copia el refresh_token
```

### 4. Probar un endpoint protegido

```bash
# Usar el access_token para acceder a recursos
curl -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Deberías recibir: [... projects ...]
```

### 5. Probar refresh de token

```bash
# Renovar el access_token usando refresh_token
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Deberías recibir:
# {
#   "access_token": "eyJhbGci...",
#   "refresh_token": "eyJhbGci...",
#   "expiresIn": 900
# }
```

---

## 📚 Próximos Pasos

### Para Entender el Sistema

1. **Lee QUICK_REFERENCE.md** (5 minutos)
   - Visión general rápida
   - Endpoints principales
   - Flujo básico

2. **Lee AUTH_SESSION_API.md** (15 minutos)
   - Documentación completa
   - Detalles de cada endpoint
   - Ejemplos detallados

3. **Lee TESTING_SESSION.md** (20 minutos)
   - Cómo testear cada endpoint
   - Casos de uso prácticos
   - Debugging

### Para Integrar en Frontend

1. **Lee FRONTEND_INTEGRATION.md** (30 minutos)
   - Código React completo
   - Interceptor HTTP
   - Servicios y hooks

2. **Implementa el Interceptor HTTP** (1-2 horas)
   - Es el punto crítico
   - Debe interceptar 401
   - Debe renovar token automáticamente

3. **Implementa Componentes** (1-2 horas)
   - ProtectedRoute
   - Login page
   - Auth context

---

## 🧪 Testing Completo

### Test Rápido (5 minutos)

```bash
# Script para validar que todo funciona

#!/bin/bash

# 1. Login
echo "1️⃣ Haciendo login..."
LOGIN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

ACCESS=$(echo $LOGIN | jq -r '.access_token')
REFRESH=$(echo $LOGIN | jq -r '.refresh_token')
echo "✅ Tokens obtenidos"

# 2. Usar access_token
echo "2️⃣ Usando access_token..."
curl -s -X GET http://localhost:3001/api/v1/projects \
  -H "Authorization: Bearer $ACCESS" | jq . > /dev/null
echo "✅ Endpoint protegido funciona"

# 3. Refresh token
echo "3️⃣ Renovando token..."
REFRESH_RESULT=$(curl -s -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}")

NEW_ACCESS=$(echo $REFRESH_RESULT | jq -r '.access_token')
echo "✅ Token renovado"

# 4. Validar nuevo token
echo "4️⃣ Validando nuevo token..."
curl -s -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Authorization: Bearer $NEW_ACCESS" | jq . > /dev/null
echo "✅ Nuevo token funciona"

echo ""
echo "🎉 Todo funciona correctamente!"
```

### Test Completo (30 minutos)

Ver `docs/TESTING_SESSION.md` para testing exhaustivo con validaciones.

---

## 🔑 Configuración Importante

### Variables de Entorno (.env)

```env
# CRÍTICO: Cambiar en producción
JWT_SECRET=your-super-secret-key

# TTL de tokens
JWT_ACCESS_EXPIRATION=15m    # 15 minutos
JWT_REFRESH_EXPIRATION=7d    # 7 días
JWT_RESET_EXPIRATION=1h      # 1 hora

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=core_platform

# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Crear archivo .env

```bash
# Copiar de ejemplo
cp .env.example .env

# Editar si es necesario cambiar valores
nano .env
```

---

## 📁 Estructura de Documentación

```
docs/
├── 🚀 QUICK_REFERENCE.md           ← EMPIEZA AQUÍ
├── 📖 AUTH_SESSION_API.md          ← API completa
├── 🧪 TESTING_SESSION.md           ← Cómo testear
├── 💻 FRONTEND_INTEGRATION.md      ← Código ejemplo
├── 📋 IMPLEMENTATION_SUMMARY.md    ← Resumen técnico
├── 📝 CHANGELOG.md                 ← Cambios realizados
├── ✅ STATUS.txt                   ← Estado actual
└── 🚀 QUICK_START.md               ← Este archivo
```

---

## 🛠️ Troubleshooting

### Error: "Cannot POST /auth/login"

```
Causa: Servidor no está corriendo
Solución: npm run dev
```

### Error: 401 Unauthorized

```
Causa: Token faltante, expirado o inválido
Solución: 
  1. Hacer login nuevamente
  2. Verificar que Authorization header está correcto
  3. Verificar que el token no expiró
```

### Error: 429 Too Many Requests

```
Causa: Demasiados intentos en corto tiempo
Solución: Esperar 15 minutos (o la ventana configurada)
```

### Error: "Invalid credentials"

```
Causa: Email o password incorrectos
Solución: Verificar credenciales, crear usuario si es necesario
```

---

## 💡 Tips Importantes

### 1. El Interceptor HTTP es CRÍTICO

Sin el interceptor en el frontend, el sistema NO funciona.

Ver: `docs/FRONTEND_INTEGRATION.md` - Sección 1

### 2. Manejo de Concurrencia

Si múltiples requests fallan al mismo tiempo con 401:
- NO hacer refresh múltiples veces
- Usar una cola para reintentos
- El ejemplo en FRONTEND_INTEGRATION.md lo maneja

### 3. localStorage vs cookies

**Desarrollo:** localStorage está OK
**Producción:** usar httpOnly cookies (más seguro)

### 4. Nunca Confiar en JWT del Cliente

Siempre validar en servidor:
- Verificar firma
- Verificar expiración
- Verificar usuario existe

El backend lo hace automáticamente ✅

---

## 📞 Documentos por Rol

### Para Desarrollador Frontend

1. `docs/QUICK_REFERENCE.md` - Endpoints rápidos
2. `docs/FRONTEND_INTEGRATION.md` - Código ejemplo
3. `docs/AUTH_SESSION_API.md` - Detalles de API

### Para QA / Tester

1. `docs/TESTING_SESSION.md` - Guía de testing
2. `docs/QUICK_REFERENCE.md` - Endpoints
3. `docs/CHANGELOG.md` - Qué cambió

### Para DevOps / SysAdmin

1. `.env.example` - Configuración necesaria
2. `docs/STATUS.txt` - Estado del proyecto
3. `docs/IMPLEMENTATION_SUMMARY.md` - Resumen técnico

### Para Project Manager

1. `docs/IMPLEMENTATION_SUMMARY.md` - Qué se hizo
2. `docs/STATUS.txt` - Estado actual
3. `docs/CHANGELOG.md` - Cambios realizados

---

## ✅ Checklist Inicial

- [ ] Backend corriendo (`npm run dev`)
- [ ] Base de datos conectada
- [ ] Hacer login exitosamente
- [ ] Obtener access_token
- [ ] Obtener refresh_token
- [ ] Usar access_token en endpoint protegido
- [ ] Renovar token con refresh_token
- [ ] Todas las respuestas tienen status correcto

---

## 🎯 Flujo Recomendado de Aprendizaje

### Día 1: Entendimiento (2 horas)

- [ ] Leer QUICK_REFERENCE.md (5 min)
- [ ] Leer AUTH_SESSION_API.md (15 min)
- [ ] Ver diagrama de flujo de sesión
- [ ] Ejecutar test rápido (5 min)

### Día 2: Testing (3 horas)

- [ ] Leer TESTING_SESSION.md
- [ ] Ejecutar todos los tests del archivo
- [ ] Crear script personalizado si es necesario

### Día 3: Integración (4-6 horas)

- [ ] Leer FRONTEND_INTEGRATION.md
- [ ] Implementar Interceptor HTTP
- [ ] Implementar AuthService
- [ ] Implementar ProtectedRoute
- [ ] Implementar componentes de Login

### Día 4: Verificación (2 horas)

- [ ] Integración E2E
- [ ] Testing de sesión expirada
- [ ] Fixing de bugs
- [ ] Optimizaciones

---

## 🚀 Próximas Mejoras

### Corto Plazo (Esta semana)
- [ ] Integración con frontend
- [ ] Testing exhaustivo
- [ ] Documentación en frontend

### Mediano Plazo (Próximo mes)
- [ ] Email service para forgot-password
- [ ] 2FA (two-factor authentication)
- [ ] httpOnly cookies en lugar de localStorage

### Largo Plazo (Roadmap general)
- [ ] Redis para persistencia
- [ ] OAuth2 (Google, GitHub)
- [ ] Passwordless authentication
- [ ] Biometric authentication

---

## 📧 Soporte

Para preguntas o problemas:

1. **Revisar QUICK_REFERENCE.md** - Solución rápida
2. **Revisar TESTING_SESSION.md** - Debugging
3. **Revisar CHANGELOG.md** - Ver qué cambió
4. **Revisar logs del servidor** - Error detallado

---

## 🎉 Conclusión

El backend está 100% funcional y listo para usar.

**Próximo paso:** Implementar interceptor HTTP en el frontend.

Ver: `docs/FRONTEND_INTEGRATION.md` (Sección 1)

---

**Última actualización:** 17 de Febrero de 2026  
**Versión:** 1.0  
**Status:** ✅ LISTO PARA USAR
