"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, unwrap } from "../lib/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setUser } from "../store/authSlice";
import { addProject, selectProject, setProjects } from "../store/projectsSlice";
import { addTask, setProjectTasks } from "../store/tasksSlice";
import type { Activity, Project, Task, User } from "../types/models";

import Sidebar from "../components/dashboard/Sidebar";
function itemId(item: { id?: string; _id?: string }) { return item._id ?? item.id ?? ""; }

export default function Home() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.items);
  const selectedId = useAppSelector((state) => state.projects.selectedId);
  const tasks = useAppSelector((state) => state.tasks.items);
  const user = useAppSelector((state) => state.auth.user);
  const [summary, setSummary] = useState({ totalTasks: 0, completedTasks: 0, overdueTasks: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const showingTasks = searchParams.get("view") === "tasks";
  const selectedProject = projects.find((project) => itemId(project) === selectedId) ?? projects[0];

  useEffect(() => {
    api.auth.me().then((result) => {
      const current = unwrap(result, null) as (User & { organization_id?: string }) | null;
      if (!current?.organization_id) {
        router.replace(current?.role === "member" ? "/organization-required" : "/settings/organization");
        return;
      }
      dispatch(setUser(current));
    }).catch(() => router.replace("/login"));
    api.projects.list().then((result) => {
      const value = unwrap(result, [] as unknown[]) as Project[];
      if (Array.isArray(value) && value.length) {
        dispatch(setProjects(value));
      }
    }).catch(() => setNotice("Projects could not be loaded."));
    api.dashboard.taskSummary().then((result) => setSummary(unwrap(result, { totalTasks: 0, completedTasks: 0, overdueTasks: 0 }) as typeof summary)).catch(() => undefined);
    api.dashboard.recentActivity().then((result) => setActivity(unwrap(result, [] as unknown[]) as Activity[])).catch(() => undefined);
  }, [dispatch, router]);

  useEffect(() => {
    const checkpoint = () => api.auth.me().then((result) => {
      const current = unwrap(result, null) as (User & { organization_id?: string }) | null;
      if (!current?.organization_id) {
        router.replace(current?.role === "member" ? "/organization-required" : "/settings/organization");
        return;
      }
      dispatch(setUser(current));
    }).catch(() => router.replace("/login"));
    const interval = window.setInterval(checkpoint, 30000);
    return () => window.clearInterval(interval);
  }, [dispatch, router]);

  useEffect(() => {
    if (!selectedId) return;
    api.tasks.list(selectedId).then((result) => dispatch(setProjectTasks({ projectId: selectedId, tasks: unwrap(result, [] as unknown[]) as Task[] }))).catch(() => dispatch(setProjectTasks({ projectId: selectedId, tasks: [] })));
  }, [dispatch, selectedId]);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    if (!projectName.trim()) return;
    try {
      const result = await api.projects.create({ name: projectName.trim(), description: "New project" });
      const created = unwrap(result, null) as Project | null;
      if (!created) throw new Error("Project was not returned by the API.");
      dispatch(addProject(created));
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Project could not be created.");
    }
    setProjectName("");
    setShowProjectForm(false);
  }

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const body = { title: taskTitle.trim(), description: "", priority: "medium" };
    try {
      const result = await api.tasks.create(selectedId, body);
      const created = unwrap(result, null) as Task | null;
      if (!created) throw new Error("Task was not returned by the API.");
      dispatch(addTask({ projectId: selectedId, task: created }));
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Task could not be created.");
    }
    setTaskTitle("");
    setShowTaskForm(false);
  }

  return (
    <div className="app-shell">
      <Sidebar projects={projects} selectedId={selectedId} user={user} taskCount={tasks.length} onSelectProject={(projectId) => dispatch(selectProject(projectId))} onCreateProject={() => setShowProjectForm(true)} />
      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{selectedProject?.name ?? "Projects"}</strong></div><div className="top-actions"><button className="search">⌕ <span>Search anything</span><kbd>⌘ K</kbd></button><button className="circle-button">?</button><button className="notification">♧<i /></button></div></header>
        <section className="content-wrap">
          <div className="page-intro"><div><p className="eyebrow">{showingTasks ? "Tasks" : new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p><h1>{showingTasks ? "My tasks" : <>Good morning, {user?.name ?? "there"} <span>✦</span></>}</h1><p className="intro-copy">{showingTasks ? `Tasks in ${selectedProject?.name ?? "your workspace"}.` : "Here's the pulse of your workspace."}</p></div><button className="primary-button" onClick={() => setShowTaskForm(true)} disabled={!selectedId}><span>+</span> New task</button></div>
          {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}
          <div className="stats-grid"><div className="stat-card"><div className="stat-icon coral">◒</div><div><span>Open tasks</span><strong>{Math.max(0, summary.totalTasks - summary.completedTasks)}</strong><small className="muted">From task summary</small></div></div><div className="stat-card"><div className="stat-icon mint">✓</div><div><span>Completed</span><strong>{summary.completedTasks}</strong><small className="muted">From task summary</small></div></div><div className="stat-card"><div className="stat-icon yellow">◷</div><div><span>Overdue</span><strong>{summary.overdueTasks}</strong><small className="muted">From task summary</small></div></div><div className="stat-card"><div className="stat-icon blue">♧</div><div><span>Loaded projects</span><strong>{projects.length}</strong><small className="muted">Accessible to you</small></div></div></div>
          {!showingTasks && <><div className="section-row"><div><h2>Project focus</h2><p>What&apos;s moving across your projects</p></div><button className="text-button">View all projects <span>→</span></button></div>
          <div className="board-layout"><section className="panel project-panel"><div className="panel-heading"><div className="project-title"><span className="project-symbol">{selectedProject?.name?.[0] ?? "-"}</span><div><h3>{selectedProject?.name ?? "No project selected"}</h3><p>{selectedProject?.description ?? "Select an accessible project to see its details."}</p></div></div><button className="icon-button">•••</button></div><div className="progress-line"><span><b>Project health</b> <i>{selectedProject ? selectedProject.status ?? "active" : "Unavailable"}</i></span><span>{selectedProject ? `${Math.round((summary.completedTasks / Math.max(summary.totalTasks, 1)) * 100)}%` : "-"}</span></div><div className="progress-bar"><i style={{ width: selectedProject ? `${Math.min(100, Math.round((summary.completedTasks / Math.max(summary.totalTasks, 1)) * 100))}%` : "0%" }} /></div><div className="mini-columns"><div><span>Loaded tasks</span><strong>{tasks.length}</strong></div><div><span>Completed</span><strong>{summary.completedTasks}</strong></div><div><span>Overdue</span><strong>{summary.overdueTasks}</strong></div></div></section><section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Latest updates from your workspace</p></div><Link className="text-button" href="/activity">See all</Link></div><div className="activity-list">{activity.length ? activity.slice(0, 3).map((event, index) => <div key={index}><span className="avatar small">{event.userName?.slice(0, 2).toUpperCase() ?? "?"}</span><p><b>{event.userName ?? "Team member"}</b> {event.message ?? event.action ?? "updated the workspace"}<small>{event.createdAt ?? "Recently"}</small></p></div>) : <p className="empty-state">No recent activity.</p>}</div></section></div></>}
          <div className="section-row task-header"><div><h2>Task board</h2><p>{tasks.length} tasks in {selectedProject?.name ?? "this project"}</p></div><div className="view-toggle"><button className="selected">Board</button><button>List</button></div></div>
          <section className="task-board">{["To do", "In progress", "In review", "Done"].map((stage, stageIndex) => <div className="task-column" key={stage}><div className="column-heading"><span><i className={`stage-dot stage-${stageIndex}`} />{stage}</span><b>{stageIndex === 0 ? tasks.length : 0}</b></div>{stageIndex === 0 && tasks.map((task) => <article className="task-card" key={itemId(task)}><div className="task-card-top"><span className={`priority ${task.priority ?? "medium"}`}>{task.priority ?? "medium"}</span><button>•••</button></div><h4>{task.title}</h4>{task.description && <p>{task.description}</p>}<div className="task-meta"><span>◷ {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}</span><span className="avatar tiny">{user?.name?.slice(0, 2).toUpperCase() ?? "?"}</span></div></article>)}{stageIndex === 0 && <button className="add-task" onClick={() => setShowTaskForm(true)} disabled={!selectedId}>+ Add task</button>}</div>)}</section>
        </section>
      </main>
      {showProjectForm && <div className="modal-backdrop"><form className="modal" onSubmit={createProject}><button type="button" className="modal-close" onClick={() => setShowProjectForm(false)}>×</button><p className="eyebrow">Workspace</p><h2>Start a project</h2><label>Project name<input autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Website refresh" /></label><button className="primary-button" type="submit">Create project</button></form></div>}
      {showTaskForm && <div className="modal-backdrop"><form className="modal" onSubmit={createTask}><button type="button" className="modal-close" onClick={() => setShowTaskForm(false)}>×</button><p className="eyebrow">{selectedProject?.name}</p><h2>Add a task</h2><label>Task title<input autoFocus value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="What needs to move forward?" /></label><button className="primary-button" type="submit">Add task</button></form></div>}
    </div>
  );
}
