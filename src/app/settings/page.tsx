"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";

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
  async function logout() {
    await api.auth.logout().catch(() => undefined);
    router.push("/login");
  }
  return (
    <main className="simple-page">
      <header className="simple-header">
        <Link href="/" className="brand">
          <span className="brand-mark">P</span>
          <span>
            pms<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav>
          <Link href="/">Overview</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/activity">Activity</Link>
          <Link className="current" href="/settings">
            Settings
          </Link>
        </nav>
        <Link className="outline-button" href="/">
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
              {String(user?.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong>{String(user?.name ?? "Account unavailable")}</strong>
              <p>{String(user?.email ?? "No account details loaded")}</p>
            </div>
          </div>
          <button className="signout-button" onClick={logout}>
            Sign out
          </button>
        </section>
      </section>
    </main>
  );
}
