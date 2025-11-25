import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
    AllCommunityModule,
    ColDef,
    GridApi,
    GridReadyEvent,
    ModuleRegistry
} from 'ag-grid-community';
import { RevisionHistory } from '../../core/models/revision-history.model';
import { AuthService } from '../../core/services/auth.service';
import { RevisionHistoryService } from '../../core/services/revision-history.service';

// Register AG Grid Community modules (FREE version)
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-revision-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AgGridAngular,
    MatButtonModule,
    MatSnackBarModule,
    FormsModule,
  ],
  template: `
    <div class="dashboard-layout">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>Airtable Integration</h2>
        </div>

        <div class="nav-menu">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
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
            <h1>Revision History</h1>
            <p class="subtitle">Track all sync operations and data changes</p>
          </div>
          <div class="header-actions">
            <button
              class="btn btn-primary"
              (click)="loadHistory()"
              [disabled]="loading"
            >
              <span *ngIf="loading" class="spinner"></span>
              <span *ngIf="!loading">Refresh</span>
            </button>
            <button
              class="btn btn-secondary"
              (click)="exportData()"
              [disabled]="!rowData.length"
            >
              Export CSV
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📜</div>
            <div class="stat-content">
              <div class="stat-label">Total Changes</div>
              <div class="stat-value">{{ rowData.length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-label">Status Changes</div>
              <div class="stat-value">{{ getSuccessCount() }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
              <div class="stat-label">Assignee Changes</div>
              <div class="stat-value">{{ getFailedCount() }}</div>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar" *ngIf="rowData.length > 0">
          <input
            type="text"
            placeholder="Search revision history..."
            [(ngModel)]="searchText"
            (input)="onSearchChange()"
            class="search-input"
          />
        </div>

        <!-- Loading State -->
        <div class="card loading-state" *ngIf="loading">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Loading revision history...</p>
          </div>
        </div>

        <!-- AG Grid Table -->
        <div class="card grid-container" *ngIf="!loading && rowData.length > 0">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="width: 100%; height: 500px;"
            [theme]="'legacy'"
            [rowData]="rowData"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [pagination]="true"
            [paginationPageSize]="20"
            [paginationPageSizeSelector]="[10, 20, 50, 100]"
            [animateRows]="true"
            (gridReady)="onGridReady($event)"
          />
        </div>

        <!-- Empty State -->
        <div class="card empty-state" *ngIf="!loading && rowData.length === 0">
          <div class="empty-icon">📜</div>
          <h3>No Revision History</h3>
          <p>Sync some data to see the revision history</p>
          <button class="btn btn-primary" routerLink="/projects">
            Go to Projects
          </button>
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
      .header-actions {
        display: flex;
        gap: 0.75rem;
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
      }
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f4f4f5;
        font-size: 1.5rem;
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
      .search-bar {
        margin-bottom: 1.5rem;
      }
      .search-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        border-radius: 6px;
        font-size: 0.875rem;
      }
      .card {
        background: white;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 1.5rem;
      }
      .grid-container {
        padding: 0;
        overflow: hidden;
      }
      .loading-state {
        text-align: center;
        padding: 3rem;
      }
      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e4e4e7;
        border-top-color: #18181b;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty-state {
        text-align: center;
        padding: 3rem;
      }
      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .empty-state h3 {
        margin: 0 0 0.5rem 0;
      }
      .empty-state p {
        color: #71717a;
        margin-bottom: 1.5rem;
      }
      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
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
      .btn-secondary {
        background: white;
        color: #18181b;
        border: 1px solid #e4e4e7;
      }
      .btn-secondary:hover:not(:disabled) {
        background: #f4f4f5;
      }
      .btn-secondary:disabled {
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
    `,
  ],
})
export class RevisionHistoryComponent implements OnInit {
  private gridApi!: GridApi;
  rowData: RevisionHistory[] = [];
  loading = false;
  searchText = '';

  columnDefs: ColDef[] = [
    {
      field: 'issueId',
      headerName: 'Issue ID',
      flex: 1,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'columnType',
      headerName: 'Column Type',
      flex: 1,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    { field: 'oldValue', headerName: 'Old Value', flex: 1, sortable: true },
    { field: 'newValue', headerName: 'New Value', flex: 1, sortable: true },
    { field: 'authoredBy', headerName: 'Author', flex: 1 },
    {
      field: 'createdDate',
      headerName: 'Date',
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '',
      sortable: true,
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  constructor(
    private revisionService: RevisionHistoryService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('🚀 [RevisionHistory] Component initialized');
    console.log(
      '🔐 [RevisionHistory] Current userId:',
      this.authService.currentUserId
    );
    this.loadHistory();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    console.log('✅ [RevisionHistory] Grid ready');
  }

  loadHistory() {
    this.loading = true;
    const userId = this.authService.currentUserId;

    console.log('📡 [RevisionHistory] Loading history for userId:', userId);

    if (!userId) {
      console.error('❌ [RevisionHistory] No userId - redirecting to login');
      this.showError('User not authenticated');
      this.loading = false;
      this.router.navigate(['/login']);
      return;
    }

    // Sync all revision history first
    this.revisionService.syncRevisionHistory({ userId }).subscribe({
      next: (response) => {
        console.log('✅ [RevisionHistory] Sync response:', response);
        this.loading = false;
        if (response.success) {
          this.showSuccess('Revision history synced successfully');
          // Since sync doesn't return data, we'd need a separate endpoint to fetch
          // For now, show empty state
          this.rowData = [];
          console.log(
            '⚠️ [RevisionHistory] No data returned from sync endpoint'
          );
        }
      },
      error: (error: any) => {
        console.error('❌ [RevisionHistory] Error syncing history:', error);
        this.showError(
          'Failed to sync history. Make sure cookies are set in Settings.'
        );
        this.loading = false;
      },
    });
  }

  onSearchChange() {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchText);
    }
  }

  exportData() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `sync-history-${new Date().toISOString().split('T')[0]}.csv`,
      });
      this.showSuccess('Data exported successfully');
    }
  }

  getSuccessCount(): number {
    return this.rowData.filter((item) => item.columnType === 'Status').length;
  }

  getFailedCount(): number {
    return this.rowData.filter((item) => item.columnType === 'Assignee').length;
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
