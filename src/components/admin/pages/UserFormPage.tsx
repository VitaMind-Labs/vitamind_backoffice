"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/use-users";
import { updateUser } from "@/actions/users";

export function UserFormPage() {
  const sp = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const isEdit = sp.get("action") === "edit";
  const id = sp.get("id") || "";

  const { data: user, loading } = useUser(isEdit ? id : "");

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useState(() => {
    if (user) {
      setNickname(user.nickname);
      setEmail(user.email);
    }
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isEdit && id) {
      startTransition(async () => {
        try {
          await updateUser(id, { nickname, email });
          router.push(`/${sessionId}?page=users`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to update user");
        }
      });
    } else {
      router.push(`/${sessionId}?page=users`);
    }
  }

  if (isEdit && loading) return <div className="py-16 text-center text-sm text-gray-400">Loading...</div>;
  if (isEdit && !user && !loading) return <div className="py-16 text-center text-sm text-gray-400">User not found.</div>;

  return (
    <div className="max-w-xl">
      <button onClick={() => router.push(`/${sessionId}?page=users`)} className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>
      <h1 className="text-xl font-bold text-black">{isEdit ? "Edit User" : "Add User"}</h1>
      <p className="mt-1 text-sm text-gray-500">{isEdit ? "Update user information." : "Users are created through the frontend application."}</p>

      {!isEdit && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">New users register through the VitaMind frontend application.</p>
          <button onClick={() => router.push(`/${sessionId}?page=users`)} className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800">
            Back to Users
          </button>
        </div>
      )}

      {isEdit && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">Nickname</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Enter nickname"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={isPending}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50">
              {isPending ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.push(`/${sessionId}?page=users`)}
              className="cursor-pointer rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
