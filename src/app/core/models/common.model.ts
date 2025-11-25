// Common API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  offset?: string;
  hasMore: boolean;
  total?: number;
}

export interface DashboardStats {
  totalProjects: number;
  totalTables: number;
  totalTickets: number;
  totalRevisionHistory: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  type: 'sync' | 'create' | 'update';
  message: string;
  timestamp: Date;
}
