# 🚀 Guía de Deploy en Render.com

## Problema Encontrado

El error en el deploy fue:
```
Unknown command: "build"

Did you mean this?
   npm run build # run the "build" package script
```

**Causa:** El comando de build en Render debe ser `npm install && npm run build` (con `run`)

---

## Configuración Paso a Paso

### 1. En Render.com Dashboard

1. **Crear nuevo Web Service**
   - Click en "+ New" → "Web Service"
   - Conectar repositorio GitHub: `MaximilianoFRomero/CORE-Project-Backend`
   - Seleccionar rama: `main`

2. **Configuración del Servicio**
   - **Name**: `core-platform-backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 22 (o la que desees)

3. **Variables de Entorno (Environment Variables)**

Agregar las siguientes variables en Render:

```
NODE_ENV=production
PORT=3001
DB_HOST=<tu-host-postgres>
DB_PORT=5432
DB_USERNAME=<tu-usuario>
DB_PASSWORD=<tu-contraseña>
DB_NAME=core_platform
DB_SYNCHRONIZE=false
JWT_SECRET=<genera-una-contraseña-segura>
REFRESH_TOKEN_SECRET=<genera-una-contraseña-segura>
CORS_ORIGIN=<tu-dominio-frontend>
SUPER_ADMIN_EMAIL=admin@coreplatform.dev
SUPER_ADMIN_PASSWORD=<contraseña-segura>
```

4. **Plan**
   - Seleccionar: **Standard** (o superior según necesidad)
   - **Auto-Deploy**: Activar si deseas deploy automático en push a `main`

---

## Estructura del Proyecto

```
backend/
├── src/
│   ├── main.ts              # Entry point
│   ├── app.module.ts
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── projects/
│       └── deployments/
├── dist/                    # Compilado (generado en build)
├── package.json             # Scripts correctos
├── render.yaml              # Configuración de Render
├── .env.production          # Variables de producción
└── tsconfig.json
```

---

## Scripts Disponibles

```json
{
  "start": "node dist/main",           // Producción
  "start:dev": "nest start --watch",   // Desarrollo local
  "dev": "ts-node-dev ...",            // Dev con hot-reload
  "build": "nest build"                // Build para producción
}
```

---

## Verificación Pre-Deploy

Antes de deployar, verifica localmente:

```bash
# Limpiar y rebuildar
rm -rf dist node_modules
npm install
npm run build

# Verificar que dist existe y contiene main.js
ls dist/
# output: main.js, app.module.js, etc.

# Probar localmente
npm start
# Debe funcionar en http://localhost:3001
```

---

## Archivo .env Correctamente Configurado

```env
# Production - Render.com
NODE_ENV=production
PORT=3001

# Database
DB_HOST=<tu-servidor-postgres>
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<contraseña>
DB_NAME=core_platform
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT
JWT_SECRET=tu-secret-key-muy-segura-min-32-caracteres
REFRESH_TOKEN_SECRET=otro-secret-key-muy-segura
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://tu-frontend.com

# Admin
SUPER_ADMIN_EMAIL=admin@coreplatform.dev
SUPER_ADMIN_FIRST_NAME=System
SUPER_ADMIN_LAST_NAME=Administrator
SUPER_ADMIN_PASSWORD=AdminSecurePass123!
```

---

## Troubleshooting

### Error: "Unknown command: build"
**Solución:** Usa `npm run build` (con `run`)

```bash
# ❌ INCORRECTO
npm build

# ✅ CORRECTO
npm run build
```

### Error: "Cannot find module"
**Solución:** Limpia y reinstala
```bash
npm install
npm run build
```

### Error: "Database connection failed"
**Solución:** Verifica que DB_HOST es accesible desde Render
- PostgreSQL debe estar en la nube
- O usar Render PostgreSQL (integrado)

### Health Check Falla
**Solución:** Render espera que GET /api/v1 devuelva 2xx
- Verifica que tu app está respondiendo
- Aumenta timeout en Render settings

---

## Monitoreo en Producción

1. **Logs en Tiempo Real**
   - Render Dashboard → Logs
   - Ver cualquier error en startup

2. **Métricas**
   - CPU, Memoria, Requests
   - Ver en el dashboard de Render

3. **Error Tracking**
   - Implementar Sentry (opcional)
   - Logs a un servicio externo

---

## Próximas Mejoras

- [ ] Agregar CI/CD pipeline (GitHub Actions)
- [ ] Implementar error tracking (Sentry)
- [ ] Agregar métricas (Prometheus)
- [ ] Configurar alertas
- [ ] Backup automático de BD
- [ ] Rate limiting en producción (Redis)

---

## Test de Endpoint en Producción

```bash
# Obtener token
TOKEN=$(curl -X POST https://tu-app.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coreplatform.dev","password":"..."}' \
  | jq -r '.access_token')

# Probar endpoint protegido
curl -X GET https://tu-app.onrender.com/api/v1/users/profile/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Documentación Oficial

- **Render Node.js**: https://render.com/docs/deploy-node-express-app
- **Environment Variables**: https://render.com/docs/environment-variables
- **Troubleshooting**: https://render.com/docs/troubleshooting-deploys

---

**Última actualización:** 17 de Febrero de 2026  
**Versión:** 1.0
