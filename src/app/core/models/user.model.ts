// Workspace User Models
export interface WorkspaceUser {
  id: string;
  email: string;
  name?: string;
  state?: string;
  createdTime?: string;
  lastActivityTime?: string;
  invitedToAirtableByUserId?: string;
  workspaceId?: string;
  workspaceName?: string;
  permissionLevel?: string;
}

export interface SyncUsersRequest {
  userId: string;
}

export interface WorkspaceUsersResponse {
  workspaceUsers: WorkspaceUser[];
  offset?: string;
  hasMore: boolean;
}
