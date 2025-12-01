import { Routes } from '@angular/router';
import { LoginComponent } from './features/authentication/login/login.component';
import { OauthCallbackComponent } from './features/authentication/oauth-callback/oauth-callback.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'oauth/callback', component: OauthCallbackComponent },
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects.component').then(
        (m) => m.ProjectsComponent
      ),
  },
  {
    path: 'tables',
    loadComponent: () =>
      import('./features/tables/tables.component').then(
        (m) => m.TablesComponent
      ),
  },
  {
    path: 'tickets',
    loadComponent: () =>
      import('./features/tickets/tickets.component').then(
        (m) => m.TicketsComponent
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'revision-history',
    loadComponent: () =>
      import('./features/revision-history/revision-history.component').then(
        (m) => m.RevisionHistoryComponent
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },
];
