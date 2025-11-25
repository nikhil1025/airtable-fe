import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  AuthState,
  OAuthInitiateRequest,
  OAuthInitiateResponse,
  RefreshTokenRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiBaseUrl;
  private readonly STORAGE_KEY = 'airtable_auth';

  private authState$ = new BehaviorSubject<AuthState>({
    userId: null,
    isAuthenticated: false,
    accessToken: null,
  });

  constructor(private http: HttpClient) {
    this.loadAuthState();
  }

  get isAuthenticated$(): Observable<boolean> {
    return new Observable((observer) => {
      this.authState$.subscribe((state) =>
        observer.next(state.isAuthenticated)
      );
    });
  }

  get currentUserId(): string | null {
    return this.authState$.value.userId;
  }

  initiateOAuth(
    userId: string
  ): Observable<ApiResponse<OAuthInitiateResponse>> {
    const request: OAuthInitiateRequest = { userId };
    return this.http.post<ApiResponse<OAuthInitiateResponse>>(
      `${this.API_URL}/oauth/authorize`,
      request
    );
  }

  handleOAuthCallback(code: string, state: string): Observable<ApiResponse> {
    return this.http
      .get<ApiResponse>(`${this.API_URL}/oauth/callback`, {
        params: { code, state },
      })
      .pipe(
        tap(() => {
          this.updateAuthState(state, true);
        })
      );
  }

  refreshToken(userId: string): Observable<ApiResponse> {
    const request: RefreshTokenRequest = { userId };
    return this.http.post<ApiResponse>(
      `${this.API_URL}/oauth/refresh`,
      request
    );
  }

  validateAuth(
    userId: string
  ): Observable<ApiResponse<{ isAuthenticated: boolean; userId: string }>> {
    return this.http.get<
      ApiResponse<{ isAuthenticated: boolean; userId: string }>
    >(`${this.API_URL}/oauth/validate`, { params: { userId } });
  }

  logout(): void {
    this.updateAuthState(null, false);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  setUserId(userId: string): void {
    this.updateAuthState(userId, false);
  }

  updateAuthState(
    userId: string | null,
    isAuthenticated: boolean,
    token?: string
  ): void {
    const newState: AuthState = {
      userId,
      isAuthenticated,
      accessToken: token || null,
    };
    this.authState$.next(newState);
    if (userId) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
    }
  }

  private loadAuthState(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const state = JSON.parse(stored);
        this.authState$.next(state);
      } catch (e) {
        console.error('Failed to load auth state', e);
      }
    }
  }
}
