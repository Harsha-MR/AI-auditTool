import { describe, expect, it } from "vitest";
import { runAudit } from "@/lib/audit";

const baseInput = {
  teamSize: 5,
  primaryUseCase: "coding" as const,
  usage: [],
};

describe("runAudit", () => {
  it("recommends downgrade when plan is oversized", () => {
    const result = runAudit({
      ...baseInput,
      primaryUseCase: "writing",
      usage: [
        {
          toolId: "cursor",
          planId: "business",
          monthlySpendUsd: 200,
          seats: 2,
        },
      ],
    });

    expect(result.perTool[0].action).toBe("downgrade");
    expect(result.perTool[0].savingsUsd).toBeGreaterThan(100);
  });

  it("right-sizes seats when seats exceed team size", () => {
    const result = runAudit({
      teamSize: 6,
      primaryUseCase: "coding",
      usage: [
        {
          toolId: "chatgpt",
          planId: "team",
          monthlySpendUsd: 300,
          seats: 10,
        },
      ],
    });

    expect(result.perTool[0].action).toBe("right-size");
    expect(result.perTool[0].savingsUsd).toBeGreaterThan(0);
  });

  it("applies credit discount at high spend", () => {
    const result = runAudit({
      ...baseInput,
      primaryUseCase: "data",
      usage: [
        {
          toolId: "openai-api",
          planId: "api-direct",
          monthlySpendUsd: 1500,
          seats: 5,
        },
      ],
    });

    expect(result.perTool[0].action).toBe("credits");
    expect(result.perTool[0].savingsUsd).toBeGreaterThan(0);
  });

  it("suggests switching to a cheaper alternative", () => {
    const result = runAudit({
      teamSize: 5,
      primaryUseCase: "writing",
      usage: [
        {
          toolId: "chatgpt",
          planId: "team",
          monthlySpendUsd: 150,
          seats: 5,
        },
      ],
    });

    expect(result.perTool[0].action).toBe("switch");
    expect(result.perTool[0].savingsUsd).toBeGreaterThan(0);
  });

  it("keeps plan when no savings are found", () => {
    const result = runAudit({
      teamSize: 1,
      primaryUseCase: "coding",
      usage: [
        {
          toolId: "chatgpt",
          planId: "plus",
          monthlySpendUsd: 20,
          seats: 1,
        },
      ],
    });

    expect(result.perTool[0].action).toBe("keep");
    expect(result.totalSavingsUsd).toBe(0);
  });
});
