"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { generateAuditSummary } from "@/app/actions/audit-summary";
import { submitLead } from "@/app/actions/lead-capture";
import { savePublicAudit } from "@/app/actions/audit-store";
import { AuditResult } from "@/lib/audit";
import { LeadPayload } from "@/lib/leads";
import { AuditSummaryContext } from "@/lib/summary";
import { getPlanDefinition, getToolDefinition } from "@/lib/pricing";
import { ToolId } from "@/lib/schema";

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

type AuditResultsProps = {
  result: AuditResult;
  summaryContext: AuditSummaryContext;
  teamSize: number;
  onEdit: () => void;
};

export const AuditResults = ({
  result,
  summaryContext,
  teamSize,
  onEdit,
}: AuditResultsProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [leadStatus, setLeadStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [publicAuditId, setPublicAuditId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    company: summaryContext.companyName ?? "",
    role: "",
    teamSize: teamSize ? String(teamSize) : "",
    honeypot: "",
  });

  const shareUrl = useMemo(() => {
    if (!publicAuditId || typeof window === "undefined") {
      return null;
    }
    return `${window.location.origin}/share/${publicAuditId}`;
  }, [publicAuditId]);

  useEffect(() => {
    if (publicAuditId) {
      return;
    }
    startTransition(async () => {
      const response = await savePublicAudit({
        teamSize,
        primaryUseCase: summaryContext.primaryUseCase,
        region: summaryContext.region,
        result,
      });
      if (response.ok && response.publicId) {
        setPublicAuditId(response.publicId);
      }
    });
  }, [publicAuditId, result, summaryContext, teamSize, startTransition]);

  const handleGenerateSummary = () => {
    setSummaryError(null);
    startTransition(async () => {
      try {
        const response = await generateAuditSummary(summaryContext);
        setSummary(response);
      } catch {
        setSummaryError("Unable to generate summary right now.");
      }
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Link copied.");
    } catch {
      setCopyStatus("Unable to copy link.");
    }
  };

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadError(null);
    setLeadStatus("submitting");

    const payload: LeadPayload = {
      email: leadForm.email,
      company: leadForm.company || undefined,
      name: leadForm.name || undefined,
      role: leadForm.role || undefined,
      teamSize: Number(leadForm.teamSize) || undefined,
      baselineSpendUsd: result.baselineSpendUsd,
      savingsUsd: result.totalSavingsUsd,
      auditSummary: summary ?? undefined,
      primaryUseCase: summaryContext.primaryUseCase,
      region: summaryContext.region,
      publicAuditId: publicAuditId ?? undefined,
      honeypot: leadForm.honeypot || undefined,
    };

    const response = await submitLead(payload);
    if (!response.ok) {
      setLeadError(response.error ?? "Unable to save your lead right now.");
      setLeadStatus("error");
      return;
    }

    setLeadStatus("success");
  };

  const savingsTier = result.totalSavingsUsd;
  const showCredex = savingsTier >= 500;
  const showHonesty = savingsTier < 100;
  const baselineValue = result.baselineSpendUsd || 1;
  const optimizedRatio = Math.min(
    100,
    Math.round((result.optimizedSpendUsd / baselineValue) * 100)
  );
  const savingsRatio = Math.min(
    100,
    Math.round((result.totalSavingsUsd / baselineValue) * 100)
  );

  return (
    <section className="space-y-8 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">
            Audit results
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Savings blueprint
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Per-tool recommendations based on plan fit, seats, and credit options.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-white/70 transition hover:border-white/30"
        >
          Edit inputs
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <p className="text-xs uppercase tracking-widest text-white/50">
            Baseline spend
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatUsd(result.baselineSpendUsd)}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5">
          <p className="text-xs uppercase tracking-widest text-emerald-200">
            Optimized target
          </p>
          <p className="mt-3 text-2xl font-semibold text-emerald-100">
            {formatUsd(result.optimizedSpendUsd)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-5">
          <p className="text-xs uppercase tracking-widest text-amber-200">
            Potential savings
          </p>
          <p className="mt-3 text-2xl font-semibold text-amber-100">
            {formatUsd(result.totalSavingsUsd)}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Optimization snapshot
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Baseline spend</span>
              <span>{formatUsd(result.baselineSpendUsd)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-2 w-full rounded-full bg-white/50" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Optimized target</span>
              <span>{formatUsd(result.optimizedSpendUsd)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${optimizedRatio}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Projected savings</span>
              <span>{formatUsd(result.totalSavingsUsd)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-violet-400"
                style={{ width: `${savingsRatio}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_340px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Executive summary
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Generate a concise AI-driven recap for stakeholders.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isPending}
                className="rounded-full bg-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              >
                {isPending ? "Summarizing..." : "Generate summary"}
              </button>
            </div>
            {summary && (
              <p className="mt-4 whitespace-pre-line text-sm text-white/70">
                {summary}
              </p>
            )}
            {summaryError && (
              <p className="mt-4 text-sm text-rose-300">{summaryError}</p>
            )}
          </div>

          {shareUrl && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Shareable report
              </p>
              <p className="mt-2 text-sm text-white/60">
                Public link excludes company and email details.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  value={shareUrl}
                  readOnly
                  className="flex-1 rounded-xl border border-white/10 bg-[#0f0b1a] px-3 py-2 text-xs text-white/70"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30"
                >
                  Copy link
                </button>
              </div>
              {copyStatus && (
                <p className="mt-2 text-xs text-white/50">{copyStatus}</p>
              )}
            </div>
          )}

          {showCredex && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                Credex opportunity
              </p>
              <p className="mt-2 text-sm text-emerald-100">
                You could save more than {formatUsd(result.totalSavingsUsd)} per
                month. Credex credits lock in discounts on the tools you already
                use.
              </p>
              <a
                href="mailto:hello@credex.rocks?subject=Credex%20Consultation"
                className="mt-4 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
              >
                Book a Credex consultation
              </a>
            </div>
          )}

          {showHonesty && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Spend health check
              </p>
              <p className="mt-2 text-sm text-white/70">
                Your spend looks well-optimized right now. We will alert you when
                new pricing or credits could unlock more savings.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Request full report
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Capture your contact details and receive the full audit.
                </p>
              </div>
            </div>
            <form onSubmit={handleLeadSubmit} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-xs">
                  <span className="font-medium text-white/70">Name</span>
                  <input
                    value={leadForm.name}
                    onChange={(event) =>
                      setLeadForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0f0b1a] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400"
                    placeholder="Taylor Reed"
                  />
                </label>
                <label className="space-y-2 text-xs">
                  <span className="font-medium text-white/70">Email</span>
                  <input
                    value={leadForm.email}
                    onChange={(event) =>
                      setLeadForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    type="email"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0f0b1a] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400"
                    placeholder="you@company.com"
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-xs">
                  <span className="font-medium text-white/70">Company</span>
                  <input
                    value={leadForm.company}
                    onChange={(event) =>
                      setLeadForm((prev) => ({
                        ...prev,
                        company: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0f0b1a] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400"
                    placeholder="Company name"
                  />
                </label>
                <label className="space-y-2 text-xs">
                  <span className="font-medium text-white/70">Role</span>
                  <input
                    value={leadForm.role}
                    onChange={(event) =>
                      setLeadForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0f0b1a] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400"
                    placeholder="Engineering lead"
                  />
                </label>
              </div>
              <label className="space-y-2 text-xs">
                <span className="font-medium text-white/70">Team size</span>
                <input
                  value={leadForm.teamSize}
                  onChange={(event) =>
                    setLeadForm((prev) => ({
                      ...prev,
                      teamSize: event.target.value,
                    }))
                  }
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-white/10 bg-[#0f0b1a] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400"
                  placeholder="18"
                />
              </label>
              <label className="hidden">
                <span>Website</span>
                <input
                  value={leadForm.honeypot}
                  onChange={(event) =>
                    setLeadForm((prev) => ({
                      ...prev,
                      honeypot: event.target.value,
                    }))
                  }
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={leadStatus === "submitting"}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {leadStatus === "submitting"
                    ? "Submitting..."
                    : "Send full report"}
                </button>
                {leadStatus === "success" && (
                  <span className="text-xs text-emerald-200">
                    Submitted. We will reach out soon.
                  </span>
                )}
                {leadError && (
                  <span className="text-xs text-rose-300">{leadError}</span>
                )}
              </div>
            </form>
          </div>

          <h3 className="text-lg font-semibold text-white">
            Tool recommendations
          </h3>
          <div className="space-y-3">
            {result.perTool.map((finding) => {
              const tool = getToolDefinition(finding.toolId);
              const recommendedPlan = finding.recommendedPlanId
                ? getPlanDefinition(
                    (finding.recommendedToolId ?? finding.toolId) as ToolId,
                    finding.recommendedPlanId
                  )
                : null;
              const recommendedTool = finding.recommendedToolId
                ? getToolDefinition(finding.recommendedToolId)
                : null;

              return (
                <div
                  key={`${finding.toolId}-${finding.planId}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {tool?.label ?? finding.toolLabel} · {finding.planLabel}
                      </p>
                      <p className="mt-1 text-sm text-white/60">
                        {finding.reason}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        finding.savingsUsd >= 500
                          ? "bg-emerald-500/20 text-emerald-200"
                          : finding.savingsUsd >= 100
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {finding.action}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
                    <span>Current: {formatUsd(finding.currentSpendUsd)}</span>
                    <span>Target: {formatUsd(finding.recommendedSpendUsd)}</span>
                    <span>Savings: {formatUsd(finding.savingsUsd)}</span>
                  </div>
                  {recommendedPlan && (
                    <p className="mt-3 text-sm text-white/70">
                      Suggested plan: {recommendedTool?.label ?? finding.toolLabel} · {recommendedPlan.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Tool mix
            </p>
            <h3 className="text-lg font-semibold text-white">
              Spend concentration
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            {Object.entries(result.perToolSpend).map(([toolId, spend]) => (
              <div key={toolId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize text-white/70">
                    {getToolDefinition(toolId as ToolId)?.label ?? toolId}
                  </span>
                  <span className="text-white/50">{formatUsd(spend)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-violet-400"
                    style={{
                      width: `${Math.min(
                        (spend / Math.max(result.baselineSpendUsd, 1)) * 100,
                        100
                      ).toFixed(0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
};