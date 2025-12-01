import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner-large"></div>
          <h2>Authenticating...</h2>
          <p class="text-zinc-500">Validating your authentication...</p>
        </div>

        <div *ngIf="!loading && success" class="success-state">
          <div class="success-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h2>Authentication Successful!</h2>
          <p class="text-zinc-500">Redirecting to dashboard...</p>
        </div>

        <div *ngIf="!loading && error" class="error-state">
          <div class="error-icon">
            <mat-icon>error</mat-icon>
          </div>
          <h2>Authentication Failed</h2>
          <p class="error-message">{{ error }}</p>
          <button class="btn btn-primary" (click)="redirectToLogin()">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .callback-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafafa;
      }

      .callback-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e4e4e7;
        padding: 3rem 2rem;
        max-width: 400px;
        width: 100%;
        text-align: center;
      }

      .loading-state,
      .success-state,
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .spinner-large {
        width: 48px;
        height: 48px;
        border: 3px solid #e4e4e7;
        border-top-color: #27272a;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .success-icon,
      .error-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .success-icon mat-icon,
      .error-icon mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .success-icon {
        background: #dcfce7;
      }

      .success-icon mat-icon {
        color: #166534;
      }

      .error-icon {
        background: #fee2e2;
      }

      .error-icon mat-icon {
        color: #991b1b;
      }

      h2 {
        margin: 0;
        color: #18181b;
      }

      .error-message {
        color: #991b1b;
        margin: 0.5rem 0 1rem;
      }

      .btn {
        margin-top: 1rem;
      }
    `,
  ],
})
export class OauthCallbackComponent implements OnInit {
  loading = true;
  success = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      // Check if backend sent success via redirect
      if (params['success'] === 'true') {
        const state = params['state'];
        if (state) {
          const [userId] = state.split(':');
          if (userId) {
            // Validate with backend that tokens were stored
            this.validateAuthentication(userId);
          } else {
            this.loading = false;
            this.error = 'Invalid state parameter';
          }
        } else {
          this.loading = false;
          this.error = 'Missing state parameter';
        }
        return;
      }

      // Check if backend sent error via redirect
      if (params['error']) {
        this.loading = false;
        this.error = decodeURIComponent(params['error']);
        return;
      }

      // Fallback: shouldn't reach here with new flow
      this.loading = false;
      this.error = 'Invalid OAuth callback';
    });
  }

  private validateAuthentication(userId: string): void {
    this.authService.validateAuth(userId).subscribe({
      next: (response: any) => {
        if (response.data?.isAuthenticated) {
          // Fetch OAuth tokens and store them in localStorage
          this.fetchAndStoreTokens(userId);
        } else {
          this.loading = false;
          this.error = 'Authentication could not be verified';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to validate authentication. Please try again.';
      },
    });
  }

  private fetchAndStoreTokens(userId: string): void {
    // Fetch OAuth tokens from backend
    this.http
      .get(`${environment.apiBaseUrl}/oauth/tokens/${userId}`)
      .subscribe({
        next: (tokenResponse: any) => {
          if (tokenResponse.success && tokenResponse.data) {
            // Store OAuth tokens in localStorage for frontend use
            const tokens = {
              accessToken: tokenResponse.data.accessToken,
              refreshToken: tokenResponse.data.refreshToken,
              userId: tokenResponse.data.userId,
            };

            localStorage.setItem('airtable_tokens', JSON.stringify(tokens));

            console.log(' OAuth tokens stored in localStorage:', {
              accessToken: tokens.accessToken.substring(0, 20) + '...',
              refreshToken: tokens.refreshToken.substring(0, 20) + '...',
            });

            // Update local auth state
            this.authService.updateAuthState(userId, true, tokens.accessToken);
            this.loading = false;
            this.success = true;

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1500);
          } else {
            console.warn(' No OAuth tokens found in response');
            this.loading = false;
            this.error = 'OAuth tokens not found. Please try logging in again.';
          }
        },
        error: (error) => {
          console.error(' Failed to fetch OAuth tokens:', error);
          this.loading = false;
          this.error =
            'Failed to retrieve authentication tokens. Please try again.';
        },
      });
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
