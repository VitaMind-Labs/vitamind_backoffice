"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Download, KeyRound, ScanLine, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi, AuthError } from "@/lib/api/auth";
import type { AdminPrincipal, TwoFactorEnrollment } from "@/types/admin";
import { CopyableId } from "@/components/admin/shared/detail";
import { OtpField } from "./otp-field";
import { StepIndicator } from "./auth-layout";

/**
 * TOTP enrolment wizard: POST /auth/admin/2fa/enable (QR + secret), then
 * /auth/admin/2fa/confirm with a code. The backend issues single-use
 * recovery codes exactly once with the confirm response — they must be
 * saved before the wizard can be closed.
 */
export function TwoFactorSetup({
  onComplete,
  onCancel,
}: {
  onComplete: (user: AdminPrincipal | null) => void;
  onCancel?: () => void;
}) {
  const [wizardStep, setWizardStep] = useState(0);
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [confirmedUser, setConfirmedUser] = useState<AdminPrincipal | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .enable2fa()
      .then((data) => !cancelled && setEnrollment(data))
      .catch((e: AuthError) => !cancelled && setLoadError(e.message));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const confirm = async (token: string) => {
    if (token.length !== 6 || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await authApi.confirm2fa(token);
      if (result.status !== "authenticated") {
        onComplete(null);
        return;
      }
      setConfirmedUser(result.user);
      setBackupCodes(result.backup_codes ?? []);
      setWizardStep(2);
      toast.success("Authenticator verified — save your recovery codes to finish.");
    } catch (e) {
      setError((e as AuthError).message);
      setCode("");
    } finally {
      setPending(false);
    }
  };

  const copyAll = async () => {
    if (!backupCodes?.length) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      toast.error("Could not copy — select the codes manually.");
    }
  };

  const download = () => {
    if (!backupCodes?.length) return;
    const body = [
      "VitaMind back office — two-factor recovery codes",
      "Each code works once, in place of the authenticator code. Store them somewhere safe.",
      "",
      ...backupCodes,
      "",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vitamind-recovery-codes.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive-border bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {loadError}
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Back
            </Button>
          )}
          <Button
            onClick={() => {
              setLoadError(null);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StepIndicator current={wizardStep} steps={["Scan QR", "Verify code", "Save backup codes"]} />

      {wizardStep === 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ScanLine className="size-4 text-primary" aria-hidden />
              Scan this QR code with your authenticator app
            </p>
            <p className="text-[13px] text-muted-foreground">Google Authenticator, 1Password, Apple Passwords — any TOTP app works.</p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-start">
            {enrollment ? (
              // Data URL generated by the backend (qrcode.toDataURL); not a remote image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={enrollment.qr_code} alt="Two-factor authentication QR code" className="size-36 shrink-0 rounded-md border bg-white p-1.5" />
            ) : (
              <Skeleton className="size-36 shrink-0" />
            )}
            <div className="min-w-0 space-y-1.5 text-center sm:text-left">
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start">
                <KeyRound className="size-3.5" /> Or enter this key manually
              </p>
              {enrollment ? <CopyableId value={enrollment.secret} /> : <Skeleton className="h-4 w-40" />}
            </div>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={() => setWizardStep(1)} disabled={!enrollment} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {wizardStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Smartphone className="size-4 text-primary" aria-hidden />
              Enter the 6-digit code your app shows
            </p>
            <p className="text-[13px] text-muted-foreground">Codes rotate every 30 seconds — any current code works.</p>
          </div>
          <OtpField value={code} onChange={setCode} onComplete={confirm} disabled={!enrollment || pending} />
          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setWizardStep(0)} disabled={pending} className="flex-1">
              Back
            </Button>
            <Button onClick={() => confirm(code)} loading={pending} disabled={code.length !== 6 || !enrollment} className="flex-1">
              Verify and continue
            </Button>
          </div>
        </div>
      )}

      {wizardStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Save your recovery codes
            </p>
            <p className="text-[13px] text-muted-foreground">
              Each code signs you in once if you lose your authenticator. They are shown <strong>only now</strong> —
              we store hashes, never the codes themselves.
            </p>
          </div>
          <ol className="grid grid-cols-2 gap-2" aria-label="Recovery codes">
            {(backupCodes ?? []).map((c) => (
              <li
                key={c}
                className="rounded-lg border bg-muted/40 px-3 py-2 text-center font-mono text-[13px] font-medium tracking-wider text-foreground"
              >
                {c}
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyAll} disabled={!backupCodes?.length} className="flex-1">
              {copiedAll ? <Check className="text-success" /> : <Copy />}
              {copiedAll ? "Copied!" : "Copy all"}
            </Button>
            <Button variant="outline" onClick={download} disabled={!backupCodes?.length} className="flex-1">
              <Download />
              Download (.txt)
            </Button>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] text-muted-foreground transition-colors has-checked:border-primary/40 has-checked:bg-primary-soft/50 has-checked:text-foreground">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
            />
            <span>I stored these codes somewhere safe. I understand they will never be shown again.</span>
          </label>
          <Button onClick={() => onComplete(confirmedUser)} disabled={!acknowledged} className="w-full">
            Done — finish setup
          </Button>
        </div>
      )}
    </div>
  );
}
