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

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_#fdf6e7,_#f7f3ee_45%,_#eef2f2_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-200/60 blur-[120px]" />
        <div className="absolute bottom-16 right-12 h-72 w-72 rounded-full bg-teal-200/50 blur-[140px]" />
      </div>
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16">
        <AuditForm />
      </main>
    </div>
  );
}
