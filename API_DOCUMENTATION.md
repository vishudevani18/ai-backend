# AI-app Backend API Documentation

## Overview

This document provides a detailed description of the AI-app Backend API. The API is built with NestJS and provides a RESTful interface for interacting with the application.

## Base URL

```
http://localhost:8080/api/v1
```

## Authentication

All endpoints that require authentication use JWT (JSON Web Tokens). To authenticate your requests, you need to include an `Authorization` header with the value `Bearer <your-jwt-token>`.

## Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register a new user | ❌ |
| `POST` | `/auth/login` | Log in a user and receive JWT tokens | ❌ |
| `POST` | `/auth/refresh` | Refresh an expired access token using a refresh token | ❌ |
| `POST` | `/auth/logout` | Invalidate the current session's refresh token | ✅ |
| `GET` | `/auth/profile` | Retrieve the profile of the authenticated user | ✅ |

### Admin Endpoints

Admin endpoints are protected and require an authenticated user with the 'admin' role.

#### Categories

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/admin/categories` | Get all categories (optionally filtered by industry or name) | ✅ | Admin |
| `GET` | `/admin/categories/:id` | Get a category by ID | ✅ | Admin |
| `POST` | `/admin/categories` | Create a new category | ✅ | Admin |
| `PUT` | `/admin/categories/:id` | Update a category by ID | ✅ | Admin |
| `PATCH` | `/admin/categories/:id/soft-delete` | Soft delete a category by ID | ✅ | Admin |

#### Industries

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/admin/industries` | Get all industries | ✅ | Admin |
| `GET` | `/admin/industries/:id` | Get an industry by ID | ✅ | Admin |
| `POST` | `/admin/industries` | Create a new industry | ✅ | Admin |
| `PUT` | `/admin/industries/:id` | Update an industry by ID | ✅ | Admin |
| `PATCH` | `/admin/industries/:id/soft-delete` | Soft delete an industry by ID | ✅ | Admin |

#### Product Backgrounds

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/admin/product-backgrounds` | Get all product backgrounds (optionally filter by product theme or search) | ✅ | Admin |
| `GET` | `/admin/product-backgrounds/:id` | Get a product background by ID | ✅ | Admin |
| `POST` | `/admin/product-backgrounds` | Create a new product background | ✅ | Admin |
| `PUT` | `/admin/product-backgrounds/:id` | Update a product background | ✅ | Admin |
| `PATCH` | `/admin/product-backgrounds/:id/soft-delete` | Soft delete a product background | ✅ | Admin |

#### Product Poses

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/admin/poses` | Get all product poses (filter by productTypeId or search by name) | ✅ | Admin |
| `GET` | `/admin/poses/:id` | Get a product pose by ID | ✅ | Admin |
| `POST` | `/admin/poses` | Create a new product pose | ✅ | Admin |
| `PUT` | `/admin/poses/:id` | Update a product pose by ID | ✅ | Admin |
| `PATCH` | `/admin/poses/:id/soft-delete` | Soft delete a product pose by ID | ✅ | Admin |

#### Product Themes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/admin/product-themes` | Get all product themes (optionally search by name) | ✅ | Admin |
| `GET` | `/admin/product-themes/:id` | Get product theme by ID | ✅ | Admin |
| `POST` | `/admin/product-themes` | Create a new product theme | ✅ | Admin |
| `PUT` | `/admin/product-themes/:id` | Update product theme by ID | ✅ | Admin |
| `PATCH` | `/admin/product-themes/:id/soft-delete` | Soft delete product theme by ID | ✅ | Admin |

### WebApp Endpoints

WebApp endpoints provide data for the public-facing web application.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/webapp/industries-tree` | Get all industries with categories, product types, themes, and backgrounds (Public) | ❌ |

### Monitoring & Health Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Application health check | ❌ |
