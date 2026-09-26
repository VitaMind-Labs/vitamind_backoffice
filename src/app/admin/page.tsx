"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { PageSkeleton } from "@/components/admin/shared/states";
import { homePathFor } from "@/lib/permissions";

/** /admin → the role's home screen. */
export default function AdminIndexPage() {
  const { admin } = useAdminSession();
  const router = useRouter();
  useEffect(() => {
    router.replace(homePathFor(admin.role));
  }, [admin.role, router]);
  return <PageSkeleton />;
}
