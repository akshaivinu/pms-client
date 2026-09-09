"use client";

import { useEffect, useState } from "react";
import { api, unwrap } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/EmptyState";
import { useRouter } from "next/navigation";

interface DashboardSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

interface Activity {
  _id?: string;
  userName?: string;
  message?: string;
  action?: string;
  created_at?: string;
}

export default function OverviewPage() {
  const projects = useAppSelector((state) => state.projects.items);
  const user = useAppSelector((state) => state.auth.user);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const activityResult = await api.dashboard.recentActivity();
        setActivity(unwrap(activityResult, []) as Activity[]);

        if (projects.length > 0) {
          const taskPromises = projects.map((project) =>
            api.tasks.list(project._id ?? project.id ?? "")
          );
          const taskResults = await Promise.all(taskPromises);

          let totalTasks = 0;
          let overdueTasks = 0;
          const now = new Date();

          taskResults.forEach((result) => {
            const tasks = unwrap(result, []) as Array<{
              _id?: string;
              due_date?: string | null;
            }>;
            totalTasks += tasks.length;
            tasks.forEach((task) => {
              if (task.due_date && new Date(task.due_date) < now) {
                overdueTasks++;
              }
            });
          });

          setSummary({ totalTasks, completedTasks: 0, overdueTasks });
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projects]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton height={32} width={200} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
      </div>
    );

  }

  const projectColors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-purple-100",
    "bg-orange-100",
    "bg-pink-100",
  ];

  const greets = greeting();
  const generateGreetingEmoji = () => {
    const partOfTheDay = greets.split(" ")[0];
    switch (partOfTheDay) {
      case "Good":
        return "🌞";
      case "Good afternoon":
        return "🌤️";
      case "Good evening":
        return "🌜";
      default:
        return "🌞";
    }
  };
  const greetingEmoji = generateGreetingEmoji();
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-ink">
          {greets}, {user?.name ?? "there"} {greetingEmoji}
        </h1>
        <p className="text-muted mt-1 text-sm md:text-base">Here&apos;s the pulse of your workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="bordered" className="bg-purple-100/60!">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-ink">{projects.length}</p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="bg-blue-100/60!">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-ink">{summary.totalTasks}</p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="bg-red-100/60!">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-red-600">
              {summary.overdueTasks}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered">
          <CardHeader className="flex flex-col justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-xs">Updates from your organization</p>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No recent activity"
                description="Activity will appear here as you work on projects"
              />
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 5).map((item, index) => (
                  <div
                    key={item._id ?? index}
                    className="flex items-center justify-between py-2 border-b border-gray-300 last:border-0"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <p className="hidden sm:block">🔔</p>
                      <div className="min-w-0">
                        <p className="text-sm text-ink truncate">{item.message}</p>
                        <p className="text-xs text-muted">{item.userName}</p>
                      </div>
                    </div>
                    <Badge variant="success" className="hidden sm:inline-flex">{item.action}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <p className="text-sm text-blue-600 cursor-pointer" onClick={() => {
              router.push('/dashboard/projects')
            }}>View All <span className="pl-1">→</span></p>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No projects yet"
                description="Create your first project to get started"
              />
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project, index) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-3 bg-snow rounded-lg cursor-pointer hover:bg-gray-100 group"
                    onClick={() => {
                      router.push(`/dashboard/projects/${project._id}`)
                    }}
                  >
                    <div className="flex items-center gap-3 md:gap-5">
                      <div className={`size-10 md:size-12 ${
                         projectColors[index % projectColors.length]
                       } inline-flex items-center justify-center rounded-lg shadow-2xl`}>
                        <p className="font-bold text-sm md:text-[18px]">{project.name.slice(0, 1)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-[10px] text-muted mt-1 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 opacity-0 -translate-x-10">
                      <p>→</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
