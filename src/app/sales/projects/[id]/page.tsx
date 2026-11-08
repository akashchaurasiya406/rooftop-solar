import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, cx, inr } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { baseUrl } from "@/lib/base-url";
import { db } from "@/lib/db";
import { daysInStage, isStuck, nextStage, STAGE_INFO, STAGES, stageIndex } from "@/lib/projects/stages";
import { AdvanceForm } from "./advance-form";

export const metadata: Metadata = { title: "Project" };

const when = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SALES", "ADMIN");
  const { id } = await params;
  const p = await db.project.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, code: true, phone: true, district: true } },
      quote: { select: { id: true, code: true, systemKw: true, netCost: true, subsidy: true } },
      events: { orderBy: { at: "asc" }, include: { by: { select: { name: true } } } },
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!p) notFound();

  const next = nextStage(p.stage);
  const stuck = isStuck(p.stage, p.stageUpdated);
  const cur = stageIndex(p.stage);
  const statusUrl = `${await baseUrl()}/status/${p.statusToken}`;
  const eventFor = (st: string) => p.events.find((e) => e.stage === st);

  return (
    <>
      <Link href="/sales/projects" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden>←</span> All projects
      </Link>

      <div className="mt-4 flex animate-rise flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">
            <Link href={`/sales/leads/${p.lead.id}`} className="underline-offset-4 hover:underline">
              {p.lead.code}
            </Link>{" "}
            · {p.lead.district} · Quote {p.quote.code}
          </p>
          <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight">{p.lead.name}</h1>
          <p className="num mt-1 text-[15px] text-muted">
            {p.quote.systemKw} kW · customer pays {inr(p.quote.netCost)} · subsidy {inr(p.quote.subsidy)} · advance {inr(p.advanceAmount)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">{STAGE_INFO[p.stage].label}</p>
          <p className={cx("num text-sm", stuck ? "font-medium text-danger" : "text-muted")}>
            {stuck ? "Stuck · " : ""}
            {daysInStage(p.stageUpdated)} days in this stage
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.05s_both] p-5 sm:p-6">
            <h2 className="text-sm font-medium text-muted">Timeline</h2>
            <ol className="mt-4">
              {STAGES.map((st, i) => {
                const ev = eventFor(st);
                return (
                  <li key={st} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span
                        className={cx(
                          "mt-1 size-3 rounded-full border-2",
                          i < cur && "border-brand bg-brand",
                          i === cur && (stuck ? "border-danger bg-surface ring-4 ring-danger-soft" : "border-brand bg-surface ring-4 ring-brand-soft"),
                          i > cur && "border-line-strong bg-surface",
                        )}
                      />
                      {i < STAGES.length - 1 && <span className={cx("my-1 w-0.5 flex-1", i < cur ? "bg-brand" : "bg-line")} />}
                    </span>
                    <div className="pb-5">
                      <p className={cx("text-[15px]", i <= cur ? "font-medium" : "text-muted")}>{STAGE_INFO[st].label}</p>
                      {ev && (
                        <p className="text-[13px] text-muted">
                          {when(ev.at)}
                          {ev.by ? ` · ${ev.by.name}` : ""}
                          {ev.note ? ` · ${ev.note}` : ""}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-muted">Messages sent to customer</h2>
              <span className="rounded-full bg-low-soft px-2 py-0.5 text-[12px] text-low">WhatsApp · test mode</span>
            </div>
            {p.notifications.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No messages yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {p.notifications.map((n) => (
                  <li key={n.id} className="max-w-md rounded-2xl rounded-tl-sm bg-high-soft px-4 py-3 text-sm">
                    <p>{n.body}</p>
                    <p className="num mt-1 text-right text-[11px] text-muted">
                      to {n.to} · {when(n.createdAt)} ✓✓
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.15s_both] p-5">
            <h2 className="font-semibold">{next ? "Next step" : "Project complete"}</h2>
            {next ? (
              <div className="mt-4">
                <AdvanceForm projectId={p.id} to={next} label={STAGE_INFO[next].label} />
                <p className="mt-3 text-[12px] text-muted">The customer gets a WhatsApp update with their status link.</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">The subsidy has been credited. Nothing more to do.</p>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-medium text-muted">Customer status link</h2>
            <a href={statusUrl} target="_blank" rel="noopener" className="mt-2 block break-all text-sm font-medium text-brand underline-offset-4 hover:underline">
              {statusUrl}
            </a>
            <p className="mt-2 text-[12px] text-muted">Anyone with this link can see the stage. It shows no phone, address or bill.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
