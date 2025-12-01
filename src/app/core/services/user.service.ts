import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, WorkspaceUsersResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Get workspace users from MongoDB cache (fast load)
   */
  getUsers(userId: string): Observable<ApiResponse<WorkspaceUsersResponse>> {
    return this.http.post<ApiResponse<WorkspaceUsersResponse>>(
      `${this.API_URL}`,
      { userId }
    );
  }
}
