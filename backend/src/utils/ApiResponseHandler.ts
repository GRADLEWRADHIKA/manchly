import { Response } from "express";
import { EmailService } from "../services/EmailService";

const errorEmailService = new EmailService();
const ERROR_NOTIFY_EMAIL = "abhishekkumar.11801521@gmail.com";

interface SuccessResponseData {
  [key: string]: any;
}

interface ErrorResponseData {
  message: string;
  code?: string;
  details?: any;
}

function sendErrorEmail(errorMessage: string, statusCode: number, context?: string) {
  const timestamp = new Date().toISOString();
  errorEmailService.sendEmail({
    to: ERROR_NOTIFY_EMAIL,
    subject: `[Manchly API Error] ${statusCode} - ${errorMessage.substring(0, 80)}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #e74c3c;">API Error Alert</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td style="padding: 8px;">${timestamp}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px;">${statusCode}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Error:</td><td style="padding: 8px;">${errorMessage}</td></tr>
          ${context ? `<tr><td style="padding: 8px; font-weight: bold;">Context:</td><td style="padding: 8px;">${context}</td></tr>` : ''}
        </table>
      </div>
    `,
  }).catch(err => console.error("Failed to send error notification email:", err.message));
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
    // `message` is mirrored at the top level: the mobile app reads
    // `data.message` at 44 call sites and `data.error.message` at 2, so
    // without it the screen falls through to the raw transport error
    // ("JSON Parse error", "Network Error") instead of the real reason.
    res.status(statusCode).json({
      success: false,
      message,
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
    const stack = error instanceof Error ? error.stack : undefined;

    console.log("customError------",errorMessage);

    // Send email notification for server errors
    sendErrorEmail(
      errorMessage || "An unexpected error occurred",
      statusCode,
      stack
    );

    // Same top-level mirror as customError, for the same client reason.
    const safeMessage = errorMessage || "An unexpected error occurred";
    res.status(statusCode).json({
      success: false,
      message: safeMessage,
      error: {
        message: safeMessage,
        type: "UNEXPECTED_ERROR"
      },
      timestamp: new Date().toISOString()
    });
  }
}
