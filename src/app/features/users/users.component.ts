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
import { WorkspaceUser } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { DataStateService } from '../../core/services/data-state.service';
import { UserService } from '../../core/services/user.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-users',
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
    <div class="users-container">
      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1>Workspace Users</h1>
            <p class="subtitle">Manage your Airtable workspace collaborators</p>
          </div>
          <div class="header-actions">
            <button
              class="btn btn-primary"
              (click)="syncUsers()"
              [disabled]="syncing"
            >
              <span *ngIf="syncing" class="spinner"></span>
              <mat-icon *ngIf="!syncing">sync</mat-icon>
              {{ syncing ? 'Syncing...' : 'Sync Users' }}
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

        <!-- Workspace Selector -->
        <div class="workspace-selector" *ngIf="workspaces.length > 1">
          <label>Workspace:</label>
          <select
            [(ngModel)]="selectedWorkspaceId"
            (change)="onWorkspaceChange()"
            class="workspace-select"
          >
            <option value="">All Workspaces</option>
            <option *ngFor="let ws of workspaces" [value]="ws.workspaceId">
              {{ ws.workspaceName }}
            </option>
          </select>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <mat-icon class="stat-icon">people</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Total Users</div>
              <div class="stat-value">{{ rowData.length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <mat-icon class="stat-icon">verified_user</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Active Users</div>
              <div class="stat-value">{{ getActiveUsersCount() }}</div>
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
            placeholder="Search users by name or email..."
            [(ngModel)]="searchText"
            (input)="onSearchChange()"
            class="search-input"
          />
        </div>

        <!-- Loading State -->
        <div class="card loading-state" *ngIf="loading">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Loading workspace users...</p>
          </div>
        </div>

        <!-- AG Grid Table -->
        <div class="grid-wrapper" *ngIf="!loading && rowData.length > 0">
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

        <!-- Empty State -->
        <div class="card empty-state" *ngIf="!loading && rowData.length === 0">
          <mat-icon class="empty-icon">people</mat-icon>
          <h3>No Users Found</h3>
          <p>Sync your data to see workspace users</p>
          <button class="btn btn-primary" (click)="loadUsers()">
            Refresh Users
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .users-container {
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
      .workspace-selector {
        background: white;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .workspace-selector label {
        font-weight: 600;
        color: #18181b;
      }
      .workspace-select {
        flex: 1;
        max-width: 400px;
        padding: 0.5rem;
        border: 1px solid #e4e4e7;
        border-radius: 6px;
        font-size: 0.875rem;
      }
      .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
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
      .grid-wrapper {
        height: 500px;
        width: 100%;
        position: relative;
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
    `,
  ],
})
export class UsersComponent implements OnInit, OnDestroy {
  private gridApi!: GridApi;
  private subscriptions: Subscription[] = [];
  rowData: WorkspaceUser[] = [];
  loading = false;
  syncing = false;
  searchText = '';
  workspaces: any[] = [];
  selectedWorkspaceId = '';
  workspaceMap: Map<string, string> = new Map();

  columnDefs: ColDef[] = [
    {
      field: 'email',
      headerName: 'Email',
      flex: 2,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.5,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'workspaceName',
      headerName: 'Workspace',
      flex: 1.5,
      filter: 'agTextColumnFilter',
      sortable: true,
      valueGetter: (params) => {
        return params.data?.workspaceName || 'Unknown';
      },
    },
    {
      field: 'permissionLevel',
      headerName: 'Permission',
      flex: 1,
      filter: 'agTextColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        return params.value.charAt(0).toUpperCase() + params.value.slice(1);
      },
    },
    {
      field: 'state',
      headerName: 'Status',
      flex: 1,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'lastActivityTime',
      headerName: 'Last Activity',
      flex: 1.5,
      filter: 'agTextColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleDateString();
      },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  constructor(
    private userService: UserService,
    public authService: AuthService,
    private dataStateService: DataStateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Subscribe to users state
    const usersSubscription = this.dataStateService
      .getUsersObservable()
      .subscribe((users) => {
        this.rowData = users;
      });
    this.subscriptions.push(usersSubscription);

    // Subscribe to loading state
    const loadingSubscription = this.dataStateService
      .getLoadingObservable()
      .subscribe((loading) => {
        this.loading = loading.users;
      });
    this.subscriptions.push(loadingSubscription);

    this.loadWorkspaces();
    this.loadUsers();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.refreshCells();
    this.gridApi.sizeColumnsToFit();
  }

  loadWorkspaces() {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    this.userService.getWorkspaces(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.workspaces = response.data.workspaces || [];
          // Build workspace ID to name map
          this.workspaceMap.clear();
          this.workspaces.forEach((ws) => {
            this.workspaceMap.set(ws.workspaceId, ws.workspaceName);
          });
        }
      },
      error: (error) => {
        console.error('[Users] Error loading workspaces:', error);
      },
    });
  }

  onWorkspaceChange() {
    const userId = this.authService.currentUserId;
    if (!userId) return;

    if (this.selectedWorkspaceId) {
      // Fetch users for specific workspace
      this.dataStateService.setLoading('users', true);
      this.userService
        .fetchUsersForWorkspace(userId, this.selectedWorkspaceId)
        .subscribe({
          next: (response) => {
            this.dataStateService.setLoading('users', false);
            if (response.success && response.data) {
              this.dataStateService.setUsers(response.data.users || []);
              this.showSuccess(
                `Loaded ${response.data.users.length} users from ${response.data.workspaceName}`
              );
            }
          },
          error: (error) => {
            this.dataStateService.setLoading('users', false);
            this.showError('Failed to load workspace users');
          },
        });
    } else {
      // Load all users from cache
      this.loadUsers();
    }
  }

  syncUsers() {
    const userId = this.authService.currentUserId;
    if (!userId) {
      this.showError('User not authenticated');
      return;
    }

    this.syncing = true;

    // Fetch and store users from all workspaces
    this.userService.fetchUsersForWorkspace(userId).subscribe({
      next: (response) => {
        this.syncing = false;
        if (response.success) {
          this.showSuccess('Users synced successfully!');
          // Reload from cache to get stored data
          this.loadUsers();
          this.loadWorkspaces();
        }
      },
      error: (error) => {
        this.syncing = false;
        console.error('[Users] Sync failed:', error);
        this.showError(
          'Failed to sync users: ' + (error.message || 'Unknown error')
        );
      },
    });
  }

  loadUsers() {
    const userId = this.authService.currentUserId;

    if (!userId) {
      console.error('[Users] No userId - user not authenticated');
      this.showError('User not authenticated. Please login first.');
      this.router.navigate(['/login']);
      return;
    }

    this.dataStateService.setLoading('users', true);

    this.userService.getUsers(userId).subscribe({
      next: (response) => {
        this.dataStateService.setLoading('users', false);
        if (response.success && response.data) {
          this.dataStateService.setUsers(response.data.workspaceUsers || []);
          if (
            response.data.workspaceUsers &&
            response.data.workspaceUsers.length > 0
          ) {
            this.showSuccess(
              `Loaded ${response.data.workspaceUsers.length} users from cache`
            );
          } else {
            this.showInfo(
              'No users found in cache. Click "Sync Users" to fetch from Airtable.'
            );
          }
        } else {
          console.warn('[Users] No data in response:', response);
        }
      },
      error: (error) => {
        console.error('[Users] Error loading users:', error);
        this.dataStateService.setLoading('users', false);
        this.showError(
          'Failed to load users: ' + (error.message || 'Unknown error')
        );
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
        fileName: `airtable-users-${
          new Date().toISOString().split('T')[0]
        }.csv`,
      });
      this.showSuccess('Data exported successfully');
    }
  }

  getActiveUsersCount(): number {
    return this.rowData.filter((user) => user.state === 'active').length;
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
