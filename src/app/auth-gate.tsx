"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, unwrap } from "../lib/api";

const publicPaths = ["/login", "/register", "/forgot-password"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    if (isPublic) {
      setChecking(false);
      return;
    }
    const checkpoint = () => api.auth.me().then((result) => {
      const user = unwrap(result, null) as { role?: string; organization_id?: string } | null;
      if (!user) {
        router.replace("/login");
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
    }).catch(() => router.replace("/login"));
    checkpoint();
    const interval = window.setInterval(checkpoint, 30000);
    return () => window.clearInterval(interval);
  }, [isPublic, pathname, router]);

  if (checking && !isPublic) return <main className="auth-page"><section className="auth-card"><p className="auth-subtitle">Checking workspace access...</p></section></main>;
  return children;
}