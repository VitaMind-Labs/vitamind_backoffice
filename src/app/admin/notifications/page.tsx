"use client";

import { NotificationsView } from "@/components/admin/notifications/notifications-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function NotificationsPage() {
  return (
    <RequirePermission permission="notifications.view">
      <NotificationsView />
    </RequirePermission>
  );
}
