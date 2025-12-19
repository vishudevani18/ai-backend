import { HttpStatus } from '@nestjs/common';

export interface BaseErrorParams {
  message: string;
  code: string;
  statusCode?: number;
  context?: Record<string, any>;
}

export class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(params: BaseErrorParams) {
    super(params.message);
    this.name = this.constructor.name;
    this.code = params.code;
    this.statusCode = params.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    this.context = params.context;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
