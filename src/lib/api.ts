import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError, AuthResponse, LoginCredentials, User, Session, Translation, CreateSessionInput, AnalyticsData, SessionWithTranslations } from '../types';

// =============================================================================
// API CLIENT - SIMPLIFIED
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
        
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !this.isRefreshing) {
          originalRequest._retry = true;
          this.isRefreshing = true;
          
          try {
            const refreshResponse = await this.refreshToken();
            if (refreshResponse.accessToken) {
              this.setAccessToken(refreshResponse.accessToken);
              this.isRefreshing = false;
              return this.client(originalRequest);
            }
          } catch {
            this.clearAccessToken();
            this.isRefreshing = false;
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(this.normalizeError(error));
          }
        }
        
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private normalizeError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }
    
    if (error.code === 'ECONNABORTED') {
      return { success: false, error: 'Request timeout', code: 'TIMEOUT' };
    }
    
    if (!error.response) {
      return { success: false, error: 'Network error', code: 'NETWORK_ERROR' };
    }
    
    return { success: false, error: error.message || 'Unknown error', code: 'UNKNOWN_ERROR' };
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
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
    const response = await this.client.post<ApiResponse<AuthResponse>>('/api/auth/refresh');
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/api/auth/me');
    return response.data.data;
  }

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------

  async createSession(input: CreateSessionInput): Promise<ApiResponse<Session>> {
    const response = await this.client.post<ApiResponse<Session>>('/api/sessions', input);
    return response.data;
  }

  async getSession(sessionId: string): Promise<ApiResponse<Session & { translations: Translation[] }>> {
    const response = await this.client.get<ApiResponse<Session & { translations: Translation[] }>>(`/api/sessions/${sessionId}`);
    return response.data;
  }

  async getSessions(): Promise<ApiResponse<Session[]>> {
    const response = await this.client.get<ApiResponse<Session[]>>('/api/sessions');
    return response.data;
  }

  async completeSession(sessionId: string): Promise<ApiResponse<Session>> {
    const response = await this.client.post<ApiResponse<Session>>(`/api/sessions/${sessionId}/complete`);
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Translations
  // ---------------------------------------------------------------------------

  async getTranslations(limit?: number): Promise<ApiResponse<Translation[]>> {
    const params = limit ? { limit } : {};
    const response = await this.client.get<ApiResponse<Translation[]>>('/api/translations', { params });
    return response.data;
  }

  async getSessionTranslations(sessionId: string): Promise<ApiResponse<Translation[]>> {
    const response = await this.client.get<ApiResponse<Translation[]>>(`/api/translations/session/${sessionId}`);
    return response.data;
  }

  async translateAudio(
    sessionId: string,
    audioBlob: Blob,
    sourceLanguage: string,
    targetLanguage: string,
    speakerType: 'staff' | 'customer',
    context?: string
  ): Promise<Translation> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('sessionId', sessionId);
    formData.append('sourceLanguage', sourceLanguage);
    formData.append('targetLanguage', targetLanguage);
    formData.append('speakerType', speakerType);
    if (context) {
      formData.append('context', context);
    }
    
    const response = await this.client.post<ApiResponse<Translation>>(
      '/api/translations/full-pipeline',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      }
    );
    
    return response.data.data;
  }

  async getTranslationStatus(): Promise<ApiResponse<{
    translation: { available: boolean };
    transcription: { available: boolean };
    tts: { available: boolean };
    supportedLanguages: string[];
  }>> {
    const response = await this.client.get<ApiResponse<{
      translation: { available: boolean };
      transcription: { available: boolean };
      tts: { available: boolean };
      supportedLanguages: string[];
    }>>('/api/translations/status');
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Analytics (Admin Only)
  // ---------------------------------------------------------------------------

  async getAnalyticsDashboard(): Promise<AnalyticsData> {
    const response = await this.client.get<ApiResponse<AnalyticsData>>('/api/analytics/dashboard');
    return response.data.data;
  }

  async getSessionsWithTranslations(): Promise<SessionWithTranslations[]> {
    const response = await this.client.get<ApiResponse<SessionWithTranslations[]>>('/api/analytics/sessions');
    return response.data.data;
  }

  async getSignedAudioUrl(audioUrl: string): Promise<string> {
    const response = await this.client.post<ApiResponse<{ signedUrl: string }>>('/api/analytics/audio-url', { audioUrl });
    return response.data.data.signedUrl;
  }

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get<ApiResponse<{ status: string; timestamp: string }>>('/api/health');
    return response.data.data;
  }
}

export const api = new ApiClient();
export { ApiClient };
