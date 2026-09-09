"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";

export default function ActivityPage() {
  const [activity, setActivity] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("Loading recent activity...");
  useEffect(() => {
    api.dashboard
      .recentActivity()
      .then((result) => {
        const data = unwrap(result, [] as unknown[]) as Record<
          string,
          unknown
        >[];
        setActivity(data);
        setMessage(data.length ? "" : "No activity has been recorded yet.");
      })
      .catch(() => setMessage("Sign in to see your team activity."));
  }, []);
  return (
    <main className="simple-page">
      <section className="simple-content narrow">
        <p className="eyebrow">Workspace pulse</p>
        <h1>Activity</h1>
        <p className="lead">
          A running record of what your team is moving forward.
        </p>
        {message && <p className="empty-state">{message}</p>}
        <div className="activity-page-list">
          {activity.map((event, index) => (
            <article key={index}>
              <span className="avatar small">
                {String(event.userName ?? "TM")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <strong>
                  {String(
                    event.message ??
                      event.action ??
                      "A team update was recorded",
                  )}
                </strong>
                <small>{String(event.createdAt ?? "Recently")}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
