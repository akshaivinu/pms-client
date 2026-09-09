"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon = "📋",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
