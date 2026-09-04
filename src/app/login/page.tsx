"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.auth.login({ email, password });
      router.push("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return <AuthFrame eyebrow="Welcome back" title="Your work, in focus." subtitle="Sign in to pick up where you left off."><form className="auth-form" onSubmit={submit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@company.com" /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" /></label><Link className="forgot-link" href="/forgot-password">Forgot your password?</Link>{error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button><p className="auth-switch">New to pms.? <Link href="/register">Create an account</Link></p></form></AuthFrame>;
}

function AuthFrame({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="auth-page"><div className="auth-aside"><Link href="/" className="brand"><span className="brand-mark">P</span><span>pms<span className="brand-dot">.</span></span></Link><div className="auth-quote"><span>✦</span><p>Make space for the work that matters.</p><small>A calmer project workspace for ambitious teams.</small></div></div><section className="auth-card"><div className="auth-content"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>{children}</div></section></main>;
}

export { AuthFrame };