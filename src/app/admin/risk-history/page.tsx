import { redirect } from "next/navigation";

/**
 * Retired as a page: a patient's risk trajectory is part of their record, so it lives on the user detail page
 * (Users → patient → "Risk level over time"). Old links and bookmarks land there.
 */
export default async function RiskHistoryRedirect({ searchParams }: { searchParams: Promise<{ patient?: string }> }) {
  const { patient } = await searchParams;
  redirect(patient ? `/admin/users/${encodeURIComponent(patient)}` : "/admin/users");
}
