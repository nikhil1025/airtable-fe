import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DemoService {
  private readonly API_URL = `${environment.apiBaseUrl}/demo`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/stats`);
  }

  getProjects(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/projects`);
  }

  getTables(projectId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.API_URL}/tables/${projectId}`
    );
  }

  getTickets(
    tableId: string,
    limit: number = 50
  ): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.API_URL}/tickets/${tableId}?limit=${limit}`
    );
  }
}
