import TTLCache from 'ttl-cache';
import nodemailer from 'nodemailer';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterMemory, IRateLimiterOptions } from 'rate-limiter-flexible';

interface OTPConfig {
  length?: number;
  ttl?: number; // Time to live in seconds
  maxAttempts?: number;
  allowedChars?: string;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
}

interface OTPData {
  otp: string;
  attempts: number;
  createdAt: Date;
  verified?: boolean;
  identifier: string;
  channel: 'email' | 'sms';
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface SMSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  senderId?: string;
}

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

class OTPManager {
  private cache: TTLCache<string, OTPData>;
  private defaultConfig: Required<OTPConfig>;
  private emailTransporter: nodemailer.Transporter | null = null;
  private snsClient: SNSClient | null = null;
  private redisClient: Redis | null = null;
  private rateLimiter: RateLimiterRedis | RateLimiterMemory;

  constructor(
    config: OTPConfig = {},
    emailConfig?: EmailConfig,
    smsConfig?: SMSConfig,
    redisConfig?: RedisConfig
  ) {
    this.defaultConfig = {
      length: config.length || 6,
      ttl: config.ttl || 300, // 5 minutes default
      maxAttempts: config.maxAttempts || 3,
      allowedChars: config.allowedChars || '0123456789',
      emailEnabled: config.emailEnabled || false,
      smsEnabled: config.smsEnabled || false
    };

    this.cache = new TTLCache({
      ttl: this.defaultConfig.ttl * 1000, // Convert to milliseconds
      checkAgeOnGet: true
    });

    // Initialize Email Transporter
    if (emailConfig && this.defaultConfig.emailEnabled) {
      this.emailTransporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.auth.user,
          pass: emailConfig.auth.pass,
        },
      });
    }

    // Initialize AWS SNS Client
    if (smsConfig && this.defaultConfig.smsEnabled) {
      this.snsClient = new SNSClient({
        region: smsConfig.region,
        credentials: {
          accessKeyId: smsConfig.accessKeyId,
          secretAccessKey: smsConfig.secretAccessKey,
        },
      });
    }

    // Initialize Redis Client
    if (redisConfig) {
      try {
        // Support both URL and individual config
        if (redisConfig.url) {
          // Use URL format (e.g., rediss://...)
          this.redisClient = new Redis(redisConfig.url, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
              if (times > 3) {
                console.warn('Redis connection failed after 3 retries, falling back to memory storage');
                return null; // Stop retrying
              }
              return Math.min(times * 100, 3000);
            },
          });
        } else {
          // Use individual config
          this.redisClient = new Redis({
            host: redisConfig.host!,
            port: redisConfig.port!,
            password: redisConfig.password,
            db: redisConfig.db || 0,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
              if (times > 3) {
                console.warn('Redis connection failed after 3 retries, falling back to memory storage');
                return null; // Stop retrying
              }
              return Math.min(times * 100, 3000);
            },
          });
        }

        // Handle Redis connection success
        this.redisClient.on('connect', () => {
          console.log('✅ Redis connected successfully');
        });

        this.redisClient.on('ready', () => {
          console.log('✅ Redis is ready to accept commands');
        });

        // Handle Redis errors gracefully
        this.redisClient.on('error', (err) => {
          console.warn('⚠️ Redis connection error, using memory storage:', err.message);
          this.redisClient = null;
        });

        // Try to connect
        this.redisClient.connect()
          .then(() => {
            console.log('✅ Redis connection established');
          })
          .catch((err) => {
            console.warn('⚠️ Failed to connect to Redis, using memory storage:', err.message);
            this.redisClient = null;
          });

        // Initialize Rate Limiter with Redis
        this.rateLimiter = new RateLimiterRedis({
          storeClient: this.redisClient,
          keyPrefix: 'otp_rate_limit',
          points: 5, // Number of OTP requests
          duration: 300, // Per 5 minutes
        });
      } catch (error) {
        console.warn('Redis initialization failed, using memory storage');
        this.redisClient = null;
        // Fallback to memory-based rate limiter
        this.rateLimiter = new RateLimiterMemory({
          keyPrefix: 'otp_rate_limit',
          points: 5,
          duration: 300,
        });
      }
    } else {
      // Fallback to memory-based rate limiter
      this.rateLimiter = new RateLimiterMemory({
        keyPrefix: 'otp_rate_limit',
        points: 5,
        duration: 300,
      });
    }
  }

  /**
   * Generate a random OTP
   */
  private generateOTP(length: number = this.defaultConfig.length): string {
    const { allowedChars } = this.defaultConfig;
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allowedChars.length);
      otp += allowedChars[randomIndex];
    }
    
    return otp;
  }

  /**
   * Check rate limiting for an identifier
   */
  private async checkRateLimit(identifier: string): Promise<void> {
    try {
      await this.rateLimiter.consume(identifier);
    } catch (rejRes) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  /**
   * Store OTP data in Redis
   */
  private async storeInRedis(identifier: string, otpData: OTPData): Promise<void> {
    if (this.redisClient) {
      const key = `otp:${identifier}`;
      await this.redisClient.setex(
        key,
        this.defaultConfig.ttl,
        JSON.stringify(otpData)
      );
    } else {
      // Fallback to in-memory cache
      this.cache.set(identifier, otpData);
    }
  }

  /**
   * Get OTP data from Redis
   */
  private async getFromRedis(identifier: string): Promise<OTPData | null> {
    if (this.redisClient) {
      const key = `otp:${identifier}`;
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback to in-memory cache
      return this.cache.get(identifier) || null;
    }
  }

  /**
   * Delete OTP data from Redis
   */
  private async deleteFromRedis(identifier: string): Promise<void> {
    if (this.redisClient) {
      const key = `otp:${identifier}`;
      await this.redisClient.del(key);
    } else {
      // Fallback to in-memory cache
      this.cache.delete(identifier);
    }
  }

  /**
   * Send OTP to a recipient (identifier)
   */
  async sendOTP(
    identifier: string, 
    customLength?: number, 
    channel: 'email' | 'sms' = 'email'
  ): Promise<string> {
    // Check rate limiting
    await this.checkRateLimit(identifier);

    // Validate channel configuration
    if (channel === 'email' && !this.defaultConfig.emailEnabled) {
      throw new Error('Email OTP is not enabled');
    }
    if (channel === 'sms' && !this.defaultConfig.smsEnabled) {
      throw new Error('SMS OTP is not enabled');
    }

    // Check if OTP already exists and hasn't expired
    const existingOTP = await this.getFromRedis(identifier);
    if (existingOTP && !existingOTP.verified) {
      throw new Error(`OTP already sent to ${identifier}. Please wait for it to expire.`);
    }

    const otpLength = customLength || this.defaultConfig.length;
    const otp = this.generateOTP(otpLength);

    const otpData: OTPData = {
      otp,
      attempts: 0,
      createdAt: new Date(),
      verified: false,
      identifier,
      channel
    };

    // Store OTP data
    await this.storeInRedis(identifier, otpData);
    
    // Send OTP via appropriate channel
    try {
      if (channel === 'email') {
        // await this.sendEmailOTP(identifier, otp); // Commented out for testing
        console.log(`📧 OTP for ${identifier}: ${otp}`);
      } else {
        // await this.sendSMSOTP(identifier, otp); // Commented out for testing
        console.log(`📱 OTP for ${identifier}: ${otp}`);
      }
    } catch (error) {
      await this.deleteFromRedis(identifier);
      throw new Error(`Failed to send OTP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return otp;
  }

  /**
   * Send OTP via Email using Nodemailer
   */
  private async sendEmailOTP(email: string, otp: string): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    console.log("email",email);

    console.log("Email Transporter configured:", !!this.emailTransporter);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'manchly2025@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      html: this.generateEmailTemplate(otp),
    };

    await this.emailTransporter.sendMail(mailOptions);
    console.log(`📧 OTP sent to ${email}: ${otp}`);
  }

  /**
   * Send OTP via SMS using AWS SNS
   */
  private async sendSMSOTP(phoneNumber: string, otp: string): Promise<void> {
    if (!this.snsClient) {
      throw new Error('SMS client not configured');
    }

    const message = `Your OTP code is: ${otp}. It will expire in ${Math.floor(this.defaultConfig.ttl / 60)} minutes.`;

    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: process.env.SMS_SENDER_ID || 'OTPService',
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });

    await this.snsClient.send(command);
    console.log(`📱 OTP sent to ${phoneNumber}: ${otp}`);
  }

  /**
   * Generate HTML email template for OTP
   */
  private generateEmailTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
          .expiry { color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Your Verification Code</h2>
          <p>Use the following OTP code to complete your verification:</p>
          <div class="otp-code">${otp}</div>
          <p class="expiry">This code will expire in ${Math.floor(this.defaultConfig.ttl / 60)} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Verify OTP for a recipient
   */
  async verifyOTP(identifier: string, otp: string): Promise<{ success: boolean; message: string }> {
    const otpData = await this.getFromRedis(identifier);

    if (!otpData) {
      return { success: false, message: 'OTP not found or expired' };
    }

    if (otpData.verified) {
      return { success: false, message: 'OTP already verified' };
    }

    if (otpData.attempts >= this.defaultConfig.maxAttempts) {
      await this.deleteFromRedis(identifier);
      return { success: false, message: 'Maximum verification attempts exceeded' };
    }

    otpData.attempts++;

    if (otpData.otp !== otp) {
      await this.storeInRedis(identifier, otpData); // Update attempts count
      
      const remainingAttempts = this.defaultConfig.maxAttempts - otpData.attempts;
      return { 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      };
    }

    // OTP is correct
    otpData.verified = true;
    await this.storeInRedis(identifier, otpData);

    return { success: true, message: 'OTP verified successfully' };
  }

  /**
   * Resend OTP to a recipient
   */
  async resendOTP(identifier: string, channel?: 'email' | 'sms'): Promise<string> {
    const existingData = await this.getFromRedis(identifier);
    const resendChannel = channel || existingData?.channel || 'email';
    
    await this.deleteFromRedis(identifier);
    return this.sendOTP(identifier, undefined, resendChannel);
  }

  /**
   * Check if OTP exists and is valid for a recipient
   */
  async hasValidOTP(identifier: string): Promise<boolean> {
    const otpData = await this.getFromRedis(identifier);
    return !!(otpData && !otpData.verified && otpData.attempts < this.defaultConfig.maxAttempts);
  }

  /**
   * Get OTP data for a recipient
   */
  async getOTPData(identifier: string): Promise<OTPData | null> {
    return await this.getFromRedis(identifier);
  }

  /**
   * Invalidate OTP for a recipient
   */
  async invalidateOTP(identifier: string): Promise<void> {
    await this.deleteFromRedis(identifier);
  }

  /**
   * Get statistics about OTP usage
   */
  async getStats(): Promise<{ activeOTPs: number; redisEnabled: boolean }> {
    if (this.redisClient) {
      // Get all OTP keys from Redis
      const keys = await this.redisClient.keys('otp:*');
      return {
        activeOTPs: keys.length,
        redisEnabled: true
      };
    } else {
      const keys = Array.from(this.cache.keys());
      return {
        activeOTPs: keys.length,
        redisEnabled: false
      };
    }
  }

  /**
   * Clear all OTPs
   */
  async clearAll(): Promise<void> {
    if (this.redisClient) {
      const keys = await this.redisClient.keys('otp:*');
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    if (this.emailTransporter) {
      this.emailTransporter.close();
    }
  }
}

export default OTPManager;