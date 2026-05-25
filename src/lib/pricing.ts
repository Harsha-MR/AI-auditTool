import { PrimaryUseCase, ToolId } from "./schema";

export type PlanBilling = "seat" | "flat" | "usage";

export type PlanDefinition = {
  id: string;
  label: string;
  tier: number;
  billing: PlanBilling;
  seatPriceUsd?: number;
  flatMonthlyUsd?: number;
  minSeats?: number;
};

export type AlternativeDefinition = {
  toolId: ToolId;
  planId: string;
  reason: string;
  appliesToUseCases?: PrimaryUseCase[];
};

export type ToolDefinition = {
  id: ToolId;
  label: string;
  plans: PlanDefinition[];
  alternatives?: AlternativeDefinition[];
  creditDiscountRate?: number;
  enterpriseThresholdUsd?: number;
};

const TOOL_CATALOG: ToolDefinition[] = [
  {
    id: "cursor",
    label: "Cursor",
    plans: [
      { id: "hobby", label: "Hobby", tier: 1, billing: "seat", seatPriceUsd: 0 },
      { id: "pro", label: "Individual", tier: 2, billing: "seat", seatPriceUsd: 20 },
      { id: "business", label: "Teams", tier: 3, billing: "seat", seatPriceUsd: 40 },
      { id: "enterprise", label: "Enterprise (contact sales)", tier: 4, billing: "seat" },
    ],
    alternatives: [
      {
        toolId: "github-copilot",
        planId: "individual",
        reason: "Comparable coding copilots with lower seat pricing for small teams.",
        appliesToUseCases: ["coding", "mixed"],
      },
    ],
    creditDiscountRate: 0.18,
    enterpriseThresholdUsd: 500,
  },
  {
    id: "github-copilot",
    label: "GitHub Copilot",
    plans: [
      { id: "free", label: "Free", tier: 1, billing: "seat", seatPriceUsd: 0 },
      { id: "individual", label: "Pro", tier: 2, billing: "seat", seatPriceUsd: 10 },
      { id: "pro-plus", label: "Pro+", tier: 3, billing: "seat", seatPriceUsd: 39 },
    ],
    alternatives: [
      {
        toolId: "cursor",
        planId: "pro",
        reason: "Full IDE experience when teams want a single-seat coding copilot.",
        appliesToUseCases: ["coding"],
      },
    ],
    creditDiscountRate: 0.15,
    enterpriseThresholdUsd: 600,
  },
  {
    id: "claude",
    label: "Claude",
    plans: [
      { id: "free", label: "Free", tier: 1, billing: "seat", seatPriceUsd: 0 },
      { id: "pro", label: "Pro", tier: 2, billing: "seat", seatPriceUsd: 20 },
      { id: "max", label: "Max (from $100)", tier: 3, billing: "seat", seatPriceUsd: 100 },
    ],
    alternatives: [
      {
        toolId: "chatgpt",
        planId: "plus",
        reason: "Lower seat pricing for writing and research-heavy use cases.",
        appliesToUseCases: ["writing", "research"],
      },
    ],
    creditDiscountRate: 0.2,
    enterpriseThresholdUsd: 700,
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    plans: [
      { id: "plus", label: "Plus", tier: 1, billing: "seat", seatPriceUsd: 20 },
      { id: "team", label: "Business", tier: 2, billing: "seat", seatPriceUsd: 25, minSeats: 2 },
      { id: "enterprise", label: "Enterprise (contact sales)", tier: 3, billing: "seat" },
    ],
    alternatives: [
      {
        toolId: "claude",
        planId: "pro",
        reason: "Comparable reasoning at lower per-seat price for small teams.",
        appliesToUseCases: ["writing", "research", "mixed"],
      },
    ],
    creditDiscountRate: 0.18,
    enterpriseThresholdUsd: 700,
  },
  {
    id: "anthropic-api",
    label: "Anthropic API",
    plans: [
      { id: "api-direct", label: "API direct", tier: 1, billing: "usage" },
    ],
    alternatives: [
      {
        toolId: "openai-api",
        planId: "api-direct",
        reason: "Competitive API pricing for general workloads.",
        appliesToUseCases: ["data", "research", "mixed"],
      },
    ],
    creditDiscountRate: 0.2,
    enterpriseThresholdUsd: 1000,
  },
  {
    id: "openai-api",
    label: "OpenAI API",
    plans: [
      { id: "api-direct", label: "API direct", tier: 1, billing: "usage" },
    ],
    alternatives: [
      {
        toolId: "anthropic-api",
        planId: "api-direct",
        reason: "Alternate frontier model pricing for heavy reasoning workloads.",
        appliesToUseCases: ["data", "research", "mixed"],
      },
    ],
    creditDiscountRate: 0.2,
    enterpriseThresholdUsd: 1000,
  },
  {
    id: "gemini",
    label: "Gemini",
    plans: [
      { id: "api", label: "API (usage)", tier: 1, billing: "usage" },
    ],
    alternatives: [
      {
        toolId: "chatgpt",
        planId: "plus",
        reason: "Lower seat price when teams are mostly using chat UX.",
        appliesToUseCases: ["writing", "research", "mixed"],
      },
    ],
    creditDiscountRate: 0.15,
    enterpriseThresholdUsd: 800,
  },
  {
    id: "windsurf",
    label: "Windsurf",
    plans: [
      { id: "starter", label: "Starter", tier: 1, billing: "seat", seatPriceUsd: 0 },
      { id: "pro", label: "Pro", tier: 2, billing: "seat", seatPriceUsd: 20 },
      { id: "max", label: "Max", tier: 3, billing: "seat", seatPriceUsd: 200 },
      { id: "team", label: "Teams", tier: 4, billing: "seat", seatPriceUsd: 40 },
      { id: "enterprise", label: "Enterprise (contact sales)", tier: 5, billing: "seat" },
    ],
    alternatives: [
      {
        toolId: "cursor",
        planId: "pro",
        reason: "Comparable coding assistant with predictable seat pricing.",
        appliesToUseCases: ["coding", "mixed"],
      },
    ],
    creditDiscountRate: 0.16,
    enterpriseThresholdUsd: 500,
  },
];

export const getToolDefinition = (toolId: ToolId) =>
  TOOL_CATALOG.find((tool) => tool.id === toolId);

export const getPlanDefinition = (toolId: ToolId, planId: string) =>
  getToolDefinition(toolId)?.plans.find((plan) => plan.id === planId);

export const TOOL_DEFINITIONS = TOOL_CATALOG;