"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function NotificationFormPage() {
  const sp = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const isEdit = sp.get("action") === "edit";

  return (
    <div className="max-w-xl">
      <button onClick={() => router.push(`/${sessionId}?page=notifications`)} className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Back to Notifications
      </button>
      <h1 className="text-xl font-bold text-black">{isEdit ? "Edit Notification" : "New Notification"}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Notifications are generated automatically by the system.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">This action is not available from the admin panel.</p>
        <button onClick={() => router.push(`/${sessionId}?page=notifications`)} className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800">
          Back to Notifications
        </button>
      </div>
    </div>
  );
}
