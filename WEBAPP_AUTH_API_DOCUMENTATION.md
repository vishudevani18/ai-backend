# WebApp Authentication API Documentation

## Base URL
```
http://localhost:8080/api/v1/webapp
```

## Authentication Flow Overview

The signup flow consists of 4 steps:
1. **Send OTP** → User enters phone number, receives OTP via WhatsApp
2. **Verify OTP** → User enters OTP, receives session token
3. **Complete Registration** → User provides additional details, account is created
4. **Login** → User logs in with email/phone and password
5. **Logout** → User logs out

---

## 1. Send OTP for Signup

**Endpoint:** `POST /api/v1/webapp/signup/send-otp`

**Description:** Sends a 6-digit OTP to the user's WhatsApp number for signup.

**Rate Limit:** 5 requests per 15 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `phone` | string | Yes | Must match pattern: `^\+91[6-9]\d{9}$` | Indian phone number in +91 format (10 digits after +91, starting with 6-9) |

**Example:**
```json
{
  "phone": "+919876543210"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "error": false,
  "message": "OTP sent successfully to your WhatsApp",
  "timestamp": "2026-01-03T13:45:00.000Z"
}
```

**Error Responses:**

**409 Conflict** - User already exists:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User with this phone number already exists",
  "timestamp": "2026-01-03T13:45:00.000Z"
}
```

**400 Bad Request** - Invalid phone format:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Phone number must be a valid Indian number starting with +91",
  "timestamp": "2026-01-03T13:45:00.000Z"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Too many OTP requests. Please try again after X minutes.",
  "timestamp": "2026-01-03T13:45:00.000Z"
}
```

---

## 2. Verify OTP for Signup

**Endpoint:** `POST /api/v1/webapp/signup/verify-otp`

**Description:** Verifies the OTP sent to the user's phone and returns a session token for completing registration.

**Rate Limit:** 10 requests per 15 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `phone` | string | Yes | Must match pattern: `^\+91[6-9]\d{9}$` | Same phone number used in step 1 |
| `otp` | string | Yes | Exactly 6 digits | The OTP received via WhatsApp |

**Example:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionToken": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  },
  "error": false,
  "message": "OTP verified successfully. Please complete your registration.",
  "timestamp": "2026-01-03T13:45:30.000Z"
}
```

**Error Responses:**

**400 Bad Request** - Invalid or expired OTP:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Invalid or expired OTP",
  "timestamp": "2026-01-03T13:45:30.000Z"
}
```

**200 OK** - User already exists (special case):
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User already registered with this phone number",
  "timestamp": "2026-01-03T13:45:30.000Z"
}
```

**Note:** The `sessionToken` must be saved and used in the next step. It expires after a certain time (typically 10-15 minutes).

---

## 3. Complete Registration

**Endpoint:** `POST /api/v1/webapp/signup/complete`

**Description:** Completes user registration with additional details. Creates the user account and returns authentication tokens.

**Rate Limit:** 5 requests per 15 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionToken": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "email": "user@example.com",
  "password": "StrongPass@123",
  "firstName": "John",
  "lastName": "Doe",
  "address": {
    "addressType": "home",
    "street": "MG Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipcode": "400001",
    "country": "India"
  },
  "business": {
    "businessName": "ABC Enterprises",
    "businessType": "manufacturer",
    "businessSegment": "clothing",
    "businessDescription": "We manufacture high-quality clothing products.",
    "gstNumber": "27ABCDE1234F1Z5",
    "websiteUrl": "https://www.example.com",
    "businessLogo": "https://www.example.com/logo.png"
  }
}
```

