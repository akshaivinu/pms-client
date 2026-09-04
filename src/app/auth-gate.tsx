"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../lib/api";

const publicPaths = ["/login", "/register", "/forgot-password"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = publicPaths.includes(pathname);

  const [prevPath, setPrevPath] = useState(pathname);
  const [checking, setChecking] = useState(!isPublic);
  const [accessDenied, setAccessDenied] = useState(false);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setChecking(!isPublic);
    setAccessDenied(false);
  }

  useEffect(() => {
    if (isPublic) {
      return;
    }
    let redirectTimer: number | undefined;
    const denyAccess = () => {
      setAccessDenied(true);
      setChecking(false);
      redirectTimer = window.setTimeout(() => router.replace("/login"), 700);
    };
    const checkpoint = () => api.auth.me().then((result) => {
      const user = unwrap(result, null) as { role?: string; organization_id?: string } | null;
      if (!user) {
        denyAccess();
        return;
      }
      if (!user.organization_id) {
        const setupRoute = user.role === "admin" ? "/settings/organization" : "/organization-required";
        if (pathname !== setupRoute) {
          router.replace(setupRoute);
          return;
        }
      }
      if (pathname === "/settings/organization" && user.role !== "admin") {
        router.replace("/organization-required");
        return;
      }
      if (pathname === "/organization-required" && user.organization_id) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    }).catch(denyAccess);
    checkpoint();
    const interval = window.setInterval(checkpoint, 30000);
    return () => {
      window.clearInterval(interval);
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [isPublic, pathname, router]);

  if (accessDenied && !isPublic) return <main className="auth-page"><section className="auth-card"><div className="auth-content"><p className="eyebrow">Access denied</p><h1>You need to sign in.</h1><p className="auth-subtitle">Redirecting you to login...</p></div></section></main>;
  if (checking && !isPublic) return <main className="auth-page"><section className="auth-card"><p className="auth-subtitle">Checking workspace access...</p></section></main>;
  return children;
}