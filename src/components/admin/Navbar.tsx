"use client";

import { useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { NotificationDrawer } from "./NotificationDrawer";
import { useNotifications } from "@/hooks/use-notifications";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useNotifications({ read: "false", limit: 1 });
  const unreadCount = data?.total ?? 0;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-black lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="relative w-64 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-black outline-none transition focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[8px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1">
            <div className="grid h-6 w-6 place-items-center rounded bg-black text-[10px] font-bold text-white">
              A
            </div>
            <span className="hidden text-sm font-medium text-black sm:block">Admin</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showNotifications && <NotificationDrawer onClose={() => setShowNotifications(false)} />}
      </AnimatePresence>
    </>
  );
}