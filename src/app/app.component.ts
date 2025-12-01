import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Airtable Revision History Automation';
  sidebarWidth = '260px';
  showSidebar = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load initial sidebar state from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    this.sidebarWidth = isCollapsed ? '72px' : '260px';

    // Check initial route
    this.checkRoute(this.router.url);

    // Listen for route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.urlAfterRedirects);
      });

    // Listen for sidebar state changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'sidebarCollapsed') {
        this.sidebarWidth = e.newValue === 'true' ? '72px' : '260px';
      }
    });

    // Listen for custom event from sidebar component
    window.addEventListener('sidebarToggled', ((event: CustomEvent) => {
      this.sidebarWidth = event.detail.isCollapsed ? '72px' : '260px';
    }) as EventListener);
  }

  private checkRoute(url: string): void {
    // Hide sidebar on login and oauth callback pages
    const authRoutes = ['/login', '/oauth/callback'];
    this.showSidebar = !authRoutes.some((route) => url.startsWith(route));
  }
}
