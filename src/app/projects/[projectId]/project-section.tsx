"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, unwrap } from "../../../lib/api";

type RecordItem = Record<string, unknown>;
const idOf = (item: RecordItem) => String(item._id ?? item.id ?? "");

export default function ProjectSection({
  section = "overview",
}: {
  section?: string;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<RecordItem | null>(null);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [members, setMembers] = useState<RecordItem[]>([]);
  const [currentUser, setCurrentUser] = useState<RecordItem | null>(null);
  const [workflow, setWorkflow] = useState<RecordItem | null>(null);
  const [completion, setCompletion] = useState(0);
  const [message, setMessage] = useState("Loading project...");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [stageName, setStageName] = useState("");
  const [editingStageId, setEditingStageId] = useState("");
  const [editingStageName, setEditingStageName] = useState("");
  const [attachmentTaskId, setAttachmentTaskId] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  useEffect(() => {
    if (!projectId) return;
    const load =
      section === "tasks"
        ? api.tasks.list(projectId)
        : section === "members"
          ? api.projects.members(projectId)
          : section === "workflow"
            ? api.workflows.get(projectId)
            : section === "activity"
              ? api.activity.project(projectId)
              : api.projects.get(projectId);

    load
      .then(async (result) => {
        const value = unwrap(
          result,
          section === "overview" || section === "workflow"
            ? null
            : ([] as unknown[]),
        );
        if (section === "overview") {
          setProject(value as RecordItem);
          const metrics = await api.dashboard
            .project(projectId)
            .catch(() => null);
          const data = metrics
            ? (unwrap(metrics, null) as RecordItem | null)
            : null;
          const summary = data?.summary as RecordItem | undefined;
          setCompletion(
            Math.round(
              (Number(summary?.completedTasks ?? 0) /
                Math.max(Number(summary?.totalTasks ?? 0), 1)) *
                100,
            ),
          );
        } else if (section === "workflow") {
          const workflowData = (value ?? {}) as RecordItem;
          setWorkflow(workflowData);
          setItems(
            Array.isArray(workflowData.stages)
              ? (workflowData.stages as RecordItem[])
              : [],
          );
        } else {
          setItems(
            (Array.isArray(value)
              ? value
              : ((value as RecordItem)?.stages ?? [])) as RecordItem[],
          );
        }
        setMessage("");
      })
      .catch(() =>
        setMessage(
          "This project could not be loaded. Check your access and session.",
        ),
      );
  }, [projectId, section]);

  useEffect(() => {
    if (!projectId || (section !== "workflow" && section !== "tasks")) return;
    api.auth
      .me()
      .then((result) => setCurrentUser(unwrap(result, null) as RecordItem | null))
      .catch(() => setCurrentUser(null));
    api.projects
      .members(projectId)
      .then((result) => setMembers(unwrap(result, [] as unknown[]) as RecordItem[]))
      .catch(() => setMembers([]));
    api.workflows
      .get(projectId)
      .then((result) => setWorkflow(unwrap(result, null) as RecordItem | null))
      .catch(() => setWorkflow(null));
  }, [projectId, section]);

  useEffect(() => {
    if (!projectId || (section !== "tasks" && section !== "members")) return;
    api.projects
      .members(projectId)
      .then((result) => setMembers(unwrap(result, [] as unknown[]) as RecordItem[]))
      .catch(() => setMembers([]));
  }, [projectId, section]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!projectId || !taskTitle.trim()) return;
    try {
      const result = await api.tasks.create(projectId, {
        title: taskTitle.trim(),
        description: "",
        priority: "medium",
      });
      const created = unwrap(result, null) as RecordItem | null;
      if (!created) throw new Error("Task was not returned by the API.");
      setItems((current) => [...current, created]);
      setTaskTitle("");
      setShowTaskForm(false);
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Could not create the task.",
      );
    }
  }

  async function addMember(event: FormEvent) {
    event.preventDefault();
    if (!projectId || !memberEmail.trim()) return;
    try {
      const result = await api.projects.addMember(projectId, {
        email: memberEmail.trim(),
      });
      const created = unwrap(result, null) as RecordItem | null;
      if (!created) throw new Error("Member was not returned by the API.");
      setItems((current) => [...current, created]);
      setMemberEmail("");
      setShowMemberForm(false);
    } catch (reason) {
      const errorMessage =
        reason instanceof Error ? reason.message : "Could not add the member.";
      if (errorMessage.includes("another organization")) {
        window.alert("This user is already in another organization.");
      } else {
        setMessage(errorMessage);
      }
    }
  }

  async function createWorkflow(event: FormEvent) {
    event.preventDefault();
    if (!projectId || !workflowName.trim()) return;
    try {
      const result = await api.workflows.create(projectId, { name: workflowName.trim() });
      const created = unwrap(result, null) as RecordItem | null;
      if (!created) throw new Error("Workflow was not returned by the API.");
      setWorkflow(created);
      setItems(Array.isArray(created.stages) ? (created.stages as RecordItem[]) : []);
      setWorkflowName("");
      setShowWorkflowForm(false);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not create the workflow.");
    }
  }

  async function createStage(event: FormEvent) {
    event.preventDefault();
    if (!projectId || !stageName.trim()) return;
    try {
      const result = await api.workflows.createStage(projectId, {
        name: stageName.trim(),
        position: items.length,
      });
      const created = unwrap(result, null) as RecordItem | null;
      if (!created) throw new Error("Stage was not returned by the API.");
      setWorkflow(created);
      setItems(
        Array.isArray(created.stages)
          ? (created.stages as RecordItem[])
          : [],
      );
      setStageName("");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not create the stage.");
    }
  }

  async function renameStage(event: FormEvent, stageId: string) {
    event.preventDefault();
    if (!editingStageName.trim()) return;
    try {
      await api.workflows.updateStage(projectId!, stageId, { name: editingStageName.trim() });
      setItems((current) => current.map((stage) => idOf(stage) === stageId ? { ...stage, name: editingStageName.trim() } : stage));
      setEditingStageId("");
      setEditingStageName("");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not rename the stage.");
    }
  }

  async function deleteStage(stageId: string) {
    if (!window.confirm("Delete this workflow stage? Tasks in it must be moved first.")) return;
    try {
      await api.workflows.deleteStage(projectId!, stageId);
      setItems((current) => current.filter((stage) => idOf(stage) !== stageId));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not delete the stage.");
    }
  }

  async function moveStage(stageId: string, direction: -1 | 1) {
    const index = items.findIndex((stage) => idOf(stage) === stageId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const payload = reordered.map((stage, position) => ({ id: idOf(stage), position }));
    try {
      const result = await api.workflows.reorderStages(projectId!, payload);
      const updated = unwrap(result, null) as RecordItem | null;
      const stages = updated?.stages;
      setItems(Array.isArray(stages) ? stages as RecordItem[] : reordered);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not reorder the stages.");
    }
  }

  async function moveTask(taskId: string, stageId: string) {
    try {
      await api.tasks.stage(taskId, stageId);
      setItems((current) => current.map((task) => idOf(task) === taskId ? { ...task, workflow_stage_id: stageId } : task));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not move the task.");
    }
  }

  const currentUserId = String(currentUser?._id ?? currentUser?.id ?? "");
  const currentMembership = members.find((member) => {
    const user = (member.user_id ?? member) as RecordItem;
    return String(user._id ?? user.id ?? "") === currentUserId;
  });
  const projectRole = String(currentMembership?.project_role ?? "").toLowerCase();
  const organizationRole = String(currentUser?.role ?? "").toLowerCase();
  const canManageWorkflow = organizationRole === "admin" ||
    (organizationRole === "manager" && ["manager", "project_manager", "project manager"].includes(projectRole));
  const workflowStages = workflow && Array.isArray(workflow.stages)
    ? (workflow.stages as RecordItem[])
    : [];

  async function addAttachment(event: FormEvent) {
    event.preventDefault();
    if (!attachmentTaskId || !attachmentName.trim() || !attachmentUrl.trim()) return;
    try {
      await api.attachments.create(attachmentTaskId, {
        type: "link",
        name: attachmentName.trim(),
        url: attachmentUrl.trim(),
      });
      setAttachmentName("");
      setAttachmentUrl("");
      setShowAttachmentForm(false);
      setMessage("Attachment added.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not add the attachment.");
    }
  }

  async function assignTask(taskId: string, assigneeId: string) {
    try {
      await api.tasks.assignee(taskId, assigneeId || null);
      setItems((current) => current.map((item) => idOf(item) === taskId ? { ...item, assignee_id: assigneeId || null } : item));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not assign the task.");
    }
  }

  async function removeProjectMember(userId: string) {
    if (!projectId) return;
    if (!window.confirm("Remove this member from the project?")) return;
    try {
      await api.projects.removeMember(projectId, userId);
      setItems((current) =>
        current.filter((member) => {
          const userObj = (member.user_id ?? member) as RecordItem;
          return String(userObj._id ?? userObj.id) !== userId;
        }),
      );
      setMembers((current) =>
        current.filter((member) => {
          const userObj = (member.user_id ?? member) as RecordItem;
          return String(userObj._id ?? userObj.id) !== userId;
        }),
      );
      setMessage("Member removed from project.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not remove member.");
    }
  }

  async function changeProjectRole(userId: string, newRole: string) {
    if (!projectId) return;
    try {
      await api.projects.updateMember(projectId, userId, { projectRole: newRole });
      setItems((current) =>
        current.map((member) => {
          const userObj = (member.user_id ?? member) as RecordItem;
          return String(userObj._id ?? userObj.id) === userId
            ? { ...member, project_role: newRole }
            : member;
        }),
      );
      setMessage("Member role updated.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not update role.");
    }
  }

  async function archiveProject() {
    if (!projectId) return;
    try {
      const res = await api.projects.archive(projectId);
      const updated = unwrap(res, null) as RecordItem | null;
      if (updated) setProject(updated);
      setMessage("Project archived.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not archive project.");
    }
  }

  async function deleteProject() {
    if (!projectId) return;
    if (!window.confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    try {
      await api.projects.delete(projectId);
      router.push("/projects");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not delete project.");
    }
  }

  const title =
    section === "overview"
      ? String(project?.name ?? "Project")
      : `${section[0].toUpperCase()}${section.slice(1)}`;

  return (
    <main className="simple-page">
      <header className="simple-header">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">P</span>
          <span>
            pms<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link className="current" href="/projects">
            Projects
          </Link>
          <Link href="/activity">Activity</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <Link className="outline-button" href="/projects">
          All projects
        </Link>
      </header>
      <section className="simple-content">
        <p className="eyebrow">Project workspace</p>
        <div className="simple-title">
          <div>
            <h1>{title}</h1>
            <p className="lead">{String(project?.description ?? "")}</p>
          </div>
          {section === "tasks" && (
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowTaskForm(true)}
            >
              + Add task
            </button>
          )}
          {section === "members" && (
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowMemberForm(true)}
            >
              + Add member
            </button>
          )}
          {section === "workflow" && canManageWorkflow && (
            <button className="primary-button" type="button" onClick={() => setShowWorkflowForm(true)}>
              + Create workflow
            </button>
          )}
        </div>
        <nav className="subnav">
          {["overview", "tasks", "members", "workflow", "activity"].map(
            (tab) => (
              <Link
                className={section === tab ? "selected" : ""}
                href={
                  tab === "overview"
                    ? `/projects/${projectId}`
                    : `/projects/${projectId}/${tab}`
                }
                key={tab}
              >
                {tab}
              </Link>
            ),
          )}
        </nav>
        {message && <p className="empty-state">{message}</p>}
        {section === "overview" ? (
          <div className="project-detail-grid">
            <div className="panel">
              <h2>Project health</h2>
              <div className="progress-bar">
                <i style={{ width: `${completion}%` }} />
              </div>
              <p>
                {completion}% complete · {String(project?.status ?? "")}
              </p>
            </div>
            <div className="panel">
              <h2>Quick actions</h2>
              <div className="quick-links">
                <Link href={`/projects/${projectId}/tasks`}>View tasks →</Link>
                <Link href={`/projects/${projectId}/members`}>
                  View members →
                </Link>
                <Link href={`/projects/${projectId}/workflow`}>
                  View workflow →
                </Link>
              </div>
              {canManageWorkflow && (
                <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <button className="outline-button" type="button" onClick={archiveProject}>
                    Archive project
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    style={{ color: "var(--coral)", fontSize: "12px" }}
                    onClick={deleteProject}
                  >
                    Delete project
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : section === "tasks" ? (
          <section className="workflow-board task-board">
            {workflowStages.map((stage) => {
              const stageId = idOf(stage);
              const stageTasks = items.filter((task) => String(task.workflow_stage_id ?? "") === stageId);
              return <article className="workflow-stage panel" key={stageId}>
                <header className="workflow-stage-header"><strong>{String(stage.name ?? "Stage")}</strong><small>{stageTasks.length} tasks</small></header>
                <div className="workflow-task-list">
                  {stageTasks.map((task) => {
                    const taskId = idOf(task);
                    return <div className="workflow-task" key={taskId}>
                      <strong>{String(task.title ?? "Task")}</strong>
                      <select value={stageId} onChange={(event) => moveTask(taskId, event.target.value)} aria-label={`Move ${String(task.title ?? "task")}`}>
                        {workflowStages.map((option) => <option key={idOf(option)} value={idOf(option)}>{String(option.name ?? "Stage")}</option>)}
                      </select>
                      <select value={String(task.assignee_id ?? "")} onChange={(event) => assignTask(taskId, event.target.value)} aria-label={`Assign ${String(task.title ?? "task")}`}>
                        <option value="">Unassigned</option>
                        {members.map((member) => {
                          const user = (member.user_id ?? member) as RecordItem;
                          const userId = String(user._id ?? user.id ?? "");
                          return <option key={userId} value={userId}>{String(user.name ?? user.email ?? "Member")}</option>;
                        })}
                      </select>
                      <button className="text-button" type="button" onClick={() => { setAttachmentTaskId(taskId); setShowAttachmentForm(true); }}>Add link</button>
                    </div>;
                  })}
                </div>
              </article>;
            })}
            {!workflow && <p className="empty-state">Create a workflow before adding tasks.</p>}
            {workflow && items.length > 0 && !workflowStages.some((stage) => items.some((task) => String(task.workflow_stage_id ?? "") === idOf(stage))) && <p className="empty-state">Tasks were loaded, but none has a matching workflow stage.</p>}
          </section>
        ) : section === "workflow" ? (
          <section className="workflow-board">
            {workflow && <p className="lead">{String(workflow.name ?? "Workflow")}</p>}
            {!workflow && <p className="empty-state">No workflow has been created yet.</p>}
            {items.map((stage, index) => {
              const stageId = idOf(stage);
              return <article className="workflow-stage panel" key={stageId || index}>
                <header className="workflow-stage-header"><strong>{String(stage.name ?? `Stage ${index + 1}`)}</strong>{canManageWorkflow && <div className="stage-actions"><button type="button" onClick={() => moveStage(stageId, -1)} disabled={index === 0} aria-label="Move stage left">←</button><button type="button" onClick={() => moveStage(stageId, 1)} disabled={index === items.length - 1} aria-label="Move stage right">→</button><button type="button" onClick={() => { setEditingStageId(stageId); setEditingStageName(String(stage.name ?? "")); }} aria-label="Rename stage">⋮</button></div>}</header>
                {editingStageId === stageId && <form className="inline-form" onSubmit={(event) => renameStage(event, stageId)}><input autoFocus value={editingStageName} onChange={(event) => setEditingStageName(event.target.value)} /><button className="text-button" type="submit">Save</button><button className="text-button" type="button" onClick={() => setEditingStageId("")}>Cancel</button><button className="text-button" type="button" onClick={() => deleteStage(stageId)}>Delete</button></form>}
              </article>;
            })}
            {canManageWorkflow && <form className="inline-form" onSubmit={createStage}><input value={stageName} onChange={(event) => setStageName(event.target.value)} placeholder="New stage name" /><button className="primary-button" type="submit">+ Add stage</button></form>}
          </section>
        ) : section === "members" ? (
          <div className="detail-list">
            {items.map((item, index) => {
              const userObj = ((item as { user_id?: RecordItem }).user_id ?? item) as RecordItem;
              const memberUserId = String(userObj._id ?? userObj.id ?? "");
              const currentProjectRole = String(item.project_role ?? "TEAM_MEMBER");
              return (
                <article
                  key={memberUserId || idOf(item) || index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 4px",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <strong>{String(userObj.name ?? userObj.email ?? `Member ${index + 1}`)}</strong>
                    <small style={{ display: "block", color: "var(--muted)", marginTop: "2px" }}>
                      {String(userObj.email ?? "")}
                    </small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {canManageWorkflow ? (
                      <select
                        value={currentProjectRole}
                        onChange={(e) => changeProjectRole(memberUserId, e.target.value)}
                        aria-label={`Project role for ${String(userObj.name ?? userObj.email)}`}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          padding: "5px 8px",
                          background: "#fff",
                          fontSize: "12px",
                          color: "var(--ink)",
                        }}
                      >
                        <option value="TEAM_MEMBER">Team Member</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                      </select>
                    ) : (
                      <small style={{ fontWeight: 600 }}>{currentProjectRole}</small>
                    )}
                    {canManageWorkflow && (
                      <button
                        type="button"
                        className="text-button"
                        style={{ color: "var(--coral)", fontSize: "12px" }}
                        onClick={() => removeProjectMember(memberUserId)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {items.length === 0 && <p className="empty-state">No members assigned to this project.</p>}
          </div>
        ) : (
          <div className="detail-list">
            {items.map((item, index) => (
              <article key={idOf(item) || index}>
                <strong>
                  {String(
                    ((item as { user_id?: RecordItem }).user_id?.name ??
                      (item as { user_id?: RecordItem }).user_id?.email ??
                      item.message ??
                      `user ${index + 1}`),
                  )}
                </strong>
                <small>
                  {String(
                    item.description ??
                      item.email ??
                      item.createdAt ??
                      item.role ??
                      item.userId ??
                      "",
                  )}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
      {showTaskForm && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createTask}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowTaskForm(false)}
              aria-label="Close add task form"
            >
              x
            </button>
            <p className="eyebrow">{String(project?.name ?? "Project")}</p>
            <h2>Add a task</h2>
            <label>
              Task title
              <input
                autoFocus
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="What needs to move forward?"
              />
            </label>
            <button className="primary-button" type="submit">
              Add task
            </button>
          </form>
        </div>
      )}
      {showMemberForm && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={addMember}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowMemberForm(false)}
              aria-label="Close add member form"
            >
              x
            </button>
            <p className="eyebrow">{String(project?.name ?? "Project")}</p>
            <h2>Add a member</h2>
            <label>
              Member Gmail
              <input
                autoFocus
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="member@gmail.com"
              />
            </label>
            <button className="primary-button" type="submit">
              Add member
            </button>
          </form>
        </div>
      )}
      {showWorkflowForm && <div className="modal-backdrop"><form className="modal" onSubmit={createWorkflow}><button className="modal-close" type="button" onClick={() => setShowWorkflowForm(false)} aria-label="Close workflow form">x</button><p className="eyebrow">Project workflow</p><h2>Create a workflow</h2><label>Workflow name<input autoFocus value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} placeholder="Default workflow" /></label><button className="primary-button" type="submit">Create workflow</button></form></div>}
      {showAttachmentForm && <div className="modal-backdrop"><form className="modal" onSubmit={addAttachment}><button className="modal-close" type="button" onClick={() => setShowAttachmentForm(false)} aria-label="Close attachment form">x</button><p className="eyebrow">Task attachment</p><h2>Add a link</h2><label>Name<input autoFocus value={attachmentName} onChange={(event) => setAttachmentName(event.target.value)} placeholder="Design document" /></label><label>URL<input type="url" value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="https://" /></label><button className="primary-button" type="submit">Add link</button></form></div>}
    </main>
  );
}
