# 🎯 Ejemplos de Integración Frontend

Ejemplos de código para integrar el sistema de sesión expirada en el frontend.

---

## 1. Interceptor HTTP (React)

Este es el componente MÁS IMPORTANTE para que funcione todo.

```typescript
// src/services/http-interceptor.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expiresIn: number;
}

class HttpInterceptor {
  private api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
  });

  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => this.handleResponseError(error)
    );
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si es 401 y no es el endpoint de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        // El refresh falló, redirigir a login
        this.redirectToLogin();
        return Promise.reject(error);
      }

      // Marcar que ya intentamos una vez
      originalRequest._retry = true;

      // Si ya estamos refrescando, agregar este request a la cola
      if (this.isRefreshing) {
        return new Promise((resolve) => {
          this.refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(this.api(originalRequest));
          });
        });
      }

      this.isRefreshing = true;

      try {
        // Intentar renovar el token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          this.redirectToLogin();
          return Promise.reject(error);
        }

        const response = await this.refreshAccessToken(refreshToken);

        // Guardar nuevos tokens
        localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);

        // Notificar a todos los subscribers
        this.refreshSubscribers.forEach((callback) =>
          callback(response.access_token)
        );
        this.refreshSubscribers = [];

        // Reintentar request original
        originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
        return this.api(originalRequest);
      } catch (refreshError) {
        // El refresh falló, ir a login
        this.redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        this.isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }

  private async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await this.api.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  private redirectToLogin() {
    // Limpiar tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Redirigir a login
    window.location.href = '/login';
  }

  public getApi() {
    return this.api;
  }
}

export default new HttpInterceptor().getApi();
```

---

## 2. Servicio de Autenticación (React)

```typescript
// src/services/auth.service.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expiresIn: number;
  user: User;
}

export class AuthService {
  /**
   * Login con email y contraseña
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    
    const { access_token, refresh_token, user } = response.data;
    
    // Guardar tokens
    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }

  /**
   * Registrarse
   */
  static async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        await axios.post(
          `${API_URL}/auth/logout`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Siempre limpiar tokens localmente
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Solicitar reset de contraseña
   */
  static async forgotPassword(email: string) {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, {
      email,
    });
    return response.data;
  }

  /**
   * Validar que el token actual es válido
   */
  static async validateToken(): Promise<User | null> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      const response = await axios.post(
        `${API_URL}/auth/validate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.valid) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtener token almacenado
   */
  static getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Obtener usuario almacenado
   */
  static getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Verificar si está autenticado
   */
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}
```

---

## 3. Hook de Autenticación (React)

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService, User } from '../services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Validar token al montar el componente
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const currentUser = await AuthService.validateToken();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      setIsLoading(true);
      return await AuthService.register(email, password, firstName, lastName);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    validateToken,
  };
};
```

---

## 4. Componente ProtectedRoute (React)

```typescript
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    // Redirigir a login, guardando la ubicación para volver luego
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

---

## 5. Componente de Login (React)

```typescript
// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error en inicio de sesión'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h1>Iniciar Sesión</h1>

        {error && <div className="error">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};
```

---

## 6. Context de Autenticación (React)

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de AuthProvider');
  }
  return context;
};
```

---

## 7. App Router (React)

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Profile } from './pages/Profile';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
```

---

## 8. Componente con Manejo de Sesión Expirada

```typescript
// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import api from '../services/http-interceptor';

interface Project {
  id: string;
  name: string;
  status: string;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setSessionExpired(false);
      
      // Este request va a través del interceptor
      // Si el token expira y se renueva, sucede automáticamente
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setSessionExpired(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionExpired) {
    return (
      <div className="session-expired">
        <h1>Sesión Expirada</h1>
        <p>Tu sesión ha expirado. Por favor, inicia sesión nuevamente.</p>
        <button onClick={logout}>Ir a Login</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Bienvenido, {user?.firstName}!</h1>

      <div className="user-info">
        <p>Email: {user?.email}</p>
        <p>Rol: {user?.role}</p>
      </div>

      {isLoading ? (
        <div>Cargando proyectos...</div>
      ) : (
        <div className="projects">
          <h2>Tus Proyectos</h2>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <strong>{project.name}</strong> - {project.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={loadProjects} disabled={isLoading}>
        Recargar
      </button>

      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
};
```

---

## 9. Configuración de Variables de Entorno (.env)

```env
# Frontend
REACT_APP_API_URL=http://localhost:3001/api/v1
REACT_APP_JWT_SECRET=your-secret-key
REACT_APP_ENVIRONMENT=development
```

---

## 10. Testing con React Testing Library

```typescript
// src/__tests__/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import * as AuthService from '../services/auth.service';

jest.mock('../services/auth.service');

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle login successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    };

    jest.spyOn(AuthService, 'login').mockResolvedValue({
      access_token: 'token',
      refresh_token: 'refresh',
      expiresIn: 900,
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should handle logout', async () => {
    localStorage.setItem('accessToken', 'token');
    jest.spyOn(AuthService, 'logout').mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });
});
```

---

## 11. Flujo Completo de Ejemplo

```typescript
// Ejemplo de flujo completo en un componente

import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import api from '../services/http-interceptor';

export const ExampleFlow: React.FC = () => {
  const { login, logout } = useAuthContext();

  const handleCompleteFlow = async () => {
    try {
      console.log('1. Usuario hace login...');
      const response = await login('usuario@ejemplo.com', 'contraseña');
      console.log('✅ Login exitoso:', response.user.email);

      console.log('2. Haciendo request a API protegida...');
      const projectsResponse = await api.get('/projects');
      console.log('✅ Proyectos cargados:', projectsResponse.data);

      console.log('3. Esperando 15+ minutos para que expire el token...');
      // En realidad no esperamos, simulamos:
      // localStorage.removeItem('accessToken'); // Simular expiración

      console.log('4. Haciendo otro request (automáticamente se renueva token)...');
      const usersResponse = await api.get('/users');
      console.log('✅ Usuarios cargados:', usersResponse.data);

      console.log('5. Usuario hace logout...');
      await logout();
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  return (
    <button onClick={handleCompleteFlow}>
      Ejecutar Flujo Completo
    </button>
  );
};
```

---

## 📝 Notas Importantes

### 1. El Interceptor es CRÍTICO
- Sin interceptor, el sistema NO funciona
- El interceptor debe:
  - Interceptar 401
  - Renovar token automáticamente
  - Reintentar request original
  - Redirigir a login si falla

### 2. Manejo de Múltiples Requests
- Si varios requests fallan simultáneamente, no hacer refresh N veces
- El código de arriba usa `isRefreshing` para esto
- Ver sección "Request queue" en HttpInterceptor

### 3. Almacenamiento de Tokens
```typescript
// ❌ NO hacer en producción
localStorage.setItem('accessToken', token); // Vulnerable a XSS

// ✅ HACER en producción (httpOnly cookies)
// El servidor envía cookie con flag httpOnly
// El navegador la envía automáticamente en requests
// El frontend NO puede acceder a ella via JavaScript
```

### 4. Debugging
```typescript
// Agregar logs para ver qué está pasando
console.log('Token:', localStorage.getItem('accessToken'));
console.log('Refresh:', localStorage.getItem('refreshToken'));
console.log('User:', localStorage.getItem('user'));

// Network tab del navegador
// Buscar respuestas 401 y 200 en /auth/refresh
```

---

**Última actualización:** 17 de Febrero de 2026  
**Versión:** 1.0
