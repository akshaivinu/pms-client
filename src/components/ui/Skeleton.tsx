"use client";

import { HTMLAttributes, forwardRef } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "text",
      width,
      height,
      lines = 1,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseClasses = "animate-pulse bg-snow rounded";

    const variantClasses = {
      text: "h-4",
      circular: "rounded-full",
      rectangular: "rounded-lg",
    };

    if (lines > 1) {
      return (
        <div ref={ref} className={`space-y-2 ${className}`} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseClasses} ${variantClasses[variant]} ${
                i === lines - 1 ? "w-3/4" : "w-full"
              }`}
              style={{ width: i === lines - 1 ? "75%" : width, height }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={{ width, height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export default Skeleton;
