export type Project = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  status?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Task = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  workflow_stage_id?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type User = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'member';
  organization_id?: string;
  created_at?: string;
};

export type Activity = {
  _id?: string;
  id?: string;
  userName?: string;
  user_id?: string;
  message?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  createdAt?: string;
  created_at?: string;
};

export type Label = {
  _id?: string;
  id?: string;
  name: string;
  color?: string;
  organization_id?: string;
};

export type Workflow = {
  _id?: string;
  id?: string;
  name: string;
  project_id?: string;
  stages?: WorkflowStage[];
};

export type WorkflowStage = {
  _id?: string;
  id?: string;
  name: string;
  order?: number;
  workflow_id?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  total?: number;
  page?: number;
  limit?: number;
};
