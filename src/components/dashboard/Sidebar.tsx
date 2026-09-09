"use client";

import Link from "next/link";
import type { Project, User } from "../../types/models";
import { usePathname, useRouter } from "next/navigation";
import { IconExternalLink, IconMenu2, IconX } from "@tabler/icons-react";
import { useState } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/dashboard/overview", label: "Overview", icon: "◈" },
    { href: "/dashboard/tasks", label: "My tasks", icon: "▣", badge: taskCount },
    { href: "/dashboard/projects", label: "Projects", icon: "▤" },
    { href: "/dashboard/activity", label: "Activity", icon: "⌁" },
  ];

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 bg-coral-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
            P
          </span>
          <span className="text-lg font-semibold text-[#212529]">
            pms
          </span>
        </div>
        <button
          className="lg:hidden p-1 text-muted hover:text-ink"
          onClick={() => setMobileOpen(false)}
        >
          <IconX size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-4 mt-5">
        {navItems.map((item) => {
          const isActive = pathname.split('/')[2] === item.href.split('/')[2];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
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
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-ink"
        onClick={() => setMobileOpen(true)}
      >
        <IconMenu2 size={20} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        hidden lg:flex w-64 h-full border-r border-gray-200 bg-white flex-col
      `}>
        {sidebarContent}
      </aside>

      <aside className={`
        lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
