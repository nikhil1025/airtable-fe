import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
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
import { AirtableBase } from '../../core/models/project.model';
import { AirtableTable } from '../../core/models/table.model';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { TableService } from '../../core/services/table.service';

// Register AG Grid Community modules (FREE version)
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AgGridAngular,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    FormsModule,
  ],
  template: `
    <div class="tables-container">
      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1>Tables</h1>
            <p class="subtitle">
              View and manage tables from your Airtable bases
            </p>
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

        <!-- Project Selector -->
        <div class="project-selector" *ngIf="projects.length > 0">
          <label for="projectSelect">Select Project:</label>
          <select
            id="projectSelect"
            [(ngModel)]="selectedProjectId"
            (change)="onProjectChange()"
            class="select-input"
          >
            <option *ngFor="let project of projects" [value]="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-label">Total Tables</div>
              <div class="stat-value">{{ rowData.length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">Selected Project</div>
              <div class="stat-value">{{ getSelectedProjectName() }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🔢</div>
            <div class="stat-content">
              <div class="stat-label">Total Fields</div>
              <div class="stat-value">{{ getTotalFields() }}</div>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar" *ngIf="rowData.length > 0">
          <input
            type="text"
            placeholder="Search tables..."
            [(ngModel)]="searchText"
            (input)="onSearchChange()"
            class="search-input"
          />
        </div>

        <!-- Loading State -->
        <div class="card loading-state" *ngIf="loading">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Loading tables...</p>
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
        <div
          class="card empty-state"
          *ngIf="!loading && rowData.length === 0 && selectedProjectId"
        >
          <div class="empty-icon">📋</div>
          <h3>No Tables Found</h3>
          <p>This project doesn't have any tables yet</p>
        </div>

        <div class="card empty-state" *ngIf="!loading && projects.length === 0">
          <div class="empty-icon">📁</div>
          <h3>No Projects Available</h3>
          <p>Please sync projects first from the Projects page</p>
          <button class="btn btn-primary" routerLink="/projects">
            Go to Projects
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .tables-container {
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
      .project-selector {
        margin-bottom: 1.5rem;
      }
      .project-selector label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .select-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e4e4e7;
        border-radius: 6px;
        font-size: 0.875rem;
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
export class TablesComponent implements OnInit {
  private gridApi!: GridApi;
  rowData: AirtableTable[] = [];
  projects: AirtableBase[] = [];
  selectedProjectId = '';
  loading = false;
  searchText = '';

  columnDefs: ColDef[] = [
    {
      field: 'name',
      headerName: 'Table Name',
      flex: 2,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'id',
      headerName: 'Table ID',
      flex: 1,
      filter: 'agTextColumnFilter',
    },
    { field: 'description', headerName: 'Description', flex: 2 },
    {
      field: 'fields',
      headerName: 'Field Count',
      flex: 1,
      valueGetter: (params) => params.data?.fields?.length || 0,
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  constructor(
    private tableService: TableService,
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  loadProjects() {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    // Load projects from cache
    this.projectService.getBases(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.projects = response.data.bases;
          if (this.projects.length > 0) {
            this.selectedProjectId = this.projects[0].id;
            this.loadTables();
          }
        }
      },
      error: (error) => {
        this.showError('Failed to load projects');
        console.error(error);
      },
    });
  }

  loadTables() {
    if (!this.selectedProjectId) return;

    this.loading = true;
    const userId = this.authService.currentUserId;
    if (!userId) {
      this.loading = false;
      return;
    }

    // Load tables from cache
    this.tableService.getTables(userId, this.selectedProjectId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rowData = response.data.tables;
          if (this.rowData.length > 0) {
            this.showSuccess(
              `Loaded ${response.data.tables.length} tables from cache`
            );
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.showError('Failed to load tables');
        console.error(error);
        this.loading = false;
      },
    });
  }

  onProjectChange() {
    this.loadTables();
  }

  onSearchChange() {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchText);
    }
  }

  exportData() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `airtable-tables-${
          new Date().toISOString().split('T')[0]
        }.csv`,
      });
      this.showSuccess('Data exported successfully');
    }
  }

  getTotalFields(): number {
    return this.rowData.reduce(
      (sum, table) => sum + (table.fields?.length || 0),
      0
    );
  }

  getSelectedProjectName(): string {
    const project = this.projects.find((p) => p.id === this.selectedProjectId);
    return project?.name || '-';
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
