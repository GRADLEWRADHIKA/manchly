type ApiErrorPayload = {
  msg?: string;
  message?: string;
  error?: {
    message?: string;
    code?: string;
  };
};

export const getApiErrorMessage = (
  error: any,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (!error) {
    return fallback;
  }

  if (!error.response && error.message) {
    if (error.message === 'Network Error') {
      return 'Unable to reach the server. Check your internet connection and try again.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    return error.message;
  }

  const responseData = error?.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  const rawResponse = error?.request?._response;
  if (rawResponse) {
    try {
      const parsed: ApiErrorPayload = JSON.parse(rawResponse);
      return (
        parsed?.msg ||
        parsed?.message ||
        parsed?.error?.message ||
        fallback
      );
    } catch {
      // Ignore malformed JSON bodies.
    }
  }

  return fallback;
};
