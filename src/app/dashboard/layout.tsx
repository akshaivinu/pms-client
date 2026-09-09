"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, unwrap } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { setProjects, selectProject } from "@/store/projectsSlice";
import { setProjectTasks } from "@/store/tasksSlice";
import type { Project, Task, User } from "@/types/models";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.items);
  const selectedId = useAppSelector((state) => state.projects.selectedId);
  const tasks = useAppSelector((state) => state.tasks.items);
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        dispatch(setUser(parsed));
      } catch {}
    }

    api.auth
      .me()
      .then((result) => {
        const current = unwrap(result, null) as
          | (User & { organization_id?: string })
          | null;
        if (!current?.organization_id) {
          router.replace(
            current?.role === "member"
              ? "/organization-required"
              : "/settings/organization"
          );
          return;
        }
        dispatch(setUser(current));
        localStorage.setItem("user", JSON.stringify(current));
      })
      .catch(() => {
        if (!stored) {
          router.replace("/login");
        }
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, router]);

  useEffect(() => {
    if (!user?.organization_id) return;

    api.projects
      .list()
      .then((result) => {
        const value = unwrap(result, [] as unknown[]) as Project[];
        if (Array.isArray(value) && value.length) {
          dispatch(setProjects(value));
          if (!selectedId && value.length > 0) {
            dispatch(selectProject(value[0]._id ?? value[0].id ?? ""));
          }
        }
      })
      .catch(console.error);
  }, [dispatch, user?.organization_id, selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    api.tasks
      .list(selectedId)
      .then((result) => {
        const value = unwrap(result, [] as unknown[]) as Task[];
        if (Array.isArray(value)) {
          dispatch(setProjectTasks({ projectId: selectedId, tasks: value }));
        }
      })
      .catch(console.error);
  }, [dispatch, selectedId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        projects={projects}
        selectedId={selectedId ?? ""}
        user={user ?? null}
        taskCount={tasks.length}
      />
      <main className="flex-1 overflow-auto bg-[#f6dc9b]/10 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
