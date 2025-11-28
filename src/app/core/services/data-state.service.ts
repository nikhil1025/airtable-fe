import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AirtableBase } from '../models/project.model';
import { AirtableTable } from '../models/table.model';

export interface AppState {
  projects: AirtableBase[];
  tables: Record<string, AirtableTable[]>; // Key: projectId, Value: tables
  tickets: Record<string, any[]>; // Key: tableId, Value: tickets
  stats: {
    projects: number;
    tables: number;
    tickets: number;
    revisions: number;
  };
  loading: {
    projects: boolean;
    tables: boolean;
    tickets: boolean;
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
    stats: {
      projects: 0,
      tables: 0,
      tickets: 0,
      revisions: 0,
    },
    loading: {
      projects: false,
      tables: false,
      tickets: false,
    },
    lastSyncTime: null,
  };

  private stateSubject = new BehaviorSubject<AppState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  constructor() {
    // Load state from localStorage on initialization
    this.loadStateFromStorage();
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
  setLoading(type: 'projects' | 'tables' | 'tickets', loading: boolean): void {
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
    localStorage.removeItem('airtable-app-state');
  }

  // Observables for specific data
  getProjectsObservable(): Observable<AirtableBase[]> {
    return new Observable((observer) => {
      this.state$.subscribe((state) => {
        observer.next(state.projects);
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
  hasProjects(): boolean {
    return this.currentState.projects.length > 0;
  }

  hasTables(projectId: string): boolean {
    return (this.currentState.tables[projectId] || []).length > 0;
  }

  hasTickets(tableId: string): boolean {
    return (this.currentState.tickets[tableId] || []).length > 0;
  }

  // Private methods
  private updateState(newState: AppState): void {
    this.stateSubject.next(newState);
    this.saveStateToStorage(newState);
  }

  private saveStateToStorage(state: AppState): void {
    try {
      const stateToSave = {
        ...state,
        // Don't save loading states
        loading: this.initialState.loading,
      };
      localStorage.setItem('airtable-app-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  private loadStateFromStorage(): void {
    try {
      const savedState = localStorage.getItem('airtable-app-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Merge with initial state to ensure all properties exist
        const restoredState: AppState = {
          ...this.initialState,
          ...parsedState,
          // Convert date string back to Date object
          lastSyncTime: parsedState.lastSyncTime
            ? new Date(parsedState.lastSyncTime)
            : null,
        };
        this.stateSubject.next(restoredState);
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
  }
}
