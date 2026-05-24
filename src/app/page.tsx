import { AuditFormLoader } from "@/components/audit-form-loader";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0b0712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-28 h-80 w-80 rounded-full bg-fuchsia-600/30 blur-[140px]" />
        <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-indigo-500/25 blur-[140px]" />
        <div className="absolute bottom-10 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/20 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl gap-6 px-6 py-8">
        

        <main className="flex-1 space-y-8">
          <header className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Introducing
            </span>
            <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
              AI Audit Tool
            </h1>
            <p className="max-w-2xl text-sm text-white/70">
              Enter spend details to pinpoint efficiency gaps and unlock savings.
            </p>
          </header>
          <AuditFormLoader />
        </main>
      </div>
    </div>
  );
}
