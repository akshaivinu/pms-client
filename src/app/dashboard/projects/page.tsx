"use client";

import { useEffect, useState } from "react";
import { api, unwrap } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addProject, selectProject, setProjects } from "@/store/projectsSlice";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import type { Project, Task } from "@/types/models";
import { useRouter } from "next/navigation";
import { IconStack3Filled } from "@tabler/icons-react";

const projectColors = [
  "bg-blue-100",
  "bg-green-100",
  "bg-purple-100",
  "bg-orange-100",
  "bg-pink-100",
];

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.items);
  const selectedId = useAppSelector((state) => state.projects.selectedId);
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

  const router = useRouter();

  useEffect(() => {
    api.projects
      .list()
      .then((result) => {
        const value = unwrap(result, [] as unknown[]) as Project[];
        if (Array.isArray(value)) {
          dispatch(setProjects(value));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (projects.length === 0) return;

    const fetchTaskCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        projects.map(async (project) => {
          const projectId = project._id ?? project.id ?? "";
          try {
            const result = await api.tasks.list(projectId);
            const tasks = unwrap(result, []) as Task[];
            counts[projectId] = tasks.length;
          } catch {
            counts[projectId] = 0;
          }
        })
      );
      setTaskCounts(counts);
    };

    fetchTaskCounts();
  }, [projects]);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      setIsSubmitting(true);
      const result = await api.projects.create({
        name: newProjectName,
        description: newProjectDescription,
      });
      const project = unwrap(result, null) as Project | null;
      if (project) {
        dispatch(addProject(project));
        dispatch(selectProject(project._id ?? project.id ?? ""));
        setNewProjectName("");
        setNewProjectDescription("");
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Failed to add project:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Projects</h1>
          <p className="text-muted mt-1">{projects.length} projects</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>+ New Project</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={160} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          description="Create your first project to get started"
          action={<Button onClick={() => setIsAdding(true)}>+ New Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => {
            const projectId = project._id ?? project.id ?? "";
            const count = taskCounts[projectId] ?? 0;
            return (
              <Card
                key={project._id}
                variant="bordered"
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => {
                  dispatch(selectProject(projectId));
                  router.push(`/dashboard/projects/${projectId}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 ${
                        projectColors[index % projectColors.length]
                      } inline-flex items-center justify-center rounded-lg`}
                    >
                      <p className="font-bold text-[18px]">
                        {project.name.slice(0, 1)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      {project.description && (
                        <p className="text-xs text-muted mt-1 line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-between">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span><IconStack3Filled size={18} /></span>
                    <div className="flex items-center gap-1">
                    <span className="font-medium text-ink">{count}</span>
                      <span className="text-muted">Tasks</span>
                    </div>
                  </div>
                  <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center 
                                  shadow-sm text-ink
                                  backdrop-blur-2xl
                                  group-hover:bg-ink group-hover:text-white
                                  group-hover:scale-105
                                  transition-all duration-300">
                    <span className="text-lg leading-none">→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="Create New Project"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter project name"
          />
          <Input
            label="Description (optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="Enter project description"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProject}
              isLoading={isSubmitting}
              disabled={!newProjectName.trim()}
            >
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
