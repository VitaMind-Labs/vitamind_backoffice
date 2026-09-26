"use client";

import { useState } from "react";
import { Archive, Beaker, BarChart3, Check, Infinity as InfinityIcon, PencilLine, Plus, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { CopyableId } from "@/components/admin/shared/detail";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Can } from "@/components/admin/shared/permission";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/admin/shared/states";
import { SUBSCRIPTION_TIER_META } from "@/lib/constants/status";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { plansApi } from "@/lib/api/payments";
import { formatDate, formatMoney, formatNumber } from "@/lib/formatters";
import type { SubscriptionPlan, SubscriptionPlanInput, SubscriptionTier } from "@/types/admin";

const NAME_MAX = 60;

interface Draft {
  name: string;
  tier: SubscriptionTier;
  price: string;
  durationDays: string;
  trialDays: string;
  reportsPerMonth: string;
  hasAdvancedInsights: boolean;
  hasUnlimitedJournal: boolean;
  hasBehaviorAnalysis: boolean;
  hasPrioritySupport: boolean;
  isActive: boolean;
}

const EMPTY: Draft = {
  name: "",
  tier: "BASIC",
  price: "",
  durationDays: "30",
  trialDays: "0",
  reportsPerMonth: "1",
  hasAdvancedInsights: false,
  hasUnlimitedJournal: false,
  hasBehaviorAnalysis: false,
  hasPrioritySupport: false,
  isActive: true,
};

function toDraft(plan?: SubscriptionPlan): Draft {
  if (!plan) return EMPTY;
  return {
    name: plan.name,
    tier: plan.tier,
    price: String(plan.priceEUR),
    durationDays: String(plan.durationDays),
    trialDays: String(plan.trialDays),
    reportsPerMonth: String(plan.reportsPerMonth),
    hasAdvancedInsights: plan.hasAdvancedInsights,
    hasUnlimitedJournal: plan.hasUnlimitedJournal,
    hasBehaviorAnalysis: plan.hasBehaviorAnalysis,
    hasPrioritySupport: plan.hasPrioritySupport,
    isActive: plan.isActive,
  };
}

function PlanFormDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan?: SubscriptionPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = !!plan;
  // Mounted with a key per plan, so the initial state is always the right plan.
  const [draft, setDraft] = useState<Draft>(() => toDraft(plan));

  const mutation = useApiMutation(
    (input: SubscriptionPlanInput) => (plan ? plansApi.update(plan.id, input) : plansApi.create(input)),
    {
      invalidate: ["plans", "payments", "dashboard"],
      successMessage: editing ? "Plan updated" : "Plan created",
      onSuccess: () => onOpenChange(false),
    },
  );

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const price = Number(draft.price);
  const nameError = draft.name.trim().length === 0 ? "Name is required." : draft.name.trim().length > NAME_MAX ? `Maximum ${NAME_MAX} characters.` : null;
  const priceError = !Number.isFinite(price) || price < 0 ? "Enter a valid price (0 or more)." : null;
  const reports = Number(draft.reportsPerMonth);
  const reportsError = !Number.isInteger(reports) || reports < 0 ? "Enter a whole number of reports (0 or more)." : null;
  const valid = !nameError && !priceError && !reportsError;

  const submit = () => {
    if (!valid) return;
    const input: SubscriptionPlanInput = {
      name: draft.name.trim(),
      tier: draft.tier,
      priceEUR: price,
      durationDays: Math.max(1, Math.trunc(Number(draft.durationDays) || 30)),
      trialDays: Math.max(0, Math.trunc(Number(draft.trialDays) || 0)),
      reportsPerMonth: reports,
      hasAdvancedInsights: draft.hasAdvancedInsights,
      hasUnlimitedJournal: draft.hasUnlimitedJournal,
      hasBehaviorAnalysis: draft.hasBehaviorAnalysis,
      hasPrioritySupport: draft.hasPrioritySupport,
      isActive: draft.isActive,
    };
    void mutation.mutate(input);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${plan.name}` : "New subscription plan"}
      description={
        editing
          ? "Changes apply to new subscriptions only; existing subscribers keep the terms they signed up with."
          : "The plan becomes selectable on the patient subscription page as soon as it is active."
      }
      submitLabel={editing ? "Save changes" : "Create plan"}
      isPending={mutation.isPending}
      canSubmit={valid}
      onSubmit={submit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="plan-name" error={nameError} className="sm:col-span-2">
          <Input id="plan-name" value={draft.name} maxLength={NAME_MAX} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pro monthly" />
        </Field>
        <Field label="Tier" htmlFor="plan-tier">
          <div className="flex h-9 items-center gap-3 rounded-md border px-3">
            <Switch
              id="plan-tier"
              checked={draft.tier === "PRO"}
              onCheckedChange={(checked) => set("tier", checked ? "PRO" : "BASIC")}
            />
            <span className="text-[13px]">
              {draft.tier === "PRO" ? "Pro" : "Basic"}
              <span className="ml-2 text-xs text-muted-foreground">{draft.tier}</span>
            </span>
          </div>
        </Field>
        <Field label="Price (EUR)" htmlFor="plan-price" error={priceError}>
          <Input
            id="plan-price"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={draft.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="9.99"
          />
        </Field>
        <Field label="Duration (days)" htmlFor="plan-duration">
          <Input
            id="plan-duration"
            type="number"
            min={1}
            step={1}
            value={draft.durationDays}
            onChange={(e) => set("durationDays", e.target.value)}
          />
        </Field>
        <Field label="Trial days" htmlFor="plan-trial">
          <Input id="plan-trial" type="number" min={0} step={1} value={draft.trialDays} onChange={(e) => set("trialDays", e.target.value)} />
        </Field>
        <Field label="Reports per month" htmlFor="plan-reports" error={reportsError}>
          <Input
            id="plan-reports"
            type="number"
            min={0}
            step={1}
            value={draft.reportsPerMonth}
            onChange={(e) => set("reportsPerMonth", e.target.value)}
          />
        </Field>
      </div>

      <div className="space-y-2.5 rounded-lg border p-3.5">
        <p className="text-[13px] font-medium">Included features</p>
        {(
          [
            ["hasBehaviorAnalysis", "Behaviour analysis", BarChart3],
            ["hasUnlimitedJournal", "Unlimited journal", InfinityIcon],
            ["hasAdvancedInsights", "Advanced insights", Sparkles],
            ["hasPrioritySupport", "Priority support", Zap],
          ] as const
        ).map(([key, label, Icon]) => (
          <label key={key} htmlFor={`plan-${key}`} className="flex cursor-pointer items-center justify-between gap-3 py-0.5">
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
              {label}
            </span>
            <Switch
              id={`plan-${key}`}
              checked={draft[key]}
              onCheckedChange={(checked) => set(key, checked)}
            />
          </label>
        ))}
        <label htmlFor="plan-active" className="flex cursor-pointer items-center justify-between gap-3 border-t pt-2.5">
          <span className="text-[13px] text-muted-foreground">Active and purchasable</span>
          <Switch id="plan-active" checked={draft.isActive} onCheckedChange={(checked) => set("isActive", checked)} />
        </label>
      </div>
    </FormDialog>
  );
}

function PlanCard({ plan, onEdit, onArchive }: { plan: SubscriptionPlan; onEdit: () => void; onArchive: () => void }) {
  const tier = SUBSCRIPTION_TIER_META[plan.tier];
  const features = [
    { label: "Behaviour analysis", on: plan.hasBehaviorAnalysis, icon: BarChart3 },
    { label: "Unlimited journal", on: plan.hasUnlimitedJournal, icon: InfinityIcon },
    { label: "Advanced insights", on: plan.hasAdvancedInsights, icon: Sparkles },
    { label: "Priority support", on: plan.hasPrioritySupport, icon: Zap },
  ];

  return (
    <Card className={`flex flex-col gap-4 p-5 ${plan.isActive ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">{plan.name}</h3>
            <Badge tone={tier.tone}>{tier.label}</Badge>
            {!plan.isActive && <Badge tone="outline">Archived</Badge>}
          </div>
          {plan.description && <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{plan.description}</p>}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{formatMoney(plan.priceEUR)}</span>
        <span className="text-[13px] text-muted-foreground">
          / {plan.durationDays} days
          {plan.trialDays > 0 ? ` · ${plan.trialDays}-day trial` : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-md border px-3 py-2">
          <p className="text-xs text-muted-foreground">Reports / month</p>
          <p className="mt-0.5 font-medium tabular-nums">{formatNumber(plan.reportsPerMonth)}</p>
        </div>
        <div className="rounded-md border px-3 py-2">
          <p className="text-xs text-muted-foreground">Trial days</p>
          <p className="mt-0.5 font-medium tabular-nums">{formatNumber(plan.trialDays)}</p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f.label} className={`flex items-center gap-2 text-[13px] ${f.on ? "text-foreground" : "text-subtle-foreground"}`}>
            {f.on ? <Check className="size-3.5 text-success" aria-hidden /> : <span className="size-3.5 rounded-full border border-dashed border-subtle-foreground/40" aria-hidden />}
            <f.icon className="size-3.5" aria-hidden />
            {f.label}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-xs text-subtle-foreground">Updated {formatDate(plan.updatedAt)}</span>
        <Can permission="plans.manage">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilLine /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground"
              onClick={onArchive}
              disabled={!plan.isActive}
              title={plan.isActive ? "Remove this plan from sale" : "This plan is already archived"}
            >
              <Archive /> Archive
            </Button>
          </div>
        </Can>
      </div>
    </Card>
  );
}

