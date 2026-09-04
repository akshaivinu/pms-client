"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../../lib/api";

type RecordItem = Record<string, unknown>;
const idOf = (item: RecordItem) => String(item._id ?? item.id ?? "");

export default function ProjectSection({ section = "overview" }: { section?: string }) {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<RecordItem | null>(null);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [completion, setCompletion] = useState(0);
  const [message, setMessage] = useState("Loading project...");
  useEffect(() => {
    if (!projectId) return;
    const load = section === "tasks" ? api.tasks.list(projectId) : section === "members" ? api.projects.members(projectId) : section === "workflow" ? api.workflows.get(projectId) : section === "activity" ? api.activity.project(projectId) : api.projects.get(projectId);
    load.then(async (result) => { const value = unwrap(result, section === "overview" || section === "workflow" ? null : [] as unknown[]); if (section === "overview") { setProject(value as RecordItem); const metrics = await api.dashboard.project(projectId).catch(() => null); const data = metrics ? unwrap(metrics, null) as RecordItem | null : null; const summary = data?.summary as RecordItem | undefined; setCompletion(Math.round((Number(summary?.completedTasks ?? 0) / Math.max(Number(summary?.totalTasks ?? 0), 1)) * 100)); } else setItems((Array.isArray(value) ? value : ((value as RecordItem)?.stages ?? [])) as RecordItem[]); setMessage(""); }).catch(() => setMessage("This project could not be loaded. Check your access and session."));
  }, [projectId, section]);
  const title = section === "overview" ? String(project?.name ?? "Project") : `${section[0].toUpperCase()}${section.slice(1)}`;
  return <main className="simple-page"><header className="simple-header"><Link href="/dashboard" className="brand"><span className="brand-mark">P</span><span>pms<span className="brand-dot">.</span></span></Link><nav><Link href="/dashboard">Dashboard</Link><Link className="current" href="/projects">Projects</Link><Link href="/activity">Activity</Link><Link href="/settings">Settings</Link></nav><Link className="outline-button" href="/projects">All projects</Link></header><section className="simple-content"><p className="eyebrow">Project workspace</p><h1>{title}</h1><p className="lead">{String(project?.description ?? "")}</p><nav className="subnav">{["overview", "tasks", "members", "workflow", "activity"].map((tab) => <Link className={section === tab ? "selected" : ""} href={tab === "overview" ? `/projects/${projectId}` : `/projects/${projectId}/${tab}`} key={tab}>{tab}</Link>)}</nav>{message && <p className="empty-state">{message}</p>}{section === "overview" ? <div className="project-detail-grid"><div className="panel"><h2>Project health</h2><div className="progress-bar"><i style={{ width: `${completion}%` }} /></div><p>{completion}% complete · {String(project?.status ?? "")}</p></div><div className="panel"><h2>Quick actions</h2><div className="quick-links"><Link href={`/projects/${projectId}/tasks`}>View tasks →</Link><Link href={`/projects/${projectId}/members`}>View members →</Link><Link href={`/projects/${projectId}/workflow`}>View workflow →</Link></div></div></div> : <div className="detail-list">{items.map((item, index) => <article key={idOf(item) || index}><strong>{String(item.title ?? item.name ?? item.action ?? item.message ?? `Item ${index + 1}`)}</strong><small>{String(item.description ?? item.email ?? item.createdAt ?? item.role ?? "")}</small></article>)}</div>}</section></main>;
}