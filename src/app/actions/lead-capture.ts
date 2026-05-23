"use server";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { LeadPayload, LeadPayloadSchema } from "@/lib/leads";

const sendTransactionalEmail = async (payload: {
  email: string;
  company?: string;
  savingsUsd: number;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { ok: false, error: "Missing email configuration." };
  }

  const companyLabel = payload.company?.trim() || "your team";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: payload.email,
      subject: "Your Credex AI spend audit",
      text: `Hi there,\n\nThanks for running the Credex AI Spend Audit for ${companyLabel}. Estimated savings: $${Math.round(payload.savingsUsd).toLocaleString()} / month.\n\nIf your savings are significant, our team will follow up with credit options.\n\n- Credex`,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: "Email request failed." };
  }

  return { ok: true };
};

const isRateLimited = async (supabase: SupabaseClient, email: string) => {
  const { data, error } = await supabase
    .from("leads")
    .select("created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return false;
  }

  const record = data[0] as { created_at?: string } | undefined;
  if (!record?.created_at) {
    return false;
  }

  const last = new Date(record.created_at).getTime();
  const diffMinutes = (Date.now() - last) / (1000 * 60);
  return diffMinutes < 10;
};

export const submitLead = async (payload: LeadPayload) => {
  const parsed = LeadPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid lead data." };
  }

  if (parsed.data.honeypot) {
    return { ok: true };
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { ok: false, error: "Missing Supabase configuration." };
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  if (await isRateLimited(supabase, parsed.data.email)) {
    return {
      ok: false,
      error: "Please wait a few minutes before submitting again.",
    };
  }

  const { error } = await supabase.from("leads").insert({
    email: parsed.data.email,
    company: parsed.data.company ?? null,
    name: parsed.data.name ?? null,
    role: parsed.data.role ?? null,
    team_size: parsed.data.teamSize ?? null,
    baseline_spend_usd: parsed.data.baselineSpendUsd,
    savings_usd: parsed.data.savingsUsd,
    primary_use_case: parsed.data.primaryUseCase,
    region: parsed.data.region ?? null,
    public_audit_id: parsed.data.publicAuditId ?? null,
  });

  if (error) {
    console.error("Supabase lead insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return {
      ok: false,
      error: `Unable to save your lead: ${error.message}`,
    };
  }

  const emailResult = await sendTransactionalEmail({
    email: parsed.data.email,
    company: parsed.data.company ?? undefined,
    savingsUsd: parsed.data.savingsUsd,
  });

  if (!emailResult.ok) {
    console.warn("Transactional email failed", emailResult.error);
  }

  return { ok: true };
};
