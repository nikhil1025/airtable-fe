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
import { AirtableRecord } from '../../core/models/ticket.model';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { TableService } from '../../core/services/table.service';
import { TicketService } from '../../core/services/ticket.service';

// Register AG Grid Community modules (FREE version)
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-tickets',
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
    <div class="tickets-container">
      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1>Tickets & Records</h1>
            <p class="subtitle">
              View and manage records from your Airtable tables
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

        <!-- Selectors -->
        <div class="selectors-grid">
          <div class="selector-group">
            <label for="projectSelect">Select Project:</label>
            <select
              id="projectSelect"
              [(ngModel)]="selectedProjectId"
              (change)="onProjectChange()"
              class="select-input"
            >
              <option value="">Choose a project...</option>
              <option *ngFor="let project of projects" [value]="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>

          <div class="selector-group">
            <label for="tableSelect">Select Table:</label>
            <select
              id="tableSelect"
              [(ngModel)]="selectedTableId"
              (change)="onTableChange()"
              class="select-input"
              [disabled]="!selectedProjectId"
            >
              <option value="">Choose a table...</option>
              <option *ngFor="let table of tables" [value]="table.id">
                {{ table.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎫</div>
            <div class="stat-content">
              <div class="stat-label">Total Records</div>
              <div class="stat-value">{{ rowData.length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">Selected Table</div>
              <div class="stat-value">{{ getSelectedTableName() }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📁</div>
            <div class="stat-content">
              <div class="stat-label">Selected Project</div>
              <div class="stat-value">{{ getSelectedProjectName() }}</div>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar" *ngIf="rowData.length > 0">
          <input
            type="text"
            placeholder="Search records..."
            [(ngModel)]="searchText"
            (input)="onSearchChange()"
            class="search-input"
          />
        </div>

        <!-- Loading State -->
        <div class="card loading-state" *ngIf="loading">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Loading records...</p>
          </div>
        </div>

        <!-- AG Grid Table -->
        <div class="card grid-container" *ngIf="!loading && rowData.length > 0">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="width: 100%; height: 600px;"
            [theme]="'legacy'"
            [rowData]="rowData"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [pagination]="true"
            [paginationPageSize]="20"
            [paginationPageSizeSelector]="[10, 20, 50, 100]"
            [animateRows]="true"
            [rowSelection]="'single'"
            (gridReady)="onGridReady($event)"
          />
        </div>

        <!-- Empty State -->
        <div
          class="card empty-state"
          *ngIf="!loading && rowData.length === 0 && selectedTableId"
        >
          <div class="empty-icon">🎫</div>
          <h3>No Records Found</h3>
          <p>This table doesn't have any records yet</p>
        </div>

        <div class="card empty-state" *ngIf="!loading && !selectedProjectId">
          <div class="empty-icon">📁</div>
          <h3>Select a Project and Table</h3>
          <p>
            Choose a project and table from the dropdowns above to view records
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .tickets-container {
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
      .selectors-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      .selector-group label {
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
      .select-input:disabled {
        background: #f4f4f5;
        cursor: not-allowed;
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
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
export class TicketsComponent implements OnInit {
  private gridApi!: GridApi;
  rowData: AirtableRecord[] = [];
  projects: AirtableBase[] = [];
  tables: AirtableTable[] = [];
  selectedProjectId = '';
  selectedTableId = '';
  loading = false;
  searchText = '';

  columnDefs: ColDef[] = [];

  // Initial default columns - will be replaced by dynamic columns from table schema
  private defaultColumnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'Record ID',
      flex: 1,
      filter: 'agTextColumnFilter',
      sortable: true,
      pinned: 'left',
    },
    {
      field: 'fields.Title',
      headerName: 'Title',
      flex: 2,
      valueGetter: (params) => params.data?.fields?.Title || '',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'fields.Status',
      headerName: 'Status',
      flex: 1,
      valueGetter: (params) => params.data?.fields?.Status || '',
      filter: 'agTextColumnFilter',
      sortable: true,
      cellStyle: (params) => {
        const status = params.value;
        if (status === 'Open')
          return { color: '#2563eb', fontWeight: 'normal' };
        if (status === 'In Progress')
          return { color: '#f59e0b', fontWeight: 'normal' };
        if (status === 'Resolved')
          return { color: '#10b981', fontWeight: 'normal' };
        if (status === 'Closed')
          return { color: '#6b7280', fontWeight: 'normal' };
        if (status === 'Reopened')
          return { color: '#ef4444', fontWeight: 'normal' };
        return { color: '#000000', fontWeight: 'normal' };
      },
    },
    {
      field: 'fields.Severity',
      headerName: 'Severity',
      flex: 1,
      valueGetter: (params) => params.data?.fields?.Severity || '',
      filter: 'agTextColumnFilter',
      sortable: true,
      cellStyle: (params) => {
        const severity = params.value as string;
        if (severity === 'Critical')
          return { color: '#dc2626', fontWeight: 'bold' };
        if (severity === 'High')
          return { color: '#ea580c', fontWeight: 'normal' };
        if (severity === 'Medium')
          return { color: '#f59e0b', fontWeight: 'normal' };
        if (severity === 'Low')
          return { color: '#10b981', fontWeight: 'normal' };
        return { color: '#000000', fontWeight: 'normal' };
      },
    },
    {
      field: 'fields.Description',
      headerName: 'Description',
      flex: 2,
      valueGetter: (params) => params.data?.fields?.Description || '',
      filter: 'agTextColumnFilter',
      sortable: true,
      cellStyle: () => ({ whiteSpace: 'normal', lineHeight: '1.5' }),
      autoHeight: true,
    },
    {
      field: 'createdTime',
      headerName: 'Created',
      flex: 1,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '',
      sortable: true,
      filter: 'agDateColumnFilter',
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  constructor(
    private ticketService: TicketService,
    private tableService: TableService,
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('🚀 [Tickets] Component initialized');
    console.log('🔐 [Tickets] Current userId:', this.authService.currentUserId);
    // Initialize with default columns
    this.columnDefs = [...this.defaultColumnDefs];
    this.loadProjects();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    console.log('✅ [Tickets] Grid ready');
  }

  loadProjects() {
    const userId = this.authService.currentUserId;
    console.log('📡 [Tickets] Loading projects from cache for userId:', userId);

    if (!userId) {
      console.error('❌ [Tickets] No userId - redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Load from cache
    this.projectService.getBases(userId).subscribe({
      next: (response) => {
        console.log('✅ [Tickets] Projects loaded from cache:', response);
        if (response.success && response.data) {
          this.projects = response.data.bases;
          console.log('✅ [Tickets] Available projects:', this.projects);
        }
      },
      error: (error: any) => {
        console.error('❌ [Tickets] Error loading projects:', error);
        this.showError('Failed to load projects');
        console.error(error);
      },
    });
  }

  onProjectChange() {
    this.tables = [];
    this.selectedTableId = '';
    this.rowData = [];

    if (!this.selectedProjectId) return;

    const userId = this.authService.currentUserId;
    if (!userId) return;

    // Load from cache
    this.tableService.getTables(userId, this.selectedProjectId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tables = response.data.tables;
        }
      },
      error: (error: any) => {
        this.showError('Failed to load tables');
        console.error(error);
      },
    });
  }

  onTableChange() {
    this.loadRecords();
  }

  loadRecords() {
    if (!this.selectedProjectId || !this.selectedTableId) return;

    this.loading = true;
    const userId = this.authService.currentUserId;
    if (!userId) {
      this.loading = false;
      return;
    }

    // Load from cache
    this.ticketService
      .getTickets(userId, this.selectedProjectId, this.selectedTableId)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.rowData = response.data.records;
            this.generateDynamicColumns();
            if (this.rowData.length > 0) {
              this.showSuccess(
                `Loaded ${response.data.records.length} records from cache`
              );
            }
          }
          this.loading = false;
        },
        error: (error: any) => {
          this.showError('Failed to load records');
          console.error(error);
          this.loading = false;
        },
      });
  }

  onSearchChange() {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchText);
    }
  }

  generateDynamicColumns() {
    if (this.rowData.length === 0) {
      this.columnDefs = [...this.defaultColumnDefs];
      return;
    }

    // Get the selected table to access its field definitions
    const selectedTable = this.tables.find(
      (t) => t.id === this.selectedTableId
    );

    // Get all unique field keys from the first few records
    const fieldKeys = new Set<string>();
    const sampleSize = Math.min(5, this.rowData.length);

    for (let i = 0; i < sampleSize; i++) {
      const record = this.rowData[i];
      if (record.fields) {
        Object.keys(record.fields).forEach((key) => fieldKeys.add(key));
      }
    }

    // Create column definitions
    const dynamicColumns: ColDef[] = [
      {
        field: 'id',
        headerName: 'Record ID',
        flex: 1,
        filter: 'agTextColumnFilter',
        sortable: true,
        pinned: 'left',
        minWidth: 150,
      },
    ];

    // Add columns for each field
    Array.from(fieldKeys).forEach((fieldKey) => {
      const fieldDef = selectedTable?.fields?.find((f) => f.name === fieldKey);

      const colDef: ColDef = {
        field: `fields.${fieldKey}`,
        headerName: fieldKey,
        flex: 1,
        sortable: true,
        filter: 'agTextColumnFilter',
        minWidth: 150,
        valueGetter: (params) => {
          const value = params.data?.fields?.[fieldKey];
          return this.formatFieldValue(value, fieldDef?.type);
        },
      };

      // Apply specific formatting based on field type
      if (fieldDef?.type) {
        this.applyFieldTypeFormatting(colDef, fieldDef.type, fieldKey);
      }

      dynamicColumns.push(colDef);
    });

    // Add created time column at the end
    dynamicColumns.push({
      field: 'createdTime',
      headerName: 'Created Time',
      flex: 1,
      sortable: true,
      filter: 'agDateColumnFilter',
      minWidth: 180,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '',
    });

    this.columnDefs = dynamicColumns;
  }

  formatFieldValue(value: any, fieldType?: string): string {
    if (value === null || value === undefined) return '';

    // Handle arrays (like lookup fields, attachments, linked records)
    if (Array.isArray(value)) {
      if (value.length === 0) return '';

      // Check if it's an array of objects (attachments, linked records)
      if (typeof value[0] === 'object') {
        if (value[0].filename) {
          // Attachments
          return `${value.length} file(s)`;
        }
        return value.map((v) => v.name || v.id || JSON.stringify(v)).join(', ');
      }

      // Simple array of values
      return value.join(', ');
    }

    // Handle objects
    if (typeof value === 'object') {
      // AI Text fields
      if (value.state && value.value) {
        return value.value;
      }
      return JSON.stringify(value);
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Return as string
    return String(value);
  }

  applyFieldTypeFormatting(
    colDef: ColDef,
    fieldType: string,
    fieldName: string
  ) {
    switch (fieldType) {
      case 'singleSelect':
        colDef.cellStyle = (params) => {
          const value = params.value as string;
          const colors: Record<string, any> = {
            Critical: { color: '#dc2626', fontWeight: 'bold' },
            High: { color: '#ea580c', fontWeight: 'normal' },
            Medium: { color: '#f59e0b', fontWeight: 'normal' },
            Low: { color: '#10b981', fontWeight: 'normal' },
            Open: { color: '#2563eb', fontWeight: 'normal' },
            'In Progress': { color: '#f59e0b', fontWeight: 'normal' },
            Resolved: { color: '#10b981', fontWeight: 'normal' },
            Closed: { color: '#6b7280', fontWeight: 'normal' },
            Reopened: { color: '#ef4444', fontWeight: 'normal' },
          };
          return colors[value] || { color: '#000000', fontWeight: 'normal' };
        };
        break;

      case 'multilineText':
        colDef.cellStyle = () => ({ whiteSpace: 'normal', lineHeight: '1.5' });
        colDef.autoHeight = true;
        colDef.flex = 2;
        break;

      case 'date':
        colDef.valueFormatter = (params) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleDateString();
        };
        break;

      case 'number':
      case 'formula':
        colDef.type = 'numericColumn';
        colDef.filter = 'agNumberColumnFilter';
        break;

      case 'checkbox':
        colDef.valueFormatter = (params) => {
          return params.value ? '✓' : '';
        };
        colDef.maxWidth = 100;
        break;

      case 'multipleAttachments':
        colDef.cellRenderer = (params: any) => {
          const value = params.value;
          if (!value) return '';
          const count = value.split(',').length;
          return `📎 ${count}`;
        };
        colDef.maxWidth = 120;
        break;

      case 'aiText':
        colDef.flex = 2;
        colDef.cellStyle = () => ({
          whiteSpace: 'normal',
          lineHeight: '1.5',
          fontStyle: 'italic',
          color: '#6b7280',
        });
        colDef.autoHeight = true;
        break;
    }
  }

  exportData() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `airtable-records-${
          new Date().toISOString().split('T')[0]
        }.csv`,
      });
      this.showSuccess('Data exported successfully');
    }
  }

  getSelectedTableName(): string {
    const table = this.tables.find((t) => t.id === this.selectedTableId);
    return table?.name || '-';
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
