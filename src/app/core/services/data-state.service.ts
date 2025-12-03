import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AirtableBase } from '../models/project.model';
import { AirtableTable } from '../models/table.model';
import { WorkspaceUser } from '../models/user.model';

export interface AppState {
  projects: AirtableBase[];
  tables: Record<string, AirtableTable[]>; // Key: projectId, Value: tables
  tickets: Record<string, any[]>; // Key: tableId, Value: tickets
  users: WorkspaceUser[]; // Workspace users
  stats: {
    projects: number;
    tables: number;
    tickets: number;
    revisions: number;
    users: number;
  };
  loading: {
    projects: boolean;
    tables: boolean;
    tickets: boolean;
    users: boolean;
  };
  lastSyncTime: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class DataStateService {
  private initialState: AppState = {
    projects: [],
    tables: {},
    tickets: {},
    users: [],
    stats: {
      projects: 0,
      tables: 0,
      tickets: 0,
      revisions: 0,
      users: 0,
    },
    loading: {
      projects: false,
      tables: false,
      tickets: false,
      users: false,
    },
    lastSyncTime: null,
  };

  private stateSubject = new BehaviorSubject<AppState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  constructor() {
    // Initialize with empty state - always fetch from APIs
  }

  get currentState(): AppState {
    return this.stateSubject.value;
  }

  // Projects
  setProjects(projects: AirtableBase[]): void {
    const currentState = this.currentState;
    const newState = {
      ...currentState,
      projects,
      stats: {
        ...currentState.stats,
        projects: projects.length,
      },
    };
    this.updateState(newState);
  }

  getProjects(): AirtableBase[] {
    return this.currentState.projects;
  }

  // Tables
  setTables(projectId: string, tables: AirtableTable[]): void {
    const currentState = this.currentState;
    const newState = {
      ...currentState,
      tables: {
        ...currentState.tables,
        [projectId]: tables,
      },
      stats: {
        ...currentState.stats,
        tables: Object.values({
          ...currentState.tables,
          [projectId]: tables,
        }).flat().length,
      },
    };
    this.updateState(newState);
  }

  getTables(projectId: string): AirtableTable[] {
    return this.currentState.tables[projectId] || [];
  }

  // Tickets
  setTickets(tableId: string, tickets: any[]): void {
    const currentState = this.currentState;
    const newState = {
      ...currentState,
      tickets: {
        ...currentState.tickets,
        [tableId]: tickets,
      },
      stats: {
        ...currentState.stats,
        tickets: Object.values({
          ...currentState.tickets,
          [tableId]: tickets,
        }).flat().length,
      },
    };
    this.updateState(newState);
  }

  getTickets(tableId: string): any[] {
    return this.currentState.tickets[tableId] || [];
  }

  // Loading states
  setLoading(
    type: 'projects' | 'tables' | 'tickets' | 'users',
    loading: boolean
  ): void {
    const currentState = this.currentState;
    const newState = {
      ...currentState,
      loading: {
        ...currentState.loading,
        [type]: loading,
      },
    };
    this.updateState(newState);
  }

  // Stats
  updateStats(stats: Partial<AppState['stats']>): void {
    const currentState = this.currentState;
    const newState = {
      ...currentState,
      stats: {
        ...currentState.stats,
        ...stats,
      },
    };
    this.updateState(newState);
  }

  // Sync time
  setSyncTime(time: Date): void {
    const currentState = this.currentState;
    const newState = {
      ...currentState,
      lastSyncTime: time,
    };
    this.updateState(newState);
  }

  // Clear all data (on logout)
  clearState(): void {
    this.updateState(this.initialState);
    // No localStorage to clear - using APIs only
  }

  // Users
  setUsers(users: WorkspaceUser[]): void {
    const currentState = this.currentState;
    const newState = {
      ...currentState,
      users,
      stats: {
        ...currentState.stats,
        users: users.length,
      },
    };
    this.updateState(newState);
  }

  getUsers(): WorkspaceUser[] {
    return this.currentState.users;
  }

  // Observables for specific data
  getProjectsObservable(): Observable<AirtableBase[]> {
    return new Observable((observer) => {
      this.state$.subscribe((state) => {
        observer.next(state.projects);
      });
    });
  }

  getUsersObservable(): Observable<WorkspaceUser[]> {
    return new Observable((observer) => {
      this.state$.subscribe((state) => {
        observer.next(state.users);
      });
    });
  }

  getStatsObservable(): Observable<AppState['stats']> {
    return new Observable((observer) => {
      this.state$.subscribe((state) => {
        observer.next(state.stats);
      });
    });
  }

  getLoadingObservable(): Observable<AppState['loading']> {
    return new Observable((observer) => {
      this.state$.subscribe((state) => {
        observer.next(state.loading);
      });
    });
  }

  // Check if data exists
  hasTables(projectId: string): boolean {
    return (this.currentState.tables[projectId] || []).length > 0;
  }

  hasTickets(tableId: string): boolean {
    return (this.currentState.tickets[tableId] || []).length > 0;
  }

  // Private methods
  private updateState(newState: AppState): void {
    this.stateSubject.next(newState);
  }
}
