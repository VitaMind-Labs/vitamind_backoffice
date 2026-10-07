"use client";

import { use } from "react";
import { AssignmentsView } from "@/components/admin/assignments/assignments-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; assign?: string }>;
}) {
  const { focus, assign } = use(searchParams);
  return (
    <RequirePermission permission="assignments.view">
      <AssignmentsView focus={focus} assignPatientId={assign} />
    </RequirePermission>
  );
}