**Request Body Schema:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `sessionToken` | string | Yes | - | Session token from step 2 |
| `email` | string | Yes | Valid email, max 150 chars | User's email address |
| `password` | string | Yes | 8-18 chars, must include: uppercase, lowercase, number, special char | User's password |
| `firstName` | string | Yes | 1-50 chars | User's first name |
| `lastName` | string | No | Max 50 chars | User's last name |
| `address` | object | No | - | User's primary address (optional) |
| `address.addressType` | string | No | Max 50 chars | Address type (e.g., "home", "office") |
| `address.street` | string | No | Max 255 chars | Street/area |
| `address.city` | string | No | Max 100 chars | City name |
| `address.state` | string | No | Max 100 chars | State name |
| `address.zipcode` | string | No | Max 20 chars | ZIP/PIN code |
| `address.country` | string | No | Max 100 chars | Country name |
| `business` | object | No | - | Business information (optional) |
| `business.businessName` | string | No | Max 150 chars | Business name |
| `business.businessType` | string | No | Enum: `manufacturer`, `reseller`, `wholesaler`, `other` | Business type |
| `business.businessSegment` | string | No | Enum: `clothing`, `accessories`, `furniture`, `electronics`, `other` | Business segment |
| `business.businessDescription` | string | No | - | Business description |
| `business.gstNumber` | string | No | Max 20 chars | GST number |
| `business.websiteUrl` | string | No | Valid URL | Business website URL |
| `business.businessLogo` | string | No | Valid URL | Business logo URL |

**Business Type Enum Values:**
- `manufacturer`
- `reseller`
- `wholesaler`
- `other`

**Business Segment Enum Values:**
- `clothing`
- `accessories`
- `furniture`
- `electronics`
- `other`

**Minimal Example (Required fields only):**
```json
{
  "sessionToken": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "email": "user@example.com",
  "password": "StrongPass@123",
  "firstName": "John"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "expiresIn": 3600,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "emailVerified": false,
      "phoneVerified": true,
      "role": "user",
      "status": "active",
      "profileImage": null,
      "business": {
        "businessName": "ABC Enterprises",
        "businessType": "manufacturer",
        "businessSegment": "clothing",
        "businessDescription": "We manufacture high-quality clothing products.",
        "gstNumber": "27ABCDE1234F1Z5",
        "websiteUrl": "https://www.example.com",
        "businessLogo": "https://www.example.com/logo.png"
      },
      "createdAt": "2026-01-03T13:46:00.000Z",
      "updatedAt": "2026-01-03T13:46:00.000Z"
    }
  },
  "error": false,
  "message": "User registered successfully",
  "timestamp": "2026-01-03T13:46:00.000Z"
}
```

**User Status Values:**
- `active` - User account is active
- `inactive` - User account is inactive
- `banned` - User account is banned

**User Role Values:**
- `user` - Regular user
- `admin` - Admin user
- `super_admin` - Super admin

**Error Responses:**

**400 Bad Request** - Invalid session token:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Invalid or expired session token",
  "timestamp": "2026-01-03T13:46:00.000Z"
}
```

**409 Conflict** - Email already exists:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User with this email already exists",
  "timestamp": "2026-01-03T13:46:00.000Z"
}
```

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "data": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "password",
        "message": "Password must include uppercase, lowercase, number, and special character"
      }
    ],
    "errorCount": 1
  },
  "error": true,
  "timestamp": "2026-01-03T13:46:00.000Z"
}
```

---

## 4. Login

**Endpoint:** `POST /api/v1/webapp/login`

**Description:** Authenticates a user with email/phone and password, returns access and refresh tokens.

**Rate Limit:** 10 requests per 15 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "StrongPass@123"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `emailOrPhone` | string | Yes | Valid email or phone (+91 format) | User's email address or phone number |
| `password` | string | Yes | 8-18 chars | User's password |

**Example with Email:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "StrongPass@123"
}
```

**Example with Phone:**
```json
{
  "emailOrPhone": "+919876543210",
  "password": "StrongPass@123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "expiresIn": 3600,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "emailVerified": false,
      "phoneVerified": true,
      "role": "user",
      "status": "active",
      "profileImage": null,
      "business": {
        "businessName": "ABC Enterprises",
        "businessType": "manufacturer",
        "businessSegment": "clothing",
        "businessDescription": "We manufacture high-quality clothing products.",
        "gstNumber": "27ABCDE1234F1Z5",
        "websiteUrl": "https://www.example.com",
        "businessLogo": "https://www.example.com/logo.png"
      },
      "createdAt": "2026-01-03T13:46:00.000Z",
      "updatedAt": "2026-01-03T13:46:00.000Z"
    }
  },
  "error": false,
  "message": "User logged in successfully",
  "timestamp": "2026-01-03T13:47:00.000Z"
}
```

