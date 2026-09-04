export type Project = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  status?: string;
};

export type Task = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  priority?: string;
  workflow_stage_id?: string;
  assignee_id?: string | null;
  due_date?: string | null;
};

export type User = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  organization_id?: string;
};

export type Activity = {
  userName?: string;
  message?: string;
  action?: string;
  createdAt?: string;
};
