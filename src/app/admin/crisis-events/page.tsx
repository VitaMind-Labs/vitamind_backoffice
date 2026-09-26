"use client";

import { use } from "react";
import { CrisisEventsView } from "@/components/admin/crisis/crisis-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function CrisisEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = use(searchParams);
  return (
    <RequirePermission permission="crisis.view">
      <CrisisEventsView focus={focus} />
    </RequirePermission>
  );
}
