"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Plus, Eye, Search } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useUsers } from "@/hooks/use-users";
import { formatDate } from "@/lib/utils";
import type { User } from "@/lib/types/models/user";

const statusLabels: Record<string, string> = {
  active: "Active", inactive: "Inactive", suspended: "Suspended",
};

export function UsersPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [search, setSearch] = useState("");

  const { data, loading, error } = useUsers(search ? { search, limit: 50 } : { limit: 50 });

  const columns: Column<User>[] = [
    { key: "nickname", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "status", label: "Status", sortable: true,
      render: (u) => (
        u.status === "active" ? <span className="text-gray-700">Active</span> :
        u.status === "inactive" ? <span className="text-gray-400">Inactive</span> :
        <span className="text-red-600">Suspended</span>
      ),
    },
    {
      key: "risk_level", label: "Risk", sortable: true,
      render: (u) => (
        <span className={
          u.risk_level === "critical" ? "font-bold text-red-600" :
          u.risk_level === "high" ? "font-semibold text-black" :
          u.risk_level === "moderate" ? "text-gray-700" : "text-gray-500"
        }>{u.risk_level ?? "—"}</span>
      ),
    },
    { key: "last_active_at", label: "Last Active", render: (u) => <span className="text-gray-400">{u.last_active_at ? formatDate(u.last_active_at) : "—"}</span> },
    {
      key: "id", label: "", width: "60px",
      render: (u) => (
        <Link href={`/${sessionId}?page=users&action=view&id=${u.id}`} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black">
          <Eye className="h-3.5 w-3.5" /> View
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage registered users.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-black outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400"
            />
          </div>
          {data && <span className="text-xs text-gray-400">{data.total} user{data.total !== 1 ? "s" : ""}</span>}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-5 flex-1 rounded bg-gray-100" />
                <div className="h-5 flex-1 rounded bg-gray-100" />
                <div className="h-5 w-16 rounded bg-gray-100" />
                <div className="h-5 w-16 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        ) : (
          <DataTable columns={columns} data={data?.data ?? []} searchable={false} />
        )}
      </div>
    </div>
  );
}
