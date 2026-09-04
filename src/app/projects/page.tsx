"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";

type Project = { _id?: string; id?: string; name: string; description?: string; status?: string };
const idOf = (project: Project) => project._id ?? project.id ?? project.name;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Loading your projects...");

  useEffect(() => { api.auth.me().then((result) => setRole(String((unwrap(result, {}) as Record<string, unknown>).role ?? "member"))).catch(() => setMessage("Sign in to load your projects.")); api.projects.list().then((result) => { const data = unwrap(result, [] as unknown[]) as Project[]; setProjects(data); setMessage(data.length ? "" : "No projects yet."); }).catch(() => setMessage("Sign in to load your projects.")); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); if (!name.trim()) return; try { const result = await api.projects.create({ name: name.trim(), description: "" }); const created = unwrap(result, null) as Project | null; if (!created) throw new Error("Project was not returned by the API."); setProjects((current) => [...current, created]); setName(""); } catch { setMessage("Could not create the project. Check your session and try again."); } }

  return <main className="simple-page"><header className="simple-header"><Link href="/" className="brand"><span className="brand-mark">P</span><span>pms<span className="brand-dot">.</span></span></Link><nav><Link href="/dashboard">Overview</Link><Link className="current" href="/projects">Projects</Link><Link href="/activity">Activity</Link><Link href="/settings">Settings</Link></nav><Link className="outline-button" href="/dashboard">Back to workspace</Link></header><section className="simple-content"><div className="simple-title"><div><p className="eyebrow">Workspace</p><h1>Projects</h1><p>Every initiative, with room to move.</p></div>{role !== "member" && <form className="inline-form" onSubmit={submit}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="New project name" /><button className="primary-button">+ Create</button></form>}</div>{message && <p className="empty-state">{message}</p>}<div className="project-grid">{projects.map((project) => <Link className="project-tile" href={`/projects/${idOf(project)}`} key={idOf(project)}><span className="project-symbol">{project.name[0]}</span><h2>{project.name}</h2><p>{project.description || "No description yet"}</p><small>{project.status ?? "active"} <b>→</b></small></Link>)}</div></section></main>;
}