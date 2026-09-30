"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Info, KeyRound, Lock, ScrollText, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { authApi, AuthError } from "@/lib/api/auth";
import { homePathFor } from "@/lib/permissions";
import type { AdminPrincipal } from "@/types/admin";
import { OtpField } from "./otp-field";
import { TwoFactorSetup } from "./two-factor-setup";
import { AuthBrandPanel, AuthLogo, StepIndicator } from "./auth-layout";
import { Logo3D } from "./logo-3d";

type Step = "credentials" | "verify" | "setup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RECOVERY_RE = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/** Normalises a recovery code as XXXX-XXXX while typing. */
function formatRecoveryCode(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

const REASON_MESSAGES: Record<string, { tone: "info" | "warning"; text: string }> = {
  expired: { tone: "warning", text: "Your session expired. Please sign in again." },
  signed_out: { tone: "info", text: "You have been signed out." },
};

function safeNext(next: string | null): string | null {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : null;
}

function Alert({ tone, children }: { tone: "error" | "warning" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-destructive-border bg-destructive-soft text-destructive",
    warning: "border-warning-border bg-warning-soft text-warning",
    info: "border-info-border bg-info-soft text-info",
  }[tone];
  const Icon = tone === "info" ? Info : AlertCircle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] ${styles}`}>
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function SignInFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const reason = REASON_MESSAGES[params.get("reason") ?? ""];
  const next = safeNext(params.get("next"));

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [code, setCode] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");

  const finish = (user: AdminPrincipal | null) => {
    router.replace(next ?? (user ? homePathFor(user.role) : "/admin"));
  };

  const submitCredentials = async (e: FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setPending(true);
    setError(null);
    try {
      const result = await authApi.login(email.trim(), password);
      setPassword("");
      if (result.status === "authenticated") finish(result.user);
      else setStep(result.status === "requires_2fa" ? "verify" : "setup");
    } catch (err) {
      setError((err as AuthError).message);
    } finally {
      setPending(false);
    }
  };

  const verify = async (token: string) => {
    const normalized = token.trim().toUpperCase();
    const valid = /^\d{6}$/.test(normalized) || RECOVERY_RE.test(normalized);
    if (!valid || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await authApi.verify2fa(token);
      finish(result.status === "authenticated" ? result.user : null);
    } catch (err) {
      const authError = err as AuthError;
      setCode("");
      if (authError.status === 401 && /expired|sign in again/i.test(authError.message)) {
        setStep("credentials");
      }
      setError(authError.message);
    } finally {
      setPending(false);
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setCode("");
    setRecoveryInput("");
    setUseRecoveryCode(false);
    setError(null);
  };

  const stepIndex = step === "credentials" ? 0 : 1;

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)]">
      <AuthBrandPanel />

      <main className="relative flex flex-col px-4 py-6 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative flex items-center justify-between">
          <div className="lg:invisible">
            <AuthLogo />
          </div>
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] space-y-6 rounded-2xl border bg-card/85 p-6 shadow-lg backdrop-blur-md sm:p-8">
            <div className="-mt-2 lg:hidden">
              <Logo3D size={112} />
            </div>
            <StepIndicator current={stepIndex} steps={["Credentials", step === "setup" ? "Enrol 2FA" : "Verification"]} />

            {step === "credentials" && (
              <>
                <div className="space-y-2.5">
                  <p className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Back office · Restricted access
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                  <p className="text-sm text-muted-foreground">Sign in with your VitaMind admin account.</p>
                </div>
                {reason && !error && <Alert tone={reason.tone}>{reason.text}</Alert>}
                {error && <Alert tone="error">{error}</Alert>}
                <form onSubmit={submitCredentials} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      autoFocus
                      placeholder="name@vitamind.health"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={!!fieldErrors.email || undefined}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      disabled={pending}
                      className="h-11"
                    />
                    {fieldErrors.email && (
                      <p id="email-error" className="text-xs text-destructive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                        onBlur={() => setCapsLock(false)}
                        aria-invalid={!!fieldErrors.password || undefined}
                        aria-describedby={
                          [fieldErrors.password ? "password-error" : "", capsLock ? "caps-warning" : ""].filter(Boolean).join(" ") || undefined
                        }
                        disabled={pending}
                        className="h-11 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {capsLock && (
                      <p id="caps-warning" className="flex items-center gap-1.5 text-xs text-warning">
                        <TriangleAlert className="size-3.5" aria-hidden /> Caps Lock is on
                      </p>
                    )}
                    {fieldErrors.password && (
                      <p id="password-error" className="text-xs text-destructive">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="group h-11 w-full text-[15px]" loading={pending}>
                    Continue
                    {!pending && <ArrowRight className="transition-transform group-hover:translate-x-0.5" />}
                  </Button>
                </form>
                <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                  <KeyRound className="mt-px size-3.5 shrink-0" aria-hidden />
                  Admin accounts are provisioned by a super admin. Contact them if you can’t sign in.
                </p>
              </>
            )}

            {step === "verify" && (
              <>
                <div className="space-y-1.5">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary ring-1 ring-inset ring-primary/15">
                    <Smartphone className="size-5" aria-hidden />
                  </span>
                  <h1 className="pt-3 text-2xl font-semibold tracking-tight">Two-factor verification</h1>
                  <p className="text-sm text-muted-foreground">
                    {useRecoveryCode
                      ? "Enter one of the recovery codes saved at setup. Each code works once."
                      : "Enter the 6-digit code from your authenticator app."}
                  </p>
                </div>
                {error && <Alert tone="error">{error}</Alert>}
                {useRecoveryCode ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="recovery-code">Recovery code</Label>
                    <Input
                      id="recovery-code"
                      autoFocus
                      autoComplete="one-time-code"
                      placeholder="XXXX-XXXX"
                      value={recoveryInput}
                      onChange={(e) => setRecoveryInput(formatRecoveryCode(e.target.value))}
                      disabled={pending}
                      className="h-11 text-center font-mono text-[15px] tracking-[0.2em]"
                    />
                  </div>
                ) : (
                  <OtpField value={code} onChange={setCode} onComplete={verify} disabled={pending} />
                )}
                <div className="space-y-2">
                  <Button
                    className="h-11 w-full"
                    onClick={() => verify(useRecoveryCode ? recoveryInput : code)}
                    loading={pending}
                    disabled={useRecoveryCode ? !RECOVERY_RE.test(recoveryInput) : code.length !== 6}
                  >
                    Verify and continue
                  </Button>
                  <Button
                    variant="link"
                    className="h-auto w-full py-1 text-[13px]"
                    onClick={() => {
                      setUseRecoveryCode((v) => !v);
                      setError(null);
                    }}
                    disabled={pending}
                  >
                    {useRecoveryCode ? "Use the authenticator code instead" : "Lost your authenticator? Use a recovery code"}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={backToCredentials} disabled={pending}>
                    <ArrowLeft /> Use a different account
                  </Button>
                </div>
              </>
            )}

            {step === "setup" && (
              <>
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight">Set up two-factor authentication</h1>
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication is required for admin accounts. Enrol an authenticator app to continue.
                  </p>
                </div>
                <TwoFactorSetup onComplete={finish} onCancel={backToCredentials} />
              </>
            )}
          </div>
        </div>

        <footer className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-subtle-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3" aria-hidden /> Encrypted session · httpOnly cookie
          </span>
          <span className="flex items-center gap-1.5">
            <ScrollText className="size-3" aria-hidden /> Every sign-in is audited
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3" aria-hidden /> 2FA enforced
          </span>
        </footer>
      </main>
    </div>
  );
}
