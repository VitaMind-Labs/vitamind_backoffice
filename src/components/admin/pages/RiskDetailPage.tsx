"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Calendar, User, ShieldAlert } from "lucide-react";
import { useRiskDetections } from "@/hooks/use-risks";
import { formatDate } from "@/lib/utils";

export function RiskDetailPage() {
  const sp = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const id = sp.get("id") || "";

  const { data, loading, error } = useRiskDetections(1, 100);
  const risk = data?.data?.find((r) => r.id === id);

  if (loading) return <div className="py-16 text-center text-sm text-gray-400"><div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black" /> Loading...</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!risk) return <div className="py-16 text-center text-sm text-gray-400">Risk detection not found.</div>;

  const isUrgent = risk.risk_level === "critical" || risk.risk_level === "high";

  return (
    <div>
      <button onClick={() => router.push(`/${sessionId}?page=risks`)} className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Back to Risk Detection
      </button>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 place-items-center rounded-xl ${isUrgent ? "bg-red-50" : "bg-gray-50"}`}>
            {isUrgent ? <AlertTriangle className="h-6 w-6 text-red-500" /> : <ShieldAlert className="h-6 w-6 text-gray-500" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-black">{risk.user?.nickname ?? "Unknown"}</h1>
              <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${risk.risk_level === "critical" ? "bg-red-50 text-red-700" : risk.risk_level === "high" ? "bg-gray-100 text-black" : "bg-gray-50 text-gray-600"}`}>{risk.risk_level}</span>
              {isUrgent && !risk.acknowledged && <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">URGENT</span>}
            </div>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-500"><User className="h-4 w-4" /> {risk.user?.nickname ?? "—"}</div>
              <div className="flex items-center gap-1 text-sm text-gray-500"><Calendar className="h-4 w-4" /> {formatDate(risk.created_at)}</div>
              <div className="text-sm text-gray-500">Score: <span className="font-bold text-black">{risk.score}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-black">Risk Indicators</h2>
          {risk.indicators && risk.indicators.length > 0 ? (
            <ul className="space-y-2">
              {risk.indicators.map((i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />{i}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No indicators recorded.</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-black">Recommendations</h2>
          {risk.recommendations && risk.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {risk.recommendations.map((r) => (
                <li key={r} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-black" />{r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No recommendations available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
