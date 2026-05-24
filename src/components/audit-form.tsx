"use client";

import type { ChangeEvent } from "react";
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
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof runAudit> | null>(
    null
  );
  const [summaryContext, setSummaryContext] = useState<
    AuditSummaryContext | null
  >(null);
  const [uploadNames, setUploadNames] = useState<string[]>([]);
  const [draft, setDraft] = useState<AuditDraft>(() => {
    const initial: AuditDraft = {
      companyName: "",
      teamSize: "",
      primaryUseCase: "coding",
      region: "",
      usage: [createUsage()],
    };

    if (typeof window === "undefined") {
      return initial;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initial;
    }

    try {
      const parsed = JSON.parse(stored) as AuditDraft;
      return { ...initial, ...parsed };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return initial;
    }
  });
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-[#0f0b1a] px-4 py-3 text-sm text-white placeholder:text-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/30";
  const selectClass =
    "w-full appearance-none rounded-xl border border-white/10 bg-[#0f0b1a] px-4 py-3 text-sm text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/30";

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

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

  const usageBreakdown = useMemo(() => {
    const totalSpend = draft.usage.reduce(
      (sum, entry) => sum + Number(entry.monthlySpendUsd || 0),
      0
    );
    return draft.usage.map((entry) => {
      const tool = TOOL_DEFINITIONS.find((item) => item.id === entry.toolId);
      const spend = Number(entry.monthlySpendUsd || 0);
      const ratio = totalSpend ? Math.round((spend / totalSpend) * 100) : 0;
      return {
        label: tool?.label ?? "Tool",
        spend,
        ratio,
      };
    });
  }, [draft.usage]);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setUploadNames(files.map((file) => file.name));
  };

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
    <div className="grid gap-8 xl:grid-cols-[minmax(0,_1fr)_360px]">
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60">
              <span>
                Step {stepIndex + 1} of {STEPS.length}
              </span>
              <span>{STEPS[stepIndex].title}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition ${
                  index === stepIndex
                    ? "border-violet-400/50 bg-violet-500/10 text-white"
                    : "border-white/10 text-white/60"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    index === stepIndex
                      ? "bg-violet-500 text-white"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-white/50">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-6">
            {stepIndex === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span className="font-medium text-white">
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
                <label className="space-y-2 text-sm text-white/70">
                  <span className="font-medium text-white">Team size</span>
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
                    <p className="text-xs text-rose-300">{errors.teamSize}</p>
                  )}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span className="font-medium text-white">
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
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#0f0b1a]"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.primaryUseCase && (
                    <p className="text-xs text-rose-300">
                      {errors.primaryUseCase}
                    </p>
                  )}
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span className="font-medium text-white">Region</span>
                  <select
                    value={draft.region}
                    onChange={(event) => updateDraft("region", event.target.value)}
                    className={selectClass}
                  >
                    <option value="" className="bg-[#0f0b1a]">
                      Select region
                    </option>
                    {REGIONS.map((region) => (
                      <option
                        key={region.value}
                        value={region.value}
                        className="bg-[#0f0b1a]"
                      >
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
                      className="rounded-2xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                          Tool {index + 1}
                        </h3>
                        {draft.usage.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUsage(index)}
                            className="text-xs font-medium text-white/60 transition hover:text-white"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm text-white/70">
                          <span className="font-medium text-white">Tool</span>
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
                            <option value="" className="bg-[#0f0b1a]">
                              Select tool
                            </option>
                            {TOOL_DEFINITIONS.map((tool) => (
                              <option
                                key={tool.id}
                                value={tool.id}
                                className="bg-[#0f0b1a]"
                              >
                                {tool.label}
                              </option>
                            ))}
                          </select>
                          {errors[`usage-${index}-toolId`] && (
                            <p className="text-xs text-rose-300">
                              {errors[`usage-${index}-toolId`]}
                            </p>
                          )}
                        </label>
                        <label className="space-y-2 text-sm text-white/70">
                          <span className="font-medium text-white">Plan</span>
                          <select
                            value={entry.planId}
                            onChange={(event) =>
                              updateUsage(index, "planId", event.target.value)
                            }
                            className={selectClass}
                          >
                            <option value="" className="bg-[#0f0b1a]">
                              Select plan
                            </option>
                            {plans.map((plan) => (
                              <option
                                key={plan.id}
                                value={plan.id}
                                className="bg-[#0f0b1a]"
                              >
                                {plan.label}
                              </option>
                            ))}
                          </select>
                          {errors[`usage-${index}-planId`] && (
                            <p className="text-xs text-rose-300">
                              {errors[`usage-${index}-planId`]}
                            </p>
                          )}
                        </label>
                        <label className="space-y-2 text-sm text-white/70">
                          <span className="font-medium text-white">
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
                            <p className="text-xs text-rose-300">
                              {errors[`usage-${index}-monthlySpendUsd`]}
                            </p>
                          )}
                        </label>
                        <label className="space-y-2 text-sm text-white/70">
                          <span className="font-medium text-white">
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
                            <p className="text-xs text-rose-300">
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
                  className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  + Add another tool
                </button>
              </div>
            )}
          </div>

          {errors.form && (
            <p className="mt-4 text-sm text-rose-300">{errors.form}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={moveBack}
              disabled={stepIndex === 0}
              className="rounded-full border border-white px-5 py-2 text-xs font-semibold text-white transition hover:border-white/30 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={moveNext}
              className="rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 px-5 py-2 text-xs font-semibold text-white transition hover:from-violet-400 hover:to-emerald-300"
            >
              {stepIndex === STEPS.length - 1 ? "Generate audit" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};