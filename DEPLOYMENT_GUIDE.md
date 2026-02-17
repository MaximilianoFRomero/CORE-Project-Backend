# 🚀 Guía de Deploy - Múltiples Plataformas

## Platform Selection

Elige la plataforma que mejor se adapte a tu caso:

| Plataforma | Costo | BD Incluida | Deploy | Mejor para |
|-----------|-------|-----------|--------|-----------|
| **Render** | Gratuito | ❌ | Automático GitHub | Pruebas, Desarrollo |
| **Railway** | $5-50/mes | ✅ | Automático GitHub | Pequeños proyectos |
| **Fly.io** | Gratuito | ❌ | Automático | Alta disponibilidad |
| **AWS** | Variable | ✅ | Manual/CDK | Producción escalable |
| **DigitalOcean** | $5-100/mes | ✅ | Manual | Control total |

---

## 1️⃣ RENDER.com (Recomendado para Start)

### ✅ Ventajas
- Gratis para testing
- Deploy automático desde GitHub
- Easy to setup

### ❌ Desventajas
- BD debe estar en otro lugar
- Spins down si inactivo (gratis)

### Setup

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

Ver: `DEPLOY_RENDER.md` para instrucciones completas

---

## 2️⃣ RAILWAY.app (Recomendado para Producción Simple)

### ✅ Ventajas
- Incluye PostgreSQL
- Muy simple
- Buena documentación
- $5-50/mes

### Setup

1. **Conectar GitHub**
   - railway.app → New Project → GitHub
   - Seleccionar repo
   - Auto-deploy activado

2. **Variables de Entorno**
   - Railway auto-detecta `.env`
   - Agregar en Railway Dashboard:
     ```
     NODE_ENV=production
     JWT_SECRET=...
     DB_HOST=${{ Postgres.PGHOST }}
     DB_NAME=${{ Postgres.PGDATABASE }}
     ```

3. **Comandos**
   - Build: `npm install && npm run build`
   - Start: `npm start`

### Deploy
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

---

## 3️⃣ FLY.io (Recomendado para Global)

### ✅ Ventajas
- Despliega en múltiples regiones
- Buena latencia global
- Gratuito para empezar
- Incluye base de datos

### Setup

1. **Instalar Fly CLI**
   ```bash
   brew install flyctl
   flyctl auth login
   ```

2. **Configurar**
   ```bash
   flyctl launch
   # Responde las preguntas
   # Crea app.toml
   ```

3. **Deploy**
   ```bash
   flyctl deploy
   ```

---

## 4️⃣ DigitalOcean (Recomendado para Control Total)

### ✅ Ventajas
- VPS completa
- Control total
- $5-150/mes
- Incluye BD PostgreSQL

### Setup

1. **Crear Droplet**
   - Ubuntu 22.04 LTS
   - 2GB RAM mínimo
   - Seleccionar SSH key

2. **Instalar en el Droplet**
   ```bash
   ssh root@tu-ip
   
   # Update
   apt update && apt upgrade
   
   # Node
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   apt install nodejs
   
   # PostgreSQL (si no usas managed)
   apt install postgresql postgresql-contrib
   
   # Clonar repo
   git clone https://github.com/MaximilianoFRomero/CORE-Project-Backend
   cd CORE-Project-Backend/backend
   
   # Install & Build
   npm install
   npm run build
   
   # PM2 para mantener app running
   npm install -g pm2
   pm2 start npm --name "core-api" -- start
   pm2 startup
   pm2 save
   
   # Nginx como reverse proxy
   apt install nginx
   # Configurar proxy_pass a localhost:3001
   ```

3. **Dominio**
   - Apuntar DNS a DigitalOcean
   - Usar Let's Encrypt para SSL

---

## 5️⃣ AWS (Recomendado para Producción Enterprise)

### ✅ Ventajas
- Escalabilidad ilimitada
- Servicios de AWS integrados
- SLA 99.99%

### Servicios Usados
- **EC2**: Servidor
- **RDS**: PostgreSQL
- **S3**: Uploads
- **CloudFront**: CDN
- **Route53**: DNS

### Costo Estimado
- EC2 (t3.medium): ~$30/mes
- RDS (db.t3.micro): ~$15/mes
- Total: ~$50/mes

---

## Comparación de Deployment

```yaml
Escenario 1: MVP/Testing
  - Plataforma: Render.com
  - BD: PostgreSQL Render (alojada aparte)
  - Costo: Gratuito
  - Ventajas: Setup rápido
  
Escenario 2: Producción Pequeña
  - Plataforma: Railway
  - BD: PostgreSQL Railway (integrado)
  - Costo: $20-30/mes
  - Ventajas: Todo integrado, simple
  
Escenario 3: Producción Global
  - Plataforma: Fly.io
  - BD: PostgreSQL Fly (integrado)
  - Costo: $10-50/mes
  - Ventajas: Latencia baja global
  
Escenario 4: Producción Enterprise
  - Plataforma: AWS
  - BD: RDS PostgreSQL
  - Costo: $50-200/mes
  - Ventajas: Máxima escalabilidad
```

---

## Pasos Comunes a Todos

### 1. Verificar Build Localmente

```bash
# Limpiar
rm -rf dist node_modules

# Instalar y buildar
npm install
npm run build

# Verificar que dist existe
ls -la dist/
# Debe tener: main.js, app.module.js, etc.

# Probar start
npm start
# Debe escuchar en puerto 3001
```

### 2. Configurar Variables de Entorno

**Mínimo requerido:**
```env
NODE_ENV=production
PORT=3001
DB_HOST=<tu-base-de-datos>
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<contraseña-segura>
DB_NAME=core_platform
JWT_SECRET=<min-32-caracteres-aleatorios>
CORS_ORIGIN=<tu-dominio-frontend>
```

### 3. Configurar Base de Datos

- PostgreSQL 12+ requerido
- Crear base de datos: `core_platform`
- TypeORM sync automático en primer startup

### 4. Health Check

El endpoint `/api/v1` debe responder con 200:

```bash
curl http://localhost:3001/api/v1
# Respuesta esperada: HTML simple o JSON
```

---

## Monitoreo Post-Deploy

### Checklist
- [ ] App responde en `/api/v1`
- [ ] Login funciona: `POST /api/v1/auth/login`
- [ ] Refresh token funciona: `POST /api/v1/auth/refresh`
- [ ] Protected endpoint responde: `GET /api/v1/users/profile/me`
- [ ] Logs sin errores

### Comandos de Test

```bash
# Login
curl -X POST https://tu-app.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Refresh
curl -X POST https://tu-app.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"token-aqui"}'

# Profile
curl https://tu-app.com/api/v1/users/profile/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Troubleshooting

### Error: "Cannot find module"
```bash
npm install
npm run build
```

### Error: "Database connection refused"
```bash
# Verificar conexión a BD
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>
```

### Error: "Port 3001 already in use"
```bash
# Cambiar puerto en .env
PORT=3000
```

### App muy lenta
- Aumentar RAM de la máquina
- Activar caching
- Usar CDN para assets

---

## Próximos Pasos

1. **Elegir plataforma** (recomendado: Railway o Render)
2. **Configurar variables** de entorno
3. **Deployar** y probar
4. **Monitorear** logs y performance
5. **Agregar dominio** y SSL

---

**Última actualización:** 17 de Febrero de 2026  
**Soportado:** NestJS 10.4+, Node 18+
