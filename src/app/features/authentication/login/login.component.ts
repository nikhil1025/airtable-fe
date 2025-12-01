import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MfaCredentials {
  email: string;
  password: string;
}

interface AuthStatus {
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}

interface AutomationResult {
  recordId: string;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  timestamp: string;
}

interface AutomationProgress {
  percent: number;
  message: string;
}

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

      .manual-auth-section {
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .manual-auth-content {
        margin-top: 1rem;
      }

      .manual-auth-content h3 {
        color: #1e293b;
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
      }

      .manual-form {
        margin: 1.5rem 0;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #374151;
        font-size: 0.9rem;
      }

      .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.95rem;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }

      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .auth-status {
        margin: 1.5rem 0;
        padding: 1rem;
        border-radius: 6px;
      }

      .auth-status.success {
        background: #ecfdf5;
        border: 2px solid #10b981;
        color: #064e3b;
      }

      .auth-status.error {
        background: #fef2f2;
        border: 2px solid #ef4444;
        color: #7f1d1d;
      }

      .auth-status h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
      }

      .auth-status p {
        margin: 0 0 1rem 0;
        font-size: 0.9rem;
      }

      .action-buttons {
        margin-top: 1rem;
      }

      .progress-section {
        margin: 1.5rem 0;
        padding: 1rem;
        background: #f1f5f9;
        border-radius: 6px;
        border-left: 4px solid #3b82f6;
      }

      .progress-section h4 {
        margin: 0 0 1rem 0;
        color: #1e293b;
        font-size: 1rem;
      }

      .progress-bar {
        width: 100%;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
        margin: 0.75rem 0;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #10b981);
        transition: width 0.3s ease;
      }

      .results-section {
        margin: 1.5rem 0;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
      }

      .results-section h4 {
        margin: 0 0 1rem 0;
        color: #1e293b;
        font-size: 1rem;
      }

      .results-summary {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        justify-content: space-around;
      }

      .stat {
        text-align: center;
        flex: 1;
      }

      .stat-number {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
      }

      .stat-label {
        display: block;
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .results-actions {
        display: flex;
        gap: 0.75rem;
        margin: 1rem 0;
        flex-wrap: wrap;
      }

      .results-actions button {
        flex: 1;
        min-width: 120px;
      }

      .detailed-results {
        margin-top: 1rem;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
      }

      .result-item {
        padding: 0.75rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.85rem;
      }

      .result-item:last-child {
        border-bottom: none;
      }

      .result-item.success {
        border-left: 3px solid #10b981;
      }

      .result-item.error {
        border-left: 3px solid #ef4444;
      }

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .record-id {
        font-weight: 600;
        font-family: 'Monaco', 'Menlo', monospace;
        color: #1e293b;
      }

      .status-badge {
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge.success {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #10b981;
      }

      .status-badge.error {
        background: #fef2f2;
        color: #7f1d1d;
        border: 1px solid #ef4444;
      }

      .result-data pre {
        background: #f8fafc;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        overflow-x: auto;
        margin: 0.5rem 0;
        max-height: 150px;
        overflow-y: auto;
      }

      .result-error {
        background: #fef2f2;
        padding: 0.5rem;
        border-radius: 4px;
        color: #7f1d1d;
        font-size: 0.8rem;
        margin: 0.5rem 0;
      }

      .result-error p {
        margin: 0;
      }

      @media (max-width: 480px) {
        .login-card {
          padding: 2rem 1.5rem;
        }

        .login-header h1 {
          font-size: 1.75rem;
        }

        .results-summary {
          flex-direction: column;
          gap: 0.5rem;
        }

        .results-actions {
          flex-direction: column;
        }

        .results-actions button {
          flex: none;
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

  // Manual authentication properties
  showManualAuth = false;
  manualCredentials: MfaCredentials = {
    email: '',
    password: '',
  };
  authStatus: AuthStatus | null = null;
  automationInProgress = false;
  automationProgress: AutomationProgress | null = null;
  automationResults: AutomationResult[] | null = null;
  showResultsDetails = false;
  private readonly baseUrl = 'http://localhost:3000/api/airtable';

  availableUsers = [
    {
      id: 'user_1763976277436',
      label: 'User 1763976277436 (Has valid cookies)',
    },
    { id: 'user_test123', label: 'User test123 (Has valid cookies)' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

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

    // Get or generate a persistent user ID that stays consistent across sessions
    const userId = this.authService.getPersistentUserId();

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

  // Manual authentication methods
  toggleManualAuth(): void {
    this.showManualAuth = !this.showManualAuth;
    if (!this.showManualAuth) {
      this.resetManualAuth();
    }
  }

  async authenticateManual(): Promise<void> {
    if (!this.manualCredentials.email || !this.manualCredentials.password) {
      this.error = 'Please enter both email and password';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      // Get or generate persistent userId
      const userId = this.authService.getPersistentUserId();

      const response = await this.http
        .post<{ success: boolean; message: string; data?: any }>(
          `${this.baseUrl}/auth/validate`,
          { ...this.manualCredentials, userId }
        )
        .toPromise();

      if (response?.success) {
        this.authStatus = {
          status: 'success',
          message:
            response.message ||
            'Authentication successful! You can now run bulk automation.',
          timestamp: new Date().toLocaleString(),
        };

        // Save auth for later use
        localStorage.setItem(
          'airtableAuth',
          JSON.stringify(this.manualCredentials)
        );
      } else {
        throw new Error(response?.message || 'Authentication failed');
      }
    } catch (error: any) {
      this.authStatus = {
        status: 'error',
        message:
          error.message ||
          'Authentication failed. Please check your credentials.',
        timestamp: new Date().toLocaleString(),
      };
    } finally {
      this.loading = false;
    }
  }

  async startBulkAutomation(): Promise<void> {
    if (this.authStatus?.status !== 'success') {
      this.error = 'Please authenticate first';
      return;
    }

    this.automationInProgress = true;
    this.loading = true;
    this.error = '';
    this.automationProgress = {
      percent: 0,
      message: 'Starting bulk automation...',
    };

    try {
      const response = await this.http
        .post<{
          success: boolean;
          results: AutomationResult[];
          message: string;
        }>(
          `${this.baseUrl}/revision-history/bulk-automation`,
          this.manualCredentials,
          {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
          }
        )
        .toPromise();

      if (response?.success && response.results) {
        this.automationResults = response.results;
        this.automationProgress = {
          percent: 100,
          message: 'Automation completed successfully!',
        };
      } else {
        throw new Error(response?.message || 'Bulk automation failed');
      }
    } catch (error: any) {
      this.error = error.message || 'Bulk automation failed';
      this.automationProgress = {
        percent: 0,
        message: 'Automation failed',
      };
    } finally {
      this.loading = false;
      this.automationInProgress = false;
    }
  }

  getSuccessCount(): number {
    if (!this.automationResults) return 0;
    return this.automationResults.filter((r) => r.status === 'success').length;
  }

  getErrorCount(): number {
    if (!this.automationResults) return 0;
    return this.automationResults.filter((r) => r.status === 'error').length;
  }

  getTotalCount(): number {
    return this.automationResults?.length || 0;
  }

  downloadResults(): void {
    if (!this.automationResults) return;

    const data = JSON.stringify(this.automationResults, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `airtable-automation-results-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  toggleResultsDetails(): void {
    this.showResultsDetails = !this.showResultsDetails;
  }

  formatJsonOutput(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  resetManualAuth(): void {
    this.authStatus = null;
    this.automationResults = null;
    this.automationProgress = null;
    this.error = '';
    this.manualCredentials = {
      email: '',
      password: '',
    };
    this.showResultsDetails = false;
    this.automationInProgress = false;
    localStorage.removeItem('airtableAuth');
  }
}
