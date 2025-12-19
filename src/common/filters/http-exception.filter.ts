import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response.util';

// ========================================================================
// 1. HttpExceptionFilter — handles all known NestJS HTTP exceptions
// ========================================================================
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const resp = exception.getResponse();

    const message =
      typeof resp === 'string'
        ? resp
        : (resp as any).message || exception.message || 'An error occurred';

    const requestId = (request as any).requestId || 'unknown';

    // Log error
    this.logger.error(`${request.method} ${request.url} -> ${message}`, exception.stack);

    const errorResponse = ResponseUtil.error(null, message, requestId);

    return response.status(status).json(errorResponse);
  }
}

// ========================================================================
// 2. AllExceptionsFilter — catches *everything else*, including PostgreSQL
// ========================================================================
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    const requestId = (request as any).requestId || 'unknown';

    // --------------------------------------------------------------------
    // PostgreSQL error handling (very important for scalable API)
    // --------------------------------------------------------------------
    if (exception?.code) {
      switch (exception.code) {
        case '23505': // unique_violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Duplicate value. This record already exists.';
          break;

        case '23503': // foreign_key_violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference. Related resource does not exist.';
          break;

        case '23502': // not_null_violation
          status = HttpStatus.BAD_REQUEST;
          message = `Missing required field: ${exception.column}`;
          break;

        case '23514': // check_violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Constraint validation failed.';
          break;

        case '22P02': // invalid_text_representation (bad UUID, number, etc.)
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid input format (e.g., invalid UUID).';
          break;

        case '22001': // string_data_right_truncation
          status = HttpStatus.BAD_REQUEST;
          message = `Value too long for column: ${exception.column}`;
          break;

        default:
          status = HttpStatus.BAD_REQUEST;
          message = exception.detail || 'Database error.';
          break;
      }
    }

    // --------------------------------------------------------------------
    // If it's a NestJS HttpException
    // --------------------------------------------------------------------
    else if (exception instanceof HttpException) {
      status = exception.getStatus();

      const resp = exception.getResponse();
      message =
        typeof resp === 'string'
          ? resp
          : (resp as any).message || exception.message || 'An error occurred';
    }

    // --------------------------------------------------------------------
    // If it's a standard Error
    // --------------------------------------------------------------------
    else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
    }

    // --------------------------------------------------------------------
    // Logging
    // --------------------------------------------------------------------
    this.logger.error(
      `${request.method} ${request.url} -> ${message}`,
      exception.stack || exception,
    );

    // --------------------------------------------------------------------
    // Unified error response
    // --------------------------------------------------------------------
    const errorResponse = ResponseUtil.error(null, message, requestId);

    return response.status(status).json(errorResponse);
  }
}
