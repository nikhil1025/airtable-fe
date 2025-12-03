import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SyncBasesRequest, SyncBasesResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly API_URL = `${environment.apiBaseUrl}/sync`;

  constructor(private http: HttpClient) {}

  syncBases(
    request: SyncBasesRequest
  ): Observable<ApiResponse<SyncBasesResponse>> {
    return this.http.post<ApiResponse<SyncBasesResponse>>(
      `${this.API_URL}/bases`,
      { ...request, forceSync: true }
    );
  }

  getBases(userId: string): Observable<ApiResponse<SyncBasesResponse>> {
    return this.http.post<ApiResponse<SyncBasesResponse>>(
      `${this.API_URL}/bases`,
      { userId, forceSync: false }
    );
  }

  syncAll(userId: string): Observable<ApiResponse> {
    const url = `${this.API_URL}/all`;
    const payload = { userId };

    console.log(' [ProjectService] Calling syncAll API', {
      url,
      payload,
      fullUrl: `${environment.apiBaseUrl}/sync/all`,
    });

    return this.http.post<ApiResponse>(url, payload);
  }
}
