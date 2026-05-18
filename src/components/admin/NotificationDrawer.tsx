"use client";

import { X, Bell, CreditCard, FileCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDate, cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/types/enums";

const typeIcons: Record<string, typeof Bell> = {
  payment: CreditCard,
  test_completed: FileCheck,
  risk_alert: AlertTriangle,
  crisis: AlertCircle,
  system: Bell,
};

interface NotificationDrawerProps {
  onClose: () => void;
}

export function NotificationDrawer({ onClose }: NotificationDrawerProps) {
  const { data, loading } = useNotifications();
  const notifications = data?.data ?? [];
  const unread = notifications.filter((n) => !n.read);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/10"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-black" />
            <h2 className="text-sm font-semibold text-black">Notifications</h2>
            {unread.length > 0 && (
              <span className="rounded-full bg-black px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unread.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-black"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-start gap-3 border-b border-gray-100 px-5 py-3.5">
                  <div className="h-7 w-7 rounded-lg bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-36 rounded bg-gray-100" />
                    <div className="mt-1 h-3 w-56 rounded bg-gray-50" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Bell className="mb-2 h-8 w-8" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 border-b border-gray-100 px-5 py-3.5 transition hover:bg-gray-50",
                    !n.read && "bg-gray-50"
                  )}
                >
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white">
                    <Icon className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-black">{n.title}</p>
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </>
  );
}
