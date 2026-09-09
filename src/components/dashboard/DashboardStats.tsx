"use client";

import { useEffect, useState } from "react";
import { api, unwrap } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/EmptyState";

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

export default function DashboardStats() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryResult, activityResult] = await Promise.all([
          api.dashboard.taskSummary(),
          api.dashboard.recentActivity(),
        ]);

        setSummary(unwrap(summaryResult, { totalTasks: 0, completedTasks: 0, overdueTasks: 0 }) as DashboardSummary);
        setActivity(unwrap(activityResult, []) as Activity[]);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="bordered">
            <Skeleton height={20} width={100} className="mb-2" />
            <Skeleton height={32} width={60} />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ink">{summary?.totalTasks ?? 0}</p>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{summary?.completedTasks ?? 0}</p>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{summary?.overdueTasks ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
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
              {activity.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between py-2 border-b border-line last:border-0"
                >
                  <div>
                    <p className="text-sm text-ink">{item.message}</p>
                    <p className="text-xs text-muted">{item.userName}</p>
                  </div>
                  <Badge variant="primary">{item.action}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