export function SubscriptionPlansView() {
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [archiving, setArchiving] = useState<SubscriptionPlan | null>(null);
  const q = useApiQuery(["plans", "all"], () => plansApi.list());
  const archive = useApiMutation((id: string) => plansApi.archive(id), {
    invalidate: ["plans", "payments", "dashboard"],
    successMessage: (_r, id) => `${q.data?.find((p) => p.id === id)?.name ?? "Plan"} archived`,
  });

  const plans = q.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription plans"
        description="The plans patients can subscribe to. Archiving keeps existing subscriptions intact but removes the plan from sale."
        actions={
          <Can permission="plans.manage">
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus /> New plan
            </Button>
          </Can>
        }
      />

      {q.error ? (
        <Card>
          <ErrorState error={q.error} onRetry={q.refetch} />
        </Card>
      ) : !plans ? (
        <PageSkeleton />
      ) : plans.length === 0 ? (
        <Card>
          <EmptyState
            icon={Beaker}
            title="No subscription plans yet"
            description="Create the first plan so patients can subscribe. Seed data is normally inserted by the backend migrations."
            action={
              <Can permission="plans.manage">
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> New plan
                </Button>
              </Can>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEdit={() => setEditing(plan)} onArchive={() => setArchiving(plan)} />
          ))}
        </div>
      )}

      {plans && plans.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold tracking-tight">Plan identifiers</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Plan IDs are referenced by payments and user subscriptions.</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-[13px]">
                <span className="truncate text-muted-foreground">{plan.name}</span>
                <CopyableId value={plan.id} display={plan.id.slice(0, 8)} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {creating && <PlanFormDialog key="new" open onOpenChange={(o) => !o && setCreating(false)} />}
      {editing && <PlanFormDialog key={editing.id} plan={editing} open onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={`Archive ${archiving?.name ?? "this plan"}?`}
        description="The plan can no longer be purchased. Users already subscribed keep their plan, price and renewal."
        confirmLabel="Archive plan"
        isPending={archive.isPending}
        onConfirm={async () => {
          if (!archiving) return false;
          return !!(await archive.mutate(archiving.id));
        }}
      />
    </div>
  );
}
