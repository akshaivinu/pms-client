"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";
import { logout } from "../../lib/logout";

export default function SettingsPage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Loading account...");
  const router = useRouter();
  useEffect(() => {
    api.auth
      .me()
      .then((result) => {
        setUser(unwrap(result, null) as Record<string, unknown> | null);
        setMessage("");
      })
      .catch(() =>
        setMessage("You are not signed in. Sign in to manage your account."),
      );
  }, []);
  async function handleLogout() {
    await logout();
    router.push("/login");
  }
  const isAdmin = user?.role === "admin";
  return (
    <main className="simple-page">
      <header className="simple-header">
        <Link href="/" className="brand">
          <span>
            pms
          </span>
        </Link>
        <nav>
          <Link href="/dashboard/overview">Overview</Link>
          <Link href="/dashboard/projects">Projects</Link>
          <Link href="/dashboard/activity">Activity</Link>
          <Link className="current" href="/settings">
            Settings
          </Link>
        </nav>
        <Link className="outline-button" href="/dashboard/overview">
          Back to workspace
        </Link>
      </header>
      <section className="simple-content narrow">
        <p className="eyebrow">Workspace</p>
        <h1>Settings</h1>
        <p className="lead">
          Keep your account details close and your workspace in order.
        </p>
        {message && <p className="empty-state">{message}</p>}
        <section className="settings-panel">
          <h2>Account</h2>
          <div className="profile-row">
            <div className="avatar">
              {String(user?.name ?? "?")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <strong>{String(user?.name ?? "Account unavailable")}</strong>
              <p>{String(user?.email ?? "No account details loaded")}</p>
            </div>
          </div>
          <button className="signout-button" onClick={handleLogout}>
            Sign out
          </button>
        </section>

        {isAdmin && (
          <section
            className="settings-panel"
            style={{ marginTop: "24px", maxWidth: "none" }}
          >
            <h2>Admin workspace</h2>
            <p
              className="lead"
              style={{
                margin: "0 0 16px",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              Manage your organization, its users, and their roles.
            </p>
            <div className="quick-links">
              <Link href="/settings/organization">Organization →</Link>
              <Link href="/settings/users">Users →</Link>
              {/*<Link href="/settings/roles">Roles →</Link>*/}
              <Link href="/settings/labels">Labels →</Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
