import type { Metadata } from "next";
import { ResetPasswordFlow } from "@/components/admin/auth/password-reset-flow";
import { callPasswordReset } from "@/lib/auth/password-reset.server";

export const metadata: Metadata = {
  title: "Reset password · SynQ Admin",
  robots: { index: false, follow: false },
  // The link carries a one-time secret: it must never leave in a Referer header.
  referrer: "no-referrer",
};

/** Signed out on purpose: no session, no refresh. The link is checked once, on the server, before anything renders. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw) ? raw : null;
  const usable = token ? (await callPasswordReset("verify-reset-token", { token })).code === "ok" : false;
  return <ResetPasswordFlow token={usable ? token : null} />;
}
