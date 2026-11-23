// Common API utility with fetch and automatic refresh token handling
export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  message?: string;
  pagination?: {
    limit: number;
    from: number;
    to: number;
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  [key: string]: any;
}

// API base URL — override with VITE_API_BASE_URL in .env
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV
    ? 'https://rcsap.nectarinfotel.in/backend/api/v1'
    : 'https://rcsap.nectarinfotel.in/backend/api/v1');

// Global state for tracking refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Common headers
const getHeaders = (isFormData = false): HeadersInit => {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};



// Refresh token function
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.warn('No refresh token available for refresh');
      return null;
    }

    console.log('Attempting to refresh access token...');

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Refresh token request failed:', data);

      // Check if refresh token is expired or invalid
      if (response.status === 401) {
        console.warn('Refresh token expired or invalid. Logging out user.');
        // Clear all auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('unauthorizedAttempts');
        window.location.href = '/login';
        throw new Error('Refresh token expired. Please login again.');
      }

      throw new Error(data.message || 'Failed to refresh token');
    }

    if (data.success && data.data?.accessToken) {
      const newToken = data.data.accessToken;
      localStorage.setItem('token', newToken);
      console.log('Access token refreshed successfully');
      return newToken;
    } else {
      console.error('Invalid refresh token response format:', data);
      throw new Error('Invalid refresh token response');
    }
  } catch (error) {
    console.error('Token refresh failed:', error);

    // If it's a refresh token expired error, don't return null
    // The error will be thrown and handled by the caller
    if (error instanceof Error && error.message.includes('Refresh token expired')) {
      throw error;
    }

    return null;
  }
};

// Generic fetch wrapper with automatic token refresh
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
  retryCount = 0
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  // Handle JSON serialization for non-FormData bodies
  let body = options.body;
  if (body && !isFormData && typeof body === 'object') {
    try {
      body = JSON.stringify(body);
    } catch (error) {
      console.error('Failed to stringify request body:', error);
      throw new Error('Failed to serialize request data');
    }
  }

  const config: RequestInit = {
    headers: getHeaders(isFormData),
    credentials: 'include',
    cache: 'no-store',
    ...options,
    body,
    signal,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized with automatic token refresh
      if (response.status === 401 && retryCount < 2) {
        const unauthorizedAttempts = parseInt(localStorage.getItem('unauthorizedAttempts') || '0');

        console.log(`401 Unauthorized received. Attempt ${retryCount + 1}/2. Total unauthorized attempts: ${unauthorizedAttempts}`);

        if (unauthorizedAttempts >= 2) {
          // Too many unauthorized attempts, logout
          console.warn('Too many unauthorized attempts. Logging out user.');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('unauthorizedAttempts');
          window.location.href = '/login';
          throw new Error('Too many unauthorized attempts. Please login again.');
        }

        // Increment unauthorized attempts
        localStorage.setItem('unauthorizedAttempts', (unauthorizedAttempts + 1).toString());

        if (isRefreshing) {
          // Wait for the current refresh to complete
          console.log('Token refresh already in progress, queuing request...');
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return apiRequest<T>(endpoint, options, onProgress, signal, retryCount + 1);
          });
        }

        isRefreshing = true;
        console.log('Starting token refresh process...');

        try {
          const newToken = await refreshToken();
          if (newToken) {
            // Reset unauthorized attempts on successful refresh
            localStorage.setItem('unauthorizedAttempts', '0');
            console.log('Token refresh successful, processing queued requests...');
            processQueue(null, newToken);

            // Retry the original request with new token
            return apiRequest<T>(endpoint, options, onProgress, signal, retryCount + 1);
          } else {
            console.error('Token refresh failed, processing queued requests with error...');
            processQueue(new Error('Failed to refresh token'), null);
            throw new Error('Failed to refresh token');
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);

          // Check if refresh token is expired
          if (refreshError instanceof Error && refreshError.message.includes('Refresh token expired')) {
            // Refresh token expired, logout user immediately
            console.warn('Refresh token expired during API request. Logging out user.');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('unauthorizedAttempts');
            window.location.href = '/login';
            throw new Error('Refresh token expired. Please login again.');
          }

          processQueue(refreshError, null);
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }

      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    // Reset unauthorized attempts on successful request
    localStorage.setItem('unauthorizedAttempts', '0');

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Special upload function with progress tracking and abort support
const uploadWithProgress = async <T>(
  endpoint: string,
  formData: FormData,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<ApiResponse<T>> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE_URL}${endpoint}`;

    // Set up progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Set up abort handling
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
    }

    // Set up response handling
    xhr.addEventListener('load', () => {
      let data: ApiResponse<T> | null = null;
      try {
        if (xhr.responseText) {
          data = JSON.parse(xhr.responseText);
        }
      } catch {
        // ignore parse errors for non-JSON bodies
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (data) {
          resolve(data);
        } else {
          reject(new Error('Invalid JSON response'));
        }
        return;
      }

      const message =
        (data && typeof data === 'object' && 'message' in data && data.message) ||
        `Upload failed (HTTP ${xhr.status})`;
      reject(new Error(String(message)));
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Set up request
    xhr.open('POST', url);

    // Set credentials
    xhr.withCredentials = true;

    // Set headers
    const headers = getHeaders(true);
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        xhr.setRequestHeader(key, value);
      }
    });

    // Send request
    xhr.send(formData);
  });
};

// HTTP method helpers
export const api = {
  // GET request
  get: <T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    return apiRequest<T>(endpoint + url.search);
  },

  // POST request
  post: <T>(endpoint: string, data?: any, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<ApiResponse<T>> => {
    // Use special upload function for FormData with progress tracking
    if (data instanceof FormData && onProgress) {
      return uploadWithProgress<T>(endpoint, data, onProgress, signal);
    }

    // Use regular fetch for other requests
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data,
      signal,
    }, onProgress);
  },

  /**
   * POST and return JSON body for any HTTP status (e.g. 400 with success:false + data).
   * Used for login/OTP flows where api.post would throw on non-2xx.
   */
  postReturnBody: async <T>(endpoint: string, bodyData?: any): Promise<ApiResponse<T>> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = bodyData instanceof FormData;
    let body: BodyInit | undefined;
    if (bodyData && !isFormData && typeof bodyData === 'object') {
      body = JSON.stringify(bodyData);
    } else {
      body = bodyData as BodyInit | undefined;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(isFormData),
      credentials: 'include',
      cache: 'no-store',
      body,
    });

    const json = await response.json();
    return json as ApiResponse<T>;
  },

  // PUT request
  put: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PATCH request
  patch: <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  delete: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'DELETE',
    });
  },
};

// Helper function to build query string from params
export const buildQueryString = (params: PaginationParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString();
};

// Common error handler
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Utility functions for testing and debugging
export const getAuthStatus = () => {
  return {
    hasToken: !!localStorage.getItem('token'),
    hasRefreshToken: !!localStorage.getItem('refreshToken'),
    unauthorizedAttempts: parseInt(localStorage.getItem('unauthorizedAttempts') || '0'),
    isRefreshing
  };
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('unauthorizedAttempts');
};

export const checkTokenExpiry = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!token && !refreshToken) {
    return 'No tokens available';
  }

  if (!token) {
    return 'Access token missing';
  }

  if (!refreshToken) {
    return 'Refresh token missing';
  }

  return 'Both tokens available';
}; 