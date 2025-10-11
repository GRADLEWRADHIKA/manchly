# API Response Handler Usage Guide

## Overview
The `ApiResponseHandler` class provides standardized response formatting for all API endpoints. It includes three main methods for different response types.

## Methods

### 1. `ApiResponseHandler.success(res, data, message, statusCode)`
Used for successful API responses.

**Parameters:**
- `res`: Express Response object
- `data`: Response data object (optional, default: {})
- `message`: Success message (optional, default: "Success")
- `statusCode`: HTTP status code (optional, default: 200)

**Example:**
```typescript
ApiResponseHandler.success(res, { user: userData }, "User created successfully", 201);
```

**Response Format:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": { ... }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. `ApiResponseHandler.customError(res, message, statusCode, code, details)`
Used for expected/business logic errors.

**Parameters:**
- `res`: Express Response object
- `message`: Error message
- `statusCode`: HTTP status code (optional, default: 400)
- `code`: Custom error code (optional)
- `details`: Additional error details (optional)

**Example:**
```typescript
ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
```

**Response Format:**
```json
{
  "success": false,
  "error": {
    "message": "Email is required",
    "code": "MISSING_EMAIL"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. `ApiResponseHandler.unexpectedError(res, error, statusCode)`
Used for unexpected/server errors.

**Parameters:**
- `res`: Express Response object
- `error`: Error object or error message
- `statusCode`: HTTP status code (optional, default: 500)

**Example:**
```typescript
ApiResponseHandler.unexpectedError(res, err, 500);
```

**Response Format:**
```json
{
  "success": false,
  "error": {
    "message": "Database connection failed",
    "type": "UNEXPECTED_ERROR"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Implementation Examples

### Before (Old Way)
```typescript
// Inconsistent response formats
if (!email) return res.status(400).json({ error: "Email is required" });
res.json({ status: true, user: userData, message: "Success" });
res.status(500).json({ error: err.message });
```

### After (New Way)
```typescript
// Consistent response formats
if (!email) {
  return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
}
ApiResponseHandler.success(res, { user: userData }, "User created successfully");
ApiResponseHandler.unexpectedError(res, err, 500);
```

## Benefits

1. **Consistency**: All API responses follow the same format
2. **Standardization**: Easy to parse responses on the frontend
3. **Error Codes**: Custom error codes for better error handling
4. **Timestamps**: All responses include timestamps
5. **Type Safety**: Better TypeScript support
6. **Maintainability**: Centralized response logic

## Error Codes Used

- `MISSING_EMAIL`: Email field is required
- `MISSING_PHONE`: Phone field is required
- `INVALID_EMAIL_FORMAT`: Email format is invalid
- `INVALID_PHONE_FORMAT`: Phone format is invalid
- `USER_NOT_FOUND`: User does not exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `OTP_ALREADY_SENT`: OTP already sent
- `OTP_VERIFICATION_FAILED`: OTP verification failed
- `NO_FILE_UPLOADED`: No file provided
- `FILE_TOO_LARGE`: File exceeds size limit
- `UPLOAD_FAILED`: File upload failed
- `SERVICE_UNHEALTHY`: Service is down
