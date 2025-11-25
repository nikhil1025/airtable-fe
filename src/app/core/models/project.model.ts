// Project/Base Models
export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

export interface SyncBasesRequest {
  userId: string;
  offset?: string;
}

export interface SyncBasesResponse {
  bases: AirtableBase[];
  offset?: string;
  hasMore: boolean;
}

export interface Project {
  _id: string;
  airtableBaseId: string;
  name: string;
  permissionLevel: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem {
  airtableBaseId: string;
  name: string;
  permissionLevel: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
