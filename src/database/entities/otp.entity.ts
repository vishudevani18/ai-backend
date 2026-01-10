import { Entity, Column, Index, Check } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OtpPurpose } from '../../common/constants/auth.constants';

@Entity('otps')
@Index(['phone', 'purpose', 'expiresAt'])
@Index(['sessionToken'], { where: 'session_token IS NOT NULL' })
@Index(['expiresAt'], { where: 'expires_at < NOW()' })
@Check(`"attempts" >= 0`)
@Check(`"phone" ~ '^\\+91[6-9]\\d{9}$'`)
export class Otp extends BaseEntity {
  @Index()
  @Column({ name: 'phone', length: 20 })
  phone: string;

  @Column({ name: 'otp_hash', type: 'varchar', length: 255 })
  otpHash: string;

  @Index()
  @Column({
    name: 'purpose',
    type: 'enum',
    enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({ name: 'attempts', type: 'integer', default: 0 })
  attempts: number;

  @Column({ name: 'session_token', type: 'varchar', length: 64, nullable: true })
  sessionToken?: string | null;

  @Column({ name: 'session_expires_at', type: 'timestamp with time zone', nullable: true })
  sessionExpiresAt?: Date | null;
}
