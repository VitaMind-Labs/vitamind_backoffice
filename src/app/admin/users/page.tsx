"use client";

import { RequirePermission } from "@/components/admin/shared/permission";
import { UsersList } from "@/components/admin/users/users-list";

export default function UsersPage() {
  return (
    <RequirePermission permission="users.list">
      <UsersList />
    </RequirePermission>
  );
}
