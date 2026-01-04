export const BCRYPT_SALT_ROUNDS = 12;
export const DEFAULT_ADDRESS_COUNTRY = 'India';
export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const REFRESH_TOKEN_FIELD_NAME = 'refreshToken';

// OTP Constants
export const OTP_LENGTH = 6;
/**
 * @deprecated Use ConfigService.get('app.otp.expiryMinutes') instead.
 * This constant is kept for backward compatibility but OTP expiry is now managed via environment variable OTP_EXPIRY_MINUTES.
 */
export const OTP_EXPIRY_MINUTES = 10;
/**
 * @deprecated Use ConfigService.get('app.otp.expiryMinutes') * 60 instead.
 * This constant is kept for backward compatibility but OTP expiry is now managed via environment variable OTP_EXPIRY_MINUTES.
 */
export const OTP_EXPIRY_SECONDS = OTP_EXPIRY_MINUTES * 60;
export const OTP_RATE_LIMIT_COUNT = 3;
export const OTP_RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 15 minutes

// OTP Purposes
export enum OtpPurpose {
  SIGNUP = 'signup',
  RESET_PASSWORD = 'reset_password',
}
