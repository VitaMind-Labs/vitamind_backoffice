"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, AuthError } from "@/lib/api/auth";
import { SESSION_EXPIRED_EVENT, SIGNIN_PATH } from "@/lib/auth/constants";
import { can as canRole, type Permission } from "@/lib/permissions";
import type { AdminProfile } from "@/types/admin";

interface AdminSessionValue {
  admin: AdminProfile;
  can: (permission: Permission) => boolean;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function useAdminSession(): AdminSessionValue {
  const value = useContext(AdminSessionContext);
  if (!value) throw new Error("useAdminSession must be used inside <AdminSessionProvider>");
  return value;
}

export function usePermission(permission: Permission): boolean {
  return useAdminSession().can(permission);
}

type State = { status: "loading" } | { status: "ready"; admin: AdminProfile } | { status: "error"; message: string };

export function AdminSessionProvider({
  children,
  fallback,
  renderError,
}: {
  children: ReactNode;
  fallback: ReactNode;
  renderError: (message: string, retry: () => void) => ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  const redirectToSignIn = useCallback(
    (reason?: string) => {
      const params = new URLSearchParams();
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (window.location.pathname !== "/admin") params.set("next", currentPath);
      if (reason) params.set("reason", reason);
      const qs = params.toString();
      router.replace(`${SIGNIN_PATH}${qs ? `?${qs}` : ""}`);
    },
    [router],
  );

  const load = useCallback(async () => {
    try {
      const admin = await authApi.me();
      setState({ status: "ready", admin });
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        redirectToSignIn("expired");
        return;
      }
      setState({ status: "error", message: (error as Error).message });
    }
  }, [redirectToSignIn]);

  useEffect(() => {
    void load();
    // Load once per mount; navigation inside the shell keeps the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onExpired = () => redirectToSignIn("expired");
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [redirectToSignIn]);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      router.replace(`${SIGNIN_PATH}?reason=signed_out`);
    }
  }, [router]);

  const value = useMemo<AdminSessionValue | null>(() => {
    if (state.status !== "ready") return null;
    return {
      admin: state.admin,
      can: (permission) => canRole(state.admin.role, permission),
      signOut,
      reload: load,
    };
  }, [state, signOut, load]);

  if (state.status === "error") return <>{renderError(state.message, () => void load())}</>;
  if (!value) return <>{fallback}</>;
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}
