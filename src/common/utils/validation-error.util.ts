import { ValidationError } from 'class-validator';

export interface ValidationErrorDetail {
  field: string;
  value: any;
  constraints: {
    [type: string]: string;
  };
  children?: ValidationErrorDetail[];
}

export interface FormattedValidationError {
  message: string;
  errors: ValidationErrorDetail[];
  errorCount: number;
}

/**
 * Formats class-validator ValidationError array into a structured format
 */
export class ValidationErrorUtil {
  /**
   * Format validation errors into a user-friendly structure
   */
  static format(errors: ValidationError[]): FormattedValidationError {
    const formattedErrors = this.formatErrors(errors);

    const errorCount = formattedErrors.length;
    const message =
      errorCount === 1 ? 'Validation failed' : `Validation failed: ${errorCount} error(s) found`;

    return {
      message,
      errors: formattedErrors,
      errorCount,
    };
  }

  /**
   * Recursively format validation errors including nested objects
   */
  private static formatErrors(
    errors: ValidationError[],
    parentPath: string = '',
  ): ValidationErrorDetail[] {
    const formatted: ValidationErrorDetail[] = [];

    for (const error of errors) {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      const errorDetail: ValidationErrorDetail = {
        field: fieldPath,
        value: error.value !== undefined ? error.value : null,
        constraints: error.constraints || {},
      };

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        errorDetail.children = this.formatErrors(error.children, fieldPath);
      }

      // Only add if there are constraints or children
      if (Object.keys(errorDetail.constraints).length > 0 || errorDetail.children?.length > 0) {
        formatted.push(errorDetail);
      }
    }

    return formatted;
  }

  /**
   * Get all constraint messages as a flat array
   */
  static getConstraintMessages(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    const extractMessages = (errorList: ValidationError[], path: string = '') => {
      for (const error of errorList) {
        const fieldPath = path ? `${path}.${error.property}` : error.property;

        if (error.constraints) {
          Object.values(error.constraints).forEach(message => {
            messages.push(`${fieldPath}: ${message}`);
          });
        }

        if (error.children && error.children.length > 0) {
          extractMessages(error.children, fieldPath);
        }
      }
    };

    extractMessages(errors);
    return messages;
  }

  /**
   * Get a user-friendly summary message
   */
  static getSummaryMessage(errors: ValidationError[]): string {
    const formatted = this.format(errors);
    if (formatted.errorCount === 0) {
      return 'No validation errors';
    }

    const fieldNames = formatted.errors.map(e => e.field).join(', ');
    return `${formatted.message}. Fields: ${fieldNames}`;
  }
}
