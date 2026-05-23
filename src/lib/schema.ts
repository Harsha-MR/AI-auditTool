import { z } from "zod";

export const ToolIdSchema = z.enum([
  "cursor",
  "github-copilot",
  "claude",
  "chatgpt",
  "anthropic-api",
  "openai-api",
  "gemini",
  "windsurf",
]);

export const PrimaryUseCaseSchema = z.enum([
  "coding",
  "writing",
  "data",
  "research",
  "mixed",
]);

export const RegionSchema = z.enum(["na", "emea", "apac", "latam"]);

export const UsageEntrySchema = z.object({
  toolId: ToolIdSchema,
  planId: z.string().min(1),
  monthlySpendUsd: z.number().nonnegative(),
  seats: z.number().int().nonnegative(),
});

export const AuditInputSchema = z.object({
  companyName: z.string().min(1).optional(),
  teamSize: z.number().int().positive(),
  primaryUseCase: PrimaryUseCaseSchema,
  region: RegionSchema.optional(),
  usage: z.array(UsageEntrySchema).min(1),
});

export type ToolId = z.infer<typeof ToolIdSchema>;
export type PrimaryUseCase = z.infer<typeof PrimaryUseCaseSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type UsageEntry = z.infer<typeof UsageEntrySchema>;
export type AuditInput = z.infer<typeof AuditInputSchema>;
