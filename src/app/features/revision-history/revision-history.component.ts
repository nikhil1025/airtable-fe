import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
} from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { AirtableBase } from '../../core/models/project.model';
import { AirtableTable } from '../../core/models/table.model';
import { AuthService } from '../../core/services/auth.service';
import { DataStateService } from '../../core/services/data-state.service';
import { ProjectService } from '../../core/services/project.service';
import {
  RevisionHistoryRecord,
  RevisionHistoryService,
} from '../../core/services/revision-history.service';
import { TableService } from '../../core/services/table.service';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-revision-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AgGridAngular,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
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
            <p class="subtitle">
              Track changes and modifications to your records
            </p>
          </div>
          <div class="header-actions">
            <mat-form-field appearance="outline" class="base-select">
              <mat-label>Select Base</mat-label>
              <mat-select
                [(value)]="selectedBaseId"
                (selectionChange)="onBaseChange()"
              >
                <mat-option value="">All Bases</mat-option>
                <mat-option *ngFor="let base of bases" [value]="base.id">
                  {{ base.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              class="table-select"
              *ngIf="selectedBaseId"
            >
              <mat-label>Select Table</mat-label>
              <mat-select
                [(value)]="selectedTableId"
                (selectionChange)="onTableChange()"
              >
                <mat-option value="">All Tables</mat-option>
                <mat-option *ngFor="let table of tables" [value]="table.id">
                  {{ table.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button
              class="btn btn-primary"
              (click)="syncRevisionHistory()"
              [disabled]="loading || !selectedBaseId || !selectedTableId"
            >
              <span *ngIf="loading" class="spinner"></span>
              <span *ngIf="!loading">🔄 Sync History</span>
            </button>

            <button
              class="btn btn-secondary"
              (click)="refreshData()"
              [disabled]="refreshing"
            >
              <span *ngIf="refreshing" class="spinner"></span>
              <span *ngIf="!refreshing">↻ Refresh</span>
            </button>
          </div>
        </div>

        <div class="content-area" *ngIf="!loading">
          <!-- Cookie Status Alert -->
          <div class="alert alert-warning" *ngIf="!cookiesValid">
            <div class="alert-content">
              <span class="alert-icon">⚠️</span>
              <div class="alert-text">
                <strong>Authentication Required</strong>
                <p>
                  Your cookies have expired. Please login again to extract
                  revision history.
                </p>
              </div>
              <button
                class="btn btn-sm btn-primary"
                (click)="redirectToLogin()"
              >
                Login
              </button>
            </div>
          </div>

          <!-- Data Grid -->
          <div class="data-section">
            <div class="section-header">
              <h3>Revision History Records</h3>
              <div class="section-actions">
                <input
                  type="text"
                  placeholder="Search revisions..."
                  class="search-input"
                  [(ngModel)]="searchText"
                  (input)="onSearchChange()"
                />
                <button
                  class="btn btn-outline btn-sm"
                  (click)="exportData()"
                  [disabled]="!rowData.length"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>

            <div class="grid-container">
              <ag-grid-angular
                class="ag-theme-alpine data-grid"
                [columnDefs]="columnDefs"
                [rowData]="rowData"
                [defaultColDef]="defaultColDef"
                [pagination]="true"
                [paginationPageSize]="50"
                [animateRows]="true"
                [suppressCellFocus]="true"
                (gridReady)="onGridReady($event)"
              >
              </ag-grid-angular>
            </div>
          </div>

          <!-- No Data State -->
          <div class="no-data-state" *ngIf="rowData.length === 0 && !loading">
            <div class="no-data-content">
              <div class="no-data-icon">📜</div>
              <h3>No Revision History Found</h3>
              <p>
                Select a base and table, then click "Sync History" to extract
                revision history data.
              </p>
              <button
                class="btn btn-primary"
                (click)="syncRevisionHistory()"
                [disabled]="!selectedBaseId || !selectedTableId"
              >
                🔄 Sync History
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading">
          <div class="spinner-large"></div>
          <h3>Extracting Revision History...</h3>
          <p>Please wait while we scrape revision history from Airtable.</p>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .dashboard-layout {
        display: flex;
        min-height: 100vh;
        background: #fafafa;
      }

      .sidebar {
        width: 240px;
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
        margin: 0;
        color: #27272a;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .nav-menu {
        flex: 1;
        padding: 1rem 0;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        color: #52525b;
        text-decoration: none;
        transition: all 0.2s;
        border-left: 2px solid transparent;
      }

      .nav-item:hover {
        background: #f4f4f5;
        color: #27272a;
      }

      .nav-item.active {
        background: #f4f4f5;
        color: #2563eb;
        border-left-color: #2563eb;
      }

      .nav-icon {
        font-size: 1.2rem;
      }

      .sidebar-footer {
        padding: 1.5rem;
        border-top: 1px solid #e4e4e7;
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .dashboard-header {
        background: white;
        padding: 2rem;
        border-bottom: 1px solid #e4e4e7;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 2rem;
      }

      .dashboard-header h1 {
        margin: 0;
        color: #27272a;
        font-size: 2rem;
        font-weight: 600;
      }

      .subtitle {
        margin: 0.5rem 0 0 0;
        color: #6b7280;
        font-size: 1rem;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .base-select,
      .table-select {
        min-width: 200px;
      }

      .content-area {
        flex: 1;
        padding: 2rem;
      }

      .alert {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
      }

      .alert-warning {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
      }

      .alert-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .alert-icon {
        font-size: 1.5rem;
      }

      .alert-text {
        flex: 1;
      }

      .alert-text strong {
        display: block;
        margin-bottom: 0.25rem;
      }

      .data-section {
        background: white;
        border-radius: 12px;
        border: 1px solid #e4e4e7;
        overflow: hidden;
      }

      .section-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e4e4e7;
        display: flex;
        justify-content: between;
        align-items: center;
        gap: 2rem;
      }

      .section-header h3 {
        margin: 0;
        color: #27272a;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .section-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .search-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #d4d4d8;
        border-radius: 6px;
        font-size: 0.875rem;
        min-width: 200px;
      }

      .grid-container {
        height: 600px;
      }

      .data-grid {
        width: 100%;
        height: 100%;
      }

      .no-data-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        background: white;
        border-radius: 12px;
        border: 1px solid #e4e4e7;
      }

      .no-data-content {
        text-align: center;
        max-width: 400px;
      }

      .no-data-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .no-data-content h3 {
        margin: 0 0 1rem 0;
        color: #52525b;
        font-size: 1.5rem;
      }

      .no-data-content p {
        margin: 0 0 2rem 0;
        color: #6b7280;
        line-height: 1.6;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        text-align: center;
      }

      .spinner-large {
        width: 48px;
        height: 48px;
        border: 3px solid #e4e4e7;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: inline-block;
        margin-right: 0.5rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background: #2563eb;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #1d4ed8;
      }

      .btn-secondary {
        background: #6b7280;
        color: white;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #4b5563;
      }

      .btn-outline {
        background: transparent;
        color: #6b7280;
        border: 1px solid #d4d4d8;
      }

      .btn-outline:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
      }

      .btn-block {
        width: 100%;
        justify-content: center;
      }

      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class RevisionHistoryComponent implements OnInit, OnDestroy {
  // Grid configuration
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      headerName: 'Changed At',
      field: 'changedAt',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      },
      width: 180,
    },
    {
      headerName: 'Record ID',
      field: 'recordId',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 150,
    },
    {
      headerName: 'Column',
      field: 'columnName',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 120,
    },
    {
      headerName: 'Type',
      field: 'columnType',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 100,
    },
    {
      headerName: 'Old Value',
      field: 'oldValue',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 200,
      cellRenderer: (params: any) => {
        if (!params.value)
          return '<span style="color: #9ca3af; font-style: italic;">Empty</span>';
        return params.value.length > 50
          ? params.value.substring(0, 50) + '...'
          : params.value;
      },
    },
    {
      headerName: 'New Value',
      field: 'newValue',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 200,
      cellRenderer: (params: any) => {
        if (!params.value)
          return '<span style="color: #9ca3af; font-style: italic;">Empty</span>';
        return params.value.length > 50
          ? params.value.substring(0, 50) + '...'
          : params.value;
      },
    },
    {
      headerName: 'Changed By',
      field: 'changedBy',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 150,
    },
    {
      headerName: 'Issue ID',
      field: 'issueId',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 120,
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  // Component state
  rowData: RevisionHistoryRecord[] = [];
  bases: AirtableBase[] = [];
  tables: AirtableTable[] = [];
  selectedBaseId: string = '';
  selectedTableId: string = '';
  searchText: string = '';
  loading = false;
  refreshing = false;
  cookiesValid = true;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private dataStateService: DataStateService,
    private revisionHistoryService: RevisionHistoryService,
    private projectService: ProjectService,
    private tableService: TableService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkCookieStatus();
    this.loadBases();
    this.loadRevisionHistory();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  checkCookieStatus(): void {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    this.revisionHistoryService.checkCookieStatus(userId).subscribe({
      next: (response) => {
        this.cookiesValid = response.data?.hasValidCookies || false;
        if (!this.cookiesValid) {
          this.showWarning(
            'Your cookies have expired. Please login again to extract revision history.'
          );
        }
      },
      error: (error) => {
        console.warn('Failed to check cookie status:', error);
        this.cookiesValid = false;
      },
    });
  }

  loadBases(): void {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    this.projectService.getBases(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bases = response.data.bases || [];
        }
      },
      error: (error) => {
        console.error('Failed to load bases:', error);
        this.showError('Failed to load bases');
      },
    });
  }

  onBaseChange(): void {
    this.selectedTableId = '';
    this.tables = [];

    if (this.selectedBaseId) {
      this.loadTables();
    }
  }

  loadTables(): void {
    const userId = this.authService.currentUserId;
    if (!userId || !this.selectedBaseId) return;

    this.tableService.getTables(userId, this.selectedBaseId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tables = response.data.tables || [];
        }
      },
      error: (error) => {
        console.error('Failed to load tables:', error);
        this.showError('Failed to load tables');
      },
    });
  }

  onTableChange(): void {
    this.loadRevisionHistory();
  }

  loadRevisionHistory(): void {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    const request = {
      userId,
      ...(this.selectedBaseId && { baseId: this.selectedBaseId }),
      ...(this.selectedTableId && { tableId: this.selectedTableId }),
      limit: 1000,
    };

    this.revisionHistoryService.getRevisionHistory(request).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rowData = response.data.revisions || [];
          if (this.rowData.length > 0) {
            this.showSuccess(
              `Loaded ${this.rowData.length} revision history records`
            );
          }
        }
      },
      error: (error) => {
        console.error('Failed to load revision history:', error);
        this.showError('Failed to load revision history');
      },
    });
  }

  syncRevisionHistory(): void {
    if (!this.selectedBaseId || !this.selectedTableId) {
      this.showError('Please select both base and table');
      return;
    }

    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    this.loading = true;

    const request = {
      userId,
      baseId: this.selectedBaseId,
      tableId: this.selectedTableId,
    };

    this.revisionHistoryService.syncRevisionHistory(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.showSuccess(
            `Successfully processed ${response.data.successful} records`
          );
          this.loadRevisionHistory(); // Refresh the data
        } else {
          this.showError('Sync completed but no data was returned');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to sync revision history:', error);
        this.showError('Failed to sync revision history');
      },
    });
  }

  refreshData(): void {
    this.refreshing = true;
    this.loadRevisionHistory();
    setTimeout(() => {
      this.refreshing = false;
    }, 1000);
  }

  onSearchChange(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchText);
    }
  }

  exportData(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `revision-history-${
          new Date().toISOString().split('T')[0]
        }.csv`,
      });
      this.showSuccess('Data exported successfully');
    }
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 8000,
      panelClass: ['error-snackbar'],
    });
  }

  private showWarning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 10000,
      panelClass: ['warning-snackbar'],
    });
  }
}
