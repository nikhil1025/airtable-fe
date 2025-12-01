import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RevisionHistoryRecord {
  uuid: string;
  issueId: string;
  columnType: string;
  oldValue: string;
  newValue: string;
  createdDate: string;
  authoredBy: string;
  userId?: string;
  baseId?: string;
  tableId?: string;
}

export interface SyncRevisionHistoryRequest {
  userId: string;
  baseId: string;
  tableId: string;
}

export interface SyncRevisionHistoryResponse {
  success: boolean;
  message: string;
  data: {
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  };
}

export interface FetchRevisionHistoryRequest {
  userId: string;
  baseId: string;
  tableId: string;
  recordId: string;
  rowId: string;
  viewId?: string;
}

export interface FetchRevisionHistoryResponse {
  success: boolean;
  message: string;
  data: {
    revisions: RevisionHistoryRecord[];
    recordId: string;
    totalFound: number;
  };
}

export interface GetRevisionHistoryRequest {
  userId: string;
  recordId?: string;
  baseId?: string;
  tableId?: string;
  limit?: number;
  offset?: number;
}

export interface GetRevisionHistoryResponse {
  success: boolean;
  message?: string;
  data: {
    revisions: RevisionHistoryRecord[];
    totalRevisions: number;
    totalTickets?: number;
    filters?: {
      baseId: string | null;
      tableId: string | null;
      userId: string | null;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RevisionHistoryService {
  private readonly API_URL = `${environment.apiBaseUrl}/revision-history-fetch`;

  constructor(private http: HttpClient) {}

  /**
   * Sync revision history for a specific table
   * Uses tickets DB to fetch record IDs and scrapes revision history in background
   */
  syncRevisionHistory(
    request: SyncRevisionHistoryRequest
  ): Observable<ApiResponse<SyncRevisionHistoryResponse['data']>> {
    const url = `${this.API_URL}/sync`;
    console.log('🔄 [RevisionHistoryService] Syncing revision history', {
      url,
      request,
    });
    return this.http.post<ApiResponse<SyncRevisionHistoryResponse['data']>>(
      url,
      request
    );
  }

  /**
   * Fetch revision history for a specific record
   * Uses cookies for scraping individual record history
   */
  fetchRevisionHistory(
    request: FetchRevisionHistoryRequest
  ): Observable<ApiResponse<FetchRevisionHistoryResponse['data']>> {
    const url = `${this.API_URL}/fetch`;
    console.log('📜 [RevisionHistoryService] Fetching revision history', {
      url,
      request,
    });
    return this.http.post<ApiResponse<FetchRevisionHistoryResponse['data']>>(
      url,
      request
    );
  }

  /**
   * Get revision history from MongoDB
   * Fetches stored revision history data
   */
  getRevisionHistory(
    request: GetRevisionHistoryRequest
  ): Observable<ApiResponse<GetRevisionHistoryResponse['data']>> {
    // Use the filter endpoint for baseId/tableId filtering
    const baseUrl = `${environment.apiBaseUrl}/revision-history`;

    let url: string;
    let params: any = {};

    if (request.recordId) {
      // Get specific record
      url = `${baseUrl}/record/${request.recordId}`;
      if (request.userId) params.userId = request.userId;
    } else if (request.baseId || request.tableId) {
      // Use filter endpoint for baseId/tableId
      url = `${baseUrl}/filter`;
      if (request.baseId) params.baseId = request.baseId;
      if (request.tableId) params.tableId = request.tableId;
      if (request.userId) params.userId = request.userId;
    } else {
      // Get all for user
      url = `${baseUrl}/all/${request.userId}`;
    }

    if (request.limit) params.limit = request.limit.toString();
    if (request.offset) params.skip = request.offset.toString();

    console.log('📋 [RevisionHistoryService] Getting revision history', {
      url,
      params,
    });

    return this.http.get<ApiResponse<GetRevisionHistoryResponse['data']>>(url, {
      params,
    });
  }

  /**
   * Check if user has valid cookies for revision history scraping
   */
  checkCookieStatus(
    userId: string
  ): Observable<
    ApiResponse<{ valid: boolean; validUntil?: Date; message: string }>
  > {
    const url = `${environment.apiBaseUrl}/cookies/validate`;
    return this.http.post<
      ApiResponse<{ valid: boolean; validUntil?: Date; message: string }>
    >(url, { userId });
  }

  /**
   * Bulk automation for revision history
   * Processes multiple tables/bases automatically
   */
  runBulkAutomation(
    userId: string,
    baseId?: string
  ): Observable<ApiResponse<any>> {
    const url = `${this.API_URL}/bulk-automation`;
    const payload = {
      userId,
      ...(baseId && { baseId }),
    };

    console.log('🚀 [RevisionHistoryService] Running bulk automation', {
      url,
      payload,
    });

    return this.http.post<ApiResponse<any>>(url, payload);
  }

  /**
   * Scrape and fetch revision history from Airtable
   * This will scrape data and store it in the database
   */
  scrapeRevisionHistory(userId: string): Observable<ApiResponse<any>> {
    const url = `${environment.apiBaseUrl}/revision-history/fetch/${userId}`;
    console.log('🔍 [RevisionHistoryService] Scraping revision history', {
      url,
      userId,
    });
    return this.http.get<ApiResponse<any>>(url);
  }

  /**
   * Get all revision history for a user from database
   */
  getUserRevisionHistory(
    userId: string
  ): Observable<ApiResponse<GetRevisionHistoryResponse['data']>> {
    const url = `${environment.apiBaseUrl}/revision-history/user/${userId}`;
    console.log('📚 [RevisionHistoryService] Getting user revision history', {
      url,
      userId,
    });
    return this.http.get<ApiResponse<GetRevisionHistoryResponse['data']>>(url);
  }
}
