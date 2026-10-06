"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { usersApi, type UserUpdateInput } from "@/lib/api/users";
import { LANGUAGE_LABELS, USER_STATUS_META } from "@/lib/constants/status";
import { LANGUAGES, USER_STATUSES, type AdminUser, type Language, type UserStatus } from "@/types/admin";

const REASON_MAX = 300;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ReasonField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Field
      label="Reason"
      htmlFor="reason"
      hint={`Required · recorded in the audit log · ${value.length}/${REASON_MAX}`}
      error={value.length > REASON_MAX ? `Maximum ${REASON_MAX} characters.` : null}
    >
      <Textarea id="reason" rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </Field>
  );
}

/** PATCH /users/:id/status — ADMIN, SUPPORT. */
export function UserStatusDialog({
  user,
  open,
  onOpenChange,
}: {
  user: Pick<AdminUser, "id" | "status" | "patientNumber">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [reason, setReason] = useState("");
  const mutation = useApiMutation((input: { status: UserStatus; reason: string }) => usersApi.updateStatus(user.id, input), {
    invalidate: ["users"],
    successMessage: (_r, v) => `Account status set to ${USER_STATUS_META[v.status].label.toLowerCase()}`,
    onSuccess: () => {
      setReason("");
      onOpenChange(false);
    },
  });
  const valid = status !== user.status && reason.trim().length > 0 && reason.length <= REASON_MAX;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Change account status"
      description={`VM-${user.patientNumber} is currently ${USER_STATUS_META[user.status].label.toLowerCase()}. Blocking or suspending prevents the patient from signing in.`}
      submitLabel="Update status"
      isPending={mutation.isPending}
      canSubmit={valid}
      onSubmit={() => void mutation.mutate({ status, reason: reason.trim() })}
    >
      <Field label="New status" htmlFor="status">
        <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {USER_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <ReasonField value={reason} onChange={setReason} placeholder="e.g. Patient requested a temporary suspension by email" />
    </FormDialog>
  );
}

/** PATCH /users/:id — ADMIN. Only nickname, email, language (status has its own audited flow). */
export function UserEditDialog({
  user,
  open,
  onOpenChange,
}: {
  user: Pick<AdminUser, "id" | "nickname" | "email" | "language" | "patientNumber">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [nickname, setNickname] = useState(user.nickname);
  const [email, setEmail] = useState(user.email);
  const [language, setLanguage] = useState<Language>(user.language);
  const mutation = useApiMutation((input: UserUpdateInput) => usersApi.update(user.id, input), {
    invalidate: ["users"],
    successMessage: "Account details updated",
    onSuccess: () => onOpenChange(false),
  });

  const changes: UserUpdateInput = {};
  if (nickname.trim() !== user.nickname) changes.nickname = nickname.trim();
  if (email.trim() !== user.email) changes.email = email.trim();
  if (language !== user.language) changes.language = language;

  const nicknameError = nickname.trim().length === 0 ? "Nickname is required." : nickname.trim().length > 50 ? "Maximum 50 characters." : null;
  const emailError = !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : null;
  const valid = Object.keys(changes).length > 0 && !nicknameError && !emailError;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit account details"
      description={`Account fields for VM-${user.patientNumber}. Clinical fields are written by Mira and clinicians only.`}
      isPending={mutation.isPending}
      canSubmit={valid}
      onSubmit={() => void mutation.mutate(changes)}
    >
      <Field label="Nickname" htmlFor="nickname" error={nicknameError}>
        <Input id="nickname" value={nickname} maxLength={50} onChange={(e) => setNickname(e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="email" error={emailError}>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Language" htmlFor="language">
        <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>
                {LANGUAGE_LABELS[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FormDialog>
  );
}
