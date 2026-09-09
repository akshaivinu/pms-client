"use client";

import Link from "next/link";
import type { Project, User } from "../../types/models";
import { usePathname, useRouter } from "next/navigation";
import { IconExternalLink } from '@tabler/icons-react';

type SidebarProps = {
  projects: Project[];
  selectedId: string;
  user: User | null;
  taskCount: number;
};

export default function Sidebar({
  user,
  taskCount,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const navItems = [
    { href: "/dashboard/overview", label: "Overview", icon: "◈" },
    { href: "/dashboard/tasks", label: "My tasks", icon: "▣", badge: taskCount },
    { href: "/dashboard/projects", label: "Projects", icon: "▤" },
    { href: "/dashboard/activity", label: "Activity", icon: "⌁" },
  ];

  return (
    <aside className="w-64 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 bg-coral-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
            P
          </span>
          <span className="text-lg font-semibold text-[#212529]">
            pms
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-4 mt-5">
        {navItems.map((item) => {
          const isActive = pathname.split('/')[2] === item.href.split('/')[2];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#FF6B6B]/10 text-[#FA5252]"
                  : "text-[#212529] hover:bg-[#FFFAFA]"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm font-medium text-ink">
            {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {user?.name ?? "Account"}
            </p>
            <p className="text-xs text-muted capitalize">
              {user?.role ?? "Member"}
            </p>
          </div>
          <button className="p-1 text-muted hover:text-ink rounded-lg hover:bg-snow transition-colors" onClick={() => {
            router.push('/settings')
          }}>
            <IconExternalLink stroke={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
