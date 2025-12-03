import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="settings-container">
      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1>Settings</h1>
            <p class="subtitle">Manage your Airtable credentials and cookies</p>
          </div>
        </div>

        <div class="card">
          <h3>Automatic Cookie Retrieval</h3>
          <p class="description">
            Automatically extract cookies from Airtable using your credentials.
            No manual copying required!
          </p>

          <div *ngIf="!currentUserId" class="warning-box">
            <h4>Authentication Required</h4>
            <p>
              You must complete OAuth login before retrieving cookies. Please go
              to the Dashboard and connect to Airtable first.
            </p>
          </div>

          <div class="form-group">
            <label for="email">Airtable Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="airtableEmail"
              class="input"
              placeholder="your@email.com"
              [disabled]="loading"
            />
          </div>

          <div class="form-group">
            <label for="password">Airtable Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="airtablePassword"
              class="input"
              placeholder="Your password"
              [disabled]="loading"
            />
          </div>

          <div class="button-group">
            <button
              class="btn btn-primary"
              (click)="loginWithMFA()"
              [disabled]="loading || !airtableEmail || !airtablePassword"
            >
              <span *ngIf="loading" class="spinner-sm"></span>
              <span *ngIf="!loading">Login with MFA</span>
            </button>
            <button
              class="btn btn-secondary"
              (click)="validateCookies()"
              [disabled]="loading"
            >
              Validate Cookies
            </button>
            <button
              class="btn btn-outline"
              (click)="displayCookiesForTesting()"
              [disabled]="loading"
              title="TEST ONLY: Display cookies in console"
            >
              Test: Show Cookies
            </button>
          </div>

          <div
            *ngIf="cookieStatus"
            class="status-message"
            [class.success]="cookieStatus.valid"
            [class.error]="!cookieStatus.valid"
          >
            <strong>{{ cookieStatus.valid ? '✓ Valid' : '✗ Invalid' }}</strong>
            <p>{{ cookieStatus.message }}</p>
            <p *ngIf="cookieStatus.validUntil">
              Valid until: {{ cookieStatus.validUntil | date : 'medium' }}
            </p>
            <p *ngIf="cookieStatus.cookieCount" class="cookie-count">
              {{ cookieStatus.cookieCount }} cookies stored
            </p>
          </div>

          <div *ngIf="displayedCookies.length > 0" class="cookies-display">
            <h4>Stored Cookies</h4>
            <div class="cookie-list">
              <div *ngFor="let cookie of displayedCookies" class="cookie-item">
                <strong>{{ cookie.name }}:</strong>
                <span class="cookie-value">{{
                  truncateCookieValue(cookie.value)
                }}</span>
              </div>
            </div>
            <button
              class="btn btn-outline btn-sm"
              (click)="copyCookiesToClipboard()"
            >
              Copy All Cookies
            </button>
          </div>
        </div>

        <!-- MFA Dialog -->
        <div *ngIf="showMFADialog" class="mfa-overlay">
          <div class="mfa-dialog">
            <h3 *ngIf="!extractingCookies">🔐 MFA Authentication Required</h3>
            <h3 *ngIf="extractingCookies">🍪 Extracting Cookies</h3>
            <p class="mfa-message" *ngIf="!extractingCookies">
              {{ mfaMessage }}
            </p>

            <!-- Cookie Extraction Loading State -->
            <div *ngIf="extractingCookies" class="cookie-extraction-loader">
              <div class="spinner-large"></div>
              <p class="extraction-message">{{ cookieExtractionMessage }}</p>
            </div>

            <!-- MFA Input (hidden during cookie extraction) -->
            <div *ngIf="!extractingCookies">
              <div class="form-group">
                <label for="mfaCode">Enter MFA Code</label>
                <input
                  id="mfaCode"
                  type="text"
                  [(ngModel)]="mfaCode"
                  class="input"
                  placeholder="Enter 6-digit code"
                  maxlength="6"
                  [disabled]="loading"
                  (keyup.enter)="submitMFACode()"
                />
              </div>

              <div class="button-group">
                <button
                  class="btn btn-primary"
                  (click)="submitMFACode()"
                  [disabled]="loading || !mfaCode || mfaCode.length !== 6"
                >
                  <span *ngIf="loading" class="spinner-sm"></span>
                  <span *ngIf="!loading">Submit MFA Code</span>
                </button>
                <button
                  class="btn btn-outline"
                  (click)="cancelMFALogin()"
                  [disabled]="loading"
                >
                  Cancel
                </button>
              </div>

              <div *ngIf="mfaError" class="error-message">
                {{ mfaError }}
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>OAuth Status</h3>
          <p class="description">Your OAuth connection to Airtable</p>

          <div class="status-row">
            <span>Status:</span>
            <strong class="status-badge" [class.active]="isAuthenticated">
              {{ isAuthenticated ? 'Connected' : 'Not Connected' }}
            </strong>
          </div>

          <div class="status-row" *ngIf="currentUserId">
            <span>User ID:</span>
            <code>{{ currentUserId }}</code>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .settings-container {
        min-height: 100vh;
        background: #fafafa;
        width: 100%;
        overflow-x: hidden;
      }

      .main-content {
        width: 100%;
        margin: 0;
        display: flex;
        flex-direction: column;
        padding: 1rem 100px;
        overflow-y: auto;
        box-sizing: border-box;
      }

      .dashboard-header {
        margin-bottom: 1rem;
      }
      .dashboard-header h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
      }
      .subtitle {
        color: #71717a;
        margin: 0;
      }
      .card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .card h3 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
      }
      .description {
        color: #71717a;
        margin: 0 0 1.5rem;
      }
      .instructions-box {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        border-radius: 4px;
      }
      .instructions-box h4 {
        margin: 0 0 1rem;
        color: #1e40af;
        font-size: 1rem;
      }
      .instructions-box ol {
        margin: 0 0 1rem;
        padding-left: 1.5rem;
      }
      .instructions-box li {
        margin-bottom: 0.5rem;
        color: #1e3a8a;
      }
      .warning-box {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        border-radius: 4px;
      }
      .warning-box h4 {
        margin: 0 0 0.5rem;
        color: #92400e;
        font-size: 1rem;
      }
      .warning-box p {
        margin: 0;
        color: #78350f;
        font-size: 0.875rem;
      }
      .tip {
        margin: 0;
        padding: 0.75rem;
        background: white;
        border-radius: 4px;
        color: #1e40af;
        font-size: 0.875rem;
      }
      .form-group {
        margin-bottom: 1.5rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .form-group small {
        display: block;
        margin-top: 0.5rem;
        color: #71717a;
        font-size: 0.875rem;
      }
      .input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        font-size: 1rem;
      }
      .textarea {
        resize: vertical;
        font-family: 'Courier New', monospace;
      }
      .button-group {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      .btn-primary:hover:not(:disabled) {
        background: #2563eb;
      }
      .btn-secondary {
        background: #f4f4f5;
        color: #18181b;
      }
      .btn-secondary:hover:not(:disabled) {
        background: #e4e4e7;
      }
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-outline {
        background: transparent;
        border: 1px solid #e4e4e7;
        color: #18181b;
      }
      .btn-outline:hover {
        background: #f4f4f5;
      }
      .btn-block {
        width: 100%;
      }
      .status-message {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
      }
      .status-message.success {
        background: #dcfce7;
        border: 1px solid #86efac;
      }
      .status-message.error {
        background: #fee2e2;
        border: 1px solid #fca5a5;
      }
      .status-message strong {
        display: block;
        margin-bottom: 0.5rem;
      }
      .status-message p {
        margin: 0.25rem 0;
      }
      .cookie-count {
        font-weight: 600;
        color: #3b82f6;
      }
      .cookies-display {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
      }
      .cookies-display h4 {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: #334155;
      }
      .cookie-list {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 1rem;
        background: white;
        border-radius: 6px;
        padding: 0.75rem;
      }
      .cookie-item {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.875rem;
      }
      .cookie-item:last-child {
        border-bottom: none;
      }
      .cookie-item strong {
        min-width: 150px;
        color: #475569;
      }
      .cookie-value {
        color: #64748b;
        font-family: 'Courier New', monospace;
        word-break: break-all;
      }
      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f4f4f5;
      }
      .status-row:last-child {
        border-bottom: none;
      }
      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        background: #f4f4f5;
        color: #71717a;
      }
      .status-badge.active {
        background: #dcfce7;
        color: #16a34a;
      }
      code {
        background: #f4f4f5;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.875rem;
      }

      /* MFA Dialog Styles */
      .mfa-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .mfa-dialog {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      }

      .mfa-dialog h3 {
        margin: 0 0 1rem;
        font-size: 1.5rem;
        color: #18181b;
      }

      .mfa-message {
        color: #71717a;
        margin-bottom: 1.5rem;
      }

      .error-message {
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 8px;
        margin-top: 1rem;
        font-size: 0.875rem;
      }
      .status-row:last-child {
        border-bottom: none;
      }
      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        background: #fef2f2;
        color: #dc2626;
      }
      .status-badge.active {
        background: #dcfce7;
        color: #16a34a;
      }
      code {
        background: #f4f4f5;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: 'Courier New', monospace;
      }
      .info-card ul {
        margin: 0;
        padding-left: 1.5rem;
      }
      .info-card li {
        margin-bottom: 0.5rem;
        color: #52525b;
      }
      .spinner-sm {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .cookie-extraction-loader {
        text-align: center;
        padding: 2rem 0;
      }
      .spinner-large {
        display: inline-block;
        width: 3rem;
        height: 3rem;
        border: 4px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }
      .extraction-message {
        font-size: 0.95rem;
        color: #3b82f6;
        font-weight: 500;
        margin: 0;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  airtableEmail = '';
  airtablePassword = '';
  mfaCode = '';
  loading = false;
  cookieStatus: any = null;
  isAuthenticated = false;
  currentUserId: string | null = null;
  displayedCookies: Array<{ name: string; value: string }> = [];

  // MFA Authentication
  showMFADialog = false;
  mfaSessionId = '';
  mfaMessage = '';
  mfaError = '';
  extractingCookies = false;
  cookieExtractionMessage = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUserId;
    this.authService.isAuthenticated$.subscribe(
      (auth) => (this.isAuthenticated = auth)
    );

    // Auto-load cookie status on init
    if (this.currentUserId) {
      this.validateCookies();
      this.loadCookiesForDisplay();
    }
  }

  autoRetrieveCookies(): void {
    console.log('[Settings] autoRetrieveCookies called');

    if (!this.airtableEmail || !this.airtablePassword) {
      this.showError('Email and password are required');
      return;
    }

    this.loading = true;
    this.cookieStatus = null;
    const userId = this.authService.currentUserId;

    console.log('[Settings] Current userId:', userId);

    if (!userId) {
      this.showError(
        'User not authenticated. Please complete OAuth login first.'
      );
      this.loading = false;
      return;
    }

    const request = {
      email: this.airtableEmail.trim(),
      password: this.airtablePassword,
      userId: userId, // Pass existing userId to avoid creating duplicate
    };

    console.log('[Settings] Sending auto-retrieve request for userId:', userId);

    this.http
      .post<any>(`${environment.apiBaseUrl}/auth/validate`, request)
      .subscribe({
        next: (response) => {
          console.log('[Settings] Auto-retrieve response:', response);
          this.loading = false;
          if (response.success) {
            // Verify the userId matches
            if (response.data?.userId && response.data.userId !== userId) {
              console.warn(
                '[Settings] WARNING: Response userId differs from current userId!',
                {
                  current: userId,
                  response: response.data.userId,
                }
              );
            }
            console.log('[Settings] Cookies stored for userId:', userId);

            this.showSuccess(
              `Authentication successful! Cookies extracted and stored. (${
                response.data?.cookiesCount || 0
              } cookies)`
            );
            this.cookieStatus = {
              valid: true,
              message:
                'Cookies automatically extracted and stored via new auth system',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            };
            // Clear password for security
            this.airtablePassword = '';
            this.mfaCode = '';
            // Refresh cookie display with new userId
            setTimeout(() => this.loadCookiesForDisplay(), 1000);
          }
        },
        error: (error) => {
          console.error('[Settings] Auto-retrieve error:', error);
          this.loading = false;
          const errorMessage =
            error.error?.error ||
            error.error?.message ||
            'Failed to retrieve cookies automatically';
          this.showError(errorMessage);
          this.cookieStatus = {
            valid: false,
            message: errorMessage,
          };
          this.displayedCookies = [];
        },
      });
  }

  validateCookies(): void {
    const userId = this.authService.currentUserId;

    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    this.loading = true;
    this.http
      .post<any>(`${environment.apiBaseUrl}/cookies/validate`, { userId })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.cookieStatus = {
            valid: response.data.valid,
            message: response.data.message,
            validUntil: response.data.validUntil,
          };
          if (response.data.valid) {
            this.showSuccess('Cookies are valid!');
            // Load cookies to display count
            this.loadCookiesForDisplay();
          } else {
            this.showError('Cookies are invalid or expired');
            this.displayedCookies = [];
          }
        },
        error: (error) => {
          this.loading = false;
          this.showError('Failed to validate cookies');
          this.cookieStatus = {
            valid: false,
            message: 'Failed to validate cookies',
          };
          this.displayedCookies = [];
        },
      });
  }

  /**
   * Load cookies for display in the UI
   */
  loadCookiesForDisplay(): void {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    this.http
      .get<any>(`${environment.apiBaseUrl}/cookies/get/${userId}`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.cookies) {
            this.displayedCookies = response.data.cookies;
            // Update cookie count in status
            if (this.cookieStatus) {
              this.cookieStatus.cookieCount = this.displayedCookies.length;
            }
          }
        },
        error: () => {
          // Silent fail - cookies might not be set yet
          this.displayedCookies = [];
        },
      });
  }

  /**
   * Truncate cookie value for display
   */
  truncateCookieValue(value: string): string {
    if (!value) return '';
    return value.length > 50 ? value.substring(0, 50) + '...' : value;
  }

  /**
   * Copy all cookies to clipboard in browser-friendly format
   */
  copyCookiesToClipboard(): void {
    if (this.displayedCookies.length === 0) {
      this.showError('No cookies to copy');
      return;
    }

    const cookieString = this.formatCookiesForBrowser(this.displayedCookies);
    navigator.clipboard.writeText(cookieString).then(
      () => {
        this.showSuccess('Cookies copied to clipboard!');
      },
      () => {
        this.showError('Failed to copy cookies to clipboard');
      }
    );
  }

  /**
   * TEST ONLY: Display cookies in console for debugging
   * TODO: Remove this method after testing
   */
  displayCookiesForTesting(): void {
    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    this.loading = true;
    this.http
      .post<any>(`${environment.apiBaseUrl}/cookies/validate`, { userId })
      .subscribe({
        next: (response) => {
          this.loading = false;

          // Make another request to get actual cookie values
          this.http
            .get<any>(`${environment.apiBaseUrl}/cookies/get/${userId}`)
            .subscribe({
              next: (cookieResponse) => {
                console.group(' COOKIES FOR TESTING');
                console.log('Raw cookies:', cookieResponse.data);
                console.log(
                  'Cookie string:',
                  this.formatCookiesForBrowser(cookieResponse.data)
                );
                console.groupEnd();

                // Copy to clipboard
                const cookieString = this.formatCookiesForBrowser(
                  cookieResponse.data
                );
                navigator.clipboard.writeText(cookieString).then(() => {
                  this.showSuccess(
                    'Cookies copied to clipboard! Check console for details.'
                  );
                });
              },
              error: () => {
                this.showError('Failed to fetch cookie values');
              },
            });
        },
        error: (error) => {
          this.loading = false;
          this.showError('Failed to get cookies');
        },
      });
  }

  private formatCookiesForBrowser(cookies: any[]): string {
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  /**
   * MFA Authentication - Step 1: Initiate login
   */
  loginWithMFA(): void {
    if (!this.airtableEmail || !this.airtablePassword) {
      this.showError('Email and password are required');
      return;
    }

    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError(
        'User not authenticated. Please complete OAuth login first.'
      );
      return;
    }

    this.loading = true;
    this.mfaError = '';

    this.authService
      .initiateLoginMFA(
        this.airtableEmail.trim(),
        this.airtablePassword,
        userId
      )
      .subscribe({
        next: (response) => {
          console.log('Login initiation response:', response);
          this.loading = false;

          if (response.success && response.requiresMFA) {
            // MFA required - show dialog
            this.showMFADialog = true;
            this.mfaSessionId = response.sessionId;
            this.mfaMessage = response.message;
            this.mfaCode = '';
          } else if (response.success && !response.requiresMFA) {
            // No MFA needed - cookies already saved
            this.showSuccess('Login successful! Cookies saved.');
            this.validateCookies();
            this.loadCookiesForDisplay();
          } else {
            this.showError(response.message || 'Login failed');
          }
        },
        error: (error) => {
          console.error('Login initiation error:', error);
          this.loading = false;
          this.showError(error.error?.message || 'Failed to initiate login');
        },
      });
  }

  /**
   * MFA Authentication - Step 2: Submit MFA code
   */
  submitMFACode(): void {
    if (!this.mfaCode || this.mfaCode.length !== 6) {
      this.mfaError = 'Please enter a 6-digit MFA code';
      return;
    }

    this.loading = true;
    this.mfaError = '';
    this.extractingCookies = true;
    this.cookieExtractionMessage =
      'Navigating through pages to extract cookies...';

    this.authService.submitMFA(this.mfaSessionId, this.mfaCode).subscribe({
      next: (response) => {
        console.log('MFA submission response:', response);
        this.loading = false;
        this.extractingCookies = false;
        this.cookieExtractionMessage = '';

        if (response.success) {
          this.showSuccess('MFA verified! Cookies saved successfully.');
          this.showMFADialog = false;
          this.mfaSessionId = '';
          this.mfaCode = '';
          this.validateCookies();
          this.loadCookiesForDisplay();
        } else {
          this.mfaError = response.message || 'MFA verification failed';
        }
      },
      error: (error) => {
        console.error('MFA submission error:', error);
        this.loading = false;
        this.extractingCookies = false;
        this.cookieExtractionMessage = '';
        this.mfaError = error.error?.message || 'Failed to submit MFA code';
      },
    });
  }

  /**
   * Cancel MFA login
   */
  cancelMFALogin(): void {
    if (this.mfaSessionId) {
      this.authService.cancelMFASession(this.mfaSessionId).subscribe({
        next: () => {
          console.log('Session cancelled');
        },
        error: (error) => {
          console.error('Failed to cancel session:', error);
        },
      });
    }

    this.showMFADialog = false;
    this.mfaSessionId = '';
    this.mfaCode = '';
    this.mfaError = '';
    this.loading = false;
    this.extractingCookies = false;
    this.cookieExtractionMessage = '';
  }

  /**
   * Get baseId from localStorage
   */
  private getBaseIdFromLocalStorage(): string | null {
    try {
      const connectionStr = localStorage.getItem('airtable_connection');
      if (connectionStr) {
        const connection = JSON.parse(connectionStr);
        return connection.baseId || null;
      }
    } catch (e) {
      console.error('Failed to parse connection from localStorage', e);
    }
    return null;
  }
}
