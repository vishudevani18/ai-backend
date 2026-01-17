import { FileValidator, Injectable } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class FileValidationPipe extends FileValidator<Record<string, unknown>> {
  constructor(validationOptions: Record<string, unknown> = {}) {
    super(validationOptions);
  }

  buildErrorMessage(file: IFile | Express.Multer.File): string {
    if (!file) {
      return 'File is required';
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`;
    }

    return 'File validation failed';
  }

  isValid(file: IFile | Express.Multer.File): boolean | Promise<boolean> {
    if (!file) {
      return false;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return false;
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return false;
    }

    // Sanitize filename for Express.Multer.File
    if ('originalname' in file && file.originalname) {
      (file as Express.Multer.File).originalname = this.sanitizeFilename(file.originalname);
    }

    return true;
  }

  private sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '').replace(/\//g, '').replace(/\\/g, '');

    // Remove special characters except dots, hyphens, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');

    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }

    return sanitized || 'image';
  }
}
