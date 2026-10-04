"use client";

import { use } from "react";
import { AssignmentsView } from "@/components/admin/assignments/assignments-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = use(searchParams);
  return (
    <RequirePermission permission="assignments.view">
      <AssignmentsView focus={focus} />
    </RequirePermission>
  );
}
