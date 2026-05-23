"use server";

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { AuditResult } from "@/lib/audit";
import { PrimaryUseCase, Region } from "@/lib/schema";

type SavePublicAuditPayload = {
  teamSize: number;
  primaryUseCase: PrimaryUseCase;
  region?: Region;
  result: AuditResult;
};

export const savePublicAudit = async (payload: SavePublicAuditPayload) => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { ok: false, error: "Missing Supabase configuration." };
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const publicId = randomUUID();
  const publicPayload = {
    teamSize: payload.teamSize,
    primaryUseCase: payload.primaryUseCase,
    region: payload.region ?? null,
    baselineSpendUsd: payload.result.baselineSpendUsd,
    optimizedSpendUsd: payload.result.optimizedSpendUsd,
    totalSavingsUsd: payload.result.totalSavingsUsd,
    tools: payload.result.perTool.map((item) => ({
      toolId: item.toolId,
      planId: item.planId,
      currentSpendUsd: item.currentSpendUsd,
      recommendedSpendUsd: item.recommendedSpendUsd,
      savingsUsd: item.savingsUsd,
      action: item.action,
      reason: item.reason,
      recommendedToolId: item.recommendedToolId ?? null,
      recommendedPlanId: item.recommendedPlanId ?? null,
    })),
  };

  const { error } = await supabase.from("audits").insert({
    public_id: publicId,
    public_payload: publicPayload,
    baseline_spend_usd: payload.result.baselineSpendUsd,
    savings_usd: payload.result.totalSavingsUsd,
  });

  if (error) {
    console.error("Supabase audit insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return { ok: false, error: "Unable to store audit." };
  }

  return { ok: true, publicId };
};