**Error Responses:**

**401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Invalid email/phone or password",
  "timestamp": "2026-01-03T13:47:00.000Z"
}
```

**401 Unauthorized** - Account inactive:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Account inactive or banned",
  "timestamp": "2026-01-03T13:47:00.000Z"
}
```

**400 Bad Request** - Invalid email/phone format:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Please provide a valid email address or phone number",
  "timestamp": "2026-01-03T13:47:00.000Z"
}
```

---

## 5. Logout

**Endpoint:** `POST /api/v1/webapp/logout`

**Description:** Logs out the user by invalidating the refresh token. Requires authentication.

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <refresh_token>
```

**Note:** The logout endpoint uses the **refresh token** (not access token) in the Authorization header. The refresh token should be sent as a Bearer token.

**Request Body:**
```json
{}
```
(No body required, but send empty object or no body)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "error": false,
  "message": "User logged out successfully",
  "timestamp": "2026-01-03T13:48:00.000Z"
}
```

**Error Responses:**

**401 Unauthorized** - Invalid or missing token:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Unauthorized",
  "timestamp": "2026-01-03T13:48:00.000Z"
}
```

---

## Forgot Password Flow

The forgot password flow consists of 3 steps:
1. **Send OTP** → User enters phone number, receives OTP via WhatsApp
2. **Verify OTP** → User enters OTP, receives session token (optional - can proceed directly to reset)
3. **Reset Password** → User sets new password

---

## 6. Send OTP for Password Reset

**Endpoint:** `POST /api/v1/webapp/forgot-password/send-otp`

**Description:** Sends a 6-digit OTP to the user's WhatsApp number for password reset. The user must already be registered.

**Rate Limit:** 5 requests per 10 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `phone` | string | Yes | Must match pattern: `^\+91[6-9]\d{9}$` | Indian phone number in +91 format (must be registered) |

**Example:**
```json
{
  "phone": "+919876543210"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "error": false,
  "message": "OTP sent successfully to your WhatsApp",
  "timestamp": "2026-01-03T13:50:00.000Z"
}
```

**Error Responses:**

**404 Not Found** - User not found:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User with this phone number not found",
  "timestamp": "2026-01-03T13:50:00.000Z"
}
```

**400 Bad Request** - Invalid phone format:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Phone number must be a valid Indian number starting with +91",
  "timestamp": "2026-01-03T13:50:00.000Z"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Too many OTP requests. Please try again after X minutes.",
  "timestamp": "2026-01-03T13:50:00.000Z"
}
```

---

## 7. Verify OTP for Password Reset

**Endpoint:** `POST /api/v1/webapp/forgot-password/verify-otp`

**Description:** Verifies the OTP sent to the user's phone for password reset. Returns a session token (optional - can proceed directly to reset password).

**Rate Limit:** 10 requests per 10 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `phone` | string | Yes | Must match pattern: `^\+91[6-9]\d{9}$` | Same phone number used in step 1 |
| `otp` | string | Yes | Exactly 6 digits | The OTP received via WhatsApp |

**Example:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionToken": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  },
  "error": false,
  "message": "OTP verified successfully. You can now reset your password.",
  "timestamp": "2026-01-03T13:50:30.000Z"
}
```

**Error Responses:**

**400 Bad Request** - Invalid or expired OTP:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Invalid or expired OTP",
  "timestamp": "2026-01-03T13:50:30.000Z"
}
```

**404 Not Found** - User not found:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User not found",
  "timestamp": "2026-01-03T13:50:30.000Z"
}
```

**Note:** The session token is optional. You can proceed directly to reset password with just the phone number after OTP verification.

---

## 8. Resend OTP

**Endpoint:** `POST /api/v1/webapp/forgot-password/resend-otp`

**Description:** Resends OTP for either signup or password reset. Use this if the user didn't receive the OTP or it expired.

**Rate Limit:** 3 requests per 10 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "purpose": "reset_password"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `phone` | string | Yes | Must match pattern: `^\+91[6-9]\d{9}$` | Indian phone number in +91 format |
| `purpose` | string | Yes | Enum: `signup` or `reset_password` | Purpose of the OTP resend |

**Purpose Values:**
- `signup` - For signup flow
- `reset_password` - For password reset flow

**Example for Password Reset:**
```json
{
  "phone": "+919876543210",
  "purpose": "reset_password"
}
```

**Example for Signup:**
```json
{
  "phone": "+919876543210",
  "purpose": "signup"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "error": false,
  "message": "OTP resent successfully",
  "timestamp": "2026-01-03T13:51:00.000Z"
}
```

**Error Responses:**

**404 Not Found** - User not found (for password reset):
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User with this phone number not found",
  "timestamp": "2026-01-03T13:51:00.000Z"
}
```

