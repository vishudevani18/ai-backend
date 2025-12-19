import { HttpStatus } from '@nestjs/common';
import { BusinessError, ErrorCode } from './business.error';

export const BusinessErrors = {
  INVALID_CREDENTIALS: () =>
    new BusinessError(
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password',
      HttpStatus.UNAUTHORIZED,
    ),

  USER_NOT_FOUND: (userId?: string) =>
    new BusinessError(ErrorCode.USER_NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND, { userId }),

  USER_ALREADY_EXISTS: (email: string) =>
    new BusinessError(
      ErrorCode.USER_ALREADY_EXISTS,
      'User with this email already exists',
      HttpStatus.CONFLICT,
      { email },
    ),

  IMAGE_GENERATION_FAILED: (prompt: string) =>
    new BusinessError(
      ErrorCode.IMAGE_GENERATION_FAILED,
      'Failed to generate image',
      HttpStatus.INTERNAL_SERVER_ERROR,
      { prompt },
    ),

  RATE_LIMIT_EXCEEDED: (limit: number, window: number) =>
    new BusinessError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Maximum ${limit} requests per ${window} seconds`,
      HttpStatus.TOO_MANY_REQUESTS,
      { limit, window },
    ),

  QUOTA_EXCEEDED: (quota: string, limit: number) =>
    new BusinessError(
      ErrorCode.QUOTA_EXCEEDED,
      `${quota} quota exceeded. Limit: ${limit}`,
      HttpStatus.TOO_MANY_REQUESTS,
      { quota, limit },
    ),

  EXTERNAL_SERVICE_ERROR: (service: string, error: string) =>
    new BusinessError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service}`,
      HttpStatus.BAD_GATEWAY,
      { service, error },
    ),
};
