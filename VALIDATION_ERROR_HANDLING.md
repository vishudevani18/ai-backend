# Validation Error Handling - Centralized Architecture

## Overview

The validation error handling system is **fully centralized and reusable** across the entire application. All validation errors are handled consistently through a single pipeline.

## Architecture

```
Request
  ↓
Global ValidationPipe (main.ts)
  ↓
ValidationErrorUtil.format() - Centralized formatting
  ↓
BadRequestException with structured data
  ↓
EnhancedExceptionFilter (Global)
  ↓
Structured Error Response
```

## Components

### 1. ValidationErrorUtil (`src/common/utils/validation-error.util.ts`)

**Purpose**: Centralized utility for formatting validation errors

**Responsibilities**:
- Formats class-validator errors into structured format
- Handles nested validation errors
- Generates user-friendly messages
- Provides field-level error details

**Key Methods**:
- `format()`: Main formatting method
- `getConstraintMessages()`: Extract messages as array
- `getSummaryMessage()`: Generate summary

### 2. Global ValidationPipe (`src/main.ts`)

**Configuration**:
- `whitelist: true` - Strips non-whitelisted properties
- `forbidNonWhitelisted: true` - Rejects unknown properties
- `transform: true` - Auto-transforms types
- `exceptionFactory` - Custom error formatting using ValidationErrorUtil

**Impact**: All validation errors across the app are automatically formatted

### 3. EnhancedExceptionFilter (`src/common/filters/enhanced-exception.filter.ts`)

**Purpose**: Global exception filter that handles all errors

**Validation Error Handling**:
- Detects BadRequestException with validation data
- Extracts structured validation errors
- Formats response with consistent structure
- Sets error code to `VALIDATION_ERROR`

**Error Response Structure**:
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: string,
    statusCode: number,
    timestamp: string,
    path: string,
    method: string,
    requestId: string,
    details?: {
      validationErrors: ValidationErrorDetail[],
      errorCount: number
    }
  },
  errors?: ValidationErrorDetail[] // Direct access to errors
}
```

## Validation Error Format

### Field-Level Error Structure

```typescript
{
  field: string;           // Field name (supports nested: "address.city")
  value: any;              // Invalid value
  constraints: {           // Validation constraint messages
    [type: string]: string;
  };
  children?: [             // Nested validation errors
    {
      field: string;
      value: any;
      constraints: {...};
    }
  ];
}
```

### Example Response

**Request**: `POST /api/v1/auth/register`
```json
{
  "email": "invalid",
  "password": "123"
}
```

**Response** (400 Bad Request):
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
    "requestId": "abc123",
    "details": {
      "validationErrors": [
        {
          "field": "email",
          "value": "invalid",
          "constraints": {
            "isEmail": "Please provide a valid email address",
            "maxLength": "Email must not exceed 150 characters"
          }
        },
        {
          "field": "password",
          "value": "123",
          "constraints": {
            "minLength": "Password must be at least 8 characters long",
            "matches": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
          }
        }
      ],
      "errorCount": 2
    }
  },
  "errors": [
    {
      "field": "email",
      "value": "invalid",
      "constraints": {
        "isEmail": "Please provide a valid email address",
        "maxLength": "Email must not exceed 150 characters"
      }
    },
    {
      "field": "password",
      "value": "123",
      "constraints": {
        "minLength": "Password must be at least 8 characters long",
        "matches": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }
    }
  ]
}
```

## Usage

### Automatic (Recommended)

Simply use class-validator decorators in your DTOs. Validation errors are automatically formatted:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Manual (If Needed)

```typescript
import { ValidationErrorUtil } from './common/utils/validation-error.util';
import { validate } from 'class-validator';

const errors = await validate(dto);
if (errors.length > 0) {
  const formatted = ValidationErrorUtil.format(errors);
  // Use formatted.errors, formatted.message, etc.
}
```

## Benefits

✅ **Centralized**: Single source of truth for validation error formatting  
✅ **Consistent**: All validation errors have the same structure  
✅ **Reusable**: Works automatically for all DTOs with class-validator  
✅ **Detailed**: Field-level error information  
✅ **Nested Support**: Handles complex nested objects  
✅ **Type-safe**: Full TypeScript support  
✅ **Developer-friendly**: Easy to parse and display errors in frontend

## Testing

All validation errors are automatically tested through:
- Global ValidationPipe integration
- EnhancedExceptionFilter integration
- All DTO validation decorators

## Migration Notes

If you have existing custom validation handling, it will automatically use this centralized system. No changes needed unless you want to leverage additional features.

