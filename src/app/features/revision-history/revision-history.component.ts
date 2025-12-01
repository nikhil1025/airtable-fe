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
    <div class="revision-history-container">
      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1>Revision History</h1>
            <p class="subtitle">
              Track changes and modifications to your records
            </p>
          </div>
          <div class="header-actions">
            <div class="select-wrapper">
              <label class="select-label">Select Base</label>
              <select
                class="custom-select"
                [(ngModel)]="selectedBaseId"
                (change)="onBaseChange()"
              >
                <option value="">All Bases</option>
                <option *ngFor="let base of bases" [value]="base.id">
                  {{ base.name }}
                </option>
              </select>
            </div>

            <div class="select-wrapper" *ngIf="selectedBaseId">
              <label class="select-label">Select Table</label>
              <select
                class="custom-select"
                [(ngModel)]="selectedTableId"
                (change)="onTableChange()"
              >
                <option value="">All Tables</option>
                <option *ngFor="let table of tables" [value]="table.id">
                  {{ table.name }}
                </option>
              </select>
            </div>

            <div class="btn-group-container">
              <div class="btn-group">
                <button
                  class="btn btn-primary"
                  (click)="syncRevisionHistory()"
                  [disabled]="loading || (!selectedBaseId && !selectedTableId)"
                >
                  <span *ngIf="loading" class="spinner"></span>
                  <span *ngIf="!loading">Filter</span>
                </button>

                <button
                  class="btn btn-secondary"
                  (click)="refreshData()"
                  [disabled]="refreshing"
                >
                  <span *ngIf="refreshing" class="spinner"></span>
                  <mat-icon *ngIf="!refreshing">refresh</mat-icon>
                  <span *ngIf="!refreshing">Refresh</span>
                </button>

                <button
                  class="btn btn-primary"
                  (click)="scrapeAndLoadRevisionHistory()"
                  [disabled]="scraping"
                >
                  <span *ngIf="scraping" class="spinner"></span>
                  <mat-icon *ngIf="!scraping">sync</mat-icon>
                  <span *ngIf="!scraping">Sync Revision History</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Scraping Loader Modal -->
        <div class="loader-overlay" *ngIf="scraping">
          <div class="loader-modal">
            <div class="loader-spinner"></div>
            <h2>Scraping Revision History Data</h2>
            <p>Please wait while we fetch data from Airtable...</p>
            <div class="loader-progress">
              <div class="progress-bar"></div>
            </div>
          </div>
        </div>

        <div class="content-area" *ngIf="!loading && !scraping">
          <!-- Cookie Status Alert -->
          <div class="alert alert-warning" *ngIf="!cookiesValid">
            <div class="alert-content">
              <mat-icon class="alert-icon">warning</mat-icon>
              <div class="alert-text">
                <strong>Authentication Required</strong>
                <p>
                  Your cookies have expired or are invalid. Please update your
                  authentication credentials in Settings.
                </p>
              </div>
              <button
                class="btn btn-sm btn-primary"
                (click)="redirectToSettings()"
              >
                Go to Settings
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
                  <mat-icon>download</mat-icon>
                  Export CSV
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
              <mat-icon class="no-data-icon">history</mat-icon>
              <h3>No Revision History Found</h3>
              <p>
                Select a base (and optionally a table), then click "Sync
                History" to extract revision history data.
              </p>
              <button
                class="btn btn-primary"
                (click)="syncRevisionHistory()"
                [disabled]="!selectedBaseId && !selectedTableId"
              >
                Filter
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
      .revision-history-container {
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
      .header-actions {
        display: flex;
        gap: 0.75rem;
      }

      .btn-group-container {
        display: flex;
        // gap: 0.5rem;
        align-items: end;
        padding-bottom: 2px;
      }
      .btn-group {
        display: flex;
        gap: 0.5rem;
        height: 60%;
        align-items: center;
      }
      .btn-group>button {
        height: 100%;
      }
      .select-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 220px;
      }

      .select-label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .custom-select {
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        color: #1f2937;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        outline: none;
        min-width: 220px;
        height: 48px;
      }

      .custom-select:hover {
        border-color: #2563eb;
      }

      .custom-select:focus {
        border-color: #2563eb;
        border-width: 2px;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .custom-select option {
        padding: 8px;
        color: #1f2937;
        background: white;
      }

      .content-area {
        flex: 1;
        // padding: 2rem;
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

      /* Loader Overlay Styles */
      .loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
      }

      .loader-modal {
        background: white;
        border-radius: 16px;
        padding: 3rem;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .loader-spinner {
        width: 80px;
        height: 80px;
        border: 6px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 2rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loader-modal h2 {
        margin: 0 0 1rem 0;
        color: #18181b;
        font-size: 1.5rem;
      }

      .loader-modal p {
        margin: 0 0 2rem 0;
        color: #6b7280;
      }

      .loader-progress {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(
          90deg,
          #2563eb 0%,
          #3b82f6 50%,
          #2563eb 100%
        );
        background-size: 200% 100%;
        animation: progress 1.5s ease-in-out infinite;
      }

      @keyframes progress {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class RevisionHistoryComponent implements OnInit, OnDestroy {
  // Grid configuration
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      headerName: 'UUID',
      field: 'uuid',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 180,
      cellRenderer: (params: any) => {
        if (!params.value) return '-';
        return params.value.substring(0, 12) + '...';
      },
    },
    {
      headerName: 'Record ID',
      field: 'issueId',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 160,
    },
    {
      headerName: 'Column Type',
      field: 'columnType',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 150,
    },
    {
      headerName: 'Old Value',
      field: 'oldValue',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 220,
      cellRenderer: (params: any) => {
        if (!params.value || params.value === '')
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
      width: 220,
      cellRenderer: (params: any) => {
        if (!params.value || params.value === '')
          return '<span style="color: #9ca3af; font-style: italic;">Empty</span>';
        return params.value.length > 50
          ? params.value.substring(0, 50) + '...'
          : params.value;
      },
    },
    {
      headerName: 'Changed At',
      field: 'createdDate',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleString();
      },
      width: 180,
    },
    {
      headerName: 'Changed By',
      field: 'authoredBy',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 150,
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
  scraping = false;
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
        if (response.success && response.data) {
          this.cookiesValid = response.data.valid;

          if (!this.cookiesValid) {
            const message =
              response.data.message ||
              'Your cookies have expired or are invalid.';
            const fullMessage = `${message} Please update your authentication in Settings.`;
            this.showWarning(fullMessage);
          } else if (response.data.validUntil) {
            const validUntil = new Date(response.data.validUntil);
            console.log(
              ' Cookies are valid until:',
              validUntil.toLocaleString()
            );
          }
        } else {
          this.cookiesValid = false;
          this.showWarning(
            'Unable to validate cookies. Please check your authentication in Settings.'
          );
        }
      },
      error: (error) => {
        console.error('Failed to check cookie status:', error);
        this.cookiesValid = false;
        this.showWarning(
          'Failed to validate cookies. Please check your authentication in Settings.'
        );
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
      console.log(
        ' Base changed, loading tables for base:',
        this.selectedBaseId
      );
      this.loadTables();
      this.loadRevisionHistory(); // Load revisions for the base
    } else {
      this.loadRevisionHistory(); // Load all revisions
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
    if (this.selectedTableId) {
      console.log(
        ' Table changed, loading revision history for table:',
        this.selectedTableId
      );
    }
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

    console.log('Loading revision history with filters:', {
      baseId: this.selectedBaseId || 'All',
      tableId: this.selectedTableId || 'All',
      limit: 1000,
    });

    this.revisionHistoryService.getRevisionHistory(request).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rowData = response.data.revisions || [];

          const filterInfo = [];
          if (this.selectedBaseId)
            filterInfo.push(`Base: ${this.selectedBaseId}`);
          if (this.selectedTableId)
            filterInfo.push(`Table: ${this.selectedTableId}`);
          const filterText =
            filterInfo.length > 0 ? ` (${filterInfo.join(', ')})` : '';

          if (this.rowData.length > 0) {
            const ticketCount =
              response.data.totalTickets ||
              new Set(this.rowData.map((r) => r.issueId)).size;
            this.showSuccess(
              `Loaded ${this.rowData.length} revisions from ${ticketCount} records${filterText}`
            );
          } else {
            console.log('No revision history found with current filters');
          }
        }
      },
      error: (error) => {
        console.error('Failed to load revision history:', error);
        this.showError('Failed to load revision history from database');
      },
    });
  }

  syncRevisionHistory(): void {
    if (!this.selectedBaseId && !this.selectedTableId) {
      this.showError('Please select at least a base or table');
      return;
    }

    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    if (!this.selectedTableId) {
      this.showWarning(
        'No table selected. This will sync ALL tables in the selected base. This may take a while.'
      );
    }

    this.loading = true;

    const request: any = {
      userId,
    };

    if (this.selectedBaseId) request.baseId = this.selectedBaseId;
    if (this.selectedTableId) request.tableId = this.selectedTableId;

    console.log('Syncing revision history with request:', request);

    this.revisionHistoryService.syncRevisionHistory(request).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          const successMsg = `Successfully synced! Processed: ${response.data.processed}, Successful: ${response.data.successful}, Failed: ${response.data.failed}`;
          this.showSuccess(successMsg);

          // Wait a bit for data to be written to DB, then refresh
          setTimeout(() => {
            this.loadRevisionHistory();
          }, 500);
        } else {
          this.showError('Sync completed but no data was returned');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Failed to sync revision history:', error);
        const errorMsg =
          error?.error?.message ||
          error?.message ||
          'Failed to sync revision history';
        this.showError(errorMsg);
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

  scrapeAndLoadRevisionHistory(): void {
    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    this.scraping = true;

    console.log('Starting revision history scraping for user:', userId);

    // Step 1: Scrape revision history from Airtable
    this.revisionHistoryService.scrapeRevisionHistory(userId).subscribe({
      next: (response) => {
        console.log('Scraping completed:', response);

        // Step 2: Load the scraped data from database
        this.revisionHistoryService.getUserRevisionHistory(userId).subscribe({
          next: (loadResponse) => {
            this.scraping = false;

            if (loadResponse.success && loadResponse.data) {
              this.rowData = loadResponse.data.revisions || [];
              this.showSuccess(
                `Data loaded successfully! ${this.rowData.length} revisions found.`
              );
              console.log('Loaded revisions:', this.rowData.length);
            } else {
              this.showError('Failed to load data after scraping');
            }
          },
          error: (loadError) => {
            this.scraping = false;
            console.error('Failed to load revision history:', loadError);
            this.showError('Failed to load data after scraping');
          },
        });
      },
      error: (error) => {
        this.scraping = false;
        console.error('Failed to scrape revision history:', error);
        const errorMsg =
          error?.error?.message ||
          error?.message ||
          'Failed to scrape revision history';
        this.showError(errorMsg);
      },
    });
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

  redirectToSettings(): void {
    this.router.navigate(['/settings']);
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
