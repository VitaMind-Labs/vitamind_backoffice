"use client";

import { useState } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRiskDetections } from "@/hooks/use-risks";
import { acknowledgeRiskDetection } from "@/actions/risks";
import { formatDate } from "@/lib/utils";

export function DangerAlert() {
  const { data, loading, refetch } = useRiskDetections(1, 50);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const risks = data?.data ?? [];
  const urgentRisks = risks.filter(
    (r) => (r.risk_level === "critical" || r.risk_level === "high") && !r.acknowledged,
  );
  const visibleRisks = urgentRisks.filter((r) => !dismissed.includes(r.id));
  const selectedRiskData = risks.find((r) => r.id === selectedRisk);

  async function handleAcknowledge(id: string) {
    try {
      await acknowledgeRiskDetection(id);
      refetch();
      setShowPopup(false);
    } catch {
      // silently handle
    }
  }

  if (loading || visibleRisks.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        {visibleRisks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-red-200 bg-red-50"
          >
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">
                      {visibleRisks.length} urgent risk{visibleRisks.length > 1 ? "s" : ""} detected
                    </h3>
                    <p className="mt-0.5 text-sm text-red-600">Immediate attention required.</p>
                  </div>
                  <button
                    onClick={() => setDismissed(visibleRisks.map((r) => r.id))}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded text-red-400 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {visibleRisks.map((risk) => (
                    <div key={risk.id} className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-white px-3.5 py-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">Critical</span>
                          <span className="text-sm font-medium text-gray-900">{risk.user?.nickname ?? "Unknown"}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">Score: {risk.score} &middot; {formatDate(risk.created_at)}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedRisk(risk.id); setShowPopup(true); }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && selectedRiskData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="fixed inset-0 z-50 bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Urgent Risk Alert</h3>
                    <p className="text-sm text-gray-500">{selectedRiskData.user?.nickname ?? "Unknown"}</p>
                  </div>
                </div>
                <button onClick={() => setShowPopup(false)} className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-black">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex gap-3">
                <div className="rounded-lg bg-gray-50 px-3 py-1.5">
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <p className="text-sm font-bold text-red-600 uppercase">{selectedRiskData.risk_level}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-1.5">
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-sm font-bold text-black">{selectedRiskData.score}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-sm font-medium text-gray-900">Indicators</p>
                <ul className="space-y-1">
                  {selectedRiskData.indicators?.map((i) => (
                    <li key={i} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700">
                      <AlertTriangle className="h-3 w-3 shrink-0" />{i}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-sm font-medium text-gray-900">Recommendations</p>
                <ul className="space-y-1">
                  {selectedRiskData.recommendations?.map((r) => (
                    <li key={r} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-black" />{r}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleAcknowledge(selectedRiskData.id)}
                className="mt-5 w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Acknowledge
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
