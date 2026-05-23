"use client";

import { useEffect, useMemo, useState } from "react";
import { runAudit } from "@/lib/audit";
import { AuditInputSchema, PrimaryUseCase, Region } from "@/lib/schema";
import { AuditResults } from "@/components/audit-results";
import { AuditSummaryContext } from "@/lib/summary";
import { TOOL_DEFINITIONS } from "@/lib/pricing";

const STORAGE_KEY = "credex-audit-draft-v1";

const PRIMARY_USE_CASES: Array<{ value: PrimaryUseCase; label: string }> = [
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "data", label: "Data" },
  { value: "research", label: "Research" },
  { value: "mixed", label: "Mixed" },
];

const REGIONS = [
  { value: "na", label: "North America" },
  { value: "emea", label: "EMEA" },
  { value: "apac", label: "APAC" },
  { value: "latam", label: "LATAM" },
];

const STEPS = [
  {
    id: "team",
    title: "Team context",
    description: "Team size and primary AI use case.",
  },
  {
    id: "usage",
    title: "Tool spend",
    description: "Add each AI tool, plan, spend, and seats.",
  },
];

type UsageDraft = {
  toolId: string;
  planId: string;
  monthlySpendUsd: string;
  seats: string;
};

type AuditDraft = {
  companyName: string;
  teamSize: string;
  primaryUseCase: PrimaryUseCase;
  region: string;
  usage: UsageDraft[];
};

const createUsage = (): UsageDraft => ({
  toolId: "",
  planId: "",
  monthlySpendUsd: "",
  seats: "",
});

