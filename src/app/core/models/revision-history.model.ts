// Revision History Models
export interface RevisionHistory {
  _id: string;
  uuid: string;
  issueId: string;
  columnType: 'Status' | 'Assignee';
  oldValue: string;
  newValue: string;
  createdDate: string;
  authoredBy: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionHistoryGridRow {
  id: string;
  issueId: string;
  columnType: string;
  oldValue: string;
  newValue: string;
  authoredBy: string;
  createdDate: Date;
}

export interface FetchRevisionHistoryRequest {
  userId: string;
  baseId: string;
  tableId: string;
  recordId: string;
  rowId: string;
}

export interface SyncRevisionHistoryRequest {
  userId: string;
  baseId?: string;
  tableId?: string;
}

export interface RevisionHistoryStats {
  totalChanges: number;
  statusChanges: number;
  assigneeChanges: number;
  recentChanges: RevisionHistory[];
}
