"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../../lib/api";

type Task = {
  _id?: string;
  id?: string;
  title?: string;
  project_id?: string;
  priority?: string;
  due_date?: string;
  description?: string;
  status?: string;
  assignee_id?: string;
};
type Dep = { _id?: string; depends_on_task_id?: string };
type Label = { _id?: string; id?: string; name?: string };

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [msg, setMsg] = useState("Loading...");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [desc, setDesc] = useState("");
  const [deps, setDeps] = useState<Dep[]>([]);
  const [depTasks, setDepTasks] = useState<Task[]>([]);
  const [selDep, setSelDep] = useState("");
  const [labels, setLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<Label[]>([]);
  const [selLabel, setSelLabel] = useState("");
  const [canDelete, setCanDelete] = useState(false);

  const load = () => {
    if (!taskId) return;
    api.tasks
      .get(taskId)
      .then((r) => {
        const t = unwrap(r, null) as Task | null;
        setTask(t);
        setPriority(String(t?.priority ?? "medium"));
        setDueDate(
          t?.due_date
            ? new Date(t.due_date as string).toISOString().split("T")[0]
            : "",
        );
        setDesc(String(t?.description ?? ""));
        setMsg("");
        if (t?.project_id) {
          api.tasks.list(t.project_id as string).then((r2) => {
            setDepTasks(
              (unwrap(r2, []) as Task[]).filter(
                (x) => (x._id ?? x.id) !== taskId,
              ),
            );
          });
        }
      })
      .catch(() => setMsg("Could not load task."));

    api.tasks
      .dependencies(taskId)
      .then((r) => setDeps(unwrap(r, []) as Dep[]))
      .catch(() => {});
    api.labels
      .forTask(taskId)
      .then((r) => setTaskLabels(unwrap(r, []) as Label[]))
      .catch(() => {});
  };

  useEffect(load, [taskId]);
  useEffect(() => {
    api.auth
      .me()
      .then((r) => {
        const u = unwrap(r, null) as Record<string, unknown> | null;
        setCanDelete(u?.role === "admin" || u?.role === "manager");
      })
      .catch(() => {});
    api.labels
      .list()
      .then((r) => setLabels(unwrap(r, []) as Label[]))
      .catch(() => {});
  }, []);

  const update = (field: string, value: unknown) => {
    if (!taskId) return;
    api.tasks
      .update(taskId, { [field]: value })
      .then((r) => {
        setTask(unwrap(r, null) as Task | null);
        if (field === "priority") setPriority(value as string);
        if (field === "due_date") setDueDate(value as string);
        if (field === "description") setDesc(value as string);
      })
      .catch((e) => setMsg(e.message));
  };

  const addDep = () => {
    if (!taskId || !selDep) return;
    api.tasks
      .addDependency(taskId, selDep)
      .then(() => {
        api.tasks
          .dependencies(taskId)
          .then((r) => setDeps(unwrap(r, []) as Dep[]));
        setSelDep("");
      })
      .catch((e) => setMsg(e.message));
  };

  const rmDep = (id: string) => {
    if (!taskId) return;
    api.tasks
      .removeDependency(taskId, id)
      .then(() => setDeps((d) => d.filter((x) => x.depends_on_task_id !== id)));
  };

  const addLabel = () => {
    if (!taskId || !selLabel) return;
    api.labels
      .assign(taskId, selLabel)
      .then(() => {
        api.labels
          .forTask(taskId)
          .then((r) => setTaskLabels(unwrap(r, []) as Label[]));
        setSelLabel("");
      })
      .catch((e) => setMsg(e.message));
  };

  const rmLabel = (id: string) => {
    if (!taskId) return;
    api.labels
      .remove(taskId, id)
      .then(() => setTaskLabels((l) => l.filter((x) => x._id !== id)));
  };

  const delTask = () => {
    if (!taskId || !confirm("Delete this task?")) return;
    api.tasks.delete(taskId).then(() => router.push("/projects"));
  };

  const depNames = deps.map((d) => ({
    id: d.depends_on_task_id ?? "",
    title:
      depTasks.find((t) => (t._id ?? t.id) === d.depends_on_task_id)?.title ??
      d.depends_on_task_id ??
      "Unknown",
  }));

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
          <Link href="/projects">Projects</Link>
          <Link href="/activity">Activity</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </header>
      <section className="simple-content narrow">
        <Link href="/projects" className="back-link">
          ← Back to projects
        </Link>
        <p className="eyebrow task-eyebrow">Task detail</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h1 style={{ margin: 0 }}>{String(task?.title ?? "Task")}</h1>
          {canDelete && (
            <button
              className="text-button"
              onClick={delTask}
              style={{ color: "#e53e3e" }}
            >
              Delete task
            </button>
          )}
        </div>
        {msg && <p className="empty-state">{msg}</p>}

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}
        >
          <div>
            <div className="task-detail">
              <h2>Description</h2>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={() => update("description", desc)}
                rows={5}
                placeholder="Add a description..."
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="task-detail" style={{ marginTop: 16 }}>
              <h2>Dependencies</h2>
              {depNames.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <span>{d.title}</span>
                  <button
                    className="text-button"
                    onClick={() => rmDep(d.id)}
                    style={{ color: "#e53e3e" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <select
                  value={selDep}
                  onChange={(e) => setSelDep(e.target.value)}
                  style={{
                    flex: 1,
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    padding: 10,
                  }}
                >
                  <option value="">Select task...</option>
                  {depTasks.map((t) => (
                    <option key={t._id ?? t.id} value={t._id as string}>
                      {String(t.title)}
                    </option>
                  ))}
                </select>
                <button
                  className="primary-button"
                  onClick={addDep}
                  disabled={!selDep}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="task-detail" style={{ marginTop: 0 }}>
              <h2>Properties</h2>
              <label>
                Status
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "#f9f8f6",
                  }}
                >
                  {String(task?.status ?? "In progress")}
                </div>
              </label>
              <label>
                Priority
                <select
                  value={priority}
                  onChange={(e) => update("priority", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label>
                Due date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => update("due_date", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                  }}
                />
              </label>
              <label>
                Assignee
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "#f9f8f6",
                  }}
                >
                  {String(task?.assignee_id ?? "Unassigned")}
                </div>
              </label>
            </div>
            <div className="task-detail" style={{ marginTop: 0 }}>
              <h2>Labels</h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {taskLabels.map((l) => (
                  <span
                    key={l._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      background: "#e1eff6",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6198b4",
                    }}
                  >
                    {l.name}{" "}
                    <button
                      onClick={() => rmLabel(l._id!)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6198b4",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <select
                  value={selLabel}
                  onChange={(e) => setSelLabel(e.target.value)}
                  style={{
                    flex: 1,
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    padding: 8,
                  }}
                >
                  <option value="">Select label...</option>
                  {labels
                    .filter((l) => !taskLabels.some((t) => t._id === l._id))
                    .map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name}
                      </option>
                    ))}
                </select>
                <button
                  className="primary-button"
                  onClick={addLabel}
                  disabled={!selLabel}
                  style={{ padding: "8px 12px", fontSize: 12 }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
