# Frontend Authentication Integration Guide

## Overview

This guide provides complete implementation details for integrating authentication in your frontend application. The API follows **OAuth 2.0 best practices** with access tokens in headers and refresh tokens in request body.

---

## 🔑 Token Types

### 1. **Access Token** (Bearer Token)
- **Purpose**: Authenticate API requests to protected endpoints
- **Lifetime**: Short-lived (10 minutes default)
- **Storage**: Store securely (localStorage/sessionStorage or httpOnly cookies)
- **Usage**: Include in `Authorization` header for all protected API calls

### 2. **Refresh Token**
- **Purpose**: Obtain new access tokens when they expire
- **Lifetime**: Long-lived (7 days default)
- **Storage**: Store securely (preferably httpOnly cookies, or localStorage)
- **Usage**: Send in request body for refresh/logout endpoints

---

## 📡 API Endpoints

### Base URL
```
http://localhost:8080/api/v1/webapp
```

### Authentication Endpoints

| Endpoint | Method | Auth Required | Token Type |
|----------|--------|---------------|------------|
| `/signup/send-otp` | POST | ❌ | None |
| `/signup/verify-otp` | POST | ❌ | None |
| `/signup/complete` | POST | ❌ | None |
| `/login` | POST | ❌ | None |
| `/refresh` | POST | ❌ | Refresh (in body) |
| `/logout` | POST | ❌ | Refresh (in body) |
| `/forgot-password/send-otp` | POST | ❌ | None |
| `/forgot-password/verify-otp` | POST | ❌ | None |
| `/reset-password` | POST | ❌ | None |

### Protected Endpoints (Require Access Token)

| Endpoint | Method | Token Type |
|----------|--------|------------|
| `/industries-tree` | GET | Bearer (Access) |
| `/systemdata` | GET | Bearer (Access) |
| `/generate-image` | POST | Bearer (Access) |
| `/generate-bulk-image` | POST | Bearer (Access) |
| `/profile` | GET | Bearer (Access) |
| `/profile` | PATCH | Bearer (Access) |
| `/profile/change-password` | PATCH | Bearer (Access) |

---

## 🚀 Implementation Guide

### 1. Login

**Endpoint**: `POST /api/v1/webapp/login`

**Request**:
```javascript
const response = await fetch('http://localhost:8080/api/v1/webapp/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    emailOrPhone: 'user@example.com', // or '+919876543210' or '9876543210'
    password: 'StrongPass@123'
  })
});

const data = await response.json();

if (data.success) {
  // Store tokens securely
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  
  // Store user data
  localStorage.setItem('user', JSON.stringify(data.data.user));
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "role": "user",
      "status": "active"
    }
  },
  "message": "User logged in successfully"
}
```

---

### 2. Making Authenticated API Calls

**Always use Bearer token in Authorization header:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:8080/api/v1/webapp/industries-tree', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,  // ✅ Access token
    'Content-Type': 'application/json'
  }
});

if (response.status === 401) {
  // Access token expired, refresh it
  await refreshAccessToken();
  // Retry the request
}
```

---

### 3. Refresh Access Token

**Endpoint**: `POST /api/v1/webapp/refresh`

**⚠️ IMPORTANT**: Refresh token is sent in **request body**, NOT in header!

**Request**:
```javascript
const refreshToken = localStorage.getItem('refreshToken');

const response = await fetch('http://localhost:8080/api/v1/webapp/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // ❌ DO NOT send refresh token in Authorization header
  },
  body: JSON.stringify({
    refreshToken: refreshToken  // ✅ Send in body
  })
});

const data = await response.json();

if (data.success) {
  // Update tokens
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
} else {
  // Refresh token expired, redirect to login
  handleLogout();
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token...",
    "user": { ... }
  },
  "message": "Token refreshed successfully"
}
```

---

### 4. Logout

**Endpoint**: `POST /api/v1/webapp/logout`

**⚠️ IMPORTANT**: Refresh token is sent in **request body**, NOT in header!

**Request**:
```javascript
const refreshToken = localStorage.getItem('refreshToken');

try {
  const response = await fetch('http://localhost:8080/api/v1/webapp/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // ❌ DO NOT send refresh token in Authorization header
    },
    body: JSON.stringify({
      refreshToken: refreshToken  // ✅ Send in body
    })
  });

  // Clear tokens regardless of response
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Redirect to login
  window.location.href = '/login';
} catch (error) {
  // Even if logout fails, clear tokens and redirect
  localStorage.clear();
  window.location.href = '/login';
}
```

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "User logged out successfully"
}
```

---

## 🔄 Automatic Token Refresh Interceptor

Implement an HTTP interceptor to automatically refresh tokens when access token expires:

### Axios Example

