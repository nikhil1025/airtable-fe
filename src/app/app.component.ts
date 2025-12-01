import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Airtable Revision History Automation';
  sidebarWidth = '260px';

  ngOnInit(): void {
    // Load initial sidebar state from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    this.sidebarWidth = isCollapsed ? '72px' : '260px';

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
}
