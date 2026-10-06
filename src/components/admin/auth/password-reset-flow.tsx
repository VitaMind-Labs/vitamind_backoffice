"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, MailCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { authApi, AuthError } from "@/lib/api/auth";
import { AuthLogo } from "./auth-layout";

/** Mirrors the backend rule (8 characters minimum; bcrypt reads at most 72 bytes). The backend stays authoritative. */
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_AFTER_SECONDS = 60;

/** The message shown whatever the account state is. */
export const FORGOT_PASSWORD_NOTICE = "If an account exists for this email, you will receive a password reset link.";

export function passwordProblem(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return "That password is too long.";
  if (password !== confirmation) return "The two passwords do not match.";
  return null;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--glow),transparent_70%)]" aria-hidden />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px] space-y-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AuthLogo />
            <span className="text-sm font-semibold tracking-tight text-foreground">VitaMind Admin</span>
          </div>
          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-subtle-foreground">
            <Lock className="size-3" aria-hidden /> Secure, audited access
          </p>
        </div>
      </main>
    </div>
  );
}

function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive-border bg-destructive-soft px-3 py-2.5 text-[13px] text-destructive">
      <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function Heading({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      {icon}
      <h1 className={icon ? "pt-3 text-2xl font-semibold tracking-tight" : "text-xl font-semibold tracking-tight"}>{title}</h1>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

const IconBadge = ({ children }: { children: ReactNode }) => (
  <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary ring-1 ring-inset ring-primary/15">{children}</span>
);

export function ForgotPasswordFlow() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const send = async (address: string) => {
    setPending(true);
    setError(null);
    try {
      await authApi.forgotPassword(address);
      setSentTo(address);
      setWait(RESEND_AFTER_SECONDS);
    } catch (err) {
      setError((err as AuthError).message);
    } finally {
      setPending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL_RE.test(address)) return setFieldError("Enter a valid email address.");
    setFieldError(null);
    void send(address);
  };

  return (
    <Shell>
      {sentTo ? (
        <>
          <Heading
            icon={
              <IconBadge>
                <MailCheck className="size-5" aria-hidden />
              </IconBadge>
            }
            title="Check your email"
          >
            <span role="status">{FORGOT_PASSWORD_NOTICE} The link works once and expires soon.</span>
          </Heading>
          {error && <ErrorAlert>{error}</ErrorAlert>}
          <div className="space-y-2">
            <Button variant="outline" className="w-full" disabled={wait > 0} loading={pending} onClick={() => void send(sentTo)}>
              {wait > 0 ? `Send again in ${wait}s` : "Send the email again"}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/auth/admin/signin">
                <ArrowLeft /> Back to sign in
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <Heading title="Forgot your password?">Enter your admin email and we will send you a link to choose a new one.</Heading>
          {error && <ErrorAlert>{error}</ErrorAlert>}
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="name@vitamind.health"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldError || undefined}
                aria-describedby={fieldError ? "email-error" : undefined}
                disabled={pending}
                className="h-11"
              />
              {fieldError && (
                <p id="email-error" className="text-xs text-destructive">
                  {fieldError}
                </p>
              )}
            </div>
            <Button type="submit" className="group h-11 w-full text-[15px]" loading={pending}>
              Send reset link
              {!pending && <ArrowRight className="transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/auth/admin/signin">
              <ArrowLeft /> Back to sign in
            </Link>
          </Button>
        </>
      )}
    </Shell>
  );
}

function PasswordInput({ id, label, value, onChange, disabled, error }: { id: string; label: string; value: string; onChange: (value: string) => void; disabled: boolean; error?: string | null }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          className="h-11 pr-11"
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * `token` is null when the server already found the link unusable (missing, malformed, expired, used).
 * The token travelled in the URL once; it is removed from the address bar so it is not kept in history.
 */
export function ResetPasswordFlow({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unusable, setUnusable] = useState(token === null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const problem = passwordProblem(password, confirmation);
    setFieldError(problem);
    if (problem) return;
    setPending(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password, confirmation);
      setPassword("");
      setConfirmation("");
      setDone(true);
    } catch (err) {
      const failure = err as AuthError;
      if (failure.code === "invalid_link") setUnusable(true);
      else setError(failure.message);
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <Shell>
        <Heading
          icon={
            <IconBadge>
              <CheckCircle2 className="size-5" aria-hidden />
            </IconBadge>
          }
          title="Password changed"
        >
          <span role="status">Your password was updated and every session was signed out. Sign in with your new password.</span>
        </Heading>
        <Button asChild className="h-11 w-full text-[15px]">
          <Link href="/auth/admin/signin">Go to sign in</Link>
        </Button>
      </Shell>
    );
  }

  if (unusable) {
    return (
      <Shell>
        <Heading
          icon={
            <span className="grid size-11 place-items-center rounded-xl bg-warning-soft text-warning ring-1 ring-inset ring-warning-border">
              <TriangleAlert className="size-5" aria-hidden />
            </span>
          }
          title="This link no longer works"
        >
          <span role="alert">The reset link is invalid, was already used, or has expired. Request a new one to continue.</span>
        </Heading>
        <Button asChild className="h-11 w-full text-[15px]">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/auth/admin/signin">Back to sign in</Link>
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <Heading title="Choose a new password">Use at least {PASSWORD_MIN} characters. Every session will be signed out.</Heading>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <PasswordInput id="new-password" label="New password" value={password} onChange={setPassword} disabled={pending} error={fieldError && !/match/.test(fieldError) ? fieldError : null} />
        <PasswordInput id="confirm-password" label="Confirm new password" value={confirmation} onChange={setConfirmation} disabled={pending} error={fieldError && /match/.test(fieldError) ? fieldError : null} />
        <Button type="submit" className="group h-11 w-full text-[15px]" loading={pending}>
          Change password
          {!pending && <ArrowRight className="transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </form>
    </Shell>
  );
}
