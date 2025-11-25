import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  FetchRevisionHistoryRequest,
  RevisionHistory,
  SyncRevisionHistoryRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class RevisionHistoryService {
  private readonly API_URL = `${environment.apiBaseUrl}/revision-history`;

  constructor(private http: HttpClient) {}

  fetchRevisionHistory(
    request: FetchRevisionHistoryRequest
  ): Observable<ApiResponse<RevisionHistory[]>> {
    return this.http.post<ApiResponse<RevisionHistory[]>>(
      `${this.API_URL}/fetch`,
      request
    );
  }

  syncRevisionHistory(
    request: SyncRevisionHistoryRequest
  ): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/sync`, request);
  }

  getRevisionHistory(
    ticketId: string,
    userId: string
  ): Observable<ApiResponse<RevisionHistory[]>> {
    return this.http.get<ApiResponse<RevisionHistory[]>>(
      `${this.API_URL}/${ticketId}`,
      { params: { userId } }
    );
  }
}
