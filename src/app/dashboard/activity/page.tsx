"use client";

import { useEffect, useState } from "react";
import { api, unwrap } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

interface Activity {
  _id?: string;
  userName?: string;
  message?: string;
  action?: string;
  entity_type?: string;
  created_at?: string;
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.dashboard
      .recentActivity()
      .then((result) => {
        const data = unwrap(result, []) as Activity[];
        setActivity(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Activity</h1>
        <p className="text-muted mt-1">Recent updates from your workspace</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No activity yet"
          description="Activity will appear here as you work on projects"
        />
      ) : (
        <Card variant="bordered">
          <CardContent>
            <div className="space-y-4">
              {activity.map((item) => (
                <div
                  key={item._id}
                  className="flex items-start gap-4 py-3 border-b border-line last:border-0"
                >
                  <div className="w-9 h-9 bg-snow rounded-full flex items-center justify-center text-sm font-medium text-ink flex-shrink-0">
                    <p>🔔</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{item.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted">
                        {item.userName}
                      </span>
                      {item.entity_type && (
                        <>
                          <span className="text-muted">·</span>
                          <Badge variant="default">{item.entity_type}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {item.action && (
                    <Badge variant="success">{item.action}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
