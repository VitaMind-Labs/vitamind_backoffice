"use client";

import { useSearchParams } from "next/navigation";
import { DashboardPage } from "@/components/admin/pages/DashboardPage";
import { UsersPage } from "@/components/admin/pages/UsersPage";
import { UserFormPage } from "@/components/admin/pages/UserFormPage";
import { UserDetailPage } from "@/components/admin/pages/UserDetailPage";
import { RisksPage } from "@/components/admin/pages/RisksPage";
import { RiskFormPage } from "@/components/admin/pages/RiskFormPage";
import { RiskDetailPage } from "@/components/admin/pages/RiskDetailPage";
import { NotificationsPage } from "@/components/admin/pages/NotificationsPage";
import { NotificationFormPage } from "@/components/admin/pages/NotificationFormPage";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "dashboard";
  const action = searchParams.get("action") || "";
  const id = searchParams.get("id") || "";

  if (page === "users" && action === "add") return <UserFormPage />;
  if (page === "users" && action === "edit" && id) return <UserFormPage />;
  if (page === "users" && action === "view" && id) return <UserDetailPage />;
  if (page === "users") return <UsersPage />;



  if (page === "risks" && action === "add") return <RiskFormPage />;
  if (page === "risks" && action === "edit" && id) return <RiskFormPage />;
  if (page === "risks" && action === "view" && id) return <RiskDetailPage />;
  if (page === "risks") return <RisksPage />;

  if (page === "notifications" && action === "add") return <NotificationFormPage />;
  if (page === "notifications" && action === "edit" && id) return <NotificationFormPage />;
  if (page === "notifications") return <NotificationsPage />;

  return <DashboardPage />;
}
