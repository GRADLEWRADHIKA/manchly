import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';

interface ZoomConfig {
  apiKey: string;
  apiSecret: string;
  accountId?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  redirectUri?: string;
  timeout?: number;
}

export type ZoomAuthMode = "s2s" | "jwt";

export interface ZoomConfigurationStatus {
  isConfigured: boolean;
  mode: ZoomAuthMode | null;
  missing: string[];
}

const ZOOM_SETUP_MESSAGE =
  "Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET " +
  "(Server-to-Server OAuth) in your environment variables. " +
  "Legacy JWT auth is also supported via ZOOM_API_KEY and ZOOM_API_SECRET.";

export function resolveZoomConfig(): ZoomConfig {
  return {
    apiKey: process.env.ZOOM_API_KEY?.trim() || "",
    apiSecret: process.env.ZOOM_API_SECRET?.trim() || "",
    accountId: process.env.ZOOM_ACCOUNT_ID?.trim() || undefined,
    oauthClientId:
      process.env.ZOOM_CLIENT_ID?.trim() ||
      process.env.ZOOM_OAUTH_CLIENT_ID?.trim() ||
      undefined,
    oauthClientSecret:
      process.env.ZOOM_CLIENT_SECRET?.trim() ||
      process.env.ZOOM_OAUTH_CLIENT_SECRET?.trim() ||
      undefined,
    redirectUri: process.env.ZOOM_REDIRECT_URI?.trim(),
  };
}

export function getZoomConfigurationStatus(
  config: ZoomConfig = resolveZoomConfig()
): ZoomConfigurationStatus {
  const hasS2S =
    !!config.accountId && !!config.oauthClientId && !!config.oauthClientSecret;
  const hasJWT = !!config.apiKey && !!config.apiSecret;

  if (hasS2S) {
    return { isConfigured: true, mode: "s2s", missing: [] };
  }

  if (hasJWT) {
    return { isConfigured: true, mode: "jwt", missing: [] };
  }

  const missing: string[] = [];
  const partialS2S =
    !!config.accountId || !!config.oauthClientId || !!config.oauthClientSecret;

  if (partialS2S || !hasJWT) {
    if (!config.accountId) missing.push("ZOOM_ACCOUNT_ID");
    if (!config.oauthClientId) {
      missing.push("ZOOM_CLIENT_ID (or ZOOM_OAUTH_CLIENT_ID)");
    }
    if (!config.oauthClientSecret) {
      missing.push("ZOOM_CLIENT_SECRET (or ZOOM_OAUTH_CLIENT_SECRET)");
    }
  }

  if (!partialS2S && !hasJWT) {
    return {
      isConfigured: false,
      mode: null,
      missing: [
        "ZOOM_ACCOUNT_ID",
        "ZOOM_CLIENT_ID (or ZOOM_OAUTH_CLIENT_ID)",
        "ZOOM_CLIENT_SECRET (or ZOOM_OAUTH_CLIENT_SECRET)",
      ],
    };
  }

  return { isConfigured: false, mode: null, missing };
}
export function createZoomMeetingManager(config: ZoomConfig = resolveZoomConfig()): ZoomMeetingManager {
  return new ZoomMeetingManager(config);
}

interface CreateMeetingOptions {
  topic: string;
  agenda?: string;
  type?: 1 | 2 | 3 | 8; // 1=Instant, 2=Scheduled, 3=Recurring, 8=Recurring fixed time
  start_time?: string; // ISO 8601 format
  duration?: number; // in minutes
  timezone?: string;
  password?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    audio?: 'both' | 'telephony' | 'voip';
    auto_recording?: 'local' | 'cloud' | 'none';
    alternative_hosts?: string;
    close_registration?: boolean;
    show_share_button?: boolean;
    allow_multiple_devices?: boolean;
    registrants_confirmation_email?: boolean;
    meeting_authentication?: boolean;
    authentication_options?: {
      meeting_password?: boolean;
    };
  };
}

