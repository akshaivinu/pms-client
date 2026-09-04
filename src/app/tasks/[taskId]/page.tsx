"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../../lib/api";

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Loading task...");
  useEffect(() => { if (taskId) api.tasks.get(taskId).then((result) => { setTask(unwrap(result, null) as Record<string, unknown> | null); setMessage(""); }).catch(() => setMessage("This task could not be loaded. Check your access and session.")); }, [taskId]);
  return <main className="simple-page"><header className="simple-header"><Link href="/dashboard" className="brand"><span className="brand-mark">P</span><span>pms<span className="brand-dot">.</span></span></Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/projects">Projects</Link><Link href="/activity">Activity</Link><Link href="/settings">Settings</Link></nav></header><section className="simple-content narrow"><Link href="/projects" className="back-link">← Back to projects</Link><p className="eyebrow task-eyebrow">Task detail</p><h1>{String(task?.title ?? "Task")}</h1>{message && <p className="empty-state">{message}</p>}<div className="task-detail"><div><h2>Details</h2><p>{String(task?.description ?? "No description yet.")}</p></div><dl><div><dt>Status</dt><dd>{String(task?.status ?? "In progress")}</dd></div><div><dt>Priority</dt><dd>{String(task?.priority ?? "Medium")}</dd></div><div><dt>Assignee</dt><dd>{String(task?.assignee_id ?? "Unassigned")}</dd></div><div><dt>Due</dt><dd>{String(task?.due_date ?? "Not set")}</dd></div></dl></div></section></main>;
}