export const API_VERSION = 'v1';
export const API_PREFIX = `api/${API_VERSION}`;

export const ROUTES = {
  USERS: {
    BASE: 'users',
    PROFILE: 'users/profile',
  },
  HEALTH: {
    BASE: 'health',
  },
  ADMIN: {
    BASE: 'admin',
    CATEGORIES: 'admin/categories',
    INDUSTRIES: 'admin/industries',
    PRODUCT_BACKGROUNDS: 'admin/product-backgrounds',
    PRODUCT_POSES: 'admin/poses',
    PRODUCT_THEMES: 'admin/product-themes',
    PRODUCT_TYPES: 'admin/product-types',
    AI_FACES: 'admin/ai-faces',
    USERS: 'admin/users', // Regular users management
    ADMIN_USERS: 'admin/admin-users', // Admin users management (super admin only)
    LEGAL_DOCUMENTS: 'admin/legal-documents',
    CONTACT_SUBMISSIONS: 'admin/contact-submissions',
  },
  WEBAPP: {
    BASE: 'webapp',
    PROFILE: 'webapp/profile',
    // Authentication endpoints (for user roles)
    SIGNUP_SEND_OTP: 'webapp/signup/send-otp',
    SIGNUP_VERIFY_OTP: 'webapp/signup/verify-otp',
    SIGNUP_COMPLETE: 'webapp/signup/complete',
    LOGIN: 'webapp/login',
    REFRESH: 'webapp/refresh',
    LOGOUT: 'webapp/logout',
    FORGOT_PASSWORD_SEND_OTP: 'webapp/forgot-password/send-otp',
    FORGOT_PASSWORD_VERIFY_OTP: 'webapp/forgot-password/verify-otp',
    FORGOT_PASSWORD_RESEND_OTP: 'webapp/forgot-password/resend-otp',
    RESET_PASSWORD: 'webapp/reset-password',
    LEGAL_BASE: 'webapp/legal',
    PRIVACY_POLICY: 'webapp/legal/privacy-policy',
    TERMS_OF_SERVICE: 'webapp/legal/terms-of-service',
    CONTACT: 'webapp/contact',
  },
} as const;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  SUPER_ADMIN: 'super_admin',
} as const;

export const JWT_STRATEGIES = {
  ACCESS: 'jwt-access',
  REFRESH: 'jwt-refresh',
} as const;

export * from './success-messages.constants';
export * from './error-messages.constants';
