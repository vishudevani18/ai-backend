import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  OTP_LENGTH,
  OTP_RATE_LIMIT_COUNT,
  OTP_RATE_LIMIT_WINDOW_SECONDS,
  OtpPurpose,
} from '../../../common/constants/auth.constants';
import { Otp } from '../../../database/entities/otp.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
    private readonly configService: ConfigService,
  ) {}

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
    const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_SECONDS * 1000);

    const count = await this.otpRepo.count({
      where: {
        phone,
        purpose,
        createdAt: MoreThan(windowStart),
      },
    });

    if (count >= OTP_RATE_LIMIT_COUNT) {
      // Calculate remaining time
      const oldestRecord = await this.otpRepo.findOne({
        where: {
          phone,
          purpose,
          createdAt: MoreThan(windowStart),
        },
        order: { createdAt: 'ASC' },
      });

      if (oldestRecord) {
        const remainingSeconds = Math.floor(
          (oldestRecord.createdAt.getTime() + OTP_RATE_LIMIT_WINDOW_SECONDS * 1000 - Date.now()) /
            1000,
        );
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        throw new HttpException(
          `Too many OTP requests. Please try again after ${remainingMinutes} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  /**
   * Store OTP in database with expiration
   */
  async storeOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<void> {
    // Check rate limit
    await this.checkRateLimit(phone, purpose);

    // Hash OTP before storing
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpiryMinutes = this.configService.get<number>('app.otp.expiryMinutes') || 2;
    const otpExpirySeconds = otpExpiryMinutes * 60;
    const expiresAt = new Date(Date.now() + otpExpirySeconds * 1000);

    // Delete any existing OTP for this phone and purpose
    await this.otpRepo.delete({
      phone,
      purpose,
    });

    // Store hashed OTP in database
    const otpRecord = this.otpRepo.create({
      phone,
      otpHash: hashedOtp,
      purpose,
      expiresAt,
      attempts: 0,
    });

    await this.otpRepo.save(otpRecord);
  }

  /**
   * Verify OTP
   */
  async verifyOtp(phone: string, otp: string, purpose: OtpPurpose): Promise<boolean> {
    const isDevMode = this.configService.get('app.nodeEnv') === 'development';

    // Find the OTP record
    const otpRecord = await this.otpRepo.findOne({
      where: {
        phone,
        purpose,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      return false;
    }

    // In dev mode, check if this matches the logged OTP (stored in a way we can verify)
    // For dev mode, we'll accept the OTP if it matches the hash we stored
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const isValid = hashedOtp === otpRecord.otpHash;

    if (isValid) {
      // Delete OTP record from database immediately after successful verification
      await this.otpRepo.remove(otpRecord);
    } else {
      // Increment attempts for failed verification
      otpRecord.attempts += 1;
      await this.otpRepo.save(otpRecord);
    }

    return isValid;
  }

  /**
   * Create OTP session token for multi-step flows
   */
  async createOtpSession(phone: string, purpose: OtpPurpose): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Find existing OTP record and update it with session token
    const otpRecord = await this.otpRepo.findOne({
      where: {
        phone,
        purpose,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (otpRecord) {
      otpRecord.sessionToken = sessionToken;
      otpRecord.sessionExpiresAt = sessionExpiresAt;
      await this.otpRepo.save(otpRecord);
    } else {
      // Create new record with session token if OTP record doesn't exist
      const newRecord = this.otpRepo.create({
        phone,
        otpHash: '', // Empty since OTP is already verified
        purpose,
        expiresAt: sessionExpiresAt,
        sessionToken,
        sessionExpiresAt,
        attempts: 0,
      });
      await this.otpRepo.save(newRecord);
    }

    return sessionToken;
  }

  /**
   * Verify and get phone from session token
   * Note: Session token is consumed (deleted) after verification to prevent reuse
   */
  async verifyOtpSession(sessionToken: string, purpose: OtpPurpose): Promise<string | null> {
    const otpRecord = await this.otpRepo.findOne({
      where: {
        sessionToken,
        purpose,
        sessionExpiresAt: MoreThan(new Date()),
      },
    });

    if (!otpRecord) {
      return null;
    }

    const phone = otpRecord.phone;

    // Delete session record after use to prevent reuse
    // This ensures the session token can only be used once
    await this.otpRepo.remove(otpRecord);

    return phone;
  }

  /**
   * Delete OTP (for cleanup)
   */
  async deleteOtp(phone: string, purpose: OtpPurpose): Promise<void> {
    await this.otpRepo.delete({
      phone,
      purpose,
    });
  }

  /**
   * Cleanup expired OTP records
   * Can be called periodically via a scheduled job
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpRepo
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }
}
