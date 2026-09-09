"use client";

import { useState } from "react";
import { api, unwrap } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import type { Project } from "@/types/models";

interface ProjectListProps {
  projects: Project[];
  selectedId?: string;
  onSelect?: (projectId: string) => void;
  onProjectAdded?: (project: Project) => void;
  isLoading?: boolean;
}

export default function ProjectList({
  projects,
  selectedId,
  onSelect,
  onProjectAdded,
  isLoading = false,
}: ProjectListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        onProjectAdded?.(project);
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={48} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {projects.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No projects yet"
            description="Create your first project to get started"
            action={
              <Button size="sm" onClick={() => setIsAdding(true)}>
                + New Project
              </Button>
            }
          />
        ) : (
          projects.map((project) => (
            <button
              key={project._id}
              onClick={() => onSelect?.(project._id!)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedId === project._id
                  ? "bg-coral-500/10 border border-coral-500/20"
                  : "bg-snow hover:bg-snow/50 border border-transparent"
              }`}
            >
              <p className="text-sm font-medium text-ink">{project.name}</p>
              {project.description && (
                <p className="text-xs text-muted mt-1 line-clamp-1">
                  {project.description}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() => setIsAdding(true)}
      >
        + New Project
      </Button>

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
    </>
  );
}
