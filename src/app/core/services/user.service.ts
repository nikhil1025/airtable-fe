import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, WorkspaceUsersResponse } from '../models';

export interface WorkspaceInfo {
  workspaceId: string;
  workspaceName: string;
}

export interface WorkspaceUsersResult {
  workspaceId: string;
  workspaceName: string;
  users: any[];
  totalUsers: number;
  error?: string;
}

export interface AllWorkspacesResponse {
  workspaces: WorkspaceUsersResult[];
  totalWorkspaces: number;
  successfulWorkspaces: number;
  totalUsers: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(userId: string): Observable<ApiResponse<WorkspaceUsersResponse>> {
    return this.http.post<ApiResponse<WorkspaceUsersResponse>>(
      `${this.API_URL}`,
      { userId }
    );
  }

  syncUsers(userId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/sync`, { userId });
  }

  getWorkspaces(
    userId: string
  ): Observable<
    ApiResponse<{ workspaces: WorkspaceInfo[]; totalWorkspaces: number }>
  > {
    return this.http.get<
      ApiResponse<{ workspaces: WorkspaceInfo[]; totalWorkspaces: number }>
    >(`${this.API_URL}/workspaces/${userId}`);
  }

  fetchUsersForWorkspace(
    userId: string,
    workspaceId?: string
  ): Observable<ApiResponse<WorkspaceUsersResult>> {
    const url = workspaceId
      ? `${this.API_URL}/fetch/${userId}/${workspaceId}`
      : `${this.API_URL}/fetch/${userId}`;

    return this.http.get<ApiResponse<WorkspaceUsersResult>>(url);
  }

  fetchUsersFromAllWorkspaces(
    userId: string
  ): Observable<ApiResponse<AllWorkspacesResponse>> {
    return this.http.get<ApiResponse<AllWorkspacesResponse>>(
      `${this.API_URL}/fetch-all/${userId}`
    );
  }
}
