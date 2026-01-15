# Frontend v1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the AllesGut frontend from mock data to a fully functional community app with real API integration, authentication, and user interactions.

**Architecture:** React SPA with centralized API service layer, React Context for auth state, and component-level state for UI. All API calls go through a configured axios instance with automatic token handling.

**Tech Stack:** React 18, React Router 6, Axios, Tailwind CSS, Capacitor (Android), Jest + React Testing Library

---

## Phase 1: Foundation

### Task 1: Add Testing Infrastructure

**Files:**
- Create: `src/setupTests.js`
- Create: `jest.config.js`
- Modify: `package.json`

**Step 1: Install testing dependencies**

Run:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @babel/preset-typescript identity-obj-proxy
```

**Step 2: Create Jest config**

Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-loader'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@capacitor)/)'
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.jsx'
  ]
};
```

**Step 3: Create setup file**

Create `src/setupTests.js`:
```javascript
import '@testing-library/jest-dom';
```

**Step 4: Create file mock**

Create `__mocks__/fileMock.js`:
```javascript
module.exports = 'test-file-stub';
```

**Step 5: Add test script to package.json**

Modify `package.json` scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Step 6: Run tests to verify setup**

Run: `npm test`
Expected: "No tests found" (this is correct - no tests yet)

**Step 7: Commit**

```bash
git add -A && git commit -m "chore: add Jest testing infrastructure

- Configure Jest with jsdom environment
- Add React Testing Library
- Set up CSS and file mocks

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create API Configuration Service

**Files:**
- Create: `src/services/api.js`
- Create: `src/__tests__/services/api.test.js`

**Step 1: Write the failing test**

Create `src/__tests__/services/api.test.js`:
```javascript
import api, { setAuthToken, clearAuthToken } from '../../services/api';

