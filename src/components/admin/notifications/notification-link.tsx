"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { notificationTarget } from "@/lib/constants/navigation";
import type { AdminNotification } from "@/types/admin";

/** The page a notification points to, or null when it has no back-office page or the role cannot open it. */
export function useNotificationTarget(notification: Pick<AdminNotification, "reference">) {
  const { can } = useAdminSession();
  const target = notificationTarget(notification.reference);
  return target && can(target.permission) ? target : null;
}

export function NotificationLink({ notification, onNavigate }: { notification: AdminNotification; onNavigate?: () => void }) {
  const target = useNotificationTarget(notification);
  if (!target) return <span className="text-muted-foreground">—</span>;
  return (
    <Link
      href={target.href}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate?.();
      }}
      className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
    >
      {target.label}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  );
}
