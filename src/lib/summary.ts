import { AuditResult } from "@/lib/audit";
import { PrimaryUseCase, Region } from "@/lib/schema";

export type AuditSummaryContext = {
  companyName?: string;
  teamSize: number;
  primaryUseCase: PrimaryUseCase;
  region?: Region;
  result: AuditResult;
};
