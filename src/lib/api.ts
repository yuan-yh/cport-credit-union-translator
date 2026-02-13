import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError, AuthResponse, LoginCredentials, User, Session, Translation, TranslationRequest, QueueItem, QueueStats, SessionWithDetails, CreateSessionInput, QueueItemWithSession } from '../types';

// =============================================================================
// API CLIENT CONFIGURATION
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Required for refresh token cookie
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshResponse = await this.refreshToken();
            if (refreshResponse.accessToken) {
              this.setAccessToken(refreshResponse.accessToken);
              return this.client(originalRequest);
            }
          } catch {
            // Refresh failed - clear tokens and redirect to login
            this.clearAccessToken();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Token Management
  // ---------------------------------------------------------------------------

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // ---------------------------------------------------------------------------
  // Error Handling
  // ---------------------------------------------------------------------------

  private normalizeError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout. Please try again.',
        code: 'TIMEOUT',
      };
    }
    
    if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
    
    return {
      success: false,
      error: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
    };
  }

  // ---------------------------------------------------------------------------
  // Authentication Endpoints
  // ---------------------------------------------------------------------------

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      credentials
    );
    
    if (response.data.data.accessToken) {
      this.setAccessToken(response.data.data.accessToken);
    }
    
    return response.data.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
    } finally {
      this.clearAccessToken();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/api/auth/refresh'
    );
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/api/auth/me');
    return response.data.data;
  }

  // ---------------------------------------------------------------------------
  // Session Endpoints
  // ---------------------------------------------------------------------------

  async createSession(input: CreateSessionInput): Promise<SessionWithDetails> {
    const response = await this.client.post<ApiResponse<SessionWithDetails>>(
      '/api/sessions',
      input
    );
    return response.data.data;
  }

  async getSession(sessionId: string): Promise<SessionWithDetails> {
    const response = await this.client.get<ApiResponse<SessionWithDetails>>(
      `/api/sessions/${sessionId}`
    );
    return response.data.data;
  }

  async getSessions(branchId?: string): Promise<SessionWithDetails[]> {
    const params = branchId ? { branchId } : {};
    const response = await this.client.get<ApiResponse<SessionWithDetails[]>>(
      '/api/sessions',
      { params }
    );
    return response.data.data;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<Session>
  ): Promise<SessionWithDetails> {
    const response = await this.client.patch<ApiResponse<SessionWithDetails>>(
      `/api/sessions/${sessionId}`,
      updates
    );
    return response.data.data;
  }

  async completeSession(sessionId: string): Promise<SessionWithDetails> {
    const response = await this.client.post<ApiResponse<SessionWithDetails>>(
      `/api/sessions/${sessionId}/complete`
    );
    return response.data.data;
  }

  // ---------------------------------------------------------------------------
  // Translation Endpoints
  // ---------------------------------------------------------------------------

  async translate(request: TranslationRequest): Promise<Translation> {
    const response = await this.client.post<ApiResponse<Translation>>(
      '/api/translations',
      request
    );
    return response.data.data;
  }

  async getSessionTranslations(sessionId: string): Promise<Translation[]> {
    const response = await this.client.get<ApiResponse<Translation[]>>(
      `/api/translations/${sessionId}`
    );
    return response.data.data;
  }

  async transcribeAudio(
    sessionId: string,
    audioBlob: Blob,
    language: string
  ): Promise<{ text: string; confidence: number }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('sessionId', sessionId);
    formData.append('language', language);
    
    const response = await this.client.post<
      ApiResponse<{ text: string; confidence: number }>
    >('/api/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  }

  // ---------------------------------------------------------------------------
  // Queue Endpoints
  // ---------------------------------------------------------------------------

  async getQueueStats(): Promise<QueueStats> {
    const response = await this.client.get<ApiResponse<QueueStats>>(
      '/api/queue/stats'
    );
    return response.data.data;
  }

  async getQueue(queueType?: string): Promise<QueueItemWithSession[]> {
    const params = queueType ? { type: queueType } : {};
    const response = await this.client.get<ApiResponse<QueueItemWithSession[]>>(
      '/api/queue',
      { params }
    );
    return response.data.data;
  }

  async addToQueue(
    sessionId: string,
    queueType: 'TELLER' | 'CONSULTOR',
    priority?: string
  ): Promise<QueueItem> {
    const response = await this.client.post<ApiResponse<QueueItem>>(
      '/api/queue',
      { sessionId, queueType, priority }
    );
    return response.data.data;
  }

  async updateQueueItem(
    queueItemId: string,
    updates: Partial<QueueItem>
  ): Promise<QueueItem> {
    const response = await this.client.patch<ApiResponse<QueueItem>>(
      `/api/queue/${queueItemId}`,
      updates
    );
    return response.data.data;
  }

  async callNextInQueue(queueType: string): Promise<QueueItemWithSession | null> {
    const response = await this.client.post<ApiResponse<QueueItemWithSession | null>>(
      `/api/queue/call-next`,
      { queueType }
    );
    return response.data.data;
  }

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get<
      ApiResponse<{ status: string; timestamp: string }>
    >('/api/health');
    return response.data.data;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
