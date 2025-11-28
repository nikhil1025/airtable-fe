import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DataStateService } from '../../core/services/data-state.service';
import { DemoService } from '../../core/services/demo.service';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule],
  template: `
    <div class="dashboard-layout">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>Airtable Integration</h2>
        </div>

        <div class="nav-menu">
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-item"
          >
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/projects" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📁</span>
            <span>Projects</span>
          </a>
          <a routerLink="/tables" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Tables</span>
          </a>
          <a routerLink="/tickets" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🎫</span>
            <span>Tickets</span>
          </a>
          <a
            routerLink="/revision-history"
            routerLinkActive="active"
            class="nav-item"
          >
            <span class="nav-icon">📜</span>
            <span>Revision History</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span>Settings</span>
          </a>
        </div>

        <div class="sidebar-footer">
          <button class="btn btn-outline btn-block" (click)="logout()">
            Logout
          </button>
        </div>
      </nav>

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
            <span *ngIf="!syncing">🔄 Sync All Data</span>
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
            Synced {{ syncResult.data.bases || 0 }} projects,
            {{ syncResult.data.tables || 0 }} tables,
            {{ syncResult.data.tickets || 0 }} tickets, and
            {{ syncResult.data.users || 0 }} users
          </p>
          <p *ngIf="!syncResult.success">
            {{ syncResult.error || 'An error occurred during sync' }}
          </p>
        </div>

        <div class="stats-grid">
          <div class="stat-card clickable" routerLink="/projects">
            <div class="stat-icon projects">📁</div>
            <div class="stat-content">
              <div class="stat-label">Projects</div>
              <div class="stat-value">{{ stats.projects }}</div>
              <div class="stat-hint">Click to view →</div>
            </div>
          </div>

          <div class="stat-card clickable" routerLink="/tables">
            <div class="stat-icon tables">📋</div>
            <div class="stat-content">
              <div class="stat-label">Tables</div>
              <div class="stat-value">{{ stats.tables }}</div>
              <div class="stat-hint">Click to view →</div>
            </div>
          </div>

          <div class="stat-card clickable" routerLink="/tickets">
            <div class="stat-icon tickets">🎫</div>
            <div class="stat-content">
              <div class="stat-label">Tickets</div>
              <div class="stat-value">{{ stats.tickets }}</div>
              <div class="stat-hint">Click to view →</div>
            </div>
          </div>

          <div class="stat-card clickable" routerLink="/revision-history">
            <div class="stat-icon history">📜</div>
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
              <span class="action-icon">📁</span>
              <div class="action-content">
                <strong>View Projects</strong>
                <small>Browse your Airtable bases</small>
              </div>
            </button>
            <button class="action-btn" routerLink="/tickets">
              <span class="action-icon">🎫</span>
              <div class="action-content">
                <strong>View Tickets</strong>
                <small>Access table records</small>
              </div>
            </button>
            <button class="action-btn" routerLink="/revision-history">
              <span class="action-icon">📜</span>
              <div class="action-content">
                <strong>Revision History</strong>
                <small>Track data changes</small>
              </div>
            </button>
            <button class="action-btn" routerLink="/settings">
              <span class="action-icon">⚙️</span>
              <div class="action-content">
                <strong>Settings</strong>
                <small>Configure credentials</small>
              </div>
            </button>
          </div>
        </div>

        <div class="card info-card">
          <h3>ℹ️ Getting Started</h3>
          <ol>
            <li>
              Click <strong>Sync All Data</strong> to fetch your Airtable
              projects, tables, and tickets
            </li>
            <li>
              Go to <strong>Settings</strong> to configure cookies for revision
              history access
            </li>
            <li>
              Navigate to any section using the sidebar or quick actions above
            </li>
          </ol>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .dashboard-layout {
        display: flex;
        min-height: 100vh;
      }
      .sidebar {
        width: 260px;
        background: white;
        border-right: 1px solid #e4e4e7;
        display: flex;
        flex-direction: column;
      }
      .sidebar-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e4e4e7;
      }
      .sidebar-header h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
      }
      .nav-menu {
        flex: 1;
        padding: 1rem;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        color: #52525b;
        text-decoration: none;
        margin-bottom: 0.25rem;
        transition: all 0.2s;
      }
      .nav-item:hover {
        background: #f4f4f5;
        color: #18181b;
      }
      .nav-item.active {
        background: #18181b;
        color: white;
      }
      .nav-icon {
        font-size: 1.25rem;
      }
      .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid #e4e4e7;
      }
      .main-content {
        flex: 1;
        padding: 2rem;
        background: #fafafa;
      }
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
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
        margin-bottom: 2rem;
        padding: 1rem 1.5rem;
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
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      .stat-card {
        background: white;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        gap: 1rem;
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
        padding: 2rem;
        margin-bottom: 2rem;
      }
      .card h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
      }
      .description {
        color: #71717a;
        margin-bottom: 1.5rem;
      }
      .quick-actions h3 {
        margin-bottom: 1rem;
      }
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      .action-btn {
        background: white;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
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
    // Load stats from the backend
    this.demoService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dataStateService.updateStats(response.data.stats);
        }
      },
      error: (error) => {
        console.warn('Failed to load stats:', error);
      },
    });

    // Load projects from the backend
    if (!this.dataStateService.hasProjects()) {
      this.dataStateService.setLoading('projects', true);
      this.demoService.getProjects().subscribe({
        next: (response) => {
          this.dataStateService.setLoading('projects', false);
          if (response.success && response.data) {
            this.dataStateService.setProjects(response.data.bases || []);
            console.log(
              '✅ Loaded projects from database:',
              response.data.bases?.length || 0
            );
          }
        },
        error: (error) => {
          this.dataStateService.setLoading('projects', false);
          console.warn('Failed to load projects from database:', error);
        },
      });
    }
  }

  syncAll(): void {
    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    this.syncing = true;
    this.syncResult = null;

    this.projectService.syncAll(userId).subscribe({
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
    // Give the database a moment to process the sync
    setTimeout(() => {
      // Refresh stats from database
      this.demoService.getStats().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.dataStateService.updateStats(response.data.stats);
            console.log('✅ Refreshed stats after sync:', response.data.stats);
          }
        },
        error: (error) => {
          console.warn('Failed to refresh stats after sync:', error);
        },
      });

      // Refresh projects data
      this.dataStateService.setLoading('projects', true);
      this.demoService.getProjects().subscribe({
        next: (response) => {
          this.dataStateService.setLoading('projects', false);
          if (response.success && response.data) {
            this.dataStateService.setProjects(response.data.bases || []);
            console.log(
              '✅ Refreshed projects after sync:',
              response.data.bases?.length || 0
            );
          }
        },
        error: (error) => {
          this.dataStateService.setLoading('projects', false);
          console.warn('Failed to refresh projects after sync:', error);
        },
      });
    }, 1000); // Wait 1 second for database to process
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
