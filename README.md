# 🚀 Core Platform Backend API

Una API RESTful escalable construida con NestJS que potencia la próxima generación de plataformas de desarrollo con integración nativa de IA y agentes autónomos.

## ✨ Características Destacadas

### 🔐 **Autenticación Avanzada**
- JWT con refresh tokens
- Role-Based Access Control (RBAC)
- Multi-factor authentication ready
- OAuth2 para GitHub/GitLab

### 📊 **Gestión Inteligente de Proyectos**
- Soporte multi-framework (NextJS, NestJS, React, Vue, etc.)
- Configuración de bases de datos múltiples
- Analytics en tiempo real
- Integración con repositorios Git

### ⚡ **Sistema de Deployments**
- Pipeline completo con múltiples entornos
- Logs en tiempo real con WebSockets
- Rollback automático
- Métricas de performance

### 👥 **Gestión de Equipos**
- Roles granular (Admin, Developer, Viewer)
- Invitaciones por email
- Permisos por proyecto
- Dashboard administrativo

### 🧠 **IA Integrada** *(Roadmap)*
- Análisis predictivo de deployments
- Agentes autónomos para optimización
- Code review asistido por IA
- Recomendaciones inteligentes

## 🏗️ Arquitectura
```
╔════════════════════════════════════════════════════════╗
║                    Frontend Layer                      ║
║                 NextJS 15 + React 18                   ║
╚═══════════════════════════╦════════════════════════════╝
                            ║ REST API + WebSockets
╔═══════════════════════════╩════════════════════════════╗
║                    Backend Layer                       ║
║                   NestJS Framework                     ║
╠════════════════════════════════════════════════════════╣
║  ┌────────────┐  ┌────────────┐  ┌────────────┐        ║
║  │   Auth     │  │   Users    │  │    AI      │        ║
║  └────────────┘  └────────────┘  └────────────┘        ║
║  ┌────────────┐  ┌────────────┐  ┌────────────┐        ║
║  │  Projects  │  │Deployments │  │ Analytics  │        ║
║  └────────────┘  └────────────┘  └────────────┘        ║
╚═══════════════════════════╦════════════════════════════╝
                            ║
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼──────┐        ┌───▼──────┐        ┌───▼──────┐
    │PostgreSQL│        │ Redis    │        │Storage   │
    └──────────┘        └──────────┘        └──────────┘
```

## 🚀 Comenzando

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 15+
- Redis 6+
- Docker & Docker Compose (recomendado)

## Instalación Rápida

### 1. Clonar repositorio
```
git clone https://github.com/tu-usuario/core-platform-backend.git
cd core-platform-backend
```

### 2. Configurar variables de entorno

```cp .env.example .env```

### Editar .env con tus configuraciones

### 3. Iniciar servicios con Docker

```docker-compose up -d```

### 4. Instalar dependencias

```npm install```

### 5. Ejecutar migraciones

```npm run migration:run```

### 6. Iniciar servidor de desarrollo

```npm run start:dev```

## Scripts Disponibles

### Desarrollo

```npm run start:dev```

### Testing
```
npm run test           -> Tests unitarios
npm run test:e2e       -> Tests end-to-end
npm run test:cov       -> Coverage report
```

### Database
```
npm run migration:generate  -> Generar migración
npm run migration:run       -> Ejecutar migraciones
npm run seed               -> Datos de prueba
```

### Calidad de código
```
npm run lint              -> Linting
npm run format            -> Formatear código
npm run build             -> Compilar TypeScript
```

## 📡 API Endpoints

Autenticación ```(/api/v1/auth)```

```POST /login``` - Iniciar sesión

```POST /register``` - Registrar nuevo usuario

```POST /refresh``` - Refrescar token

```POST /logout``` - Cerrar sesión

Proyectos ```(/api/v1/projects)```

```GET /``` - Listar todos los proyectos

```POST /``` - Crear nuevo proyecto

```GET /:id``` - Obtener proyecto específico

```PATCH /:id``` - Actualizar proyecto

```DELETE /:id``` - Eliminar proyecto

