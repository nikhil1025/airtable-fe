import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner-large"></div>
          <h2>Authenticating...</h2>
          <p class="text-zinc-500">
            Validating your authentication...
          </p>
        </div>

        <div *ngIf="!loading && success" class="success-state">
          <div class="success-icon">✓</div>
          <h2>Authentication Successful!</h2>
          <p class="text-zinc-500">Redirecting to dashboard...</p>
        </div>

        <div *ngIf="!loading && error" class="error-state">
          <div class="error-icon">✕</div>
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
        font-size: 2rem;
        font-weight: bold;
      }

      .success-icon {
        background: #dcfce7;
        color: #166534;
      }

      .error-icon {
        background: #fee2e2;
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
    private authService: AuthService
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
          // Update local auth state
          this.authService.updateAuthState(userId, true);
          this.loading = false;
          this.success = true;
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.loading = false;
          this.error = 'Authentication could not be verified';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to validate authentication. Please try again.';
      }
    });
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
