// Type definitions for Manchly SDK v1

export interface ManchlyConfig {
  /** Optional — if omitted, the creator must complete onboarding before courses load. */
  creatorId?: string;
  apiBase?: string;
  checkoutPage?: string;
  storagePrefix?: string;
  theme?: Partial<ManchlyTheme>;
  timeoutMs?: number;
}

export interface CreatorInfo {
  creator_id: string;
  name?: string;
  email?: string;
  profile_image?: string | null;
  course_count?: number;
}

export interface ManchlyTheme {
  accent: string;
  accentDark: string;
  charcoal: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  success: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  user_type?: string | string[];
  profile_image?: string | null;
  [k: string]: any;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  thumbnail?: string;
  thumbnail_url?: string;
  creator?: { id: string; name?: string };
  [k: string]: any;
}

export type ErrorKind =
  | 'network' | 'timeout' | 'unauthorized' | 'forbidden' | 'not_found'
  | 'conflict' | 'rate_limited' | 'server' | 'validation' | 'unknown';

export class ManchlyError extends Error {
  kind: ErrorKind;
  status: number;
  code: string | null;
  details: any;
}

export interface PaymentReturn {
  status: 'success' | 'failed' | 'cancelled';
  orderId: string | null;
  reason: string | null;
}

export interface BuyResult {
  free?: boolean;
  redirecting?: boolean;
  alreadyEnrolled?: boolean;
  orderId?: string;
  enrollment?: any;
}

export type EventName =
  | 'login' | 'logout' | 'otp:sent'
  | 'creator:otp:sent' | 'creator:connected' | 'creator:disconnected'
  | 'payment:redirect' | 'payment:success' | 'payment:cancelled' | 'payment:failed' | 'payment:error'
  | 'enrollment:success' | 'enrollment:existing' | 'enrollment:added' | 'enrollments:loaded'
  | 'continue:requested';

export interface MountButtonOptions {
  courseId: string;
  enrolledLabel?: string;
  notEnrolledLabel?: string;
  onContinue?: (courseId: string) => void;
}

export interface ManchlySDK {
  version: string;
  config: ManchlyConfig;

  creator: {
    info(): CreatorInfo | null;
    isConnected(): boolean;
    requestOtp(args: { email: string; phone: string }): Promise<any>;
    verify(args: { email: string; code: string }): Promise<CreatorInfo>;
    disconnect(): void;
    openOnboarding(opts?: { onConnected?: (info: CreatorInfo) => void }): Promise<CreatorInfo | null>;
  };

  auth: {
    isLoggedIn(): boolean;
    user(): User | null;
    token(): string | null;
    logout(): void;
    sendOtp(args: { name: string; email: string; phone: string }): Promise<any>;
    verifyOtp(args: { email: string; code: string }): Promise<{ token: string; user: User }>;
    openLogin(opts?: { onLogin?: (payload: any) => void }): { close(): void };
  };

  courses: {
    listByCreator(opts?: { autoPrompt?: boolean }): Promise<any>;
    get(courseId: string): Promise<any>;
    myCourses(): Promise<any>;
    isEnrolled(courseId: string): Promise<boolean>;
    isEnrolledSync(courseId: string): boolean;
    refreshEnrollments(): Promise<string[]>;
  };

  payments: {
    createOrder(courseId: string): Promise<any>;
  };

  buy(courseId: string, opts?: { returnTo?: string; onLogin?: () => void }): Promise<BuyResult>;
  /** Render a smart button on `target` that auto-switches between Enroll and Continue. Returns an unmount fn. */
  mountButton(target: string | HTMLElement, options: MountButtonOptions): () => void;
  /** Synchronous check — returns true if buyer is enrolled (uses local cache). */
  isEnrolledSync(courseId: string): boolean;
  /** Force-refresh the local enrollments cache from the server. */
  refreshEnrollments(): Promise<string[]>;
  handlePaymentReturn(opts?: { showThankYou?: boolean }): PaymentReturn | null;

  on<T = any>(event: EventName, handler: (payload: T) => void): () => void;
  off<T = any>(event: EventName, handler: (payload: T) => void): void;

  showToast(kind: 'ok' | 'error', title: string, message?: string): void;
  ManchlyError: typeof ManchlyError;
}

declare global {
  interface Window {
    Manchly: {
      init(config: ManchlyConfig): ManchlySDK;
      ManchlyError: typeof ManchlyError;
    };
  }
}

export declare const Manchly: {
  init(config: ManchlyConfig): ManchlySDK;
  ManchlyError: typeof ManchlyError;
};
