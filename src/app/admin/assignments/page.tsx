"use client";

import { AssignmentsView } from "@/components/admin/assignments/assignments-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function AssignmentsPage() {
  return (
    <RequirePermission permission="assignments.view">
      <AssignmentsView />
    </RequirePermission>
  );
}
