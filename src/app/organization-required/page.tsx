"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";

export default function OrganizationRequiredPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const checkpoint = () =>
      api.auth
        .me()
        .then((result) => {
          const user = unwrap(result, null) as {
            role?: string;
            organization_id?: string;
          } | null;
          if (!user) router.replace("/login");
          else if (user.organization_id) router.replace("/dashboard");
          else if (user.role === "admin")
            router.replace("/settings/organization");
          else setChecking(false);
        })
        .catch(() => router.replace("/login"));
    checkpoint();
    const interval = window.setInterval(checkpoint, 30000);
    return () => window.clearInterval(interval);
  }, [router]);
  async function signOut() {
    await api.auth.logout().catch(() => undefined);
    router.replace("/login");
  }
  if (checking)
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-subtitle">Checking your workspace access...</p>
        </section>
      </main>
    );
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link href="/" className="brand">
          <span className="brand-mark">P</span>
          <span>
            pms<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="auth-quote">
          <span>✦</span>
          <p>Your work starts with a team.</p>
          <small>
            Organization membership is managed by your workspace administrator.
          </small>
        </div>
      </div>
      <section className="auth-card">
        <div className="auth-content">
          <p className="eyebrow">Workspace access</p>
          <h1>You&apos;re not in an organization yet.</h1>
          <p className="auth-subtitle">
            Ask your organization administrator to invite you or assign you to
            the right workspace. Once they do, you&apos;ll be able to access
            your projects here.
          </p>
          <div className="form-success">
            <strong>What to do next</strong>
            <p>
              Contact your workspace admin and ask them to add your account.
            </p>
          </div>
          <button className="primary-button auth-submit" onClick={signOut}>
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
