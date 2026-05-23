import { z } from "zod";

export const LeadPayloadSchema = z.object({
  email: z.string().email(),
  company: z.string().min(1).optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  teamSize: z.number().int().positive().optional(),
  baselineSpendUsd: z.number().nonnegative(),
  savingsUsd: z.number().nonnegative(),
  primaryUseCase: z.string().min(1),
  region: z.string().min(1).optional(),
  publicAuditId: z.string().optional(),
  honeypot: z.string().optional(),
});

export type LeadPayload = z.infer<typeof LeadPayloadSchema>;
