import { registerAs } from '@nestjs/config';
import {
  DEFAULT_NODE_ENV,
  DEFAULT_PORT,
  DEFAULT_DB_HOST,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USERNAME,
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_DATABASE,
  DEFAULT_JWT_SECRET,
  DEFAULT_JWT_EXPIRES_IN,
  DEFAULT_JWT_REFRESH_SECRET,
  DEFAULT_JWT_REFRESH_EXPIRES_IN,
  DEFAULT_CORS_ORIGIN,
  DEFAULT_THROTTLE_TTL,
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_UPLOAD_PATH,
  DEFAULT_GEMINI_API_KEY,
  DEFAULT_GEMINI_API_URL,
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_FILE,
  DEFAULT_CSRF_ENABLED,
  DEFAULT_HELMET_ENABLED,
  DEFAULT_STORAGE_PROVIDER,
  DEFAULT_GCS_BUCKET_NAME,
  DEFAULT_GCS_PROJECT_ID,
  DEFAULT_GCS_CDN_BASE_URL,
  DEFAULT_BASE_URL,
  DEFAULT_WHATSAPP_PROVIDER,
  DEFAULT_WHATSAPP_API_URL,
  DEFAULT_WHATSAPP_OTP_SIGNUP_TEMPLATE,
  DEFAULT_WHATSAPP_OTP_RESET_TEMPLATE,
  DEFAULT_GEMINI_IMAGE_MODEL,
  DEFAULT_IMAGE_RETENTION_HOURS,
  DEFAULT_OTP_EXPIRY_MINUTES,
} from 'src/common/constants/config.constants';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || DEFAULT_NODE_ENV,
  port: parseInt(process.env.PORT, 10) || DEFAULT_PORT,
  database: {
    host: process.env.DB_HOST || DEFAULT_DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || DEFAULT_DB_PORT,
    username: process.env.DB_USERNAME || DEFAULT_DB_USERNAME,
    password: process.env.DB_PASSWORD || DEFAULT_DB_PASSWORD,
    database: process.env.DB_DATABASE || DEFAULT_DB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [DEFAULT_CORS_ORIGIN],
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || DEFAULT_THROTTLE_TTL,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || DEFAULT_THROTTLE_LIMIT,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || DEFAULT_MAX_FILE_SIZE, // 10MB
    path: process.env.UPLOAD_PATH || DEFAULT_UPLOAD_PATH,
  },
  google: {
    projectId: process.env.GCP_PROJECT_ID || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY,
    apiUrl: process.env.GEMINI_API_URL || DEFAULT_GEMINI_API_URL,
    imageGeneration: {
      model: process.env.GEMINI_IMAGE_MODEL || DEFAULT_GEMINI_IMAGE_MODEL,
      promptTemplate: process.env.GEMINI_IMAGE_PROMPT_TEMPLATE,
      maxImages: 4,
      responseModality: 'IMAGE' as const,
      imageRetentionHours: parseInt(process.env.IMAGE_RETENTION_HOURS, 10) || DEFAULT_IMAGE_RETENTION_HOURS,
      location: process.env.VERTEX_AI_LOCATION || 'us-central1',
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    file: process.env.LOG_FILE || DEFAULT_LOG_FILE,
  },
  security: {
    csrfEnabled: process.env.CSRF_ENABLED === 'true' || DEFAULT_CSRF_ENABLED,
    helmetEnabled: process.env.HELMET_ENABLED !== 'false' || DEFAULT_HELMET_ENABLED,
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || DEFAULT_STORAGE_PROVIDER,
    gcs: {
      bucketName: process.env.GCS_BUCKET_NAME || DEFAULT_GCS_BUCKET_NAME,
      projectId: process.env.GCS_PROJECT_ID || DEFAULT_GCS_PROJECT_ID,
      cdnBaseUrl: process.env.GCS_CDN_BASE_URL || DEFAULT_GCS_CDN_BASE_URL,
    },
  },
  baseUrl: process.env.BASE_URL || DEFAULT_BASE_URL,
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || DEFAULT_WHATSAPP_PROVIDER,
    apiUrl: process.env.WHATSAPP_API_URL || DEFAULT_WHATSAPP_API_URL,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    // BSP Credentials (Gupshup)
    gupshupApiKey: process.env.GUPSHUP_API_KEY,
    gupshupAppName: process.env.GUPSHUP_APP_NAME,
    // Template Names
    otpSignupTemplate:
      process.env.WHATSAPP_OTP_SIGNUP_TEMPLATE || DEFAULT_WHATSAPP_OTP_SIGNUP_TEMPLATE,
    otpResetTemplate:
      process.env.WHATSAPP_OTP_RESET_TEMPLATE || DEFAULT_WHATSAPP_OTP_RESET_TEMPLATE,
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || DEFAULT_OTP_EXPIRY_MINUTES,
  },
}));
