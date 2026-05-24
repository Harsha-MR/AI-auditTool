"use server";

import { AuditSummaryContext } from "@/lib/summary";

const buildFallbackSummary = (context: AuditSummaryContext) => {
  const name = context.companyName?.trim() || "your team";
  const baseline = Math.round(context.result.baselineSpendUsd);
  const savings = Math.round(context.result.totalSavingsUsd);
  const topRecommendation = context.result.perTool[0];

  return [
    `Baseline spend for ${name} is about $${baseline.toLocaleString()} per month with estimated savings of $${savings.toLocaleString()}.`,
    topRecommendation
      ? `Highest-impact lever: ${topRecommendation.toolLabel} (${topRecommendation.action}) saving ~$${Math.round(topRecommendation.savingsUsd).toLocaleString()}.`
      : "Top savings lever not identified yet.",
    "Next steps: right-size seats, validate plan fit, and explore credit discounts.",
  ].join("\n");
};

const buildPrompt = (context: AuditSummaryContext) => {
  const name = context.companyName?.trim() || "This team";

  return `Summarize this AI spend audit in 3 concise sentences.\n\nCompany: ${name}\nTeam size: ${context.teamSize}\nPrimary use case: ${context.primaryUseCase}\nRegion: ${context.region ?? "unspecified"}\nBaseline spend: $${Math.round(context.result.baselineSpendUsd)}\nOptimized target: $${Math.round(context.result.optimizedSpendUsd)}\nTotal savings: $${Math.round(context.result.totalSavingsUsd)}\nTop recommendations: ${context.result.perTool
    .slice(0, 3)
    .map(
      (item) =>
        `${item.toolLabel} ${item.action} (~$${Math.round(item.savingsUsd)})`
    )
    .join(", ")}`;
};

const SYSTEM_PROMPT =
  "You are a finance analyst. Provide a crisp executive summary without bullet lists.";

const callAnthropic = async (prompt: string, apiKey: string) => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("Anthropic API key is empty");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": trimmedKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 220,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Anthropic API request failed (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("Anthropic returned empty content");
  }

  return text.trim();
};

const callGroq = async (prompt: string, apiKey: string) => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("Groq API key is empty");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${trimmedKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Groq API request failed (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned empty content");
  }

  return content.trim();
};

export const generateAuditSummary = async (context: AuditSummaryContext) => {
  const prompt = buildPrompt(context);
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!anthropicKey && !groqKey) {
    console.log(
      "No API keys configured for audit summary generation, using fallback."
    );
    return buildFallbackSummary(context);
  }

  if (anthropicKey) {
    try {
      console.log("Calling Anthropic API for audit summary...");
      return await callAnthropic(prompt, anthropicKey);
    } catch (err: unknown) {
      console.error(
        "Anthropic API failed for audit summary:",
        err instanceof Error ? err.message : err
      );
    }
  }

  if (groqKey) {
    try {
      console.log("Calling Groq API for audit summary...");
      return await callGroq(prompt, groqKey);
    } catch (err: unknown) {
      console.error(
        "Groq API failed for audit summary:",
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log("LLM calls failed, using fallback.");
  return buildFallbackSummary(context);
};

/*
Future use (Anthropic):

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
const response = await client.messages.create({
  model: "claude-3-5-sonnet-latest",
  max_tokens: 220,
  temperature: 0.2,
  system:
    "You are a finance analyst. Provide a crisp executive summary without bullet lists.",
  messages: [{ role: "user", content: prompt }],
});
const content = response.content.find((item) => item.type === "text");
return content?.type === "text" ? content.text.trim() : buildFallbackSummary(context);
*/
