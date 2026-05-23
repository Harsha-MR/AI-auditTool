import { AuditFormLoader } from "@/components/audit-form-loader";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_#fdf6e7,_#f7f3ee_45%,_#eef2f2_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-200/60 blur-[120px]" />
        <div className="absolute bottom-16 right-12 h-72 w-72 rounded-full bg-teal-200/50 blur-[140px]" />
      </div>
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16">
        <AuditFormLoader />
      </main>
    </div>
  );
}
