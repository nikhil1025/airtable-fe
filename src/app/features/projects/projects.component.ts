import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { AirtablePaginationService } from '../../core/services/airtable-pagination.service';
import { AuthService } from '../../core/services/auth.service';
import { DataStateService } from '../../core/services/data-state.service';
import { ProjectService } from '../../core/services/project.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AgGridAngular,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule,
  ],
  template: `
    <div class="projects-container">
      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1>Projects & Bases</h1>
            <p class="subtitle">Manage your Airtable bases and sync data</p>
          </div>
          <div class="header-actions">
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
            <mat-icon class="stat-icon">folder</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Total Projects</div>
              <div class="stat-value">{{ totalProjects }}</div>
            </div>
          </div>

          <div class="stat-card">
            <mat-icon class="stat-icon">check_circle</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Synced</div>
              <div class="stat-value">{{ rowData.length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <mat-icon class="stat-icon">schedule</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Last Sync</div>
              <div class="stat-value">Just now</div>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar" *ngIf="rowData.length > 0">
          <input
            type="text"
            placeholder="Search projects by name or ID..."
            [(ngModel)]="searchText"
            (input)="onSearchChange()"
            class="search-input"
          />
        </div>

        <!-- Loading State -->
        <div class="card loading-state" *ngIf="loading">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Syncing projects from Airtable...</p>
          </div>
        </div>

        <!-- AG Grid Table -->
        <div class="grid-wrapper" *ngIf="!loading && initialDataLoaded">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="height: 100%; width: 100%;"
            [theme]="'legacy'"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [rowModelType]="'infinite'"
            [cacheBlockSize]="pageSize"
            [maxBlocksInCache]="10"
            [pagination]="true"
            [paginationPageSize]="pageSize"
            [paginationPageSizeSelector]="[10, 20, 50, 100]"
            [animateRows]="true"
            [domLayout]="'normal'"
            (gridReady)="onGridReady($event)"
          ></ag-grid-angular>
        </div>

        <div class="card empty-state" *ngIf="!loading && rowData.length === 0">
          <mat-icon class="empty-icon">folder</mat-icon>
          <h3>No Projects Found</h3>
          <p>Sync your Airtable bases to get started</p>
          <button class="btn btn-primary" (click)="syncAll()">
            Sync Projects Now
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .projects-container {
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
        padding: 0 !important;
        overflow: visible !important;
        height: 550px;
        min-height: 550px;
        display: block;
        position: relative;
      }
      .grid-wrapper {
        height: 500px;
        width: 100%;
        position: relative;
        // border: 3px solid #ef4444; /* Red border for debugging */
        background: #fee; /* Light red background */
      }
      .ag-theme-alpine {
        --ag-foreground-color: #18181b;
        --ag-background-color: #ffffff;
        --ag-header-background-color: #f4f4f5;
        --ag-odd-row-background-color: #fafafa;
        --ag-border-color: #e4e4e7;
        height: 100% !important;
        width: 100% !important;
      }
      .grid-container ag-grid-angular {
        height: 100%;
        width: 100%;
        display: block;
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
export class ProjectsComponent implements OnInit, OnDestroy {
  private gridApi!: GridApi;
  private subscriptions: Subscription[] = [];
  rowData: AirtableBase[] = [];
  loading = false;
  searchText = '';

  pageSize = 20;
  totalProjects = 0;
  offsetCache = new Map<number, string>();
  initialDataLoaded = false;

  columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Project Name',
      flex: 2,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'id',
      headerName: 'Base ID',
      flex: 1,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'permissionLevel',
      headerName: 'Permission',
      flex: 1,
      filter: 'agTextColumnFilter',
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  constructor(
    private projectService: ProjectService,
    public authService: AuthService,
    private dataStateService: DataStateService,
    private router: Router,
    private snackBar: MatSnackBar,
    private paginationService: AirtablePaginationService
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.refreshCells();
    this.gridApi.sizeColumnsToFit();
    if (this.initialDataLoaded) {
      this.setupDataSource();
    }
  }

  setupDataSource() {
    if (!this.gridApi) return;

    const dataSource = {
      rowCount: undefined,
      getRows: (params: any) => {
        const page = Math.floor(params.startRow / this.pageSize);
        const offset = this.offsetCache.get(page);

        const userId = this.authService.currentUserId;
        if (!userId) {
          params.failCallback();
          return;
        }

        this.paginationService
          .getPaginatedBases({
            userId,
            offset,
            pageSize: this.pageSize,
          })
          .subscribe({
            next: (response) => {
              if (response.success && response.data) {
                const bases = response.data.bases || [];
                this.dataStateService.setProjects(bases);

                if (response.data.offset) {
                  this.offsetCache.set(page + 1, response.data.offset);
                }

                let lastRow = -1;
                if (!response.data.hasMore) {
                  lastRow = params.startRow + bases.length;
                }

                params.successCallback(bases, lastRow);
              } else {
                params.failCallback();
              }
            },
            error: (error) => {
              console.error('Error loading projects:', error);
              params.failCallback();
            },
          });
      },
    };

    this.gridApi.setGridOption('datasource', dataSource);
  }

  loadProjects() {
    const userId = this.authService.currentUserId;

    if (!userId) {
      console.error('No userId - user not authenticated');
      this.showError('User not authenticated. Please login first.');
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.offsetCache.clear();

    this.paginationService
      .getPaginatedBases({
        userId,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.rowData = response.data.bases || [];
            this.dataStateService.setProjects(this.rowData);

            if (response.data.offset) {
              this.offsetCache.set(1, response.data.offset);
            }

            this.initialDataLoaded = true;
            if (this.gridApi) {
              this.setupDataSource();
            }
            this.showSuccess('Projects loaded from Airtable');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.loading = false;
          this.showError(
            'Failed to load projects: ' + (error.message || 'Unknown error')
          );
        },
      });
  }

  syncAll() {
    this.loading = true;
    const userId = this.authService.currentUserId;

    if (!userId) {
      this.showError('User not authenticated');
      this.loading = false;
      return;
    }

    this.projectService.syncAll(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('All projects synced successfully from Airtable');
          // Reload from cache after sync
          this.loadProjects();
        }
        this.loading = false;
      },
      error: (error) => {
        this.showError('Failed to sync projects');
        console.error('Error syncing:', error);
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
        fileName: `airtable-projects-${
          new Date().toISOString().split('T')[0]
        }.csv`,
      });
      this.showSuccess('Data exported successfully');
    }
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showInfo(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar'],
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
