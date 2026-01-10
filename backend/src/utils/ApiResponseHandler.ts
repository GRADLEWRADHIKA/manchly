import { Response } from "express";

interface SuccessResponseData {
  [key: string]: any;
}

interface ErrorResponseData {
  message: string;
  code?: string;
  details?: any;
}

export class ApiResponseHandler {
  /**
   * Send a successful response
   * @param res - Express Response object
   * @param data - Response data
   * @param message - Success message
   * @param statusCode - HTTP status code (default: 200)
   */
  static success(
    res: Response,
    data: SuccessResponseData = {},
    message: string = "Success",
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send a custom error response
   * @param res - Express Response object
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 400)
   * @param code - Custom error code
   * @param details - Additional error details
   */
  static customError(
    res: Response,
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: any
  ): void {
    const errorResponse: ErrorResponseData = {
      message,
      ...(code && { code }),
      ...(details && { details })
    };
   console.log("customError------",errorResponse);
    res.status(statusCode).json({
      success: false,
      error: errorResponse,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send an unexpected error response
   * @param res - Express Response object
   * @param error - Error object or message
   * @param statusCode - HTTP status code (default: 500)
   */
  static unexpectedError(
    res: Response,
    error: Error | string,
    statusCode: number = 500
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;

    console.log("customError------",errorMessage);
    
    res.status(statusCode).json({
      success: false,
      error: {
        message: errorMessage || "An unexpected error occurred",
        type: "UNEXPECTED_ERROR"
      },
      timestamp: new Date().toISOString()
    });
  }
}
