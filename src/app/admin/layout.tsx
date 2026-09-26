import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/layout/admin-shell";

export const metadata: Metadata = {
  title: { default: "Back office", template: "%s · VitaMind back office" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
