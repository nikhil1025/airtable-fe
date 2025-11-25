import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SyncTablesRequest, SyncTablesResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private readonly API_URL = `${environment.apiBaseUrl}/sync`;

  constructor(private http: HttpClient) {}

  /**
   * Sync tables from Airtable API (force refresh)
   */
  syncTables(
    request: SyncTablesRequest
  ): Observable<ApiResponse<SyncTablesResponse>> {
    return this.http.post<ApiResponse<SyncTablesResponse>>(
      `${this.API_URL}/tables`,
      { ...request, forceSync: true }
    );
  }

  /**
   * Get tables from MongoDB cache (fast load)
   */
  getTables(
    userId: string,
    baseId: string
  ): Observable<ApiResponse<SyncTablesResponse>> {
    return this.http.post<ApiResponse<SyncTablesResponse>>(
      `${this.API_URL}/tables`,
      { userId, baseId, forceSync: false }
    );
  }
}
