// Table Models
export interface AirtableField {
  id: string;
  name: string;
  type: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  description?: string;
  fields: AirtableField[];
}

export interface SyncTablesRequest {
  userId: string;
  baseId: string;
  offset?: string;
}

export interface SyncTablesResponse {
  tables: AirtableTable[];
  offset?: string;
  hasMore: boolean;
}

export interface Table {
  _id: string;
  airtableTableId: string;
  baseId: string;
  name: string;
  description?: string;
  fields: AirtableField[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableListItem {
  airtableTableId: string;
  baseId: string;
  name: string;
  description?: string;
  fields: AirtableField[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
