"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, FileText, ShieldAlert, Bell, LogOut, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRiskDetections } from "@/hooks/use-risks";
import { useNotifications } from "@/hooks/use-notifications";

const iconMap: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, Users, ClipboardList, FileText, ShieldAlert, Bell,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon: keyof typeof iconMap;
  href?: string;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "", icon: "LayoutDashboard" as const },
  { label: "Users", path: "/users", icon: "Users" as const },
  { label: "Risk Detection", path: "/risks", icon: "ShieldAlert" as const },
  { label: "Notifications", path: "/notifications", icon: "Bell" as const, href: "/admin/notifications" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const currentPage = searchParams.get("page") || "dashboard";

  const { data: riskData } = useRiskDetections(1, 1);
  const { data: notifData } = useNotifications({ read: "false", limit: 1 });

  const urgentCount = riskData?.data?.filter(
    (r) => (r.risk_level === "critical" || r.risk_level === "high") && !r.acknowledged
  ).length ?? 0;
  const unreadCount = notifData?.total ?? 0;

  return (
    <aside
      style={{ width: collapsed ? 64 : 256 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200"
    >
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
        <Link href={`/${sessionId}`} className="flex items-center justify-center gap-2 overflow-hidden" aria-label="VitaMind">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-transparent">
            <Image
              src="/logo.svg"
              alt="VitaMind"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 bg-transparent object-contain"
              priority
            />
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-black"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const href = item.href ?? (item.path ? `/${sessionId}?page=${item.path.replace("/", "")}` : `/${sessionId}`);
          const pageKey = item.path.replace("/", "") || "dashboard";
          const isActive = currentPage === pageKey;

          let badge = 0;
          if (item.label === "Risk Detection") badge = urgentCount;
          if (item.label === "Notifications") badge = unreadCount;

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                isActive
                  ? "bg-gray-100 font-semibold text-black"
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[8px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-2">
        <Link
          href="/signin"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-black"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Link>
      </div>
    </aside>
  );
}
