"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldAlert, AlertTriangle, Eye, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRiskDetections } from "@/hooks/use-risks";
import { acknowledgeRiskDetection } from "@/actions/risks";
import { formatDate } from "@/lib/utils";

export function RisksPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [filter, setFilter] = useState("all");
  const [ackIds, setAckIds] = useState<Set<string>>(new Set());

  const { data, loading, error, refetch } = useRiskDetections();
  const risks = data?.data ?? [];

  const filtered = filter === "all" ? risks : risks.filter((r) => r.risk_level === filter);

  async function handleAcknowledge(id: string) {
    try {
      await acknowledgeRiskDetection(id);
      setAckIds((prev) => new Set(prev).add(id));
      refetch();
    } catch {
      // silently handle
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Risk Detection</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor risk levels from user responses.</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["all", "critical", "high", "moderate", "low"].map((level) => (
          <button key={level} onClick={() => setFilter(level)}
            className={filter === level ? "rounded-lg bg-black px-3.5 py-1.5 text-xs font-semibold text-white" : "rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"}>
            {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="mt-1 h-3 w-48 rounded bg-gray-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <ShieldAlert className="mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No risks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((risk, index) => {
            const isAcknowledged = risk.acknowledged || ackIds.has(risk.id);
            const isUrgent = risk.risk_level === "critical" || risk.risk_level === "high";

            return (
              <motion.div key={risk.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${isUrgent ? "bg-red-50" : "bg-gray-50"}`}>
                      {isUrgent ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <ShieldAlert className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-black">{risk.user?.nickname ?? "—"}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${risk.risk_level === "critical" ? "bg-red-50 text-red-700" : risk.risk_level === "high" ? "bg-gray-100 text-black" : "bg-gray-50 text-gray-600"}`}>{risk.risk_level}</span>
                        {isUrgent && !isAcknowledged && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">Urgent</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">Score: {risk.score} &middot; {formatDate(risk.created_at)}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {risk.indicators?.map((ind) => <span key={ind} className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">{ind}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/${sessionId}?page=risks&action=view&id=${risk.id}`}
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
                      <Eye className="mr-1 inline h-3 w-3" />Details
                    </Link>
                    {!isAcknowledged && (
                      <button onClick={() => handleAcknowledge(risk.id)}
                        className="rounded-lg bg-black px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800">
                        <CheckCircle2 className="mr-1 inline h-3 w-3" />Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