export const AuditForm = () => {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof runAudit> | null>(
    null
  );
  const [summaryContext, setSummaryContext] = useState<
    AuditSummaryContext | null
  >(null);
  const [draft, setDraft] = useState<AuditDraft>({
    companyName: "",
    teamSize: "",
    primaryUseCase: "coding",
    region: "",
    usage: [createUsage()],
  });
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const fieldClass =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/70";
  const selectClass =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200/70";

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setHasHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AuditDraft;
      setDraft((prev) => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hasHydrated]);

  const totals = useMemo(() => {
    const totalSpend = draft.usage.reduce(
      (sum, entry) => sum + Number(entry.monthlySpendUsd || 0),
      0
    );
    const totalSeats = draft.usage.reduce(
      (sum, entry) => sum + Number(entry.seats || 0),
      0
    );

    return { totalSpend, totalSeats };
  }, [draft.usage]);

  const updateDraft = (key: keyof AuditDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const updateUsage = (
    index: number,
    key: keyof UsageDraft,
    value: string
  ) => {
    setDraft((prev) => {
      const usage = [...prev.usage];
      usage[index] = { ...usage[index], [key]: value };
      return { ...prev, usage };
    });
    setErrors((prev) => ({ ...prev, [`usage-${index}-${key}`]: "" }));
  };

  const addUsage = () => {
    setDraft((prev) => ({ ...prev, usage: [...prev.usage, createUsage()] }));
  };

  const removeUsage = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      usage: prev.usage.filter((_, idx) => idx !== index),
    }));
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!Number(draft.teamSize)) {
        nextErrors.teamSize = "Team size is required.";
      }
      if (!draft.primaryUseCase) {
        nextErrors.primaryUseCase = "Select a primary use case.";
      }
    }

    if (stepIndex === 1) {
      draft.usage.forEach((entry, index) => {
        if (!entry.toolId) {
          nextErrors[`usage-${index}-toolId`] = "Select a tool.";
        }
        if (!entry.planId) {
          nextErrors[`usage-${index}-planId`] = "Select a plan.";
        }
        if (!Number(entry.monthlySpendUsd)) {
          nextErrors[`usage-${index}-monthlySpendUsd`] =
            "Monthly spend is required.";
        }
        if (Number(entry.seats) <= 0) {
          nextErrors[`usage-${index}-seats`] = "Seats must be greater than 0.";
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const moveNext = () => {
    if (!validateStep()) {
      return;
    }
    if (stepIndex === STEPS.length - 1) {
      const parsed = AuditInputSchema.safeParse({
        companyName: draft.companyName || undefined,
        teamSize: Number(draft.teamSize),
        primaryUseCase: draft.primaryUseCase,
        region: draft.region ? (draft.region as Region) : undefined,
        usage: draft.usage.map((entry) => ({
          toolId: entry.toolId,
          planId: entry.planId,
          monthlySpendUsd: Number(entry.monthlySpendUsd),
          seats: Number(entry.seats),
        })),
      });

      if (!parsed.success) {
        setErrors({
          form: "Please review the highlighted fields before generating.",
        });
        return;
      }

      const auditResult = runAudit(parsed.data);
      setResult(auditResult);
      setSummaryContext({
        companyName: draft.companyName || undefined,
        teamSize: Number(draft.teamSize),
        primaryUseCase: draft.primaryUseCase,
        region: draft.region ? (draft.region as Region) : undefined,
        result: auditResult,
      });
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const moveBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const resolvePlans = (toolId: string) =>
    TOOL_DEFINITIONS.find((tool) => tool.id === toolId)?.plans ?? [];

  if (result && summaryContext) {
    return (
      <AuditResults
        key={`${summaryContext.companyName ?? "anon"}-${result.baselineSpendUsd}-${result.totalSavingsUsd}`}
        result={result}
        summaryContext={summaryContext}
        teamSize={Number(draft.teamSize)}
        onEdit={() => {
          setResult(null);
          setSummaryContext(null);
        }}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,_1fr)_340px]">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-900/70">
            Credex spend audit
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
            AI Spend Audit Tool
          </h1>
          <p className="text-base text-neutral-600">
            Audit AI tool spend by plan, seats, and use case in minutes.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/90 p-6 shadow-[0_18px_60px_-40px_rgba(20,20,20,0.6)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-neutral-500">
              <span>
                Step {stepIndex + 1} of {STEPS.length}
              </span>
              <span>{STEPS[stepIndex].title}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-200">
              <div
                className="h-1.5 rounded-full bg-amber-500 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition ${
                  index === stepIndex
                    ? "border-amber-500/60 bg-amber-50 text-amber-900"
                    : "border-black/10 text-neutral-500"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    index === stepIndex
                      ? "bg-amber-500 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-neutral-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-6">
            {stepIndex === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-neutral-700">
                  <span className="font-medium text-neutral-800">
                    Company name (optional)
                  </span>
                  <input
                    value={draft.companyName}
                    onChange={(event) =>
                      updateDraft("companyName", event.target.value)
                    }
                    className={fieldClass}
                    placeholder="Northwind Analytics"
                  />
                </label>
                <label className="space-y-2 text-sm text-neutral-700">
                  <span className="font-medium text-neutral-800">Team size</span>
                  <input
                    value={draft.teamSize}
                    onChange={(event) =>
                      updateDraft("teamSize", event.target.value)
                    }
                    type="number"
                    min={1}
                    className={fieldClass}
                    placeholder="18"
                  />
                  {errors.teamSize && (
                    <p className="text-xs text-red-600">{errors.teamSize}</p>
                  )}
                </label>
                <label className="space-y-2 text-sm text-neutral-700">
                  <span className="font-medium text-neutral-800">
                    Primary use case
                  </span>
                  <select
                    value={draft.primaryUseCase}
                    onChange={(event) =>
                      updateDraft("primaryUseCase", event.target.value)
                    }
                    className={selectClass}
                  >
                    {PRIMARY_USE_CASES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.primaryUseCase && (
                    <p className="text-xs text-red-600">
                      {errors.primaryUseCase}
                    </p>
                  )}
                </label>
                <label className="space-y-2 text-sm text-neutral-700">
                  <span className="font-medium text-neutral-800">Region</span>
                  <select
                    value={draft.region}
                    onChange={(event) => updateDraft("region", event.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select region</option>
                    {REGIONS.map((region) => (
                      <option key={region.value} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {stepIndex === 1 && (
              <div className="space-y-6">
                {draft.usage.map((entry, index) => {
                  const plans = resolvePlans(entry.toolId);

                  return (
                    <div
                      key={`usage-${index}`}
                      className="rounded-2xl border border-black/10 bg-neutral-50/60 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-neutral-800">
                          Tool {index + 1}
                        </h3>
                        {draft.usage.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUsage(index)}
                            className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm text-neutral-700">
                          <span className="font-medium text-neutral-800">
                            Tool
                          </span>
                          <select
                            value={entry.toolId}
                            onChange={(event) => {
                              const toolId = event.target.value;
                              const nextPlans = resolvePlans(toolId);
                              updateUsage(index, "toolId", toolId);
                              updateUsage(
                                index,
                                "planId",
                                nextPlans[0]?.id ?? ""
                              );
                            }}
                            className={selectClass}
                          >
                            <option value="">Select tool</option>
                            {TOOL_DEFINITIONS.map((tool) => (
                              <option key={tool.id} value={tool.id}>
                                {tool.label}
                              </option>
                            ))}
                          </select>
                          {errors[`usage-${index}-toolId`] && (
                            <p className="text-xs text-red-600">
                              {errors[`usage-${index}-toolId`]}
                            </p>
                          )}
                        </label>
                        <label className="space-y-2 text-sm text-neutral-700">
                          <span className="font-medium text-neutral-800">
                            Plan
                          </span>
                          <select
                            value={entry.planId}
                            onChange={(event) =>
                              updateUsage(index, "planId", event.target.value)
                            }
                            className={selectClass}
                          >
                            <option value="">Select plan</option>
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.label}
                              </option>
                            ))}
                          </select>
                          {errors[`usage-${index}-planId`] && (
                            <p className="text-xs text-red-600">
                              {errors[`usage-${index}-planId`]}
                            </p>
                          )}
                        </label>
                        <label className="space-y-2 text-sm text-neutral-700">
                          <span className="font-medium text-neutral-800">
                            Monthly spend (USD)
                          </span>
                          <input
                            value={entry.monthlySpendUsd}
                            onChange={(event) =>
                              updateUsage(
                                index,
                                "monthlySpendUsd",
                                event.target.value
                              )
                            }
                            type="number"
                            min={0}
                            className={fieldClass}
                            placeholder="1200"
                          />
                          {errors[`usage-${index}-monthlySpendUsd`] && (
                            <p className="text-xs text-red-600">
                              {errors[`usage-${index}-monthlySpendUsd`]}
                            </p>
                          )}
                        </label>
                        <label className="space-y-2 text-sm text-neutral-700">
                          <span className="font-medium text-neutral-800">
                            Active seats
                          </span>
                          <input
                            value={entry.seats}
                            onChange={(event) =>
                              updateUsage(index, "seats", event.target.value)
                            }
                            type="number"
                            min={1}
                            className={fieldClass}
                            placeholder="12"
                          />
                          {errors[`usage-${index}-seats`] && (
                            <p className="text-xs text-red-600">
                              {errors[`usage-${index}-seats`]}
                            </p>
                          )}
                        </label>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addUsage}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700"
                >
                  + Add another tool
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={moveBack}
              disabled={stepIndex === 0}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-neutral-600 transition disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={moveNext}
              className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              {stepIndex === STEPS.length - 1 ? "Generate audit" : "Continue"}
            </button>
            {errors.form && (
              <p className="w-full text-xs text-red-600">{errors.form}</p>
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-4 rounded-2xl border border-black/10 bg-white/85 p-6 lg:sticky lg:top-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Live snapshot
          </p>
          <h2 className="text-lg font-semibold text-neutral-900">Spend rollup</h2>
        </div>
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-black/10 bg-neutral-50/70 p-4">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Monthly spend
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              ${totals.totalSpend.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-neutral-50/70 p-4">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Active seats
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {totals.totalSeats.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Audits never ask for email before results are shown.
        </div>
      </aside>
    </div>
  );
};