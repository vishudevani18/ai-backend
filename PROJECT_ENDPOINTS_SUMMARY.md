# AI-app Backend - Complete Endpoints & Functionality Summary

## 📋 Project Overview

This is a **NestJS-based SaaS backend** for an AI-powered application that manages:
- User authentication with OTP-based signup and password reset
- Product catalog system (Industries → Categories → Product Types → Poses)
- Product themes and backgrounds
- AI face management
- Admin user management
- Legal documents (Privacy Policy, Terms of Service)

**Base URL:** `http://localhost:8080/api/v1`

---

## 🔐 Authentication Endpoints (`/webapp`)

All authentication endpoints are **public** (no auth required) except logout.

### Signup Flow (OTP-based)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `POST` | `/webapp/signup/send-otp` | Send OTP to phone for signup | 5/15min | ❌ |
| `POST` | `/webapp/signup/verify-otp` | Verify OTP and get session token | 10/15min | ❌ |
| `POST` | `/webapp/signup/complete` | Complete registration with user details | 5/15min | ❌ |

**Flow:**
1. User sends phone number → receives OTP via WhatsApp
2. User verifies OTP → receives session token
3. User completes registration with session token + user details → receives JWT tokens

### Login

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `POST` | `/webapp/login` | Login with phone + password | 10/15min | ❌ |
| `POST` | `/webapp/admin/login` | Super admin login (email + password) | 10/15min | ❌ |

### Token Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/webapp/refresh` | Refresh access token using refresh token | Refresh Token |
| `POST` | `/webapp/logout` | Invalidate refresh token | Refresh Token |

### Password Reset Flow (OTP-based)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `POST` | `/webapp/forgot-password/send-otp` | Send OTP for password reset | 5/10min | ❌ |
| `POST` | `/webapp/forgot-password/verify-otp` | Verify OTP and get session token | 10/10min | ❌ |
| `POST` | `/webapp/forgot-password/resend-otp` | Resend OTP (signup or reset) | 3/10min | ❌ |
| `POST` | `/webapp/reset-password` | Reset password with session token | 5/10min | ❌ |

**Flow:**
1. User sends phone number → receives OTP
2. User verifies OTP → receives session token
3. User resets password with session token + new password

---

## 👤 User Profile Endpoints (`/webapp/profile`)

All endpoints require **USER role** authentication.

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| `GET` | `/webapp/profile` | Get current user profile | ✅ | USER |
| `PATCH` | `/webapp/profile` | Update current user profile | ✅ | USER |
| `PATCH` | `/webapp/profile/change-password` | Change user password | ✅ | USER |

---

## 🌐 Public WebApp Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/webapp/industries-tree` | Get complete hierarchy: Industries → Categories → Product Types → Themes → Backgrounds | ❌ |
| `GET` | `/webapp/legal/privacy-policy` | Get privacy policy (public) | ❌ |
| `GET` | `/webapp/legal/terms-of-service` | Get terms of service (public) | ❌ |

---

## 🔧 Admin Endpoints

All admin endpoints require **ADMIN** or **SUPER_ADMIN** role. Base path: `/admin`

### Categories (`/admin/categories`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/categories` | Get all categories (paginated) | Filter: `industryId`, `search` (name)<br>Sort: `createdAt`, `updatedAt`, `name`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/categories/:id` | Get category by ID | - |
| `POST` | `/admin/categories` | Create category | Multipart form-data with optional `image` file |
| `PUT` | `/admin/categories/:id` | Update category | Multipart form-data with optional `image` file |
| `PATCH` | `/admin/categories/:id/soft-delete` | Soft delete category | - |
| `DELETE` | `/admin/categories/:id` | Hard delete category | Permanent deletion |

### Industries (`/admin/industries`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/industries` | Get all industries (paginated) | Filter: `search` (name)<br>Sort: `createdAt`, `updatedAt`, `name`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/industries/:id` | Get industry by ID | - |
| `POST` | `/admin/industries` | Create industry | - |
| `PUT` | `/admin/industries/:id` | Update industry | - |
| `PATCH` | `/admin/industries/:id/soft-delete` | Soft delete industry | - |
| `DELETE` | `/admin/industries/:id` | Hard delete industry | Permanent deletion |

### Product Types (`/admin/product-types`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/product-types` | Get all product types (paginated) | Filter: `categoryId`, `search` (name)<br>Sort: `createdAt`, `updatedAt`, `name`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/product-types/:id` | Get product type by ID | - |
| `POST` | `/admin/product-types` | Create product type | - |
| `PUT` | `/admin/product-types/:id` | Update product type | - |
| `PATCH` | `/admin/product-types/:id/soft-delete` | Soft delete product type | - |
| `DELETE` | `/admin/product-types/:id` | Hard delete product type | Permanent deletion |