```javascript
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1/webapp',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add access token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Refresh the token
        const response = await axios.post(
          'http://localhost:8080/api/v1/webapp/refresh',
          { refreshToken },  // ✅ In body, not header
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Update tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Fetch API Example

```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = localStorage.getItem('accessToken');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add access token to header
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, config);

    // Handle 401 - Token expired
    if (response.status === 401 && !options._retry) {
      options._retry = true;
      
      // Try to refresh token
      const refreshed = await this.refreshToken();
      
      if (refreshed) {
        // Retry original request with new token
        const newAccessToken = localStorage.getItem('accessToken');
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(url, config);
      } else {
        // Refresh failed, redirect to login
        this.logout();
        throw new Error('Session expired');
      }
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),  // ✅ In body
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call logout endpoint
    if (refreshToken) {
      fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),  // ✅ In body
      }).catch(() => {}); // Ignore errors
    }

    // Clear storage
    localStorage.clear();
    window.location.href = '/login';
  }

  // Convenience methods
  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

// Usage
const api = new ApiClient('http://localhost:8080/api/v1/webapp');

// Make authenticated request
const response = await api.get('/industries-tree');
const data = await response.json();
```

---

## 📋 Complete Example: React Hook

```javascript
import { useState, useEffect, useCallback } from 'react';

const useAuth = () => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const login = async (emailOrPhone, password) => {
    const response = await fetch('http://localhost:8080/api/v1/webapp/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password }),
    });

    const data = await response.json();

    if (data.success) {
      setAccessToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      setUser(data.data.user);
      
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      return true;
    }
    
    throw new Error(data.message || 'Login failed');
  };

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false;

    try {
      const response = await fetch('http://localhost:8080/api/v1/webapp/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),  // ✅ In body
      });

      const data = await response.json();

      if (data.success) {
        setAccessToken(data.data.accessToken);
        setRefreshToken(data.data.refreshToken);
        
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }, [refreshToken]);

  const logout = async () => {
    if (refreshToken) {
      try {
        await fetch('http://localhost:8080/api/v1/webapp/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),  // ✅ In body
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    
    localStorage.clear();
    window.location.href = '/login';
  };

  const apiCall = useCallback(async (endpoint, options = {}) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`http://localhost:8080/api/v1/webapp${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,  // ✅ Access token in header
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        const newToken = localStorage.getItem('accessToken');
        return fetch(`http://localhost:8080/api/v1/webapp${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      } else {
        // Refresh failed, logout
        logout();
        throw new Error('Session expired');
      }
    }

    return response;
  }, [accessToken, refreshAccessToken, logout]);

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
    refreshAccessToken,
    apiCall,
  };
};

export default useAuth;
```

---

## ⚠️ Important Security Notes

1. **Never send refresh token in Authorization header** - Always use request body
2. **Store tokens securely** - Consider httpOnly cookies for production
3. **Handle token expiration** - Implement automatic refresh logic
4. **Clear tokens on logout** - Always clear storage even if API call fails
5. **Validate tokens** - Check expiration before making requests
6. **HTTPS in production** - Always use HTTPS to protect tokens in transit

---

## 🔍 Error Handling

### Common Error Responses

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": true
}
```
→ Access token expired or invalid → Refresh token

**401 Unauthorized (Refresh endpoint)**:
```json
{
  "success": false,
  "message": "Invalid refresh token",
  "error": true
}
```
→ Refresh token expired or invalid → Redirect to login

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [...],
  "error": true
}
```
→ Invalid request data → Show validation errors

---

## 📝 Summary

### ✅ DO:
- Use `Bearer <accessToken>` in Authorization header for API calls
- Send refresh token in **request body** for `/refresh` and `/logout`
- Implement automatic token refresh on 401 errors
- Clear tokens on logout regardless of API response
- Store tokens securely

### ❌ DON'T:
- Don't send refresh token in Authorization header
- Don't use access token for refresh/logout endpoints
- Don't store tokens in plain text or insecure storage
- Don't ignore 401 errors - always handle token refresh

---

## 🧪 Testing Examples

### cURL Examples

**Login**:
```bash
curl -X POST http://localhost:8080/api/v1/webapp/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"user@example.com","password":"StrongPass@123"}'
```

**Refresh Token**:
```bash
curl -X POST http://localhost:8080/api/v1/webapp/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token_here"}'
```

**Logout**:
```bash
curl -X POST http://localhost:8080/api/v1/webapp/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token_here"}'
```

**Authenticated API Call**:
```bash
curl -X GET http://localhost:8080/api/v1/webapp/industries-tree \
  -H "Authorization: Bearer your_access_token_here"
```

---

## 📞 Support

If you encounter any issues, check:
1. Token format (Bearer for access, body for refresh)
2. Token expiration (refresh when 401)
3. Request body format (JSON stringified)
4. CORS configuration (if making requests from browser)

For questions or issues, contact the backend team.

