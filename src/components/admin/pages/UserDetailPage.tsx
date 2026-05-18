"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Calendar, Activity } from "lucide-react";
import { useUser, useUserResponses } from "@/hooks/use-users";
import { formatDate } from "@/lib/utils";
import { DataTable, type Column } from "@/components/admin/DataTable";
import type { UserResponse } from "@/lib/types/models/response";

export function UserDetailPage() {
  const sp = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const id = sp.get("id") || "";

  const { data: user, loading, error } = useUser(id);
  const { data: responsesData, loading: respLoading } = useUserResponses(id);

  if (loading) return <div className="py-16 text-center text-sm text-gray-400"><div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black" /> Loading...</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!user) return <div className="py-16 text-center text-sm text-gray-400">User not found.</div>;

  const resCols: Column<UserResponse>[] = [
    { key: "questionnaire", label: "Questionnaire", sortable: true, render: (r) => <span>{r.questionnaire?.title ?? "—"}</span> },
    { key: "score", label: "Score", sortable: true, render: (r) => <span className="font-medium">{r.score ?? "—"}</span> },
    {
      key: "risk_level", label: "Risk", sortable: true,
      render: (r) => <span className={r.risk_level === "critical" ? "font-bold text-red-600" : "text-gray-700"}>{r.risk_level ?? "—"}</span>,
    },
    { key: "completed_at", label: "Completed", render: (r) => <span className="text-gray-400">{r.completed_at ? formatDate(r.completed_at) : "—"}</span> },
  ];

  const userResponses = responsesData?.data ?? [];

  return (
    <div>
      <button onClick={() => router.push(`/${sessionId}?page=users`)} className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-gray-100 text-lg font-bold text-gray-700">
            {user.nickname?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-black">{user.nickname}</h1>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-gray-500"><Mail className="h-4 w-4" /> {user.email}</div>
              <div className="flex items-center gap-2 text-sm text-gray-500"><Calendar className="h-4 w-4" /> Joined {formatDate(user.created_at)}</div>
              <div className="flex items-center gap-2 text-sm text-gray-500"><Activity className="h-4 w-4" /> Last active {user.last_active_at ? formatDate(user.last_active_at) : "—"}</div>
              <div className="flex items-center gap-2 text-sm text-gray-500">Lang: {user.lang}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600">{user.status}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                user.risk_level === "critical" ? "bg-red-50 text-red-700" :
                user.risk_level === "high" ? "bg-gray-100 text-black" : "bg-gray-50 text-gray-600"
              }`}>{user.risk_level ?? "—"}</span>
              <span className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600">{user.subscription_tier}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-black">Response History ({userResponses.length})</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {respLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading responses...</div>
          ) : (
            <DataTable columns={resCols} data={userResponses} searchable={false} />
          )}
        </div>
      </div>
    </div>
  );
}