### Product Poses (`/admin/poses`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/poses` | Get all product poses (paginated) | Filter: `productTypeId`, `search` (name)<br>Sort: `createdAt`, `updatedAt`, `name`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/poses/:id` | Get product pose by ID | - |
| `POST` | `/admin/poses` | Create product pose | Multipart form-data with required `image` file |
| `PUT` | `/admin/poses/:id` | Update product pose | Multipart form-data with optional `image` file |
| `PATCH` | `/admin/poses/:id/soft-delete` | Soft delete product pose | - |
| `DELETE` | `/admin/poses/:id` | Hard delete product pose | Permanent deletion |

### Product Themes (`/admin/product-themes`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/product-themes` | Get all product themes (paginated) | Filter: `search` (name)<br>Sort: `createdAt`, `updatedAt`, `name`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/product-themes/:id` | Get product theme by ID | - |
| `POST` | `/admin/product-themes` | Create product theme | Multipart form-data with optional `image` file |
| `PUT` | `/admin/product-themes/:id` | Update product theme | Multipart form-data with optional `image` file |
| `PATCH` | `/admin/product-themes/:id/soft-delete` | Soft delete product theme | - |
| `DELETE` | `/admin/product-themes/:id` | Hard delete product theme | Permanent deletion |

### Product Backgrounds (`/admin/product-backgrounds`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/product-backgrounds` | Get all backgrounds (paginated) | Filter: `productThemeId`, `search` (name)<br>Sort: `createdAt`, `updatedAt`, `name`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/product-backgrounds/:id` | Get background by ID | - |
| `POST` | `/admin/product-backgrounds` | Create background | Multipart form-data with required `image` file |
| `PUT` | `/admin/product-backgrounds/:id` | Update background | Multipart form-data with optional `image` file |
| `PATCH` | `/admin/product-backgrounds/:id/soft-delete` | Soft delete background | - |
| `DELETE` | `/admin/product-backgrounds/:id` | Hard delete background | Permanent deletion |

### AI Faces (`/admin/ai-faces`)

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/ai-faces` | Get all AI faces (paginated) | Filter: `categoryId`, `gender` (male/female), `search` (name)<br>Sort: `createdAt`, `updatedAt`, `name`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/ai-faces/:id` | Get AI face by ID | - |
| `POST` | `/admin/ai-faces` | Create AI face | Multipart form-data with required `image` file |
| `PUT` | `/admin/ai-faces/:id` | Update AI face | Multipart form-data with optional `image` file |
| `PATCH` | `/admin/ai-faces/:id/soft-delete` | Soft delete AI face | - |
| `DELETE` | `/admin/ai-faces/:id` | Hard delete AI face | Permanent deletion |

### User Management (`/admin/users`)

**Regular users management** - Available to ADMIN and SUPER_ADMIN.

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `GET` | `/admin/users` | Get all users (paginated) | Filter: `email`, `phone`, `status`<br>Sort: `createdAt`, `updatedAt`, `email`, `firstName`, `lastName`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/users/:id` | Get user by ID | - |
| `PATCH` | `/admin/users/:id/toggle-active` | Toggle user active/inactive status | - |
| `DELETE` | `/admin/users/:id` | Delete user | - |

### Admin Users Management (`/admin/admin-users`)

**Admin users management** - Available to SUPER_ADMIN only.

| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `POST` | `/admin/admin-users` | Create new admin user | - |
| `GET` | `/admin/admin-users` | Get all admin users (paginated) | Filter: `email`, `phone`, `status`<br>Sort: `createdAt`, `updatedAt`, `email`, `firstName`, `lastName`<br>Default: 20/page, DESC by createdAt |
| `GET` | `/admin/admin-users/:id` | Get admin user by ID | - |
| `PATCH` | `/admin/admin-users/:id` | Update admin user | - |
| `DELETE` | `/admin/admin-users/:id` | Delete admin user | Cannot delete yourself |
| `PATCH` | `/admin/admin-users/:id/toggle-active` | Toggle admin active/inactive status | Cannot deactivate yourself |

### Legal Documents (`/admin/legal-documents`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| `PUT` | `/admin/legal-documents/privacy-policy` | Update privacy policy | ✅ | ADMIN/SUPER_ADMIN |
| `PUT` | `/admin/legal-documents/terms-of-service` | Update terms of service | ✅ | ADMIN/SUPER_ADMIN |
| `GET` | `/admin/legal-documents/privacy-policy` | Get privacy policy | ✅ | ADMIN/SUPER_ADMIN |
| `GET` | `/admin/legal-documents/terms-of-service` | Get terms of service | ✅ | ADMIN/SUPER_ADMIN |

---

## 🏥 Health & Monitoring Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Application health check | ❌ |
| `GET` | `/health/ready` | Readiness check (database, storage, APIs) | ❌ |

---

## 📊 Data Model Hierarchy

```
Industry (1) ──→ (Many) Category (1) ──→ (Many) ProductType (1) ──→ (Many) ProductPose
                                                                         │
                                                                         │ many-to-many
                                                                         ▼
                                                              ProductTheme (many-to-many) ProductBackground
