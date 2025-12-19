import { Injectable, Logger } from '@nestjs/common';
import * as DOMPurify from 'isomorphic-dompurify';
import * as validator from 'validator';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

    // Use DOMPurify for additional sanitization
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    return sanitized;
  }

  sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  validateEmail(email: string): boolean {
    return validator.isEmail(email) && email.length <= 254;
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateFileUpload(file: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'application/json',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.pdf',
      '.txt',
      '.json',
    ];
    const fileExtension =
      typeof file.originalname === 'string'
        ? file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
        : '';

    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not allowed`);
    }

    // Check for malicious file names
    if (this.containsMaliciousContent(file.originalname)) {
      errors.push('File name contains potentially malicious content');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  validatePhoneNumber(phone: string): boolean {
    return validator.isMobilePhone(phone);
  }

  validateUuid(uuid: string): boolean {
    return validator.isUUID(uuid);
  }

  containsMaliciousContent(input: string): boolean {
    const maliciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // Script tags
      /javascript:/i, // JavaScript protocol
      /on\w+\s*=/i, // Event handlers
      /eval\s*\(/i, // Eval function
      /expression\s*\(/i, // CSS expression
      /vbscript:/i, // VBScript protocol
      /data:text\/html/i, // Data URI with HTML
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  validateApiKey(apiKey: string): boolean {
    // API key should be at least 32 characters and contain alphanumeric characters
    return /^[a-zA-Z0-9]{32,}$/.test(apiKey);
  }

  validateJwtToken(token: string): boolean {
    // Basic JWT format validation (3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 255); // Limit length
  }

  validateImagePrompt(prompt: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    }

    if (prompt.length > 1000) {
      errors.push('Prompt must be less than 1000 characters');
    }

    if (this.containsMaliciousContent(prompt)) {
      errors.push('Prompt contains potentially malicious content');
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ['nude', 'explicit', 'adult', 'nsfw'];
    const lowerPrompt = prompt.toLowerCase();

    if (inappropriateWords.some(word => lowerPrompt.includes(word))) {
      errors.push('Prompt contains inappropriate content');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
