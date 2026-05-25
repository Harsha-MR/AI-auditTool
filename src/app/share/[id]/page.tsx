import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getToolDefinition, getPlanDefinition } from "@/lib/pricing";
import { ToolId } from "@/lib/schema";

type PublicAudit = {
  public_id: string;
  public_payload: {
    teamSize: number;
    primaryUseCase: string;
    region?: string | null;
    baselineSpendUsd: number;
    optimizedSpendUsd: number;
    totalSavingsUsd: number;
    tools: Array<{
      toolId: ToolId;
      planId: string;
      currentSpendUsd: number;
      recommendedSpendUsd: number;
      savingsUsd: number;
      action: string;
      reason: string;
      recommendedToolId?: ToolId | null;
      recommendedPlanId?: string | null;
    }>;
  };
};

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const fetchAudit = async (id: string) => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("audits")
    .select("public_id, public_payload")
    .eq("public_id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PublicAudit;
};

export const generateMetadata = async (
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> => {
  const { id } = await props.params;
  const audit = await fetchAudit(id);

  if (!audit) {
    return {
      title: "Audit not found",
      description: "The requested AI spend audit could not be found.",
    };
  }

  const savings = formatUsd(audit.public_payload.totalSavingsUsd);

  return {
    title: `AI Spend Audit · ${savings} savings`,
    description: `Public AI spend audit summary with ${savings} monthly savings potential.`,
    openGraph: {
      title: "Credex AI Spend Audit",
      description: `Potential savings: ${savings} per month.`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: "Credex AI Spend Audit",
      description: `Potential savings: ${savings} per month.`,
    },
  };
};

export default async function SharePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const audit = await fetchAudit(id);

  if (!audit) {
    notFound();
  }

  const payload = audit.public_payload;
  const annualSavingsUsd = payload.totalSavingsUsd * 12;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fdf6e7,_#f7f3ee_45%,_#eef2f2_100%)] px-6 py-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-900/70">
            Credex public audit
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
            AI Spend Audit Snapshot
          </h1>
          <p className="text-base text-neutral-600">
            Shareable view of tool spend and recommended actions.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Baseline spend
            </p>
            <p className="mt-3 text-2xl font-semibold text-neutral-900">
              {formatUsd(payload.baselineSpendUsd)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs uppercase tracking-widest text-emerald-700">
              Optimized target
            </p>
            <p className="mt-3 text-2xl font-semibold text-emerald-900">
              {formatUsd(payload.optimizedSpendUsd)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs uppercase tracking-widest text-amber-700">
              Potential savings
            </p>
            <p className="mt-3 text-2xl font-semibold text-amber-900">
              {formatUsd(payload.totalSavingsUsd)}
            </p>
            <p className="mt-2 text-xs text-amber-800/80">
              Monthly: {formatUsd(payload.totalSavingsUsd)} · Annual: {formatUsd(annualSavingsUsd)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Tool breakdown
          </p>
          <div className="mt-4 space-y-3">
            {payload.tools.map((tool) => {
              const toolLabel = getToolDefinition(tool.toolId)?.label ?? tool.toolId;
              const planLabel =
                getPlanDefinition(tool.toolId, tool.planId)?.label ?? tool.planId;
              const recommendedToolLabel = tool.recommendedToolId
                ? getToolDefinition(tool.recommendedToolId)?.label
                : null;
              const recommendedPlanLabel = tool.recommendedPlanId
                ? getPlanDefinition(
                    (tool.recommendedToolId ?? tool.toolId) as ToolId,
                    tool.recommendedPlanId
                  )?.label
                : null;

              return (
                <div
                  key={`${tool.toolId}-${tool.planId}`}
                  className="rounded-2xl border border-black/10 bg-neutral-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-neutral-900">
                      {toolLabel} · {planLabel}
                    </p>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                      {tool.action}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{tool.reason}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span>Current: {formatUsd(tool.currentSpendUsd)}</span>
                    <span>Target: {formatUsd(tool.recommendedSpendUsd)}</span>
                    <span>Savings: {formatUsd(tool.savingsUsd)}</span>
                  </div>
                  {recommendedToolLabel && recommendedPlanLabel && (
                    <p className="mt-2 text-sm text-neutral-700">
                      Suggested plan: {recommendedToolLabel} · {recommendedPlanLabel}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}