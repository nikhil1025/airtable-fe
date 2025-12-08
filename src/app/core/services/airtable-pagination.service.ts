import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

interface PaginatedBasesRequest {
  userId: string;
  offset?: string;
  pageSize?: number;
}

interface PaginatedTablesRequest {
  userId: string;
  baseId: string;
  offset?: string;
  pageSize?: number;
}

interface PaginatedRecordsRequest {
  userId: string;
  baseId: string;
  tableId: string;
  offset?: string;
  pageSize?: number;
}

interface BasesResponse {
  bases: any[];
  offset?: string;
  hasMore: boolean;
}

interface TablesResponse {
  tables: any[];
  offset?: string;
  hasMore: boolean;
}

interface RecordsResponse {
  records: any[];
  offset?: string;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AirtablePaginationService {
  private readonly API_URL = `${environment.apiBaseUrl}/pagination`;

  constructor(private http: HttpClient) {}

  getPaginatedBases(
    request: PaginatedBasesRequest
  ): Observable<ApiResponse<BasesResponse>> {
    return this.http.post<ApiResponse<BasesResponse>>(
      `${this.API_URL}/bases`,
      request
    );
  }

  getPaginatedTables(
    request: PaginatedTablesRequest
  ): Observable<ApiResponse<TablesResponse>> {
    return this.http.post<ApiResponse<TablesResponse>>(
      `${this.API_URL}/tables`,
      request
    );
  }

  getPaginatedRecords(
    request: PaginatedRecordsRequest
  ): Observable<ApiResponse<RecordsResponse>> {
    return this.http.post<ApiResponse<RecordsResponse>>(
      `${this.API_URL}/records`,
      request
    );
  }
}
