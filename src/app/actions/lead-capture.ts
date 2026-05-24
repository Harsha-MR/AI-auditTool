"use server";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { LeadPayload, LeadPayloadSchema } from "@/lib/leads";

const buildFallbackSummary = (payload: {
  company?: string;
  baselineSpendUsd: number;
  savingsUsd: number;
}) => {
  const name = payload.company?.trim() || "your team";
  const baseline = Math.round(payload.baselineSpendUsd);
  const savings = Math.round(payload.savingsUsd);

  return `Baseline spend for ${name} is about $${baseline.toLocaleString()} per month, with estimated savings of $${savings.toLocaleString()}.`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildAuditReportHtml = (payload: {
  companyName: string;
  score: number;
  summary: string;
  reportUrl: string;
  downloadUrl: string;
}) => {
  const companyName = escapeHtml(payload.companyName);
  const summary = escapeHtml(payload.summary);
  const reportUrl = escapeHtml(payload.reportUrl);
  const downloadUrl = escapeHtml(payload.downloadUrl);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>AI Usage Audit Report</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#111827;padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:28px;">AI Usage Audit Report</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 30px;">
                <h2 style="margin-top:0;color:#111827;">Hello ${companyName},</h2>
                <p style="font-size:16px;line-height:1.7;color:#4b5563;">
                  Your AI usage audit has been successfully completed.
                  Here is a quick overview of your organization&#39;s AI adoption and optimization score.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                  style="margin:30px 0;background:#f9fafb;border-radius:10px;">
                  <tr>
                    <td style="padding:25px;text-align:center;">
                      <p style="margin:0;font-size:14px;color:#6b7280;">Overall AI Readiness Score</p>
                      <h1 style="margin:10px 0;color:#2563eb;font-size:48px;">${payload.score}/100</h1>
                      <p style="margin:0;color:#6b7280;">Generated using our AI Audit Engine</p>
                    </td>
                  </tr>
                </table>
                <h3 style="color:#111827;">Audit Summary</h3>
                <p style="font-size:15px;line-height:1.7;color:#4b5563;">${summary}</p>
                <div style="text-align:center;margin:40px 0;">
                  <a href="${reportUrl}"
                    style="background:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
                    View Full Report
                  </a>
                  <span style="display:inline-block;width:12px;"></span>
                  <a href="${downloadUrl}"
                    style="background:#111827;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
                    Download Report
                  </a>
                </div>
                <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                  If you have any questions regarding the audit report, feel free to reply to this email.
                </p>
                <p style="margin-top:30px;font-size:15px;color:#111827;">
                  Regards,<br/>
                  <strong>Your AI Audit Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f3f4f6;padding:20px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#6b7280;">
                  &copy; 2026 AI Usage Audit Tool. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const computeReadinessScore = (baselineSpendUsd: number, savingsUsd: number) => {
  if (baselineSpendUsd <= 0) {
    return 100;
  }
  const optimized = Math.max(baselineSpendUsd - savingsUsd, 0);
  const ratio = optimized / baselineSpendUsd;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
};

const sendTransactionalEmail = async (payload: {
  email: string;
  company?: string;
  savingsUsd: number;
  baselineSpendUsd: number;
  publicAuditId?: string;
  auditSummary?: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appBaseUrl = process.env.APP_BASE_URL;
  const downloadBaseUrl =
    process.env.AUDIT_REPORT_DOWNLOAD_BASE_URL || appBaseUrl;

  if (!apiKey || !fromEmail || !appBaseUrl) {
    return { ok: false, error: "Missing email configuration." };
  }

  const companyLabel = payload.company?.trim() || "your team";
  const readinessScore = computeReadinessScore(
    payload.baselineSpendUsd,
    payload.savingsUsd
  );
  const summaryText = payload.auditSummary?.trim()
    ? payload.auditSummary.trim()
    : buildFallbackSummary({
        company: payload.company,
        baselineSpendUsd: payload.baselineSpendUsd,
        savingsUsd: payload.savingsUsd,
      });
  const reportUrl = payload.publicAuditId
    ? `${appBaseUrl.replace(/\/$/, "")}/share/${payload.publicAuditId}`
    : appBaseUrl;
  const downloadUrl = payload.publicAuditId
    ? `${downloadBaseUrl?.replace(/\/$/, "") ?? appBaseUrl}/share/${payload.publicAuditId}`
    : reportUrl;
  const html = buildAuditReportHtml({
    companyName: companyLabel,
    score: readinessScore,
    summary: summaryText,
    reportUrl,
    downloadUrl,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: payload.email,
      subject: "Your Credex AI Usage Audit Report",
      html,
      text: `Hi ${companyLabel},\n\nYour audit report is ready.\n\nView report: ${reportUrl}\nDownload report: ${downloadUrl}\n\nSummary: ${summaryText}\n\n- Credex`,
    }),
  });

  if (!response.ok) {
    let errorDetails = "";
    try {
      errorDetails = await response.text();
    } catch {
      errorDetails = "";
    }
    console.error("Resend email failed", {
      status: response.status,
      statusText: response.statusText,
      details: errorDetails,
    });
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

  const rateLimited = await isRateLimited(supabase, parsed.data.email);
  const allowResend = Boolean(parsed.data.publicAuditId);

  if (rateLimited && !allowResend) {
    return {
      ok: false,
      error: "Please wait a few minutes before submitting again.",
    };
  }

  if (!rateLimited) {
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
  }

  const emailResult = await sendTransactionalEmail({
    email: parsed.data.email,
    company: parsed.data.company ?? undefined,
    savingsUsd: parsed.data.savingsUsd,
    baselineSpendUsd: parsed.data.baselineSpendUsd,
    publicAuditId: parsed.data.publicAuditId ?? undefined,
    auditSummary: parsed.data.auditSummary ?? undefined,
  });

  if (!emailResult.ok) {
    console.warn("Transactional email failed", emailResult.error);
  }

  return { ok: true };
};
