// Ticket/Record Models
export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
  rowId?: string;
}

export interface SyncTicketsRequest {
  userId: string;
  baseId: string;
  tableId: string;
  offset?: string;
}

export interface SyncTicketsResponse {
  records: AirtableRecord[];
  offset?: string;
  hasMore: boolean;
}

export interface Ticket {
  _id: string;
  airtableRecordId: string;
  baseId: string;
  tableId: string;
  fields: Record<string, any>;
  rowId: string;
  createdTime: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListItem {
  airtableRecordId: string;
  baseId: string;
  tableId: string;
  fields: Record<string, any>;
  rowId: string;
  createdTime: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketGridRow {
  id: string;
  status?: string;
  assignee?: string;
  title?: string;
  priority?: string;
  createdTime?: Date;
  [key: string]: any;
}
