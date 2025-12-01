import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DataStateService } from '../../core/services/data-state.service';
import { DemoService } from '../../core/services/demo.service';
import { ProjectService } from '../../core/services/project.service';
import { RealDataService } from '../../core/services/real-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p class="subtitle">
              Welcome to your Airtable Integration Dashboard
            </p>
          </div>
          <button
            class="btn btn-primary"
            (click)="syncAll()"
            [disabled]="syncing"
          >
            <span *ngIf="syncing" class="spinner"></span>
            <mat-icon *ngIf="!syncing">sync</mat-icon>
            <span *ngIf="!syncing">Sync All Data</span>
          </button>
        </div>

        <div
          *ngIf="syncResult"
          class="sync-result"
          [class.success]="syncResult.success"
          [class.error]="!syncResult.success"
        >
          <strong>{{
            syncResult.success ? '✓ Sync Complete!' : '✗ Sync Failed'
          }}</strong>
          <p *ngIf="syncResult.success && syncResult.data">
            Synced {{ syncResult.data.synced.bases || 0 }} projects,
            {{ syncResult.data.synced.tables || 0 }} tables,
            {{ syncResult.data.synced.tickets || 0 }} tickets, and
            {{ syncResult.data.synced.users || 0 }} users
          </p>
          <p *ngIf="!syncResult.success">
            {{ syncResult.error || 'An error occurred during sync' }}
          </p>
        </div>

        <div class="stats-grid">
          <div class="stat-card clickable" routerLink="/projects">
            <mat-icon class="stat-icon projects">folder</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Projects</div>
              <div class="stat-value">{{ stats.projects }}</div>
              <div class="stat-hint">Click to view →</div>
            </div>
          </div>

          <div class="stat-card clickable" routerLink="/tables">
            <mat-icon class="stat-icon tables">table_chart</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Tables</div>
              <div class="stat-value">{{ stats.tables }}</div>
              <div class="stat-hint">Click to view →</div>
            </div>
          </div>

          <div class="stat-card clickable" routerLink="/tickets">
            <mat-icon class="stat-icon tickets">confirmation_number</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Tickets</div>
              <div class="stat-value">{{ stats.tickets }}</div>
              <div class="stat-hint">Click to view →</div>
            </div>
          </div>

          <div class="stat-card clickable" routerLink="/revision-history">
            <mat-icon class="stat-icon history">history</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Revisions</div>
              <div class="stat-value">{{ stats.revisions }}</div>
              <div class="stat-hint">Click to view →</div>
            </div>
          </div>
        </div>

        <div class="card quick-actions">
          <h3>Quick Actions</h3>
          <p class="description">Get started with these common tasks</p>
          <div class="actions-grid">
            <button class="action-btn" routerLink="/projects">
              <mat-icon class="action-icon">folder</mat-icon>
              <div class="action-content">
                <strong>View Projects</strong>
                <small>Browse your Airtable bases</small>
              </div>
            </button>
            <button class="action-btn" routerLink="/tickets">
              <mat-icon class="action-icon">confirmation_number</mat-icon>
              <div class="action-content">
                <strong>View Tickets</strong>
                <small>Access table records</small>
              </div>
            </button>
            <button class="action-btn" routerLink="/revision-history">
              <mat-icon class="action-icon">history</mat-icon>
              <div class="action-content">
                <strong>Revision History</strong>
                <small>Track data changes</small>
              </div>
            </button>
            <button class="action-btn" routerLink="/settings">
              <mat-icon class="action-icon">settings</mat-icon>
              <div class="action-content">
                <strong>Settings</strong>
                <small>Configure credentials</small>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        min-height: 100vh;
        background: #fafafa;
        width: 100%;
        overflow-x: hidden;
      }

      .main-content {
        max-width: 100%;
        margin: 0;
        padding: 1rem 100px;
        box-sizing: border-box;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }
      .dashboard-header h1 {
        font-size: 1.875rem;
        font-weight: 700;
        margin: 0;
      }
      .subtitle {
        color: #71717a;
        margin-top: 0.25rem;
      }
      .sync-result {
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
      }
      .sync-result.success {
        background: #dcfce7;
        border: 1px solid #86efac;
        color: #166534;
      }
      .sync-result.error {
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #991b1b;
      }
      .sync-result strong {
        display: block;
        margin-bottom: 0.5rem;
      }
      .sync-result p {
        margin: 0.25rem 0 0 0;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .stat-card {
        background: white;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        gap: 0.75rem;
        transition: all 0.2s;
      }
      .stat-card.clickable {
        cursor: pointer;
      }
      .stat-card.clickable:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #18181b;
      }
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }
      .stat-icon.projects {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      }
      .stat-icon.tables {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      }
      .stat-icon.tickets {
        background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
      }
      .stat-icon.history {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      }
      .stat-content {
        flex: 1;
      }
      .stat-label {
        font-size: 0.875rem;
        color: #71717a;
        margin: 0;
      }
      .stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        margin: 0.25rem 0 0 0;
      }
      .stat-hint {
        font-size: 0.75rem;
        color: #a1a1aa;
        margin-top: 0.25rem;
      }
      .card {
        background: white;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      .card h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
      }
      .description {
        color: #71717a;
        margin-bottom: 0.75rem;
      }
      .quick-actions h3 {
        margin-bottom: 0.5rem;
      }
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
      }
      .action-btn {
        background: white;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }
      .action-btn:hover {
        background: #f4f4f5;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      .action-icon {
        font-size: 1.75rem;
      }
      .action-content {
        flex: 1;
      }
      .action-content strong {
        display: block;
        margin-bottom: 0.25rem;
      }
      .action-content small {
        color: #71717a;
        font-size: 0.75rem;
      }
      .info-card {
        background: #f0f9ff;
        border-color: #bae6fd;
      }
      .info-card h3 {
        color: #0c4a6e;
      }
      .info-card ol {
        margin: 0;
        padding-left: 1.5rem;
        color: #0c4a6e;
      }
      .info-card li {
        margin-bottom: 0.75rem;
      }
      .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .btn-primary {
        background: #18181b;
        color: white;
      }
      .btn-primary:hover:not(:disabled) {
        background: #27272a;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-outline {
        background: transparent;
        color: #18181b;
        border: 1px solid #e4e4e7;
      }
      .btn-outline:hover {
        background: #f4f4f5;
      }
      .btn-block {
        width: 100%;
      }
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  syncing = false;
  syncResult: any = null;
  stats = {
    projects: 0,
    tables: 0,
    tickets: 0,
    revisions: 0,
  };
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private dataStateService: DataStateService,
    private demoService: DemoService,
    private realDataService: RealDataService,
    private projectService: ProjectService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to state changes
    const statsSubscription = this.dataStateService
      .getStatsObservable()
      .subscribe((stats) => {
        this.stats = stats;
      });
    this.subscriptions.push(statsSubscription);

    // Load existing data if available
    this.loadExistingData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadExistingData(): void {
    const userId = this.authService.currentUserId;
    if (!userId) {
      console.warn('No user ID available for loading data');
      return;
    }

    // Try to load real stats from database first
    this.realDataService.getStats(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dataStateService.updateStats(response.data.stats);
          console.log(' Loaded real stats from database:', response.data.stats);
        }
      },
      error: (error) => {
        console.warn('Failed to load real stats, falling back to demo:', error);
        // Fallback to demo data if real data fails
        this.demoService.getStats().subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.dataStateService.updateStats(response.data.stats);
              console.log(
                ' Loaded demo stats as fallback:',
                response.data.stats
              );
            }
          },
          error: (demoError) => {
            console.warn('Failed to load demo stats:', demoError);
          },
        });
      },
    });

    // Always load fresh projects from the backend API
    this.dataStateService.setLoading('projects', true);
    this.realDataService.getProjects(userId).subscribe({
      next: (response) => {
        this.dataStateService.setLoading('projects', false);
        if (response.success && response.data) {
          this.dataStateService.setProjects(response.data.bases || []);
          console.log(
            ' Loaded real projects from database:',
            response.data.bases?.length || 0
          );
        }
      },
      error: (error) => {
        console.warn(
          'Failed to load real projects, falling back to demo:',
          error
        );
        // Fallback to demo data
        this.demoService.getProjects().subscribe({
          next: (response) => {
            this.dataStateService.setLoading('projects', false);
            if (response.success && response.data) {
              this.dataStateService.setProjects(response.data.bases || []);
              console.log(
                ' Loaded demo projects as fallback:',
                response.data.bases?.length || 0
              );
            }
          },
          error: (demoError) => {
            this.dataStateService.setLoading('projects', false);
            console.warn('Failed to load demo projects:', demoError);
          },
        });
      },
    });
  }

  syncAll(): void {
    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    this.syncing = true;
    this.syncResult = null;

    // Use fresh sync that bypasses cookie issues
    this.realDataService.syncFresh(userId).subscribe({
      next: (response) => {
        this.syncing = false;
        this.syncResult = response;
        if (response.success && response.data?.synced) {
          // Update state service with new stats from sync response
          const syncStats = {
            projects: response.data.synced.bases || 0,
            tables: response.data.synced.tables || 0,
            tickets: response.data.synced.tickets || 0,
            revisions: response.data.synced.users || 0,
          };
          this.dataStateService.updateStats(syncStats);
          this.dataStateService.setSyncTime(new Date());

          // Force refresh data from database to get the actual persisted data
          this.refreshDataAfterSync();

          this.showSuccess('Sync completed successfully!');
        }
      },
      error: (error) => {
        this.syncing = false;
        this.syncResult = {
          success: false,
          error: error.error?.error || 'Sync failed',
        };
        this.showError('Sync failed. Please try again.');
      },
    });
  }

  private refreshDataAfterSync(): void {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    // Give the database a moment to process the sync
    setTimeout(() => {
      // Refresh stats from real database
      this.realDataService.getStats(userId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.dataStateService.updateStats(response.data.stats);
            console.log(
              ' Refreshed real stats after sync:',
              response.data.stats
            );
          }
        },
        error: (error) => {
          console.warn('Failed to refresh real stats after sync:', error);
        },
      });

      // Refresh projects data from real database
      this.dataStateService.setLoading('projects', true);
      this.realDataService.getProjects(userId).subscribe({
        next: (response) => {
          this.dataStateService.setLoading('projects', false);
          if (response.success && response.data) {
            this.dataStateService.setProjects(response.data.bases || []);
            console.log(
              ' Refreshed real projects after sync:',
              response.data.bases?.length || 0
            );
          }
        },
        error: (error) => {
          this.dataStateService.setLoading('projects', false);
          console.warn('Failed to refresh real projects after sync:', error);
        },
      });
    }, 1000); // Wait 1 second for database to process
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
