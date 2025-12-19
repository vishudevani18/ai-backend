import { Injectable, Inject, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import {
  OTP_LENGTH,
  OTP_EXPIRY_SECONDS,
  OTP_RATE_LIMIT_COUNT,
  OTP_RATE_LIMIT_WINDOW_SECONDS,
  OTP_KEY_PREFIX,
  OTP_RATE_LIMIT_KEY_PREFIX,
  OTP_SESSION_KEY_PREFIX,
  OtpPurpose,
} from '../../../common/constants/auth.constants';

@Injectable()
export class OtpService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Generate a random 6-digit OTP
   */
  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Check rate limit for OTP requests
   */
  async checkRateLimit(phone: string, purpose: OtpPurpose): Promise<void> {
    const key = `${OTP_RATE_LIMIT_KEY_PREFIX}${purpose}:${phone}`;
    const count = await this.redis.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;

    if (currentCount >= OTP_RATE_LIMIT_COUNT) {
      const ttl = await this.redis.ttl(key);
      throw new HttpException(
        `Too many OTP requests. Please try again after ${Math.ceil(ttl / 60)} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Store OTP in Redis with expiration
   */
  async storeOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<void> {
    // Check rate limit
    await this.checkRateLimit(phone, purpose);

    // Hash OTP before storing
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const key = `${OTP_KEY_PREFIX}${purpose}:${phone}`;
    const rateLimitKey = `${OTP_RATE_LIMIT_KEY_PREFIX}${purpose}:${phone}`;

    // Store hashed OTP
    await this.redis.setex(key, OTP_EXPIRY_SECONDS, hashedOtp);

    // Update rate limit counter
    const currentCount = await this.redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await this.redis.expire(rateLimitKey, OTP_RATE_LIMIT_WINDOW_SECONDS);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<boolean> {
    const key = `${OTP_KEY_PREFIX}${purpose}:${phone}`;
    const storedHash = await this.redis.get(key);

    if (!storedHash) {
      return false;
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const isValid = hashedOtp === storedHash;

    if (isValid) {
      // Delete OTP after successful verification
      await this.redis.del(key);
    }

    return isValid;
  }

  /**
   * Create OTP session token for multi-step flows
   */
  async createOtpSession(phone: string, purpose: OtpPurpose): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const key = `${OTP_SESSION_KEY_PREFIX}${purpose}:${sessionToken}`;

    // Store session for 30 minutes (increased from 15 minutes)
    await this.redis.setex(key, 30 * 60, phone);

    return sessionToken;
  }

  /**
   * Verify and get phone from session token
   * Note: Session token is consumed (deleted) after verification to prevent reuse
   */
  async verifyOtpSession(sessionToken: string, purpose: OtpPurpose): Promise<string | null> {
    const key = `${OTP_SESSION_KEY_PREFIX}${purpose}:${sessionToken}`;
    const phone = await this.redis.get(key);

    if (phone) {
      // Delete session after use to prevent reuse
      // This ensures the session token can only be used once
      await this.redis.del(key);
    }

    return phone;
  }

  /**
   * Delete OTP (for cleanup)
   */
  async deleteOtp(phone: string, purpose: OtpPurpose): Promise<void> {
    const key = `${OTP_KEY_PREFIX}${purpose}:${phone}`;
    await this.redis.del(key);
  }
}
