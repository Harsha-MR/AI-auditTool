import { AuditInput, PrimaryUseCase, ToolId, UsageEntry } from "./schema";
import {
  AlternativeDefinition,
  getPlanDefinition,
  getToolDefinition,
  PlanDefinition,
  ToolDefinition,
} from "./pricing";

export type RecommendationAction =
  | "keep"
  | "downgrade"
  | "switch"
  | "right-size"
  | "credits";

export type ToolRecommendation = {
  toolId: ToolId;
  toolLabel: string;
  planId: string;
  planLabel: string;
  currentSpendUsd: number;
  recommendedSpendUsd: number;
  savingsUsd: number;
  action: RecommendationAction;
  reason: string;
  recommendedToolId?: ToolId;
  recommendedPlanId?: string;
};

export type AuditResult = {
  baselineSpendUsd: number;
  optimizedSpendUsd: number;
  totalSavingsUsd: number;
  perTool: ToolRecommendation[];
  perToolSpend: Record<string, number>;
};

type Candidate = {
  action: RecommendationAction;
  savingsUsd: number;
  recommendedSpendUsd: number;
  reason: string;
  recommendedToolId?: ToolId;
  recommendedPlanId?: string;
};

const estimatePlanCost = (plan: PlanDefinition, seats: number) => {
  if (plan.billing === "seat") {
    if (plan.seatPriceUsd === undefined) {
      return null;
    }
    const seatCount = Math.max(seats, plan.minSeats ?? 0, 1);
    return seatCount * plan.seatPriceUsd;
  }
  if (plan.billing === "flat") {
    return plan.flatMonthlyUsd ?? null;
  }
  return null;
};

const findDowngradePlan = (
  tool: ToolDefinition,
  currentPlan: PlanDefinition,
  seats: number
) => {
  const lowerPlans = tool.plans
    .filter((plan) => plan.tier < currentPlan.tier)
    .filter((plan) => (plan.minSeats ?? 0) <= seats)
    .sort((a, b) => b.tier - a.tier);

  return lowerPlans[0];
};

const pickAlternative = (
  alternatives: AlternativeDefinition[] | undefined,
  useCase: PrimaryUseCase
) => {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    alternatives.find((alt) =>
      alt.appliesToUseCases ? alt.appliesToUseCases.includes(useCase) : true
    ) ?? null
  );
};

const ACTION_PRIORITY: Record<RecommendationAction, number> = {
  "right-size": 4,
  switch: 3,
  downgrade: 2,
  credits: 1,
  keep: 0,
};

const evaluateEntry = (input: AuditInput, entry: UsageEntry): ToolRecommendation => {
  const tool = getToolDefinition(entry.toolId);
  const plan = getPlanDefinition(entry.toolId, entry.planId);

  const baseline = Math.max(entry.monthlySpendUsd, 0);
  const toolLabel = tool?.label ?? entry.toolId;
  const planLabel = plan?.label ?? entry.planId;

  if (!tool || !plan) {
    return {
      toolId: entry.toolId,
      toolLabel,
      planId: entry.planId,
      planLabel,
      currentSpendUsd: baseline,
      recommendedSpendUsd: baseline,
      savingsUsd: 0,
      action: "keep",
      reason: "Pricing data for this plan is missing, keeping current spend.",
    };
  }

  const candidates: Candidate[] = [];

  if (plan.billing === "seat" && entry.seats > input.teamSize) {
    const seatPrice = plan.seatPriceUsd ?? 0;
    const extraSeats = entry.seats - input.teamSize;
    const savings = Math.max(extraSeats * seatPrice, 0);
    if (savings > 0) {
      candidates.push({
        action: "right-size",
        savingsUsd: Math.min(savings, baseline),
        recommendedSpendUsd: Math.max(baseline - savings, 0),
        reason: `Seats (${entry.seats}) exceed team size (${input.teamSize}).`,
      });
    }
  }

  const downgradePlan = findDowngradePlan(tool, plan, entry.seats);
  if (downgradePlan) {
    const downgradeCost = estimatePlanCost(downgradePlan, entry.seats);
    if (downgradeCost !== null && downgradeCost < baseline) {
      candidates.push({
        action: "downgrade",
        savingsUsd: baseline - downgradeCost,
        recommendedSpendUsd: downgradeCost,
        recommendedPlanId: downgradePlan.id,
        reason: `${plan.label} is above current seat needs (${entry.seats}).`,
      });
    }
  }

  const alternative = pickAlternative(tool.alternatives, input.primaryUseCase);
  if (alternative) {
    const alternativePlan = getPlanDefinition(
      alternative.toolId,
      alternative.planId
    );
    if (alternativePlan) {
      const altCost = estimatePlanCost(alternativePlan, entry.seats);
      if (altCost !== null && altCost < baseline) {
        candidates.push({
          action: "switch",
          savingsUsd: baseline - altCost,
          recommendedSpendUsd: altCost,
          recommendedToolId: alternative.toolId,
          recommendedPlanId: alternative.planId,
          reason: alternative.reason,
        });
      }
    }
  }

  if (
    tool.enterpriseThresholdUsd &&
    tool.creditDiscountRate &&
    baseline >= tool.enterpriseThresholdUsd
  ) {
    const savings = baseline * tool.creditDiscountRate;
    candidates.push({
      action: "credits",
      savingsUsd: savings,
      recommendedSpendUsd: Math.max(baseline - savings, 0),
      reason: "Volume is high enough to benefit from discounted AI credits.",
    });
  }

  if (candidates.length === 0) {
    return {
      toolId: entry.toolId,
      toolLabel,
      planId: entry.planId,
      planLabel,
      currentSpendUsd: baseline,
      recommendedSpendUsd: baseline,
      savingsUsd: 0,
      action: "keep",
      reason: "Current plan appears aligned with your usage and team size.",
    };
  }

  const best = candidates.sort((a, b) => {
    const savingsDiff = b.savingsUsd - a.savingsUsd;
    if (savingsDiff !== 0) {
      return savingsDiff;
    }
    return ACTION_PRIORITY[b.action] - ACTION_PRIORITY[a.action];
  })[0];

  return {
    toolId: entry.toolId,
    toolLabel,
    planId: entry.planId,
    planLabel,
    currentSpendUsd: baseline,
    recommendedSpendUsd: best.recommendedSpendUsd,
    savingsUsd: best.savingsUsd,
    action: best.action,
    reason: best.reason,
    recommendedToolId: best.recommendedToolId,
    recommendedPlanId: best.recommendedPlanId,
  };
};

export const runAudit = (input: AuditInput): AuditResult => {
  const perTool: ToolRecommendation[] = input.usage.map((entry) =>
    evaluateEntry(input, entry)
  );

  const baselineSpendUsd = perTool.reduce(
    (sum, item) => sum + item.currentSpendUsd,
    0
  );
  const optimizedSpendUsd = perTool.reduce(
    (sum, item) => sum + item.recommendedSpendUsd,
    0
  );

  const perToolSpend = perTool.reduce<Record<string, number>>((acc, item) => {
    acc[item.toolId] = (acc[item.toolId] ?? 0) + item.currentSpendUsd;
    return acc;
  }, {});

  return {
    baselineSpendUsd,
    optimizedSpendUsd,
    totalSavingsUsd: Math.max(baselineSpendUsd - optimizedSpendUsd, 0),
    perTool: perTool.sort((a, b) => b.savingsUsd - a.savingsUsd),
    perToolSpend,
  };
};