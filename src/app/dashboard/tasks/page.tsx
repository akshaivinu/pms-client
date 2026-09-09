"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, unwrap } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addTask, setProjectTasks } from "@/store/tasksSlice";
import { selectProject } from "@/store/projectsSlice";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import type { Task } from "@/types/models";

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-red-500/10 text-red-600",
};

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const tasks = useAppSelector((state) => state.tasks.items);
  const projects = useAppSelector((state) => state.projects.items);
  const selectedId = useAppSelector((state) => state.projects.selectedId);
  const user = useAppSelector((state) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!selectedId);

  const canManage = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "manager";

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;
    setIsLoading(true);

    api.tasks
      .list(selectedId)
      .then((result) => {
        if (cancelled) return;
        const value = unwrap(result, [] as unknown[]) as Task[];
        if (Array.isArray(value)) {
          dispatch(setProjectTasks({ projectId: selectedId, tasks: value }));
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedId]);

  const selectedProject = projects.find(
    (p) => (p._id ?? p.id) === selectedId
  );

  const projectOptions = projects.map((p) => ({
    value: p._id ?? p.id ?? "",
    label: p.name,
  }));

  const filteredTasks = searchQuery
    ? tasks.filter((t) =>
        String(t.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  const handleProjectChange = (projectId: string) => {
    dispatch(selectProject(projectId));
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/dashboard/tasks/${task._id}`);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedId) return;

    try {
      setIsSubmitting(true);
      const result = await api.tasks.create(selectedId, {
        title: newTaskTitle,
        priority: newTaskPriority,
        due_date: newTaskDueDate || null,
      });
      const task = unwrap(result, null) as Task | null;
      if (task) {
        dispatch(addTask({ projectId: selectedId, task }));
        setNewTaskTitle("");
        setNewTaskPriority("medium");
        setNewTaskDueDate("");
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
      if (selectedId) {
        dispatch(
          setProjectTasks({
            projectId: selectedId,
            tasks: tasks.filter((t) => t._id !== taskId),
          })
        );
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tasks</h1>
          <p className="text-muted mt-1">
            {filteredTasks.length} tasks
            {selectedProject && ` in ${selectedProject.name}`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsAdding(true)} disabled={!selectedId}>
            + Add Task
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={selectedId ?? ""}
          onChange={(e) => handleProjectChange(e.target.value)}
          options={projectOptions}
          placeholder="Select a project"
          className="max-w-xs"
        />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            canManage ? (
              <Button onClick={() => setIsAdding(true)} disabled={!selectedId}>
                + Add Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card
              key={task._id}
              variant="bordered"
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Badge className={priorityColors[task.priority ?? "medium"]}>
                    {task.priority ?? "medium"}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-ink">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {task.due_date && (
                    <span className="text-xs text-muted">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
          <Input
            label="Due Date (optional)"
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
          />
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
    </div>
  );
}
