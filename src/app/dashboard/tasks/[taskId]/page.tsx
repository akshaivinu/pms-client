"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, unwrap } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";

type Task = {
  _id?: string;
  id?: string;
  title?: string;
  project_id?: string;
  priority?: string;
  due_date?: string;
  description?: string;
  status?: string;
  assignee_id?: string;
};

type Dep = { _id?: string; depends_on_task_id?: string };
type Label = { _id?: string; id?: string; name?: string };

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-red-500/10 text-red-600",
};

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deps, setDeps] = useState<Dep[]>([]);
  const [depTasks, setDepTasks] = useState<Task[]>([]);
  const [selDep, setSelDep] = useState("");
  const [labels, setLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<Label[]>([]);
  const [selLabel, setSelLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "manager";

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;

    api.tasks
      .get(taskId)
      .then((r) => {
        if (cancelled) return;
        const t = unwrap(r, null) as Task | null;
        setTask(t);
        if (t) {
          setEditTitle(t.title ?? "");
          setEditPriority(t.priority ?? "medium");
          setEditDueDate(
            t.due_date
              ? new Date(t.due_date).toISOString().split("T")[0]
              : ""
          );
          setEditDescription(t.description ?? "");

          if (t.project_id) {
            api.tasks.list(t.project_id).then((r2) => {
              if (!cancelled) {
                setDepTasks(
                  (unwrap(r2, []) as Task[]).filter(
                    (x) => (x._id ?? x.id) !== taskId
                  )
                );
              }
            });
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    api.tasks
      .dependencies(taskId)
      .then((r) => {
        if (!cancelled) setDeps(unwrap(r, []) as Dep[]);
      })
      .catch(() => {});

    api.labels
      .forTask(taskId)
      .then((r) => {
        if (!cancelled) setTaskLabels(unwrap(r, []) as Label[]);
      })
      .catch(() => {});

    api.labels
      .list()
      .then((r) => {
        if (!cancelled) setLabels(unwrap(r, []) as Label[]);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const handleSave = async () => {
    if (!taskId) return;

    try {
      setIsSubmitting(true);
      await api.tasks.update(taskId, {
        title: editTitle,
        priority: editPriority,
        due_date: editDueDate || null,
        description: editDescription,
      });
      setTask({
        ...task!,
        title: editTitle,
        priority: editPriority,
        due_date: editDueDate || undefined,
        description: editDescription,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDep = () => {
    if (!taskId || !selDep) return;
    api.tasks
      .addDependency(taskId, selDep)
      .then(() => {
        api.tasks.dependencies(taskId).then((r) => setDeps(unwrap(r, []) as Dep[]));
        setSelDep("");
      })
      .catch(console.error);
  };

  const rmDep = (id: string) => {
    if (!taskId) return;
    api.tasks
      .removeDependency(taskId, id)
      .then(() => setDeps((d) => d.filter((x) => x.depends_on_task_id !== id)));
  };

  const addLabel = () => {
    if (!taskId || !selLabel) return;
    api.labels
      .assign(taskId, selLabel)
      .then(() => {
        api.labels.forTask(taskId).then((r) => setTaskLabels(unwrap(r, []) as Label[]));
        setSelLabel("");
      })
      .catch(console.error);
  };

  const rmLabel = (id: string) => {
    if (!taskId) return;
    api.labels
      .remove(taskId, id)
      .then(() => setTaskLabels((l) => l.filter((x) => x._id !== id)));
  };

  const delTask = async () => {
    if (!taskId || !confirm("Delete this task?")) return;
    try {
      await api.tasks.delete(taskId);
      router.push("/dashboard/tasks");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const depNames = deps.map((d) => ({
    id: d.depends_on_task_id ?? "",
    title:
      depTasks.find((t) => (t._id ?? t.id) === d.depends_on_task_id)?.title ??
      d.depends_on_task_id ??
      "Unknown",
  }));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton height={32} width={200} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <p className="text-muted">Task not found</p>
        <Link href="/dashboard/tasks" className="text-coral-500 hover:underline mt-4 inline-block">
          ← Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#f6dc9b]/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/tasks"
            className="text-muted hover:text-ink transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-black">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold"
              />
            ) : (
              task.title
            )}
          </h1>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} isLoading={isSubmitting}>
                  Save
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="text-black">Edit</Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-sm text-ink whitespace-pre-wrap">
                  {task.description || "No description"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              {depNames.length === 0 ? (
                <p className="text-sm text-muted">No dependencies</p>
              ) : (
                <div className="space-y-2">
                  {depNames.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 bg-snow rounded-lg"
                    >
                      <span className="text-sm text-ink">{d.title}</span>
                      {canManage && (
                        <button
                          onClick={() => rmDep(d.id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {canManage && (
                <div className="flex gap-2 mt-4">
                  <select
                    value={selDep}
                    onChange={(e) => setSelDep(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-line rounded-lg"
                  >
                    <option value="">Select task...</option>
                    {depTasks.map((t) => (
                      <option key={t._id ?? t.id} value={t._id as string}>
                        {String(t.title)}
                      </option>
                    ))}
                  </select>
                  <Button onClick={addDep} disabled={!selDep} size="sm">
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Status
                </label>
                <p className="text-sm text-ink">In progress</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Priority
                </label>
                {isEditing ? (
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-line rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                ) : (
                  <Badge className={priorityColors[task.priority ?? "medium"]}>
                    {task.priority ?? "medium"}
                  </Badge>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Due Date
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-ink">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "No due date"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Assignee
                </label>
                <p className="text-sm text-ink">
                  {task.assignee_id ?? "Unassigned"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Labels</CardTitle>
            </CardHeader>
            <CardContent>
              {taskLabels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {taskLabels.map((l) => (
                    <Badge key={l._id} variant="primary">
                      {l.name}
                      {canManage && (
                        <button
                          onClick={() => rmLabel(l._id!)}
                          className="ml-1 text-coral-600 hover:text-coral-700"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
              {canManage && (
                <div className="flex gap-2">
                  <select
                    value={selLabel}
                    onChange={(e) => setSelLabel(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-line rounded-lg"
                  >
                    <option value="">Select label...</option>
                    {labels
                      .filter((l) => !taskLabels.some((t) => t._id === l._id))
                      .map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.name}
                        </option>
                      ))}
                  </select>
                  <Button onClick={addLabel} disabled={!selLabel} size="sm">
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Button variant="danger" onClick={delTask} className="w-full">
              Delete Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
