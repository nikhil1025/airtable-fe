import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Airtable Integration</h1>
          <p class="text-zinc-500">
            Connect your Airtable account to get started
          </p>
        </div>

        <div class="login-content">
          <div *ngIf="loading" class="loading-state">
            <div class="spinner-large"></div>
            <p>{{ loadingMessage }}</p>
          </div>

          <div *ngIf="!loading">
            <!-- Quick Login with Existing User -->
            <div class="quick-login-section">
              <h3>Quick Login (Testing)</h3>
              <p class="helper-text">
                Login with an existing authenticated user
              </p>
              <select
                [(ngModel)]="selectedUserId"
                class="user-select"
                (change)="onUserSelect()"
              >
                <option value="">Select a user...</option>
                <option *ngFor="let user of availableUsers" [value]="user.id">
                  {{ user.label }}
                </option>
              </select>
              <button
                class="btn btn-success btn-block"
                (click)="quickLogin()"
                [disabled]="!selectedUserId"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"
                  ></path>
                </svg>
                Quick Login
              </button>
            </div>

            <div class="divider">
              <span>OR</span>
            </div>

            <!-- OAuth Login -->
            <button
              class="btn btn-primary btn-block btn-large"
              (click)="initiateOAuth()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                ></path>
              </svg>
              Connect New Airtable Account
            </button>
          </div>

          <div *ngIf="error" class="error-message">
            {{ error }}
            <button class="retry-btn" (click)="clearError()">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f4f4f5 0%, #fafafa 100%);
        padding: 1rem;
      }

      .login-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e4e4e7;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 3rem 2rem;
        max-width: 500px;
        width: 100%;
      }

      .login-header {
        text-align: center;
        margin-bottom: 2.5rem;
      }

      .login-header h1 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #18181b;
      }

      .login-content {
        min-height: 150px;
      }

      .quick-login-section {
        background: #f4f4f5;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }

      .quick-login-section h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #18181b;
      }

      .helper-text {
        font-size: 0.875rem;
        color: #71717a;
        margin: 0 0 1rem 0;
      }

      .user-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e4e4e7;
        border-radius: 6px;
        font-size: 0.95rem;
        margin-bottom: 1rem;
        background: white;
      }

      .divider {
        position: relative;
        text-align: center;
        margin: 1.5rem 0;
      }

      .divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #e4e4e7;
      }

      .divider span {
        position: relative;
        background: white;
        padding: 0 1rem;
        color: #71717a;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .loading-state {
        text-align: center;
      }

      .loading-state p {
        margin-top: 1rem;
        color: #71717a;
        font-size: 0.95rem;
      }

      .spinner-large {
        border: 3px solid #e4e4e7;
        border-top-color: #18181b;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 0.8s linear infinite;
        margin: 0 auto;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .btn-large {
        font-size: 1.1rem;
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
      }

      .btn-block {
        width: 100%;
      }

      .btn-success {
        background: #10b981;
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .btn-success:hover:not(:disabled) {
        background: #059669;
      }

      .btn-success:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .error-message {
        margin-top: 1rem;
        padding: 1rem;
        background: #fee2e2;
        color: #991b1b;
        border-radius: 8px;
        font-size: 0.95rem;
        text-align: center;
        width: 100%;
      }

      .retry-btn {
        margin-top: 0.75rem;
        padding: 0.5rem 1rem;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
      }

      .retry-btn:hover {
        background: #b91c1c;
      }

      @media (max-width: 480px) {
        .login-card {
          padding: 2rem 1.5rem;
        }

        .login-header h1 {
          font-size: 1.75rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  loading = false;
  loadingMessage = 'Loading...';
  error = '';
  selectedUserId = '';

  availableUsers = [
    {
      id: 'user_1763976277436',
      label: 'User 1763976277436 (Has valid cookies)',
    },
    { id: 'user_test123', label: 'User test123 (Has valid cookies)' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  onUserSelect(): void {
    this.error = '';
  }

  quickLogin(): void {
    if (!this.selectedUserId) {
      this.error = 'Please select a user';
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Logging in...';
    this.error = '';

    // Set the userId in AuthService
    this.authService.updateAuthState(this.selectedUserId, true);

    // Small delay to show loading state
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/projects']);
    }, 500);
  }

  clearError(): void {
    this.error = '';
  }

  initiateOAuth(): void {
    this.loading = true;
    this.loadingMessage = 'Redirecting to Airtable...';
    this.error = '';

    // Generate a random user ID or use a fixed one
    const userId = 'user_' + Date.now();

    this.authService.initiateOAuth(userId).subscribe({
      next: (response: any) => {
        if (response.data?.authUrl) {
          // Save userId for callback
          this.authService.setUserId(userId);
          // Redirect to Airtable OAuth
          window.location.href = response.data.authUrl;
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error =
          err.error?.error || 'Failed to initiate OAuth. Please try again.';
      },
    });
  }
}
