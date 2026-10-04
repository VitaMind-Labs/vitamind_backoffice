"use client";

import { use } from "react";
import { PsychologistsView } from "@/components/admin/psychologists/psychologists-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function PsychologistsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = use(searchParams);
  return (
    <RequirePermission permission="psychologists.view">
      <PsychologistsView focus={focus} />
    </RequirePermission>
  );
}
