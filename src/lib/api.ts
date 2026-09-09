const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiResponse<T> =
  T | { success?: boolean; data?: T; user?: T; message?: string };

let isRedirectingToLogin = false;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (
    response.status === 401 &&
    !isRedirectingToLogin &&
    typeof window !== "undefined" &&
    !path.startsWith("/auth")
  ) {
    isRedirectingToLogin = true;
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  return body as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

export const api = {
  auth: {
    register: (body: Record<string, unknown>) =>
      post<ApiResponse<unknown>>("/auth/register", body),
    login: (body: Record<string, unknown>) =>
      post<ApiResponse<unknown>>("/auth/login", body),
    logout: () => post<ApiResponse<unknown>>("/auth/logout"),
    me: () => get<ApiResponse<unknown>>("/auth/me"),
    updateRole: () => patch<ApiResponse<unknown>>("/auth"),
  },
  dashboard: {
    overview: () => get<ApiResponse<unknown>>("/dashboard"),
    taskSummary: () => get<ApiResponse<unknown>>("/dashboard/task-summary"),
    overdueTasks: () => get<ApiResponse<unknown>>("/dashboard/overdue-tasks"),
    workload: () => get<ApiResponse<unknown>>("/dashboard/workload"),
    recentActivity: () =>
      get<ApiResponse<unknown>>("/dashboard/recent-activity"),
    project: (projectId: string) =>
      get<ApiResponse<unknown>>(`/projects/${projectId}/dashboard`),
  },
  organizations: {
    create: (body: Record<string, unknown>) =>
      post<ApiResponse<unknown>>("/organizations", body),
    get: (organizationId: string) =>
      get<ApiResponse<unknown>>(`/organizations/${organizationId}`),
    update: (organizationId: string, body: Record<string, unknown>) =>
      patch<ApiResponse<unknown>>(`/organizations/${organizationId}`, body),
    users: (organizationId: string) =>
      get<ApiResponse<unknown[]>>(`/organizations/${organizationId}/users`),
    user: (organizationId: string, userId: string) =>
      get<ApiResponse<unknown>>(
        `/organizations/${organizationId}/users/${userId}`,
      ),
    updateUser: (
      organizationId: string,
      userId: string,
      body: Record<string, unknown>,
    ) =>
      patch<ApiResponse<unknown>>(
        `/organizations/${organizationId}/users/${userId}`,
        body,
      ),
    updateUserRole: (organizationId: string, userId: string, role: string) =>
      patch<ApiResponse<unknown>>(
        `/organizations/${organizationId}/users/${userId}/role`,
        { role },
      ),
    deleteUser: (organizationId: string, userId: string) =>
      del<ApiResponse<unknown>>(
        `/organizations/${organizationId}/users/${userId}`,
      ),
  },
  projects: {
    list: () => get<ApiResponse<unknown[]>>("/projects"),
    get: (projectId: string) =>
      get<ApiResponse<unknown>>(`/projects/${projectId}`),
    create: (body: { name: string; description?: string }) =>
      post<ApiResponse<unknown>>("/projects", body),
    update: (projectId: string, body: Record<string, unknown>) =>
      patch<ApiResponse<unknown>>(`/projects/${projectId}`, body),
    delete: (projectId: string) =>
      del<ApiResponse<unknown>>(`/projects/${projectId}`),
    archive: (projectId: string) =>
      post<ApiResponse<unknown>>(`/projects/${projectId}/archive`),
    members: (projectId: string) =>
      get<ApiResponse<unknown[]>>(`/projects/${projectId}/members`),
    addMember: (projectId: string, body: Record<string, unknown>) =>
      post<ApiResponse<unknown>>(`/projects/${projectId}/members`, body),
    updateMember: (
      projectId: string,
      userId: string,
      body: Record<string, unknown>,
    ) =>
      patch<ApiResponse<unknown>>(
        `/projects/${projectId}/members/${userId}`,
        body,
      ),
    removeMember: (projectId: string, userId: string) =>
      del<ApiResponse<unknown>>(`/projects/${projectId}/members/${userId}`),
  },
  tasks: {
    list: (projectId: string) =>
      get<ApiResponse<unknown[]>>(`/projects/${projectId}/tasks`),
    get: (taskId: string) => get<ApiResponse<unknown>>(`/tasks/${taskId}`),
    create: (projectId: string, body: Record<string, unknown>) =>
      post<ApiResponse<unknown>>(`/projects/${projectId}/tasks`, body),
    update: (taskId: string, body: Record<string, unknown>) =>
      patch<ApiResponse<unknown>>(`/tasks/${taskId}`, body),
    delete: (taskId: string) => del<ApiResponse<unknown>>(`/tasks/${taskId}`),
    assignee: (taskId: string, assigneeId: string | null) =>
      patch<ApiResponse<unknown>>(`/tasks/${taskId}/assignee`, { assigneeId }),
    stage: (taskId: string, workflowStageId: string) =>
      patch<ApiResponse<unknown>>(`/tasks/${taskId}/stage`, {
        workflowStageId,
      }),
    priority: (taskId: string, priority: string) =>
      patch<ApiResponse<unknown>>(`/tasks/${taskId}/priority`, { priority }),
    dueDate: (taskId: string, dueDate: string | null) =>
      patch<ApiResponse<unknown>>(`/tasks/${taskId}/due-date`, { dueDate }),
    dependencies: (taskId: string) =>
      get<ApiResponse<unknown[]>>(`/tasks/${taskId}/dependencies`),
    addDependency: (taskId: string, dependsOnTaskId: string) =>
      post<ApiResponse<unknown>>(`/tasks/${taskId}/dependencies`, {
        dependsOnTaskId,
      }),
    removeDependency: (taskId: string, dependencyTaskId: string) =>
      del<ApiResponse<unknown>>(
        `/tasks/${taskId}/dependencies/${dependencyTaskId}`,
      ),
  },
  workflows: {
    get: (projectId: string) =>
      get<ApiResponse<unknown>>(`/projects/${projectId}/workflow`),
    create: (projectId: string, body: Record<string, unknown>) =>
      post<ApiResponse<unknown>>(`/projects/${projectId}/workflow`, body),
    update: (projectId: string, body: Record<string, unknown>) =>
      patch<ApiResponse<unknown>>(`/projects/${projectId}/workflow`, body),
    createStage: (
      projectId: string,
      body: { name: string; position: number },
    ) =>
      post<ApiResponse<unknown>>(
        `/projects/${projectId}/workflow/stages`,
        body,
      ),
    updateStage: (
      projectId: string,
      stageId: string,
      body: Record<string, unknown>,
    ) =>
      patch<ApiResponse<unknown>>(
        `/projects/${projectId}/workflow/stages/${stageId}`,
        body,
      ),
    deleteStage: (projectId: string, stageId: string) =>
      del<ApiResponse<unknown>>(
        `/projects/${projectId}/workflow/stages/${stageId}`,
      ),
    reorderStages: (
      projectId: string,
      body: Array<{ id: string; position: number }>,
    ) =>
      patch<ApiResponse<unknown>>(
        `/projects/${projectId}/workflow/stages/reorder`,
        body,
      ),
  },
  labels: {
    list: () => get<ApiResponse<unknown[]>>("/labels"),
    create: (name: string) => post<ApiResponse<unknown>>("/labels", { name }),
    update: (labelId: string, body: Record<string, unknown>) =>
      patch<ApiResponse<unknown>>(`/labels/${labelId}`, body),
    delete: (labelId: string) =>
      del<ApiResponse<unknown>>(`/labels/${labelId}`),
    forTask: (taskId: string) =>
      get<ApiResponse<unknown[]>>(`/tasks/${taskId}/labels`),
    assign: (taskId: string, labelId: string) =>
      post<ApiResponse<unknown>>(`/tasks/${taskId}/labels`, { labelId }),
    remove: (taskId: string, labelId: string) =>
      del<ApiResponse<unknown>>(`/tasks/${taskId}/labels/${labelId}`),
  },
  activity: {
    organization: (organizationId: string) =>
      get<ApiResponse<unknown[]>>(`/organizations/${organizationId}/activity`),
    project: (projectId: string) =>
      get<ApiResponse<unknown[]>>(`/projects/${projectId}/activity`),
    task: (taskId: string) =>
      get<ApiResponse<unknown[]>>(`/tasks/${taskId}/activity`),
  },
  attachments: {
    list: (taskId: string) =>
      get<ApiResponse<unknown[]>>(`/tasks/${taskId}/attachments`),
    create: (taskId: string, body: Record<string, unknown>) =>
      post<ApiResponse<unknown>>(`/tasks/${taskId}/attachments`, body),
    delete: (taskId: string, attachmentId: string) =>
      del<ApiResponse<unknown>>(`/tasks/${taskId}/attachments/${attachmentId}`),
  },
};

export function unwrap<T>(value: ApiResponse<T>, fallback: T): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    value.data !== undefined
  )
    return value.data as T;
  if (
    value &&
    typeof value === "object" &&
    "user" in value &&
    value.user !== undefined
  )
    return value.user as T;
  return (value as T) ?? fallback;
}
