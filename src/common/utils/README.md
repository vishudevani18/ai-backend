# Validation Error Handling

This directory contains centralized validation error handling utilities.

## ValidationErrorUtil

A centralized utility class for formatting and handling validation errors consistently across the application.

### Features

- **Structured Error Formatting**: Converts class-validator errors into a consistent, structured format
- **Nested Object Support**: Handles validation errors for nested objects and arrays
- **Field-level Details**: Provides detailed information about each validation error including field name, value, and constraints
- **User-friendly Messages**: Generates summary messages for validation errors

### Usage

The utility is automatically used by the global ValidationPipe configured in `main.ts`. All validation errors from class-validator decorators are automatically formatted using this utility.

### Error Response Format

When validation fails, the API returns a consistent error structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: 2 error(s) found",
    "statusCode": 400,
    "timestamp": "2023-01-01T00:00:00.000Z",
    "path": "/api/v1/auth/register",
    "method": "POST",
    "requestId": "uuid",
    "details": {
      "validationErrors": [...],
      "errorCount": 2
    }
  },
  "errors": [
    {
      "field": "email",
      "value": "invalid-email",
      "constraints": {
        "isEmail": "Please provide a valid email address",
        "maxLength": "Email must not exceed 150 characters"
      }
    },
    {
      "field": "password",
      "value": "weak",
      "constraints": {
        "minLength": "Password must be at least 8 characters long",
        "matches": "Password must contain at least one uppercase letter..."
      }
    }
  ]
}
```

### Methods

#### `format(errors: ValidationError[]): FormattedValidationError`

Formats an array of validation errors into a structured format with field-level details.

#### `getConstraintMessages(errors: ValidationError[]): string[]`

Extracts all constraint messages as a flat array of strings.

#### `getSummaryMessage(errors: ValidationError[]): string`

Generates a user-friendly summary message from validation errors.

### Integration

The validation error handling is integrated at multiple levels:

1. **Global ValidationPipe** (`main.ts`): Formats all validation errors automatically
2. **HttpExceptionFilter** (`common/filters/http-exception.filter.ts`): Handles Http exceptions; validation details included via global ValidationPipe
3. **BusinessError** (`common/errors/business.error.ts`): Can be used for custom validation errors

### Example

```typescript
// Validation errors are automatically formatted when using class-validator decorators
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

When a request with invalid data is sent, the validation errors are automatically formatted and returned in the consistent structure above.

