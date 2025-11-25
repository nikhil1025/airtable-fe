// Authentication Models
export interface OAuthInitiateRequest {
  userId: string;
}

export interface OAuthInitiateResponse {
  authUrl: string;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
}

export interface OAuthCallbackResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  userId: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
}

export interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}
