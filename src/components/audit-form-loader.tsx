"use client";

import dynamic from "next/dynamic";

const AuditForm = dynamic(
  () => import("@/components/audit-form").then((mod) => mod.AuditForm),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_-40px_rgba(20,20,20,0.6)]">
        <div className="h-3 w-40 rounded-full bg-neutral-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-12 rounded-xl bg-neutral-100" />
          <div className="h-12 rounded-xl bg-neutral-100" />
          <div className="h-12 rounded-xl bg-neutral-100" />
          <div className="h-12 rounded-xl bg-neutral-100" />
        </div>
      </div>
    ),
  }
);

export const AuditFormLoader = () => <AuditForm />;
