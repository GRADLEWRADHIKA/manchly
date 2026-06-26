import { AxiosError, AxiosResponse } from 'axios';
import { instance } from '../utils/AxiosInstance';

export type ApiError = {
  error: string;
  status?: number;
  fields?: Record<string, string>;
  missingFields?: string[];
};

type ApiEnvelope<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      fields?: Record<string, string>;
      missingFields?: string[];
    };

function isApiError(value: unknown): value is ApiError {
  return (
    !!value &&
    typeof value === 'object' &&
    'error' in value &&
    !('isAxiosError' in (value as object))
  );
}

function normalizeError(err: unknown): ApiError {
  // Already normalized below (e.g. a 200 response that still reports success: false).
  if (isApiError(err)) return err;

  const axiosErr = err as AxiosError<ApiEnvelope<unknown>>;

  if (axiosErr?.response) {
    const body = axiosErr.response.data as
      | { error?: string; fields?: Record<string, string>; missingFields?: string[] }
      | undefined;

    return {
      error: body?.error ?? 'UNKNOWN_ERROR',
      status: axiosErr.response.status,
      fields: body?.fields,
      missingFields: body?.missingFields,
    };
  }

  if (axiosErr?.request) {
    return { error: 'NETWORK_ERROR' };
  }

  return { error: 'UNKNOWN_ERROR' };
}

async function unwrap<T>(
  promise: Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> {
  try {
    const response = await promise;
    const envelope = response.data;

    if (envelope && envelope.success) {
      return envelope.data;
    }

    // Defensive: a 2xx response that still reports success: false.
    throw {
      error: (envelope as any)?.error ?? 'UNKNOWN_ERROR',
      status: response.status,
      fields: (envelope as any)?.fields,
      missingFields: (envelope as any)?.missingFields,
    } as ApiError;
  } catch (err) {
    throw normalizeError(err);
  }
}

export const api = {
  get: <T = unknown>(url: string) =>
    unwrap<T>(instance.get<ApiEnvelope<T>>(url)),

  post: <T = unknown>(url: string, body: unknown = {}) =>
    unwrap<T>(instance.post<ApiEnvelope<T>>(url, body)),

  put: <T = unknown>(url: string, body: unknown = {}) =>
    unwrap<T>(instance.put<ApiEnvelope<T>>(url, body)),

  delete: <T = unknown>(url: string) =>
    unwrap<T>(instance.delete<ApiEnvelope<T>>(url)),
};

export default api;