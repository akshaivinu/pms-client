"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";

type Section = "organization" | "users" | "roles";
type User = {
  _id?: string;
  id?: string;
  role?: string;
  organization_id?: string;
  name?: string;
  email?: string;
};
type Organization = {
  name?: string;
  description?: string;
  _id?: string;
  id?: string;
};

export default function AdminSection({ section }: { section: Section }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [editingOrg, setEditingOrg] = useState(false);
  const [editOrgName, setEditOrgName] = useState("");
  const [message, setMessage] = useState("Checking permissions...");
  const [notice, setNotice] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const checkpoint = () =>
      api.auth
        .me()
        .then(async (result) => {
          const current = unwrap(result, null) as User | null;
          setUser(current);
          if (current?.role !== "admin") {
            setMessage("Admin access is required to view this page.");
            return;
          }
          const organizationId = current.organization_id;
          if (!organizationId) {
            setMessage("Create an organization to start your workspace.");
            return;
          }
          if (section === "users" || section === "roles") {
            const users = await api.organizations.users(organizationId);
            setItems(
              unwrap(users, [] as unknown[]) as Record<string, unknown>[],
            );
          }
          if (section === "organization") {
            const organization = await api.organizations.get(organizationId);
            const orgData = unwrap(organization, {}) as Record<string, unknown>;
            setItems([orgData]);
            setEditOrgName(String(orgData.name ?? ""));
          }
          setMessage("");
        })
        .catch(() => setMessage("Sign in as an administrator to continue."));

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
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Organization could not be created.",
      );
    }
  }

  async function updateOrganization(event: FormEvent) {
    event.preventDefault();
    const organizationId = user?.organization_id;
    if (!organizationId || !editOrgName.trim()) return;
    try {
      await api.organizations.update(organizationId, {
        name: editOrgName.trim(),
      });
      setItems([{ ...items[0], name: editOrgName.trim() }]);
      setEditingOrg(false);
      setNotice("Organization updated successfully.");
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not update organization.",
      );
    }
  }

  async function changeRole(userId: string, newRole: string) {
    const organizationId = user?.organization_id;
    if (!organizationId) return;
    try {
      await api.organizations.updateUserRole(organizationId, userId, newRole);
      setItems((prev) =>
        prev.map((item) =>
          String(item._id ?? item.id) === userId
            ? { ...item, role: newRole }
            : item,
        ),
      );
      setNotice("User role updated successfully.");
    } catch (reason) {
      setNotice(
        reason instanceof Error
          ? reason.message
          : "Could not update user role.",
      );
    }
  }

  async function removeUser(userId: string) {
    const organizationId = user?.organization_id;
    if (!organizationId) return;
    if (
      !window.confirm(
        "Are you sure you want to remove this user from the organization?",
      )
    )
      return;
    try {
      const res = await api.organizations.deleteUser(organizationId, userId);
      const data = unwrap(res, null) as {
        success?: boolean;
        message?: string;
      } | null;
      if (data && data.success === false) {
        setNotice(data.message ?? "Could not remove user.");
        return;
      }
      setItems((prev) =>
        prev.filter((item) => String(item._id ?? item.id) !== userId),
      );
      setNotice("User removed successfully.");
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Could not remove user.",
      );
    }
  }

  const title =
    section === "organization"
      ? "Organization"
      : section === "users"
        ? "Users"
        : "Roles";
  const needsOrganization = user?.role === "admin" && !user.organization_id;
  const organization = items[0] as Organization | undefined;

  return (
    <main className="simple-page">
      <header className="simple-header">
        <Link href="/dashboard" className="brand">
          <span>
            pms
          </span>
        </Link>
        <nav>
          <Link href="/dashboard/overview">Dashboard</Link>
          <Link href="/dashboard/projects">Projects</Link>
          <Link href="/dashboard/activity">Activity</Link>
          <Link className="current" href="/settings">
            Settings
          </Link>
        </nav>
      </header>
      <section className="simple-content narrow">
        <p className="eyebrow">Admin settings</p>
        <h1>{title}</h1>
        <p className="lead">
          Manage the people and policies behind your workspace.
        </p>
        {user?.role === "admin" && (
          <nav className="subnav settings-tabs">
            <Link
              className={section === "organization" ? "selected" : ""}
              href="/settings/organization"
            >
              Organization
            </Link>
            <Link
              className={section === "users" ? "selected" : ""}
              href="/settings/users"
            >
              Users
            </Link>
            {/*<Link
              className={section === "roles" ? "selected" : ""}
              href="/settings/roles"
            >
              Roles
            </Link>*/}
          </nav>
        )}

        {notice && (
          <div className="notice" style={{ marginBottom: "20px" }}>
            {notice}
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {message && !needsOrganization && (
          <p
            className={`empty-state ${user?.role !== "admin" ? "access-denied" : ""}`}
          >
            {message}
          </p>
        )}

        {needsOrganization && section === "organization" && (
          <section className="settings-panel">
            <h2>Create your organization</h2>
            <p className="lead">
              Your admin account is ready. Create the organization that will own
              your projects and users.
            </p>
            {created ? (
              <div className="form-success">
                <strong>Organization created</strong>
                <p>
                  Your organization is ready. Refreshing your session will load
                  it here.
                </p>
              </div>
            ) : (
              <form className="auth-form" onSubmit={createOrganization}>
                <label>
                  Organization name
                  <input
                    autoFocus
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    required
                    placeholder="Your organization"
                  />
                </label>
                <button className="primary-button" type="submit">
                  Create organization
                </button>
              </form>
            )}
          </section>
        )}

        {!needsOrganization && section === "organization" && organization && (
          <section className="settings-panel organization-card">
            <div className="project-symbol">
              {organization.name?.[0] ?? "O"}
            </div>
            {editingOrg ? (
              <form
                onSubmit={updateOrganization}
                style={{ marginTop: "14px", display: "grid", gap: "10px" }}
              >
                <label style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Organization name
                  <input
                    autoFocus
                    value={editOrgName}
                    onChange={(e) => setEditOrgName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid var(--line)",
                      borderRadius: "6px",
                      marginTop: "4px",
                    }}
                  />
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="primary-button" type="submit">
                    Save
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setEditingOrg(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2>{organization.name ?? "Organization"}</h2>
                <p>{organization.description ?? "Organization workspace"}</p>
                <div style={{ marginTop: "16px" }}>
                  <button
                    className="outline-button"
                    type="button"
                    onClick={() => {
                      setEditOrgName(String(organization.name ?? ""));
                      setEditingOrg(true);
                    }}
                  >
                    Edit organization
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {needsOrganization && section !== "organization" && (
          <p className="empty-state access-denied">
            Create an organization before managing {section}.
          </p>
        )}

        {!needsOrganization && (section === "users" || section === "roles") && (
          <div className="detail-list">
            {items.map((item) => {
              const itemId = String(item._id ?? item.id ?? "");
              const currentRole = String(item.role ?? "member");
              const isSelf = itemId === String(user?._id ?? user?.id);
              return (
                <article
                  key={itemId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "16px 4px",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <strong>
                      {String(item.name ?? "User")}{" "}
                      {isSelf && (
                        <small style={{ color: "var(--coral)" }}>(You)</small>
                      )}
                    </strong>
                    <small
                      style={{
                        display: "block",
                        color: "var(--muted)",
                        marginTop: "2px",
                      }}
                    >
                      {String(item.email ?? "")}
                    </small>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      Role:
                      <select
                        value={currentRole}
                        onChange={(e) => changeRole(itemId, e.target.value)}
                        disabled={isSelf}
                        aria-label={`Role for ${String(item.name ?? item.email)}`}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          background: "#fff",
                          fontSize: "12px",
                          color: "var(--ink)",
                          fontWeight: "600",
                        }}
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                      </select>
                    </label>
                    {!isSelf && (
                      <button
                        type="button"
                        className="text-button"
                        style={{ color: "var(--coral)", fontSize: "12px" }}
                        onClick={() => removeUser(itemId)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {items.length === 0 && (
              <p className="empty-state">
                No users found in this organization.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
