# Forgot Password Flow - Security Documentation

## 🔐 Security Flow Overview

The forgot password flow uses a **3-step security process** to ensure only the legitimate user can reset their password:

1. **OTP Verification** - User proves they have access to their phone
2. **Session Token** - Time-limited token that binds the reset to the verified phone
3. **Password Reset** - Session token is validated before allowing password change

---

## 📋 Step-by-Step Flow

### Step 1: Send OTP
**Endpoint**: `POST /api/v1/webapp/forgot-password/send-otp`

**What happens**:
- User provides phone number
- System checks if user exists with that phone
- OTP is sent to user's WhatsApp
- OTP expires in **2 minutes** (configurable via `OTP_EXPIRY_MINUTES`)

**Security**: 
- Rate limited (5 requests per 10 minutes)
- User must exist in system

---

### Step 2: Verify OTP
**Endpoint**: `POST /api/v1/webapp/forgot-password/verify-otp`

**What happens**:
- User provides phone number + OTP
- System verifies OTP is correct and not expired
- System verifies user exists
- **Session token is created** and bound to the verified phone number
- Session token expires in **30 minutes**

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionToken": "abc123def456..."
  },
  "message": "OTP verified successfully. You can now reset your password."
}
```

**Security**:
- OTP is verified (must match and not be expired)
- User existence is verified
- Session token is cryptographically secure (32-byte hex string)
- Session token is bound to the specific phone number that verified OTP

---

### Step 3: Reset Password
**Endpoint**: `POST /api/v1/webapp/reset-password`

**What happens**:
- User provides session token + new password + confirm password
- **System validates session token**:
  - Checks if session token exists
  - Checks if session token is not expired (30 minutes)
  - Checks if session token matches the purpose (RESET_PASSWORD)
  - **Extracts the phone number** from the session token
- System finds user by the phone number from session token
- System validates new password requirements
- System checks new password is different from old password
- Password is updated
- **Session token is consumed (deleted)** - cannot be reused

**Request**:
```json
{
  "sessionToken": "abc123def456...",
  "newPassword": "NewStrongPass@123",
  "confirmPassword": "NewStrongPass@123"
}
```

**Security**:
- ✅ Session token must be valid and not expired
- ✅ Session token must match the verified phone number
- ✅ Session token can only be used once (deleted after use)
- ✅ Password must meet complexity requirements
- ✅ New password must be different from old password
- ✅ Rate limited (5 requests per 10 minutes)

---

## ⏱️ Token Expiry Times

### OTP Expiry
- **Default**: 2 minutes (configurable via `OTP_EXPIRY_MINUTES` environment variable)
- **Purpose**: Prevents OTP from being used after a reasonable time
- **Location**: `env.development` → `OTP_EXPIRY_MINUTES=2`

### Session Token Expiry
- **Current**: **5 minutes** (hardcoded)
- **Purpose**: Gives user time to reset password after OTP verification (short window for security)
- **Location**: `src/modules/auth/services/otp.service.ts` line 140
- **Note**: This could be made configurable in the future

---

## 🔒 Security Features

### 1. **Phone Number Verification**
- User must have access to the phone number to receive OTP
- OTP is sent via WhatsApp (secure channel)

### 2. **Session Token Binding**
- Session token is **bound to the specific phone number** that verified OTP
- When resetting password, the phone number is extracted from the session token
- This prevents someone from using a session token for a different phone number

### 3. **One-Time Use**
- Session token is **deleted immediately after use**
- Cannot be reused even if not expired
- Prevents replay attacks

### 4. **Time-Limited**
- Session token expires after 30 minutes
- User must complete password reset within this window
- If expired, user must verify OTP again

### 5. **Purpose-Specific**
- Session token is created with `OtpPurpose.RESET_PASSWORD`
- Can only be used for password reset, not for other purposes
- Prevents token misuse

### 6. **Rate Limiting**
- OTP sending: 5 requests per 10 minutes
- OTP verification: 10 requests per 10 minutes
- Password reset: 5 requests per 10 minutes
- Prevents brute force attacks

---

## 🛡️ How User Validation Works

### Before Password Reset (Current Implementation - SECURE ✅)

1. **OTP Verification**:
   ```typescript
   // User provides: phone + OTP
   // System verifies:
   - OTP is correct
   - OTP is not expired
   - User exists with that phone
   // System creates: session token bound to phone
   ```

2. **Password Reset**:
   ```typescript
   // User provides: sessionToken + newPassword
   // System validates:
   - Session token exists
   - Session token is not expired (30 min)
   - Session token purpose is RESET_PASSWORD
   - Extracts phone number from session token
   - Finds user by that phone number
   - Validates password requirements
   - Updates password
   - Deletes session token (one-time use)
   ```

### Security Guarantees

✅ **Only the person who verified OTP can reset password**
- Session token is bound to the phone number that verified OTP
- Session token cannot be used for a different phone number

✅ **Session token cannot be reused**
- Deleted immediately after password reset
- Even if someone intercepts it, it's already consumed

✅ **Time-limited access**
- 5 minutes to complete password reset
- Must re-verify OTP if expired

✅ **No phone number spoofing**
- Phone number comes from session token, not from user input
- User cannot change the phone number during reset

---

## 📊 Security Comparison

### ❌ Old Implementation (INSECURE)
```typescript
// User could reset password with just phone number
resetPassword(phone, newPassword) {
  // Only validated by phone number
  // No session token validation
  // Anyone with phone number could reset password
}
```

**Vulnerabilities**:
- No proof that user verified OTP
- Phone number could be spoofed
- No time limit on password reset
- Could reset password without OTP verification

### ✅ New Implementation (SECURE)
```typescript
// User must provide session token from OTP verification
resetPassword(sessionToken, newPassword) {
  // Validates session token
  // Extracts phone from session token
  // Ensures OTP was verified
  // Time-limited (30 minutes)
  // One-time use
}
```

**Security Benefits**:
- ✅ Proof of OTP verification required
- ✅ Phone number cannot be spoofed (comes from session token)
- ✅ Time-limited (30 minutes)
- ✅ One-time use (cannot be reused)
- ✅ Purpose-specific (only for password reset)

---

## 🔧 Configuration

### Environment Variables

```env
# OTP Expiry (in minutes)
OTP_EXPIRY_MINUTES=2

