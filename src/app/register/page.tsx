"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push("At least one special character (!@#$%^&* etc.)");
    }
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordErrors(validatePassword(value));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      setLoading(false);
      return;
    }

    try {
      await api.auth.register({ name, email, password });
      router.push("/login");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link href="/" className="brand">
          <span>
            pms
          </span>
        </Link>
        <div className="auth-quote">
          <span>!!</span>
          <p>Build momentum, together.</p>
          <small>Bring projects, people, and priorities into one place.</small>
        </div>
      </div>
      <section className="auth-card">
        <div className="auth-content">
          <p className="eyebrow">Start your workspace</p>
          <h1>Make work feel lighter.</h1>
          <p className="auth-subtitle">
            Create your account and get your team moving.
          </p>
          <form className="auth-form" onSubmit={submit}>
            <label>
              Your name
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Alex Brown"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@company.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                required
                placeholder="At least 8 characters with special character"
              />
              {password.length > 0 && passwordErrors.length > 0 && (
                <div className="mt-1">
                  {passwordErrors.map((err, i) => (
                    <p key={i} className="text-xs text-red-500">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </label>
            {error && <p className="form-error">{error}</p>}
            <button
              className="primary-button auth-submit"
              disabled={loading || passwordErrors.length > 0}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
            <p className="auth-switch">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
