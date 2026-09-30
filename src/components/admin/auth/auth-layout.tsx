import { Activity, Check, Lock, ScrollText, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Logo3D } from "./logo-3d";

export function AuthLogo({ inverted, withWordmark }: { inverted?: boolean; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-transparent">
        <Image
          src="/logo.svg"
          alt="VitaMind"
          width={44}
          height={44}
          className="h-11 w-11 bg-transparent object-contain"
          priority
        />
      </span>
      {withWordmark && (
        <span className="leading-tight">
          <span
            className={`block text-[15px] font-semibold tracking-tight ${inverted ? "text-auth-panel-foreground" : "text-foreground"}`}
          >
            VitaMind
          </span>
          <span className={`block text-[11px] font-medium ${inverted ? "text-auth-panel-muted" : "text-muted-foreground"}`}>
            Clinical platform
          </span>
        </span>
      )}
    </div>
  );
}

const FEATURES = [
  { icon: Lock, title: "Role-scoped access", text: "Every module and action is gated by your admin role." },
  { icon: ScrollText, title: "Full audit trail", text: "Changes and sensitive views are written to the audit log." },
  { icon: ShieldCheck, title: "Privacy by design", text: "Clinical content stays with clinicians — the console shows metadata only." },
] as const;

/** Left-hand brand panel of the sign-in screen (desktop only). Always dark, in both themes. */
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-auth-panel via-auth-panel to-auth-panel-2 text-auth-panel-foreground lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--auth-panel-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-panel-line)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-24 top-1/3 size-[420px] rounded-full bg-primary/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-[360px] rounded-full bg-brand-gold/10 blur-3xl" aria-hidden />

      <div className="relative">
        <AuthLogo inverted withWordmark />
      </div>

      <div className="relative flex flex-1 items-center justify-center py-6">
        <Logo3D size={300} />
      </div>

      <div className="relative max-w-md space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-auth-panel-muted backdrop-blur">
            <Activity className="size-3.5 text-brand-gold" aria-hidden />
            Clinical operations back office
          </span>
          <h2 className="text-[32px] font-semibold leading-[1.15] tracking-tight">
            Patient safety signals,
            <br />
            <span className="bg-gradient-to-r from-white to-auth-panel-muted bg-clip-text text-transparent">handled with care.</span>
          </h2>
          <p className="text-[15px] leading-relaxed text-auth-panel-muted">
            Monitor crises, clinical alerts, diagnostics and platform health from one restricted, audited workspace.
          </p>
        </div>
        <ul className="space-y-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.07] ring-1 ring-inset ring-white/10">
                <f.icon className="size-4 text-auth-panel-foreground" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium">{f.title}</span>
                <span className="block text-[13px] text-auth-panel-muted">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center justify-between gap-4 text-xs text-auth-panel-muted">
        <span>Restricted system · authorised staff only</span>
        <span className="flex gap-1.5">
          {["RGPD", "2FA", "Audit"].map((chip) => (
            <span key={chip} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-medium">
              {chip}
            </span>
          ))}
        </span>
      </div>
    </aside>
  );
}

/** Two-step progress for credentials → second factor. */
export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-2 text-xs" aria-label={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={cn("flex items-center gap-2", i > 0 && "flex-1 min-w-0")}>
            {i > 0 && <span className={cn("h-px min-w-3 flex-1", done || active ? "bg-primary" : "bg-border")} aria-hidden />}
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full text-[10px] font-semibold",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary-soft text-primary ring-1 ring-primary/40",
                !done && !active && "bg-muted text-subtle-foreground",
              )}
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("whitespace-nowrap", active ? "font-medium text-foreground" : "sr-only")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
