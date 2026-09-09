"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
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
          <p>Nothing important should get lost.</p>
          <small>We&apos;ll help you get back into your workspace.</small>
        </div>
      </div>
      <section className="auth-card">
        <div className="auth-content">
          <p className="eyebrow">Account recovery</p>
          <h1>Forgot your password?</h1>
          <p className="auth-subtitle">
            Enter your work email and your workspace admin can help you reset
            access.
          </p>
          {submitted ? (
            <div className="form-success">
              <strong>Request noted</strong>
              <p>
                Password recovery is not connected to the server yet. Please
                contact your workspace administrator.
              </p>
              <Link href="/login">Return to sign in</Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
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
              <button className="primary-button auth-submit">Continue</button>
              <p className="auth-switch">
                <Link href="/login">← Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
