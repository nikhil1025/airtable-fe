import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  SyncTicketsRequest,
  SyncTicketsResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly API_URL = `${environment.apiBaseUrl}/sync`;

  constructor(private http: HttpClient) {}

  syncTickets(
    request: SyncTicketsRequest
  ): Observable<ApiResponse<SyncTicketsResponse>> {
    return this.http.post<ApiResponse<SyncTicketsResponse>>(
      `${this.API_URL}/tickets`,
      { ...request, forceSync: true }
    );
  }

  getTickets(
    userId: string,
    baseId: string,
    tableId: string
  ): Observable<ApiResponse<SyncTicketsResponse>> {
    return this.http.post<ApiResponse<SyncTicketsResponse>>(
      `${this.API_URL}/tickets`,
      { userId, baseId, tableId, forceSync: false }
    );
  }
}