**409 Conflict** - User already exists (for signup):
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User with this phone number already exists",
  "timestamp": "2026-01-03T13:51:00.000Z"
}
```

**400 Bad Request** - Invalid purpose:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Purpose must be either signup or reset_password",
  "timestamp": "2026-01-03T13:51:00.000Z"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Too many OTP requests. Please try again after X minutes.",
  "timestamp": "2026-01-03T13:51:00.000Z"
}
```

---

## 9. Reset Password

**Endpoint:** `POST /api/v1/webapp/reset-password`

**Description:** Resets the user's password after OTP verification. The user must have verified the OTP for this phone number.

**Rate Limit:** 5 requests per 10 minutes

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionToken": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "newPassword": "NewStrongPass@123",
  "confirmPassword": "NewStrongPass@123"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `sessionToken` | string | Yes | - | Session token received from OTP verification step (expires in 5 minutes) |
| `newPassword` | string | Yes | 8-18 chars, must include: uppercase, lowercase, number, special char | New password |
| `confirmPassword` | string | Yes | Must match `newPassword` | Confirmation of new password |

**⚠️ Important**: You must first verify the OTP using `/forgot-password/verify-otp` to get the `sessionToken`. The session token expires in 5 minutes and can only be used once.

**Example:**
```json
{
  "phone": "+919876543210",
  "newPassword": "NewStrongPass@123",
  "confirmPassword": "NewStrongPass@123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "error": false,
  "message": "Password has been successfully reset",
  "timestamp": "2026-01-03T13:52:00.000Z"
}
```

**Error Responses:**

**400 Bad Request** - Passwords don't match:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "Passwords do not match",
  "timestamp": "2026-01-03T13:52:00.000Z"
}
```

**400 Bad Request** - New password same as old:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "New password must be different from old password",
  "timestamp": "2026-01-03T13:52:00.000Z"
}
```

**404 Not Found** - User not found:
```json
{
  "success": false,
  "data": null,
  "error": true,
  "message": "User not found",
  "timestamp": "2026-01-03T13:52:00.000Z"
}
```

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "data": {
    "message": "Validation failed",
    "errors": [
      {
        "field": "newPassword",
        "message": "Password must include uppercase, lowercase, number, and special character"
      }
    ],
    "errorCount": 1
  },
  "error": true,
  "timestamp": "2026-01-03T13:52:00.000Z"
}
```

---

## Additional Endpoints

### Refresh Token

**Endpoint:** `POST /api/v1/webapp/refresh`

**Description:** Refreshes the access token using a valid refresh token.

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <refresh_token>
```

**Request Body:**
```json
{}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token...",
    "expiresIn": 3600,
    "user": { /* user profile */ }
  },
  "error": false,
  "message": "Token refreshed successfully",
  "timestamp": "2026-01-03T13:49:00.000Z"
}
```

---

## Token Usage

### Access Token
- **Usage:** Include in `Authorization` header for protected endpoints
- **Format:** `Authorization: Bearer <access_token>`
- **Expiry:** Typically 60 minutes (3600 seconds)
- **Purpose:** Authenticate API requests

### Refresh Token
- **Usage:** Include in `Authorization` header for refresh and logout endpoints
- **Format:** `Authorization: Bearer <refresh_token>`
- **Expiry:** Typically 7 days
- **Purpose:** Obtain new access tokens and logout

---

## Error Handling

