"use client";

import { useState } from "react";
import Link from "next/link";
import { api, unwrap } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import type { Task } from "@/types/models";

interface TaskListProps {
  tasks: Task[];
  projectId?: string;
  onTaskAdded?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  isLoading?: boolean;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-red-500/10 text-red-600",
};

export default function TaskList({
  tasks,
  projectId,
  onTaskAdded,
  onTaskDeleted,
  isLoading = false,
}: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !projectId) return;

    try {
      setIsSubmitting(true);
      const result = await api.tasks.create(projectId, {
        title: newTaskTitle,
        priority: newTaskPriority,
      });
      const task = unwrap(result, null) as Task | null;
      if (task) {
        onTaskAdded?.(task);
        setNewTaskTitle("");
        setNewTaskPriority("medium");
        setIsAdding(false);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.tasks.delete(taskId);
      onTaskDeleted?.(taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  if (isLoading) {
    return (
      <Card variant="bordered">
        <CardHeader>
          <Skeleton width={120} height={24} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="bordered">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          + Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No tasks yet"
            description="Create your first task to get started"
            action={
              <Button size="sm" onClick={() => setIsAdding(true)}>
                + Add Task
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center justify-between p-3 bg-snow rounded-lg hover:bg-snow/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className={priorityColors[task.priority ?? "medium"]}>
                    {task.priority ?? "medium"}
                  </Badge>
                  <Link
                    href={`/tasks/${task._id}`}
                    className="text-sm font-medium text-ink hover:text-coral-500 transition-colors"
                  >
                    {task.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  {task.due_date && (
                    <span className="text-xs text-muted">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteTask(task._id!)}
                    className="p-1 text-muted hover:text-red-500 transition-colors"
                    aria-label="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add New Task"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title"
          />
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Priority
            </label>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              isLoading={isSubmitting}
              disabled={!newTaskTitle.trim()}
            >
              Add Task
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