```

### Entity Relationships

1. **Industry → Category**: One-to-Many
2. **Category → ProductType**: One-to-Many
3. **ProductType → ProductPose**: One-to-Many
4. **ProductType ↔ ProductTheme**: Many-to-Many
5. **ProductTheme ↔ ProductBackground**: Many-to-Many
6. **AI Face**: Belongs to Category, has Gender (male/female)

---

## 🔑 Authentication & Authorization

### JWT Token System
- **Access Token**: Short-lived, used for API requests (Bearer token in Authorization header)
- **Refresh Token**: Long-lived, used to refresh access token (sent in Authorization header as "Refresh <token>")

### User Roles
- **USER**: Regular application users
- **ADMIN**: Admin users with management capabilities
- **SUPER_ADMIN**: Highest privilege, can manage admins

### Guards
- `JwtAuthGuard`: Validates access token
- `JwtRefreshGuard`: Validates refresh token
- `RolesGuard`: Validates user role permissions

---

## 📁 File Upload

### Supported Endpoints
- Categories (optional image)
- Product Poses (required image)
- Product Themes (optional image)
- Product Backgrounds (required image)
- AI Faces (required image)

### Storage
- Files uploaded to **Google Cloud Storage (GCS)**
- Images stored with both `imageUrl` (public CDN URL) and `imagePath` (GCS path for deletion)
- Automatic cleanup on entity deletion via TypeORM subscribers

---

## 🔒 Security Features

1. **Rate Limiting**: Configured via ThrottlerModule
   - Default: 100 requests per 60 seconds
   - Custom limits on auth endpoints (5-10 requests per 10-15 minutes)

2. **Password Security**:
   - Bcrypt hashing
   - Password reset via OTP (not email links)

3. **OTP System**:
   - WhatsApp-based OTP delivery
   - Session tokens for multi-step flows
   - Rate-limited to prevent abuse

4. **CORS**: Configurable origins
5. **Helmet**: Security headers (configurable)
6. **Body Parser**: 20MB limit for Base64 images

---

## 🗄️ Database

- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Migrations**: TypeORM migrations
- **Seeds**: Super admin creation on startup
- **Soft Deletes**: Most entities support soft deletion (deletedAt timestamp)

---

## 📝 Common Features Across Admin Endpoints

### Pagination
- Default: 20 items per page
- Query params: `page`, `limit`

### Filtering
- Most endpoints support `search` (name-based)
- Entity-specific filters (e.g., `industryId`, `categoryId`, `productTypeId`, `productThemeId`, `gender`)

### Sorting
- Default: `createdAt DESC`
- Query params: `sortBy`, `sortOrder` (ASC/DESC)
- Common sort fields: `createdAt`, `updatedAt`, `name`

### Response Format
All endpoints use `ResponseUtil` for consistent responses:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...},
  "pagination": {...} // for paginated responses
}
```

---

## 🚀 Development Notes

### Key Technologies
- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Storage**: Google Cloud Storage
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI (@nestjs/swagger)

### Environment Configuration
- Supports multiple environments: `development`, `production`, `test`
- GCP Secret Manager integration for production
- Environment-specific config files: `env.development`, `env.production`, `env.test`

### API Documentation
- Swagger UI available at: `/api/v1/docs`
- All endpoints documented with OpenAPI decorators

---

## 📌 Important Notes

1. **Authentication Flow**: Uses OTP-based signup, not traditional email verification
2. **File Uploads**: Multipart form-data required for image uploads
3. **Soft Delete**: Most entities support soft delete (can be restored) vs hard delete (permanent)
4. **Role Hierarchy**: SUPER_ADMIN > ADMIN > USER
5. **Public Endpoints**: Health checks, legal documents (read), industries-tree
6. **Rate Limiting**: Stricter limits on authentication endpoints to prevent abuse

---

## 🔄 Future Development Considerations

When planning new features, consider:
- Existing pagination, filtering, and sorting patterns
- Soft delete support for new entities
- Image upload patterns (GCS integration)
- Role-based access control patterns
- OTP-based flows for sensitive operations
- Consistent response formatting with ResponseUtil

---

**Last Updated**: Based on current codebase analysis
**Total Endpoints**: ~80+ endpoints across all modules

