import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <nav class="sidebar" [class.collapsed]="isCollapsed">
      <button
        class="collapse-toggle"
        (click)="toggleSidebar()"
        title="{{ isCollapsed ? 'Expand' : 'Collapse' }}"
      >
        <mat-icon>{{
          isCollapsed ? 'chevron_right' : 'chevron_left'
        }}</mat-icon>
      </button>

      <div class="sidebar-header">
        <h2 *ngIf="!isCollapsed">Airtable</h2>
        <h2 *ngIf="isCollapsed" class="collapsed-title">A</h2>
      </div>

      <div class="nav-menu">
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-item"
          [title]="isCollapsed ? 'Dashboard' : ''"
        >
          <span class="nav-icon">📊</span>
          <span class="nav-text" *ngIf="!isCollapsed">Dashboard</span>
        </a>
        <a
          routerLink="/projects"
          routerLinkActive="active"
          class="nav-item"
          [title]="isCollapsed ? 'Projects' : ''"
        >
          <span class="nav-icon">📁</span>
          <span class="nav-text" *ngIf="!isCollapsed">Projects</span>
        </a>
        <a
          routerLink="/tables"
          routerLinkActive="active"
          class="nav-item"
          [title]="isCollapsed ? 'Tables' : ''"
        >
          <span class="nav-icon">📋</span>
          <span class="nav-text" *ngIf="!isCollapsed">Tables</span>
        </a>
        <a
          routerLink="/tickets"
          routerLinkActive="active"
          class="nav-item"
          [title]="isCollapsed ? 'Tickets' : ''"
        >
          <span class="nav-icon">🎫</span>
          <span class="nav-text" *ngIf="!isCollapsed">Tickets</span>
        </a>
        <a
          routerLink="/revision-history"
          routerLinkActive="active"
          class="nav-item"
          [title]="isCollapsed ? 'Revision History' : ''"
        >
          <span class="nav-icon">📜</span>
          <span class="nav-text" *ngIf="!isCollapsed">Revision History</span>
        </a>
        <a
          routerLink="/settings"
          routerLinkActive="active"
          class="nav-item"
          [title]="isCollapsed ? 'Settings' : ''"
        >
          <span class="nav-icon">⚙️</span>
          <span class="nav-text" *ngIf="!isCollapsed">Settings</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <button
          class="btn btn-outline btn-block"
          (click)="logout()"
          [title]="isCollapsed ? 'Logout' : ''"
        >
          <span class="nav-icon" *ngIf="isCollapsed">🚪</span>
          <span *ngIf="!isCollapsed">Logout</span>
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 260px;
        background: white;
        border-right: 1px solid #e4e4e7;
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
        z-index: 1000;
        overflow-x: hidden;
      }

      .sidebar.collapsed {
        width: 72px;
      }

      .collapse-toggle {
        position: absolute;
        top: 16px;
        right: -12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 1px solid #e4e4e7;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
        padding: 0;
      }

      .collapse-toggle:hover {
        background: #f4f4f5;
        transform: scale(1.1);
      }

      .collapse-toggle mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #52525b;
      }

      .sidebar-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e4e4e7;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sidebar-header h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: #18181b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sidebar.collapsed .sidebar-header h2.collapsed-title {
        font-size: 1.5rem;
      }

      .nav-menu {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .nav-menu::-webkit-scrollbar {
        width: 6px;
      }

      .nav-menu::-webkit-scrollbar-track {
        background: transparent;
      }

      .nav-menu::-webkit-scrollbar-thumb {
        background: #e4e4e7;
        border-radius: 3px;
      }

      .nav-menu::-webkit-scrollbar-thumb:hover {
        background: #d4d4d8;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        color: #52525b;
        text-decoration: none;
        margin-bottom: 0.25rem;
        transition: all 0.2s;
        white-space: nowrap;
        position: relative;
      }

      .sidebar.collapsed .nav-item {
        justify-content: center;
        padding: 0.75rem;
      }

      .nav-item:hover {
        background: #f4f4f5;
        color: #18181b;
      }

      .nav-item.active {
        background: #2563eb;
        color: white;
      }

      .nav-item.active .nav-icon {
        filter: brightness(0) invert(1);
      }

      .nav-icon {
        font-size: 1.25rem;
        min-width: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-text {
        font-size: 0.875rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid #e4e4e7;
      }

      .btn {
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        white-space: nowrap;
      }

      .sidebar.collapsed .btn {
        padding: 0.75rem;
      }

      .btn-outline {
        background: transparent;
        color: #18181b;
        border: 1px solid #e4e4e7;
        width: 100%;
      }

      .btn-outline:hover {
        background: #f4f4f5;
      }

      .btn-block {
        width: 100%;
      }

      @media (max-width: 768px) {
        .sidebar {
          width: 72px;
        }

        .collapse-toggle {
          display: none;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  isCollapsed = false;

  constructor(private authService: AuthService, private router: Router) {
    // Load saved state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      this.isCollapsed = savedState === 'true';
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', this.isCollapsed.toString());

    // Dispatch custom event for app component to listen to
    window.dispatchEvent(
      new CustomEvent('sidebarToggled', {
        detail: { isCollapsed: this.isCollapsed },
      })
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