# Session Token Expiry (currently hardcoded to 30 minutes)
# Future: Could be made configurable via SESSION_TOKEN_EXPIRY_MINUTES
```

### Code Locations

- **OTP Expiry**: `src/config/configuration.ts` → `app.otp.expiryMinutes`
- **Session Token Expiry**: `src/modules/auth/services/otp.service.ts` line 140
- **Reset Password Validation**: `src/modules/auth/auth.service.ts` → `resetPasswordWithOtp()`

---

## 📝 Frontend Implementation Notes

### Required Flow

1. **Send OTP**:
   ```javascript
   POST /forgot-password/send-otp
   { phone: "+919876543210" }
   ```

2. **Verify OTP** (Save session token):
   ```javascript
   POST /forgot-password/verify-otp
   { phone: "+919876543210", otp: "123456" }
   
   // Response contains sessionToken - SAVE THIS!
   // sessionToken expires in 30 minutes
   ```

3. **Reset Password** (Use session token):
   ```javascript
   POST /reset-password
   {
     sessionToken: "abc123...",  // From step 2
     newPassword: "NewPass@123",
     confirmPassword: "NewPass@123"
   }
   ```

### Important Notes

⚠️ **Session token expires in 5 minutes**
- User must complete password reset within 5 minutes
- If expired, user must verify OTP again

⚠️ **Session token can only be used once**
- After password reset, token is deleted
- Cannot reuse the same token

⚠️ **Store session token securely**
- Don't expose in URLs
- Clear from storage after use
- Handle expiration gracefully

---

## 🧪 Testing

### Valid Flow
1. Send OTP → Success
2. Verify OTP → Get session token
3. Reset password with session token → Success
4. Try to reset again with same session token → Error (token consumed)

### Invalid Scenarios
1. Reset password without session token → Error
2. Reset password with expired session token → Error
3. Reset password with wrong session token → Error
4. Reset password with session token from different phone → Error

---

## ✅ Summary

**Session Token Expiry**: **30 minutes** (hardcoded)

**User Validation**:
1. ✅ OTP verification proves phone access
2. ✅ Session token binds reset to verified phone
3. ✅ Session token validates user identity
4. ✅ One-time use prevents replay attacks
5. ✅ Time-limited prevents long-term abuse

**Security Level**: **Production-ready** ✅

The implementation now follows the same secure pattern as the signup flow, ensuring only verified users can reset passwords.

---

## ✅ Security Status

### Phone Number Updates

**Status**: ✅ **SECURE** - Phone updates are disabled

**Implementation**: 
- Phone field removed from `UpdateProfileDto`
- Phone can only be set during signup
- Phone updates are completely disabled for security

**Rationale**: 
- Prevents phone number hijacking
- Ensures phone number remains tied to the original verified user
- Simplifies security model

See `SECURITY_AUDIT_REPORT.md` for details.

