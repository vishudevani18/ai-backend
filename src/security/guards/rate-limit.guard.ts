import {
  RATE_LIMIT_METADATA_KEY,
  RATE_LIMIT_DEFAULT_MESSAGE,
  X_RATE_LIMIT_LIMIT_HEADER,
  X_RATE_LIMIT_REMAINING_HEADER,
  X_RATE_LIMIT_RESET_HEADER,
} from '../../common/constants/security.constants';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiSecurityService } from '../services/api-security.service';
import { BusinessErrors } from 'src/common/errors/error.factory';

export interface RateLimitOptions {
  limit: number;
  window: number; // in seconds
  message?: string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiSecurityService: ApiSecurityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip; // Use user ID or IP as identifier
    const endpoint = this.getEndpointPath(request);

    const { allowed, info } = await this.apiSecurityService.checkRateLimit(
      userId,
      endpoint,
      options.limit,
      options.window,
    );

    if (!allowed) {
      throw new HttpException(
        {
          ...BusinessErrors.RATE_LIMIT_EXCEEDED(options.limit, options.window).toJSON(),
          retryAfter: Math.ceil((info.resetTime.getTime() - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit info to response headers
    const response = context.switchToHttp().getResponse();
    response.setHeader(X_RATE_LIMIT_LIMIT_HEADER, info.limit);
    response.setHeader(X_RATE_LIMIT_REMAINING_HEADER, Math.max(0, info.limit - info.count));
    response.setHeader(X_RATE_LIMIT_RESET_HEADER, Math.ceil(info.resetTime.getTime() / 1000));

    return true;
  }

  private getEndpointPath(request: any): string {
    // Create a consistent endpoint path for rate limiting
    const method = request.method;
    const path = request.route?.path || request.url.split('?')[0];

    // Normalize dynamic routes
    const normalizedPath = path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9-]{24}/g, '/:objectId');

    return `${method}:${normalizedPath}`;
  }
}