All error responses follow this structure:
```json
{
  "success": false,
  "data": null | object,
  "error": true,
  "message": "Error message here",
  "timestamp": "2026-01-03T13:50:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created (registration complete)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `409` - Conflict (user already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Frontend Integration Notes

1. **Store Tokens Securely:**
   - Store `accessToken` and `refreshToken` securely (e.g., secure HTTP-only cookies or secure storage)
   - Never store tokens in localStorage if possible (use secure storage)

2. **Token Refresh:**
   - Monitor access token expiry
   - Automatically refresh before expiry using the refresh token endpoint
   - Handle refresh token expiry by redirecting to login

3. **Error Handling:**
   - Handle 401 errors by attempting token refresh
   - If refresh fails, redirect to login
   - Display user-friendly error messages

4. **Session Token:**
   - Store the `sessionToken` from step 2 (verify OTP) temporarily
   - Use it immediately in step 3 (complete registration)
   - Session tokens expire quickly (10-15 minutes)

5. **Rate Limiting:**
   - Implement retry logic with exponential backoff
   - Show user-friendly messages when rate limits are hit
   - Disable submit buttons after rate limit is reached

6. **Phone Number Format:**
   - Always use `+91` prefix for Indian numbers
   - Validate format: `+91` followed by 10 digits starting with 6-9
   - Example: `+919876543210`

7. **Password Requirements:**
   - Minimum 8 characters, maximum 18 characters
   - Must include: uppercase letter, lowercase letter, number, special character
   - Show password strength indicator

8. **Forgot Password Flow:**
   - User must be registered (phone number must exist)
   - OTP verification is required before password reset
   - New password must be different from the old password
   - Use resend OTP if user didn't receive the OTP
   - Session token from verify OTP is optional (not required for reset password)

9. **Resend OTP:**
   - Can be used for both signup and password reset flows
   - Specify the correct `purpose` (`signup` or `reset_password`)
   - Rate limited to 3 requests per 10 minutes
   - Use when OTP expires or user didn't receive it

---

## Testing in Development

In development mode, OTPs are logged to the console. Check your backend logs to see the OTP:
```
[DEV MODE] OTP for +919876543210: 123456
```

Use this exact OTP for verification in development.

---

## Complete Flow Examples

### Signup Flow Example

```javascript
// Step 1: Send OTP
const sendOtpResponse = await fetch('http://localhost:8080/api/v1/webapp/signup/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+919876543210' })
});

// Step 2: Verify OTP (check console for OTP in dev mode)
const verifyOtpResponse = await fetch('http://localhost:8080/api/v1/webapp/signup/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+919876543210', otp: '123456' })
});
const { data: { sessionToken } } = await verifyOtpResponse.json();

// Step 3: Complete Registration
const completeResponse = await fetch('http://localhost:8080/api/v1/webapp/signup/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionToken,
    email: 'user@example.com',
    password: 'StrongPass@123',
    firstName: 'John',
    lastName: 'Doe'
  })
});
const { data: { accessToken, refreshToken, user } } = await completeResponse.json();

// Step 4: Login (for future logins)
const loginResponse = await fetch('http://localhost:8080/api/v1/webapp/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailOrPhone: 'user@example.com',
    password: 'StrongPass@123'
  })
});

// Step 5: Logout
const logoutResponse = await fetch('http://localhost:8080/api/v1/webapp/logout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${refreshToken}`
  }
});
```

### Forgot Password Flow Example

```javascript
// Step 1: Send OTP for Password Reset
const sendResetOtpResponse = await fetch('http://localhost:8080/api/v1/webapp/forgot-password/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+919876543210' })
});

// Step 2: Verify OTP (check console for OTP in dev mode)
const verifyResetOtpResponse = await fetch('http://localhost:8080/api/v1/webapp/forgot-password/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+919876543210', otp: '123456' })
});
const { data: { sessionToken } } = await verifyResetOtpResponse.json();

// Step 3: Reset Password
const resetPasswordResponse = await fetch('http://localhost:8080/api/v1/webapp/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    newPassword: 'NewStrongPass@123',
    confirmPassword: 'NewStrongPass@123'
  })
});

// Alternative: Resend OTP if needed
const resendOtpResponse = await fetch('http://localhost:8080/api/v1/webapp/forgot-password/resend-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    purpose: 'reset_password'
  })
});
```

---

## Support

For questions or issues, refer to the Swagger documentation at:
```
http://localhost:8080/api/v1/docs
```

