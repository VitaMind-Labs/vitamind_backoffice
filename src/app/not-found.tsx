"use client";

import Link from "next/link";
import Image from "next/image";
import { Activity, ArrowLeft, LayoutDashboard, Lock, ScrollText, ShieldCheck } from "lucide-react";

function PulseLine() {
  return (
    <svg
      viewBox="0 0 320 48"
      fill="none"
      aria-hidden
      className="mx-auto h-12 w-full max-w-[320px] text-primary"
    >
      <path
        d="M0 24h112l10-14 12 28 10-20 6 6h34l10-14 12 28 10-20 6 6H320"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-lg space-y-8 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Activity className="size-3.5 text-primary" aria-hidden />
          Clinical platform · Audited workspace
        </p>

        {/* Brand focal point — larger than the 44px header mark */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border bg-card/80 shadow-lg backdrop-blur-md">
          <Image
            src="/logo.svg"
            alt="SynQ"
            width={72}
            height={72}
            className="h-[72px] w-[72px] bg-transparent object-contain"
            priority
          />
        </div>

        <PulseLine />

        <div className="space-y-2">
          <p className="text-7xl font-bold tabular-nums tracking-tight text-foreground">404</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">No record of this page</h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
            The page you are looking for does not exist or was moved. Your workspace and clinical data are
            unaffected.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/admin/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover"
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Return to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-card px-5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Go to home
          </Link>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-subtle-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3" aria-hidden /> Encrypted session
          </span>
          <span className="flex items-center gap-1.5">
            <ScrollText className="size-3" aria-hidden /> Every access is audited
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3" aria-hidden /> Restricted system
          </span>
        </footer>
      </div>
    </div>
  );
}
