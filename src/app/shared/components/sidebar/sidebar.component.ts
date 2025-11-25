import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  template: `
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
  `,
  styles: [
    `
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
      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
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
    `,
  ],
})
export class SidebarComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
