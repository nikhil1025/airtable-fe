import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RealStatsResponse {
  success: boolean;
  data: {
    stats: {
      projects: number;
      tables: number;
      tickets: number;
      revisions: number;
    };
    message: string;
  };
}

export interface RealProjectsResponse {
  success: boolean;
  data: {
    bases: Array<{
      id: string;
      name: string;
      permissionLevel: string;
      workspace?: any;
    }>;
    message: string;
  };
}

export interface RealTablesResponse {
  success: boolean;
  data: {
    tables: Array<{
      id: string;
      name: string;
      description: string;
      baseId: string;
      fields: any[];
    }>;
    message: string;
  };
}

export interface RealTicketsResponse {
  success: boolean;
  data: {
    records: Array<{
      id: string;
      fields: any;
      createdTime: string;
      baseId: string;
      tableId: string;
    }>;
    message: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class RealDataService {
  private baseUrl = `${environment.apiBaseUrl}/data`;

  constructor(private http: HttpClient) {}

  /**
   * Get real stats from database
   */
  getStats(userId: string): Observable<RealStatsResponse> {
    const tokens = this.getTokensFromLocalStorage();
    const storedAuth = this.getAuthFromLocalStorage();
    const actualUserId = storedAuth?.userId || userId;

    return this.http.post<RealStatsResponse>(
      `${this.baseUrl}/stats?userId=${actualUserId}`,
      tokens
    );
  }

  /**
   * Get real projects from database
   */
  getProjects(userId: string): Observable<RealProjectsResponse> {
    const tokens = this.getTokensFromLocalStorage();
    const storedAuth = this.getAuthFromLocalStorage();
    const actualUserId = storedAuth?.userId || userId;

    return this.http.post<RealProjectsResponse>(
      `${this.baseUrl}/projects?userId=${actualUserId}`,
      tokens
    );
  }

  /**
   * Get real tables for a project from database
   */
  getTables(projectId: string, userId: string): Observable<RealTablesResponse> {
    const tokens = this.getTokensFromLocalStorage();
    const storedAuth = this.getAuthFromLocalStorage();
    const actualUserId = storedAuth?.userId || userId;

    return this.http.post<RealTablesResponse>(
      `${this.baseUrl}/tables/${projectId}?userId=${actualUserId}`,
      tokens
    );
  }

  /**
   * Get real tickets for a table from database
   */
  getTickets(tableId: string, userId: string): Observable<RealTicketsResponse> {
    const tokens = this.getTokensFromLocalStorage();
    const storedAuth = this.getAuthFromLocalStorage();
    const actualUserId = storedAuth?.userId || userId;

    return this.http.post<RealTicketsResponse>(
      `${this.baseUrl}/tickets/${tableId}?userId=${actualUserId}`,
      tokens
    );
  }

  /**
   * Force a fresh sync using OAuth tokens from localStorage
   */
  syncFresh(userId: string): Observable<any> {
    const tokens = this.getTokensFromLocalStorage();
    const storedAuth = this.getAuthFromLocalStorage();
    const actualUserId = storedAuth?.userId || userId;

    return this.http.post<any>(
      `${this.baseUrl}/sync-fresh?userId=${actualUserId}`,
      tokens
    );
  }

  /**
   * Helper method to get OAuth tokens from localStorage
   */
  private getTokensFromLocalStorage(): {
    accessToken?: string;
    refreshToken?: string;
  } {
    // Try different localStorage keys and formats
    const tokenSources = [
      'airtable_tokens',
      'airtableTokens',
      'oauth_tokens',
      'tokens',
    ];

    for (const source of tokenSources) {
      const tokensStr = localStorage.getItem(source);
      if (tokensStr) {
        try {
          const tokens = JSON.parse(tokensStr);

          // Handle different token key formats
          const accessToken =
            tokens.accessToken ||
            tokens.access_token ||
            tokens.airtable_access_token;
          const refreshToken =
            tokens.refreshToken ||
            tokens.refresh_token ||
            tokens.airtable_refresh_token;

          if (accessToken && refreshToken) {
            console.log(` Found OAuth tokens in localStorage[${source}]`, {
              accessToken: accessToken.substring(0, 20) + '...',
              refreshToken: refreshToken.substring(0, 20) + '...',
            });
            return { accessToken, refreshToken };
          }
        } catch (e) {
          console.warn(
            `Failed to parse OAuth tokens from localStorage[${source}]`,
            e
          );
        }
      }
    }

    // Debug: Show what's actually in localStorage
    console.warn(
      ' No OAuth tokens found in localStorage. Available keys:',
      Object.keys(localStorage)
    );

    // Show contents of potential token keys
    tokenSources.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`localStorage[${key}]:`, value);
      }
    });

    return {};
  }

  /**
   * Helper method to get auth info from localStorage
   */
  private getAuthFromLocalStorage(): {
    userId?: string;
    isAuthenticated?: boolean;
  } | null {
    const authStr = localStorage.getItem('airtable_auth');
    if (authStr) {
      try {
        return JSON.parse(authStr);
      } catch (e) {
        console.warn('Failed to parse auth from localStorage', e);
      }
    }
    return null;
  }
}
