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
  authorName: string;
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

  syncRevisionHistory(
    request: SyncRevisionHistoryRequest
  ): Observable<ApiResponse<SyncRevisionHistoryResponse['data']>> {
    const url = `${this.API_URL}/sync`;

    return this.http.post<ApiResponse<SyncRevisionHistoryResponse['data']>>(
      url,
      request
    );
  }

  fetchRevisionHistory(
    request: FetchRevisionHistoryRequest
  ): Observable<ApiResponse<FetchRevisionHistoryResponse['data']>> {
    const url = `${this.API_URL}/fetch`;

    return this.http.post<ApiResponse<FetchRevisionHistoryResponse['data']>>(
      url,
      request
    );
  }

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

    return this.http.get<ApiResponse<GetRevisionHistoryResponse['data']>>(url, {
      params,
    });
  }

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

  runBulkAutomation(
    userId: string,
    baseId?: string
  ): Observable<ApiResponse<any>> {
    const url = `${this.API_URL}/bulk-automation`;
    const payload = {
      userId,
      ...(baseId && { baseId }),
    };

    return this.http.post<ApiResponse<any>>(url, payload);
  }

  scrapeRevisionHistory(userId: string): Observable<ApiResponse<any>> {
    const url = `${environment.apiBaseUrl}/revision-history/fetch/${userId}`;

    return this.http.get<ApiResponse<any>>(url);
  }

  getUserRevisionHistory(
    userId: string
  ): Observable<ApiResponse<GetRevisionHistoryResponse['data']>> {
    const url = `${environment.apiBaseUrl}/revision-history/user/${userId}`;

    return this.http.get<ApiResponse<GetRevisionHistoryResponse['data']>>(url);
  }

  getFilteredRevisions(params: {
    baseId?: string;
    tableId?: string;
    userId?: string;
    limit?: number;
    skip?: number;
  }): Observable<ApiResponse<any>> {
    const url = `${environment.apiBaseUrl}/revision-history/filter`;

    return this.http.get<ApiResponse<any>>(url, { params: params as any });
  }

  getRecordRevisions(recordId: string): Observable<ApiResponse<any>> {
    const url = `${environment.apiBaseUrl}/revision-history/record/${recordId}`;

    return this.http.get<ApiResponse<any>>(url);
  }

  scrapeRecordRevisions(params: {
    userId: string;
    recordId: string;
    baseId: string;
    tableId: string;
  }): Observable<ApiResponse<any>> {
    const url = `${environment.apiBaseUrl}/revision-history/scrape/record`;

    return this.http.post<ApiResponse<any>>(url, params);
  }

  syncRecordRevisions(params: {
    userId: string;
    recordId: string;
    baseId: string;
    tableId: string;
  }): Observable<ApiResponse<any>> {
    const url = `${environment.apiBaseUrl}/revision-history/sync/record`;

    return this.http.post<ApiResponse<any>>(url, params);
  }
}