interface Meeting {
  id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  start_url: string;
  password: string;
  agenda: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    waiting_room: boolean;
    audio: string;
    auto_recording: string;
    alternative_hosts: string;
  };
}

interface Registrant {
  id?: string;
  email: string;
  first_name: string;
  last_name?: string;
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
  state?: string;
  phone?: string;
  industry?: string;
  org?: string;
  job_title?: string;
  purchasing_time_frame?: string;
  role_in_purchase_process?: string;
  no_of_employees?: string;
  comments?: string;
  custom_questions?: Array<{
    title: string;
    value: string;
  }>;
  status?: 'approved' | 'pending' | 'denied';
  join_url?: string;
}

interface AddRegistrantOptions {
  auto_approve?: boolean;
}

interface ListMeetingsOptions {
  type?: 'scheduled' | 'live' | 'upcoming' | 'previous';
  page_size?: number;
  page_number?: number;
}

class ZoomMeetingManager {
  private client: AxiosInstance;
  private config: ZoomConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private configurationStatus: ZoomConfigurationStatus;

  constructor(config: ZoomConfig) {
    this.config = config;
    this.configurationStatus = getZoomConfigurationStatus(config);

    if (!this.configurationStatus.isConfigured) {
      console.warn(
        "⚠️  [Zoom] Invalid Zoom configuration — webinar meeting creation is disabled until credentials are set.\n" +
          `    Missing: ${this.configurationStatus.missing.join(", ")}\n` +
          `    ${ZOOM_SETUP_MESSAGE}`
      );
    } else {
      console.info(
        `✅ [Zoom] Configured for ${this.configurationStatus.mode === "s2s" ? "Server-to-Server OAuth" : "legacy JWT"} authentication.`
      );
    }

    this.client = axios.create({
      baseURL: 'https://api.zoom.us/v2',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to handle authentication
    this.client.interceptors.request.use(async (config) => {
      if (!this.accessToken || this.isTokenExpired()) {
        await this.authenticate();
      }
      config.headers.Authorization = `Bearer ${this.accessToken}`;
      return config;
    });

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token might be expired, try to reauthenticate
          this.accessToken = null;
          this.tokenExpiry = null;
        }
        return Promise.reject(error);
      }
    );
  }
  isConfigured(): boolean {
    return this.configurationStatus.isConfigured;
  }
  private ensureConfigured(): void {
    if (this.configurationStatus.isConfigured) {
      return;
    }

    const missing = this.configurationStatus.missing.join(", ");
    console.error(
      `[Zoom] Invalid Zoom configuration. Missing environment variables: ${missing}. ${ZOOM_SETUP_MESSAGE}`
    );
    throw new Error(
      `Invalid Zoom configuration. Missing: ${missing}. ${ZOOM_SETUP_MESSAGE}`
    );
  }

  private async authenticate(): Promise<void> {
    try {
      this.ensureConfigured();

      const hasS2S =
        !!this.config.accountId &&
        !!this.config.oauthClientId &&
        !!this.config.oauthClientSecret;

      if (hasS2S) {
        const token = await this.getServerToServerToken();
        this.accessToken = token.access_token;
        this.tokenExpiry = new Date(Date.now() + (token.expires_in - 60) * 1000);
      }

      else if (this.config.apiKey && this.config.apiSecret) {
        this.accessToken = this.generateJWTToken();
        this.tokenExpiry = new Date(Date.now() + 59 * 60 * 1000);
      } else {
        throw new Error(
          `Invalid Zoom configuration. Missing: ${this.configurationStatus.missing.join(", ")}. ${ZOOM_SETUP_MESSAGE}`
        );
      }
    } catch (error) {
      throw new Error(`Zoom authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private generateJWTToken(): string {
    const payload = {
      iss: this.config.apiKey,
      exp: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.config.apiSecret!)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private async getServerToServerToken(): Promise<{ access_token: string; expires_in: number }> {
    const credentials = Buffer.from(`${this.config.oauthClientId}:${this.config.oauthClientSecret}`).toString('base64');
    
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'account_credentials',
        account_id: this.config.accountId,
      },
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return new Date() >= this.tokenExpiry;
  }

  /**
   * ============ MEETING MANAGEMENT ============
   */

  /**
   * Create a new Zoom meeting
   */
  async createMeeting(userId: string = 'me', options: CreateMeetingOptions): Promise<Meeting> {
    try {
      this.ensureConfigured();

      const meetingData = {
        topic: options.topic,
        type: options.type || 2, // Default to scheduled meeting
        start_time: options.start_time,
        duration: options.duration || 60,
        timezone: options.timezone || 'UTC',
        password: options.password || this.generateMeetingPassword(),
        agenda: options.agenda,
        settings: {
          host_video: options.settings?.host_video ?? true,
          participant_video: options.settings?.participant_video ?? true,
          join_before_host: options.settings?.join_before_host ?? false,
          mute_upon_entry: options.settings?.mute_upon_entry ?? false,
          waiting_room: options.settings?.waiting_room ?? true,
          audio: options.settings?.audio || 'both',
          auto_recording: options.settings?.auto_recording || 'none',
          alternative_hosts: options.settings?.alternative_hosts,
          close_registration: options.settings?.close_registration ?? false,
          show_share_button: options.settings?.show_share_button ?? true,
          allow_multiple_devices: options.settings?.allow_multiple_devices ?? false,
          registrants_confirmation_email: options.settings?.registrants_confirmation_email ?? true,
          meeting_authentication: options.settings?.meeting_authentication ?? false,
          authentication_options: options.settings?.authentication_options,
        },
      };

      const response: AxiosResponse<Meeting> = await this.client.post(`/users/${userId}/meetings`, meetingData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get meeting details
   */
  async getMeeting(meetingId: string): Promise<Meeting> {
    try {
      const response: AxiosResponse<Meeting> = await this.client.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update a meeting
   */
  async updateMeeting(meetingId: string, options: Partial<CreateMeetingOptions>): Promise<void> {
    try {
      await this.client.patch(`/meetings/${meetingId}`, options);
    } catch (error: any) {
      throw new Error(`Failed to update meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await this.client.delete(`/meetings/${meetingId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * List all meetings for a user
   */
  async listMeetings(userId: string = 'me', options: ListMeetingsOptions = {}): Promise<Meeting[]> {
    try {
      const response: AxiosResponse<{ meetings: Meeting[] }> = await this.client.get(`/users/${userId}/meetings`, {
        params: {
          type: options.type || 'scheduled',
          page_size: options.page_size || 30,
          page_number: options.page_number || 1,
        },
      });
      return response.data.meetings;
    } catch (error: any) {
      throw new Error(`Failed to list meetings: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * ============ REGISTRANT MANAGEMENT ============
   */

  /**
   * Add a registrant to a meeting
   */
  async addRegistrant(meetingId: string, registrant: Registrant, options: AddRegistrantOptions = {}): Promise<Registrant> {
    try {
      const response: AxiosResponse<Registrant> = await this.client.post(
        `/meetings/${meetingId}/registrants`,
        registrant,
        {
          params: {
            occurrence_ids: 'all',
            auto_approve: options.auto_approve ?? true,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add registrant: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Add multiple registrants to a meeting
   */
  async addRegistrants(meetingId: string, registrants: Registrant[]): Promise<{ registrants: Registrant[] }> {
    try {
      const response: AxiosResponse<{ registrants: Registrant[] }> = await this.client.post(
        `/meetings/${meetingId}/batch_registrants`,
        {
          registrants,
          auto_approve: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add registrants: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * List all registrants for a meeting
   */
  async listRegistrants(meetingId: string, status: 'approved' | 'pending' | 'denied' = 'approved'): Promise<Registrant[]> {
    try {
      const response: AxiosResponse<{ registrants: Registrant[] }> = await this.client.get(
        `/meetings/${meetingId}/registrants`,
        {
          params: {
            status,
            occurrence_id: 'all',
            page_size: 300, // Maximum allowed by Zoom
          },
        }
      );
      return response.data.registrants;
    } catch (error: any) {
      throw new Error(`Failed to list registrants: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update registrant status
   */
  async updateRegistrantStatus(meetingId: string, registrantId: string, status: 'approve' | 'deny'): Promise<void> {
    try {
      await this.client.put(`/meetings/${meetingId}/registrants/status`, {
        action: status,
        registrants: [{ id: registrantId }],
      });
    } catch (error: any) {
      throw new Error(`Failed to update registrant status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Remove a registrant from a meeting
   */
  async removeRegistrant(meetingId: string, registrantId: string): Promise<void> {
    try {
      await this.client.delete(`/meetings/${meetingId}/registrants/${registrantId}`);
    } catch (error: any) {
      throw new Error(`Failed to remove registrant: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * ============ UTILITY METHODS ============
   */

  /**
   * Generate a random meeting password
   */
  private generateMeetingPassword(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Send meeting invitation email to registrant
   */
  async sendInvitationEmail(meetingId: string, registrantEmail: string, customMessage?: string): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      
      // In a real implementation, you would integrate with your email service
      // This is a placeholder for the email sending logic
      console.log(`Sending invitation email to: ${registrantEmail}`);
      console.log(`Meeting Topic: ${meeting.topic}`);
      console.log(`Join URL: ${meeting.join_url}`);
      console.log(`Password: ${meeting.password}`);
      
      // Example integration with nodemailer or other email service
      // await emailService.send({
      //   to: registrantEmail,
      //   subject: `Invitation: ${meeting.topic}`,
      //   html: this.generateInvitationEmail(meeting, customMessage),
      // });
    } catch (error: any) {
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  }

  /**
   * Generate invitation email HTML
   */
  private generateInvitationEmail(meeting: Meeting, customMessage?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2D8CFF; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2D8CFF; color: white; text-decoration: none; border-radius: 4px; }
          .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Meeting Invitation</h1>
          </div>
          <div class="content">
            <h2>${meeting.topic}</h2>
            ${customMessage ? `<p>${customMessage}</p>` : ''}
            
            <div class="details">
              <p><strong>Date & Time:</strong> ${new Date(meeting.start_time).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
              <p><strong>Meeting ID:</strong> ${meeting.id}</p>
              <p><strong>Password:</strong> ${meeting.password}</p>
            </div>
            
            <a href="${meeting.join_url}" class="button">Join Meeting</a>
            
            <p>Or copy and paste this link in your browser:<br>
            <a href="${meeting.join_url}">${meeting.join_url}</a></p>
            
            <p><em>This meeting invitation was sent automatically. Please do not reply to this email.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Create meeting and add registrant in one operation
   */
  async createMeetingWithRegistrant(
    options: CreateMeetingOptions,
    registrant: Registrant,
    sendInvitation: boolean = true
  ): Promise<{ meeting: Meeting; registrant: Registrant }> {
    try {
      // Create the meeting
      const meeting = await this.createMeeting('me', options);
      
      // Add the registrant
      const addedRegistrant = await this.addRegistrant(meeting.id, registrant);
      
      // Send invitation email if requested
      if (sendInvitation) {
        await this.sendInvitationEmail(meeting.id, registrant.email);
      }
      
      return { meeting, registrant: addedRegistrant };
    } catch (error: any) {
      throw new Error(`Failed to create meeting with registrant: ${error.message}`);
    }
  }

  /**
   * Get meeting join URL for a specific registrant
   */
  async getRegistrantJoinUrl(meetingId: string, registrantEmail: string): Promise<string | null> {
    try {
      const registrants = await this.listRegistrants(meetingId);
      const registrant = registrants.find(r => r.email === registrantEmail);
      return registrant?.join_url || null;
    } catch (error: any) {
      throw new Error(`Failed to get registrant join URL: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.listMeetings('me', { page_size: 1 });
      return { ok: true, message: 'Zoom API is accessible' };
    } catch (error: any) {
      return { 
        ok: false, 
        message: `Zoom API health check failed: ${error.response?.data?.message || error.message}` 
      };
    }
  }
}

export default ZoomMeetingManager;