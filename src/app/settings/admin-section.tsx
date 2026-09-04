"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";

type Section = "organization" | "users" | "roles";
type User = { role?: string; organization_id?: string; name?: string; email?: string };
type Organization = { name?: string; description?: string; _id?: string; id?: string };

export default function AdminSection({ section }: { section: Section }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [message, setMessage] = useState("Checking permissions...");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const checkpoint = () => api.auth.me().then(async (result) => {
      const current = unwrap(result, null) as User | null;
      setUser(current);
      if (current?.role !== "admin") { setMessage("Admin access is required to view this page."); return; }
      const organizationId = current.organization_id;
      if (!organizationId) { setMessage("Create an organization to start your workspace."); return; }
      if (section === "users") { const users = await api.organizations.users(organizationId); setItems(unwrap(users, [] as unknown[]) as Record<string, unknown>[]); }
      if (section === "organization") { const organization = await api.organizations.get(organizationId); setItems([unwrap(organization, {}) as Record<string, unknown>]); }
      setMessage("");
    }).catch(() => setMessage("Sign in as an administrator to continue."));
    checkpoint();
    const interval = window.setInterval(checkpoint, 30000);
    return () => window.clearInterval(interval);
  }, [section]);

  async function createOrganization(event: FormEvent) {
    event.preventDefault();
    if (!organizationName.trim()) return;
    try {
      await api.organizations.create({ name: organizationName.trim() });
      await api.auth.me();
      setCreated(true);
      setOrganizationName("");
      router.replace("/dashboard");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Organization could not be created.");
    }
  }

  const title = section === "organization" ? "Organization" : section === "users" ? "Users" : "Roles";
  const needsOrganization = user?.role === "admin" && !user.organization_id;
  const organization = items[0] as Organization | undefined;
  return <main className="simple-page"><header className="simple-header"><Link href="/dashboard" className="brand"><span className="brand-mark">P</span><span>pms<span className="brand-dot">.</span></span></Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/projects">Projects</Link><Link href="/activity">Activity</Link><Link className="current" href="/settings">Settings</Link></nav></header><section className="simple-content narrow"><p className="eyebrow">Admin settings</p><h1>{title}</h1><p className="lead">Manage the people and policies behind your workspace.</p>{user?.role === "admin" && <nav className="subnav settings-tabs"><Link className={section === "organization" ? "selected" : ""} href="/settings/organization">Organization</Link><Link className={section === "users" ? "selected" : ""} href="/settings/users">Users</Link><Link className={section === "roles" ? "selected" : ""} href="/settings/roles">Roles</Link></nav>}{message && !needsOrganization && <p className={`empty-state ${user?.role !== "admin" ? "access-denied" : ""}`}>{message}</p>}{needsOrganization && section === "organization" && <section className="settings-panel"><h2>Create your organization</h2><p className="lead">Your admin account is ready. Create the organization that will own your projects and users.</p>{created ? <div className="form-success"><strong>Organization created</strong><p>Your organization is ready. Refreshing your session will load it here.</p></div> : <form className="auth-form" onSubmit={createOrganization}><label>Organization name<input autoFocus value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required placeholder="Your organization" /></label><button className="primary-button" type="submit">Create organization</button></form>}</section>}{!needsOrganization && section === "organization" && organization && <section className="settings-panel organization-card"><div className="project-symbol">{organization.name?.[0] ?? "O"}</div><h2>{organization.name ?? "Organization"}</h2><p>{organization.description ?? "Organization workspace"}</p><small>ID: {organization._id ?? organization.id ?? ""}</small></section>}{needsOrganization && section !== "organization" && <p className="empty-state access-denied">Create an organization before managing {section}.</p>}<div className="detail-list">{items.slice(section === "organization" ? 1 : 0).map((item, index) => <article key={String(item._id ?? index)}><strong>{String(item.name ?? item.email ?? item.role ?? "Workspace setting")}</strong><small>{String(item.description ?? item.email ?? item.role ?? "")}</small></article>)}</div></section></main>;
}