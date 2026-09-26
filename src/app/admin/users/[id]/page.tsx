"use client";

import { use } from "react";
import { RequirePermission } from "@/components/admin/shared/permission";
import { UserDetail } from "@/components/admin/users/user-detail";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission permission="users.view">
      <UserDetail userId={id} />
    </RequirePermission>
  );
}
