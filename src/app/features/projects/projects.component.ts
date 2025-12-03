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
              <div class="stat-value">{{ rowData.length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <mat-icon class="stat-icon">check_circle</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Synced Today</div>
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
        <!-- <div class="card grid-container" *ngIf="!loading && rowData.length > 0"> -->
        <div class="grid-wrapper">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="height: 100%; width: 100%;"
            [theme]="'legacy'"
            [rowData]="rowData"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [pagination]="true"
            [paginationPageSize]="20"
            [paginationPageSizeSelector]="[10, 20, 50, 100]"
            [animateRows]="true"
            [domLayout]="'normal'"
            (gridReady)="onGridReady($event)"
          ></ag-grid-angular>
        </div>
        <!-- </div> -->

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
    public authService: AuthService, // Made public for template access
    private dataStateService: DataStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Subscribe to projects state
    const projectsSubscription = this.dataStateService
      .getProjectsObservable()
      .subscribe((projects) => {
        this.rowData = projects;
      });
    this.subscriptions.push(projectsSubscription);

    // Subscribe to loading state
    const loadingSubscription = this.dataStateService
      .getLoadingObservable()
      .subscribe((loading) => {
        this.loading = loading.projects;
      });
    this.subscriptions.push(loadingSubscription);

    this.loadProjects();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    // Force refresh
    this.gridApi.refreshCells();
    this.gridApi.sizeColumnsToFit();
  }

  loadProjects() {
    const userId = this.authService.currentUserId;

    if (!userId) {
      console.error(' [Projects] No userId - user not authenticated');
      this.showError('User not authenticated. Please login first.');
      this.router.navigate(['/login']);
      return;
    }

    // Always fetch fresh data from API - no caching
    this.dataStateService.setLoading('projects', true);

    // Use getBases for fast cached load
    this.projectService.getBases(userId).subscribe({
      next: (response) => {
        this.dataStateService.setLoading('projects', false);
        if (response.success && response.data) {
          this.dataStateService.setProjects(response.data.bases || []);

          if (response.data.bases && response.data.bases.length > 0) {
            this.showSuccess(
              `Loaded ${response.data.bases.length} projects from cache`
            );
          } else {
            this.showInfo(
              'No projects found in cache. Click "Sync All" to fetch from Airtable.'
            );
          }
        } else {
          console.warn(' [Projects] No data in response:', response);
        }
      },
      error: (error) => {
        console.error(' [Projects] Error loading projects:', error);
        this.dataStateService.setLoading('projects', false);
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