describe('API Service', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  test('api has correct base URL', () => {
    expect(api.defaults.baseURL).toBe('https://api.allesgut.com/v1');
  });

  test('setAuthToken adds Authorization header', () => {
    setAuthToken('test-token-123');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token-123');
  });

  test('clearAuthToken removes Authorization header', () => {
    setAuthToken('test-token-123');
    clearAuthToken();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../../services/api'"

**Step 3: Write minimal implementation**

Create `src/services/api.js`:
```javascript
import axios from 'axios';

const API_BASE_URL = 'https://api.allesgut.com/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - will be handled by auth context
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

export default api;
```

**Step 4: Install axios**

Run: `npm install axios`

**Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add API configuration service

- Create axios instance with base URL
- Add token management functions
- Add request/response interceptors
- Handle 401 unauthorized errors

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create Auth Service

**Files:**
- Create: `src/services/auth.js`
- Create: `src/__tests__/services/auth.test.js`

**Step 1: Write the failing test**

Create `src/__tests__/services/auth.test.js`:
```javascript
import { authService } from '../../services/auth';

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
  setAuthToken: jest.fn(),
  clearAuthToken: jest.fn(),
}));

import api, { setAuthToken, clearAuthToken } from '../../services/api';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('sendSmsCode', () => {
    test('calls correct endpoint with phone number', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await authService.sendSmsCode('13800138000');

      expect(api.post).toHaveBeenCalledWith('/auth/sms/send', {
        phone: '13800138000'
      });
    });
  });

  describe('verifySmsCode', () => {
    test('stores token and user on successful verification', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'jwt-token-123',
            user: { id: 1, nickname: 'Test User' }
          }
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await authService.verifySmsCode('13800138000', '123456');

      expect(api.post).toHaveBeenCalledWith('/auth/sms/verify', {
        phone: '13800138000',
        code: '123456'
      });
      expect(setAuthToken).toHaveBeenCalledWith('jwt-token-123');
      expect(localStorage.getItem('auth_token')).toBe('jwt-token-123');
      expect(result.user).toEqual({ id: 1, nickname: 'Test User' });
    });
  });

  describe('logout', () => {
    test('clears token and localStorage', async () => {
      localStorage.setItem('auth_token', 'old-token');
      api.post.mockResolvedValue({ data: { success: true } });

      await authService.logout();

      expect(clearAuthToken).toHaveBeenCalled();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('restoreSession', () => {
    test('restores token from localStorage if exists', async () => {
      localStorage.setItem('auth_token', 'stored-token');
      api.get.mockResolvedValue({
        data: { success: true, data: { id: 1, nickname: 'User' } }
      });

      const user = await authService.restoreSession();

      expect(setAuthToken).toHaveBeenCalledWith('stored-token');
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(user).toEqual({ id: 1, nickname: 'User' });
    });

    test('returns null if no stored token', async () => {
      const user = await authService.restoreSession();
      expect(user).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../../services/auth'"

**Step 3: Write minimal implementation**

Create `src/services/auth.js`:
```javascript
import api, { setAuthToken, clearAuthToken } from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
  async sendSmsCode(phone) {
    const response = await api.post('/auth/sms/send', { phone });
    return response.data;
  },

  async verifySmsCode(phone, code) {
    const response = await api.post('/auth/sms/verify', { phone, code });

    if (response.data.success) {
      const { token, user } = response.data.data;

      // Store token
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setAuthToken(token);

      return { token, user };
    }

    throw new Error(response.data.message || 'Verification failed');
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout API errors
      console.warn('Logout API error:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      clearAuthToken();
    }
  },

  async restoreSession() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return null;
    }

    try {
      setAuthToken(token);
      const response = await api.get('/auth/me');

      if (response.data.success) {
        const user = response.data.data;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }

      throw new Error('Invalid session');
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      clearAuthToken();
      return null;
    }
  },

  getStoredUser() {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all auth tests pass)

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add auth service

- SMS code send/verify
- Token storage in localStorage
- Session restore on app start
- Logout with cleanup

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Create Auth Context

**Files:**
- Create: `src/contexts/AuthContext.jsx`
- Create: `src/__tests__/contexts/AuthContext.test.jsx`

**Step 1: Write the failing test**

Create `src/__tests__/contexts/AuthContext.test.jsx`:
```javascript
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

// Mock auth service
jest.mock('../../services/auth', () => ({
  authService: {
    restoreSession: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(),
    getStoredUser: jest.fn(),
  }
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (isAuthenticated) return <div>Welcome, {user.nickname}</div>;
  return <div>Please login</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    authService.restoreSession.mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows user when authenticated', async () => {
    authService.restoreSession.mockResolvedValue({ id: 1, nickname: 'TestUser' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
    });
  });

  test('shows login prompt when not authenticated', async () => {
    authService.restoreSession.mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Please login')).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../../contexts/AuthContext'"

**Step 3: Write minimal implementation**

Create `src/contexts/AuthContext.jsx`:
```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const restoredUser = await authService.restoreSession();
        setUser(restoredUser);
      } catch (error) {
        console.error('Failed to restore session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen for unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      authService.logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add AuthContext for global auth state

- Restore session on app mount
- Provide login/logout/updateUser functions
- Handle unauthorized events
- Loading state during session restore

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Create Login Page

**Files:**
- Create: `src/pages/Login/index.jsx`
- Modify: `src/App.jsx`

**Step 1: Create Login page component**

Create `src/pages/Login/index.jsx`:
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validatePhone = (phone) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.sendSmsCode(phone);
      setStep('code');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || '发送验证码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { user } = await authService.verifySmsCode(phone, code);
      login(user);
      // Navigation will happen via useEffect above
    } catch (err) {
      setError(err.response?.data?.message || '验证码错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    if (countdown === 0) {
      handleSendCode();
    }
  };

  const handleBack = () => {
    setStep('phone');
    setCode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          {step === 'code' ? (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          ) : (
            <div className="w-8" />
          )}
          <span className="font-medium text-gray-900">
            {step === 'phone' ? '手机登录' : '输入验证码'}
          </span>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 p-6">
        {/* Logo/Title */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AllesGut</h1>
          <p className="text-gray-500">特需儿童家长社区</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          /* Phone input step */
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">手机号码</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号码"
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={11}
              />
            </div>

            <button
              onClick={handleSendCode}
              disabled={isLoading || phone.length !== 11}
              className={`w-full py-4 rounded-xl text-lg font-medium transition-colors ${
                isLoading || phone.length !== 11
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isLoading ? '发送中...' : '获取验证码'}
            </button>
          </div>
        ) : (
          /* Code input step */
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-gray-600">验证码已发送至</p>
              <p className="text-gray-900 font-medium">{phone}</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入6位验证码"
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className={`w-full py-4 rounded-xl text-lg font-medium transition-colors ${
                isLoading || code.length !== 6
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isLoading ? '验证中...' : '登录'}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={countdown > 0}
                className={`text-sm ${
                  countdown > 0 ? 'text-gray-400' : 'text-primary-500'
                }`}
              >
                {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
              </button>
            </div>
          </div>
        )}

        {/* Terms */}
        <p className="text-center text-gray-400 text-xs mt-8">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
};

export default Login;
```

**Step 2: Run build to verify no syntax errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Login page with SMS verification

- Phone number input with validation
- SMS code verification
- Countdown timer for resend
- Redirect after successful login

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Add Auth Provider and Protected Routes to App

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.jsx`

**Step 1: Update index.jsx to wrap with AuthProvider**

Modify `src/index.jsx`:
```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './styles/index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

**Step 2: Update App.jsx with Login route and protected routes**

Modify `src/App.jsx`:
```javascript
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Mall from './pages/Mall';
import Profile from './pages/Profile';
import Publish from './pages/Publish';
import Login from './pages/Login';

// Loading spinner component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <i className="fas fa-spinner fa-spin text-3xl text-primary-500 mb-4"></i>
      <p className="text-gray-500">加载中...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="mall" element={<Mall />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="publish"
          element={
            <ProtectedRoute>
              <Publish />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
```

**Step 3: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: integrate auth into app with protected routes

- Wrap app with AuthProvider
- Add loading screen during auth check
- Protect Profile and Publish routes
- Add Login route
- Redirect unauthenticated users to login

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Core API Integration

### Task 7: Create Posts Service

**Files:**
- Create: `src/services/posts.js`
- Create: `src/__tests__/services/posts.test.js`

**Step 1: Write the failing test**

Create `src/__tests__/services/posts.test.js`:
```javascript
import { postsService } from '../../services/posts';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Posts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    test('fetches posts with default params', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await postsService.getPosts();

      expect(api.get).toHaveBeenCalledWith('/posts', {
        params: { page: 1, limit: 20, feed_type: 'recommended' }
      });
    });

    test('fetches posts with custom params', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await postsService.getPosts({ page: 2, feed_type: 'following', tag: '自闭症' });

      expect(api.get).toHaveBeenCalledWith('/posts', {
        params: { page: 2, limit: 20, feed_type: 'following', tag: '自闭症' }
      });
    });
  });

  describe('getPost', () => {
    test('fetches single post by id', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { id: 1, title: 'Test' } }
      });

      const result = await postsService.getPost(1);

      expect(api.get).toHaveBeenCalledWith('/posts/1');
      expect(result).toEqual({ id: 1, title: 'Test' });
    });
  });

  describe('createPost', () => {
    test('creates post with form data', async () => {
      api.post.mockResolvedValue({
        data: { success: true, data: { id: 1 } }
      });

      const postData = { title: 'Test', content: 'Content', tags: ['tag1'] };
      await postsService.createPost(postData);

      expect(api.post).toHaveBeenCalledWith('/posts', postData);
    });
  });

  describe('likePost', () => {
    test('likes a post', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await postsService.likePost(1);

      expect(api.post).toHaveBeenCalledWith('/posts/1/like');
    });
  });

  describe('unlikePost', () => {
    test('unlikes a post', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      await postsService.unlikePost(1);

      expect(api.delete).toHaveBeenCalledWith('/posts/1/like');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/services/posts.js`:
```javascript
import api from './api';

export const postsService = {
  async getPosts({ page = 1, limit = 20, feed_type = 'recommended', tag, search } = {}) {
    const params = { page, limit, feed_type };
    if (tag) params.tag = tag;
    if (search) params.search = search;

    const response = await api.get('/posts', { params });
    return response.data.data;
  },

  async getPost(id) {
    const response = await api.get(`/posts/${id}`);
    return response.data.data;
  },

  async createPost(data) {
    const response = await api.post('/posts', data);
    return response.data.data;
  },

  async updatePost(id, data) {
    const response = await api.put(`/posts/${id}`, data);
    return response.data.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  async likePost(id) {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  },

  async unlikePost(id) {
    const response = await api.delete(`/posts/${id}/like`);
    return response.data;
  },

  async favoritePost(id) {
    const response = await api.post(`/posts/${id}/favorite`);
    return response.data;
  },

  async unfavoritePost(id) {
    const response = await api.delete(`/posts/${id}/favorite`);
    return response.data;
  },

  async getTags() {
    const response = await api.get('/tags');
    return response.data.data;
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add posts service

- CRUD operations for posts
- Like/unlike, favorite/unfavorite
- Pagination and filtering support
- Tags fetching

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Create Comments Service

**Files:**
- Create: `src/services/comments.js`
- Create: `src/__tests__/services/comments.test.js`

**Step 1: Write the failing test**

Create `src/__tests__/services/comments.test.js`:
```javascript
import { commentsService } from '../../services/comments';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Comments Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getComments', () => {
    test('fetches comments for a post', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { comments: [], total: 0 } }
      });

      await commentsService.getComments(1);

      expect(api.get).toHaveBeenCalledWith('/posts/1/comments', {
        params: { page: 1, limit: 20 }
      });
    });
  });

  describe('addComment', () => {
    test('adds a comment to a post', async () => {
      api.post.mockResolvedValue({
        data: { success: true, data: { id: 1, content: 'Test' } }
      });

      await commentsService.addComment(1, { content: 'Test comment' });

      expect(api.post).toHaveBeenCalledWith('/posts/1/comments', {
        content: 'Test comment'
      });
    });

    test('adds a reply with parent_id', async () => {
      api.post.mockResolvedValue({
        data: { success: true, data: { id: 2 } }
      });

      await commentsService.addComment(1, {
        content: 'Reply',
        parent_id: 5,
        mentions: [3]
      });

      expect(api.post).toHaveBeenCalledWith('/posts/1/comments', {
        content: 'Reply',
        parent_id: 5,
        mentions: [3]
      });
    });
  });

  describe('likeComment', () => {
    test('likes a comment', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await commentsService.likeComment(1);

      expect(api.post).toHaveBeenCalledWith('/comments/1/like');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/services/comments.js`:
```javascript
import api from './api';

export const commentsService = {
  async getComments(postId, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async addComment(postId, { content, parent_id, mentions }) {
    const data = { content };
    if (parent_id) data.parent_id = parent_id;
    if (mentions?.length) data.mentions = mentions;

    const response = await api.post(`/posts/${postId}/comments`, data);
    return response.data.data;
  },

  async deleteComment(commentId) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  async likeComment(commentId) {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  async unlikeComment(commentId) {
    const response = await api.delete(`/comments/${commentId}/like`);
    return response.data;
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add comments service

- Get comments with pagination
- Add comments with reply and mention support
- Like/unlike comments
- Delete comments

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Create Users Service

**Files:**
- Create: `src/services/users.js`
- Create: `src/__tests__/services/users.test.js`

**Step 1: Write the failing test**

Create `src/__tests__/services/users.test.js`:
```javascript
import { usersService } from '../../services/users';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Users Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    test('fetches user by id', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { id: 1, nickname: 'Test' } }
      });

      const result = await usersService.getUser(1);

      expect(api.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual({ id: 1, nickname: 'Test' });
    });
  });

  describe('updateProfile', () => {
    test('updates current user profile', async () => {
      api.put.mockResolvedValue({
        data: { success: true, data: { id: 1, nickname: 'Updated' } }
      });

      await usersService.updateProfile({ nickname: 'Updated' });

      expect(api.put).toHaveBeenCalledWith('/users/me', { nickname: 'Updated' });
    });
  });

  describe('followUser', () => {
    test('follows a user', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await usersService.followUser(2);

      expect(api.post).toHaveBeenCalledWith('/users/2/follow');
    });
  });

  describe('unfollowUser', () => {
    test('unfollows a user', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      await usersService.unfollowUser(2);

      expect(api.delete).toHaveBeenCalledWith('/users/2/follow');
    });
  });

  describe('getUserPosts', () => {
    test('fetches posts by user', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await usersService.getUserPosts(1);

      expect(api.get).toHaveBeenCalledWith('/users/1/posts', {
        params: { page: 1, limit: 20 }
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/services/users.js`:
```javascript
import api from './api';

export const usersService = {
  async getUser(id) {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async updateProfile(data) {
    const response = await api.put('/users/me', data);
    return response.data.data;
  },

  async followUser(id) {
    const response = await api.post(`/users/${id}/follow`);
    return response.data;
  },

  async unfollowUser(id) {
    const response = await api.delete(`/users/${id}/follow`);
    return response.data;
  },

  async getFollowers(id, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/users/${id}/followers`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getFollowing(id, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/users/${id}/following`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getUserPosts(id, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/users/${id}/posts`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getMyFavorites({ page = 1, limit = 20 } = {}) {
    const response = await api.get('/users/me/favorites', {
      params: { page, limit }
    });
    return response.data.data;
  },

  async blockUser(id) {
    const response = await api.post(`/users/${id}/block`);
    return response.data;
  },

  async unblockUser(id) {
    const response = await api.delete(`/users/${id}/block`);
    return response.data;
  },

  async searchUsers(query, { page = 1, limit = 20 } = {}) {
    const response = await api.get('/users/search', {
      params: { q: query, page, limit }
    });
    return response.data.data;
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add users service

- Get user profile
- Update own profile
- Follow/unfollow users
- Get followers/following lists
- Get user posts and favorites
- Block/unblock users
- Search users

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Create Upload Service

**Files:**
- Create: `src/services/upload.js`
- Create: `src/__tests__/services/upload.test.js`

**Step 1: Write the failing test**

Create `src/__tests__/services/upload.test.js`:
```javascript
import { uploadService } from '../../services/upload';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Upload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    test('uploads image as FormData', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      api.post.mockResolvedValue({
        data: { success: true, data: { url: 'https://example.com/image.jpg' } }
      });

      const result = await uploadService.uploadImage(mockFile);

      expect(api.post).toHaveBeenCalledWith(
        '/upload/image',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toBe('https://example.com/image.jpg');
    });
  });

  describe('uploadVideo', () => {
    test('uploads video and returns upload id', async () => {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      api.post.mockResolvedValue({
        data: { success: true, data: { upload_id: 'upload-123', url: 'https://example.com/video.mp4' } }
      });

      const result = await uploadService.uploadVideo(mockFile);

      expect(result).toEqual({
        upload_id: 'upload-123',
        url: 'https://example.com/video.mp4'
      });
    });
  });

  describe('getVideoStatus', () => {
    test('checks video processing status', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { status: 'completed', url: 'https://example.com/processed.mp4' } }
      });

      const result = await uploadService.getVideoStatus('upload-123');

      expect(api.get).toHaveBeenCalledWith('/upload/video/upload-123/status');
      expect(result.status).toBe('completed');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/services/upload.js`:
```javascript
import api from './api';

export const uploadService = {
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data.data.url;
  },

  async uploadImages(files) {
    const urls = await Promise.all(
      files.map(file => this.uploadImage(file))
    );
    return urls;
  },

  async uploadVideo(file, onProgress) {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (e) => {
        const progress = Math.round((e.loaded * 100) / e.total);
        onProgress(progress);
      } : undefined
    });

    return response.data.data;
  },

  async getVideoStatus(uploadId) {
    const response = await api.get(`/upload/video/${uploadId}/status`);
    return response.data.data;
  },

  async waitForVideoProcessing(uploadId, { maxAttempts = 60, interval = 2000 } = {}) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVideoStatus(uploadId);

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Video processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Video processing timeout');
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add upload service

- Upload single/multiple images
- Upload video with progress callback
- Check video processing status
- Wait for video processing completion

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Create Notifications Service

**Files:**
- Create: `src/services/notifications.js`
- Create: `src/__tests__/services/notifications.test.js`

**Step 1: Write the failing test**

Create `src/__tests__/services/notifications.test.js`:
```javascript
import { notificationsService } from '../../services/notifications';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Notifications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    test('fetches notifications with pagination', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { notifications: [], total: 0 } }
      });

      await notificationsService.getNotifications();

      expect(api.get).toHaveBeenCalledWith('/notifications', {
        params: { page: 1, limit: 20 }
      });
    });
  });

  describe('getUnreadCount', () => {
    test('fetches unread count', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { count: 5 } }
      });

      const result = await notificationsService.getUnreadCount();

      expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    test('marks single notification as read', async () => {
      api.put.mockResolvedValue({ data: { success: true } });

      await notificationsService.markAsRead(1);

      expect(api.put).toHaveBeenCalledWith('/notifications/1/read');
    });
  });

  describe('markAllAsRead', () => {
    test('marks all notifications as read', async () => {
      api.put.mockResolvedValue({ data: { success: true } });

      await notificationsService.markAllAsRead();

      expect(api.put).toHaveBeenCalledWith('/notifications/read-all');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/services/notifications.js`:
```javascript
import api from './api';

export const notificationsService = {
  async getNotifications({ page = 1, limit = 20 } = {}) {
    const response = await api.get('/notifications', {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.count;
  },

  async markAsRead(id) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add notifications service

- Get notifications with pagination
- Get unread count
- Mark single/all as read

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: UI Integration (Continued in Part 2)

The remaining tasks cover integrating these services into UI components:

- Task 12: Update Home page to use posts service with feed tabs
- Task 13: Update PostDetail to use real like/favorite/comment APIs
- Task 14: Update PostDetail comments section with real data
- Task 15: Update Publish page with real upload and post creation
- Task 16: Update Profile page with real user data
- Task 17: Add Edit Profile page
- Task 18: Add Notifications page
- Task 19: Add follow functionality to PostDetail and Profile
- Task 20: Add search functionality
- Task 21: Fetch tags from API

---

## Summary

**Phase 1 (Tasks 1-6):** Foundation - Testing, API config, Auth service/context, Login page, Protected routes

**Phase 2 (Tasks 7-11):** Services - Posts, Comments, Users, Upload, Notifications

**Phase 3 (Tasks 12-21):** UI Integration - Connect all components to real APIs

Each task follows TDD: write test → verify fail → implement → verify pass → commit.
