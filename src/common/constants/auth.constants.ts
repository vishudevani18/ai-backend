export const BCRYPT_SALT_ROUNDS = 12;
export const DEFAULT_ADDRESS_COUNTRY = 'India';
export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const REFRESH_TOKEN_FIELD_NAME = 'refreshToken';

// OTP Constants
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_EXPIRY_SECONDS = OTP_EXPIRY_MINUTES * 60;
export const OTP_RATE_LIMIT_COUNT = 3;
export const OTP_RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 15 minutes

// OTP Redis Key Prefixes
export const OTP_KEY_PREFIX = 'otp:';
export const OTP_RATE_LIMIT_KEY_PREFIX = 'otp:rate_limit:';
export const OTP_SESSION_KEY_PREFIX = 'otp:session:';

// OTP Purposes
export enum OtpPurpose {
  SIGNUP = 'signup',
  RESET_PASSWORD = 'reset_password',
}