```GET /stats``` - Estadísticas de proyectos

Deployments ```(/api/v1/deployments)```

```GET /``` - Listar deployments

```POST /``` - Crear nuevo deployment

```GET /stats``` - Métricas de deployments

```GET /by-date-range``` - Filtro por fecha

```PATCH /:id/status``` - Actualizar estado

Usuarios ```(/api/v1/users)```

```GET /``` - Listar usuarios (admin)

```GET /profile/me``` - Perfil del usuario actual

```PATCH /profile/me``` - Actualizar perfil

```GET /:id``` - Obtener usuario específico

```POST /:id/activate``` - Activar usuario (admin)

## 🐳 Docker

docker-compose.yml

```
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: core_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./:/app
      - /app/node_modules
    command: npm run start:dev

volumes:
  postgres_data:
```


## 🔧 Configuración

### Variables de Entorno Clave

```
# Database
DB_HOST=localhost

DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=core_platform
DB_SYNCHRONIZE=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=1h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRATION=7d

# Application
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api/v1

# AI Integration (Future)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
AI_ENABLED=false
```

## 🧪 Testing

### Ejecutar todos los tests
```
npm run test
```

### Tests en modo watch
```
npm run test:watch
```

### Tests con coverage
```
npm run test:cov
```

### Tests end-to-end
```
npm run test:e2e
```

## 📊 Monitoreo y Logs

- Health checks: ```GET /api/v1/health```

- Metrics endpoint: ```GET /api/v1/metrics``` (Prometheus format)

- Structured logging con Winston

- Request tracing con correlación IDs

- Error tracking integrado

## 🔐 Seguridad

- Helmet.js para headers de seguridad

- Rate limiting global y por usuario

- CORS configurable

- Input validation con class-validator

- SQL injection protection (TypeORM)

- XSS protection automatizado

## 🚀 Deployment

### Opción 1: Docker
```
docker build -t core-platform-backend .
docker run -p 3001:3001 --env-file .env core-platform-backend
```

### Opción 2: Manual
```
npm run build
npm run start:prod
```

### Opción 3: Kubernetes
```
apiVersion: apps/v1

kind: Deployment
metadata:
  name: core-platform-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: core-platform-backend
  template:
    metadata:
      labels:
        app: core-platform-backend
    spec:
      containers:
      - name: backend
        image: core-platform-backend:latest
        ports:
        - containerPort: 3001
        envFrom:
        - secretRef:
            name: backend-secrets
```

## 🤝 Contribuir

1. Fork del repositorio
2. Crear una branch para tu feature (```git checkout -b feature/AmazingFeature```)
3. Commit tus cambios (```git commit -m 'Add some AmazingFeature'```)
4. Push a la branch (```git push origin feature/AmazingFeature```)
5. Abrir un Pull Request

### Guía de Contribución
Sigue el Conventional Commits

Mantén cobertura de tests > 80%

Documenta nuevas features

Actualiza el ```CHANGELOG.md```

## 📈 Roadmap

### ✅ Implementado

- API RESTful básica

- Autenticación JWT

- CRUD de proyectos y deployments

- Sistema de usuarios y roles

- Dockerización completa

- Testing básico

### 🔄 En Progreso

- WebSockets para logs en tiempo real

- Integración con GitHub/GitLab

- Notificaciones por email

- Dashboard administrativo

### 🚀 Planeado

- Integración de IA para analytics

- Agentes autónomos para optimización

- Code review asistido por IA

- Auto-scaling inteligente

- Multi-tenant architecture

- Plugin system extensible

### 🧠 Integración de IA (Futuro)

El sistema está diseñado para integración nativa con:

- OpenAI GPT para análisis de código

- Anthropic Claude para documentación

- AutoML para predicción de fallos

- Agentes autónomos para optimización

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver LICENSE para más detalles.

## 👨‍💻 Autor

Maximiliano Romero
[maximilianoromerovigo@gmail.com]
https://github.com/MaximilianoFRomero

# ⭐️ ¿Te gusta este proyecto? ¡Dale una estrella en GitHub y compártelo!