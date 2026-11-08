import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, cx, inr } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { baseUrl } from "@/lib/base-url";
import { db } from "@/lib/db";
import { dateLocale, getDict } from "@/lib/i18n";
import { fill } from "@/lib/i18n/format";
import { daysInStage, isStuck, nextStage, STAGES, stageIndex } from "@/lib/projects/stages";
import { toDocItem } from "@/components/document-list";
import { AdvanceForm } from "./advance-form";
import { ProjectDocuments } from "./document-form";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [, { lang, t }, { id }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict(), params]);
  const P = t.staff.projects;
  const when = (d: Date) => d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const p = await db.project.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, code: true, phone: true, district: true } },
      quote: { select: { id: true, code: true, systemKw: true, netCost: true, subsidy: true } },
      events: { orderBy: { at: "asc" }, include: { by: { select: { name: true } } } },
      notifications: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, fileMime: true, fileSize: true, createdAt: true } },
    },
  });
  if (!p) notFound();

  const next = nextStage(p.stage);
  const stuck = isStuck(p.stage, p.stageUpdated);
  const cur = stageIndex(p.stage);
  const statusUrl = `${await baseUrl()}/status/${p.statusToken}`;
  const eventFor = (st: string) => p.events.find((e) => e.stage === st);
  const days = daysInStage(p.stageUpdated);

  return (
    <>
      <Link href="/sales/projects" className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">
          ←
        </span>{" "}
        {P.all}
      </Link>

      <div className="mt-4 flex animate-rise flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">
            <Link href={`/sales/leads/${p.lead.id}`} className="underline-offset-4 hover:underline">
              {p.lead.code}
            </Link>{" "}
            · {p.lead.district} · {P.quote} {p.quote.code}
          </p>
          <h1 className="mt-1 text-[2rem] font-semibold tracking-tight">{p.lead.name}</h1>
          <p className="num mt-1 text-[15px] text-muted">
            {fill(P.paysSummary, { kw: p.quote.systemKw, pay: inr(p.quote.netCost), sub: inr(p.quote.subsidy), adv: inr(p.advanceAmount) })}
          </p>
        </div>
        <div className="text-right">
          <p className="inline-flex items-center gap-2 font-medium">
            {stuck && (
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-70" />
                <span className="relative size-2 rounded-full bg-danger" />
              </span>
            )}
            {t.stages[p.stage][0]}
          </p>
          <p className={cx("num text-sm", stuck ? "font-medium text-danger" : "text-muted")}>
            {stuck ? fill(P.stuckDays, { n: days }) : fill(P.daysIn, { n: days })}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.05s_both] p-5 sm:p-6">
            <h2 className="text-sm font-medium text-muted">{P.timeline}</h2>
            <ol className="mt-4">
              {STAGES.map((st, i) => {
                const ev = eventFor(st);
                const delay = 200 + i * 140;
                return (
                  <li key={st} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span
                        className={cx(
                          "mt-1 size-3 animate-[pop_0.4s_var(--ease-out-soft)_both] rounded-full border-2",
                          i < cur && "border-brand bg-brand",
                          i === cur && (stuck ? "border-danger bg-surface ring-4 ring-danger-soft" : "border-brand bg-surface ring-4 ring-brand-soft"),
                          i > cur && "border-line-strong bg-surface",
                        )}
                        style={{ animationDelay: `${delay}ms` }}
                      />
                      {i < STAGES.length - 1 && (
                        <span
                          className={cx("my-1 w-0.5 flex-1 origin-top animate-[draw_0.4s_ease-out_both]", i < cur ? "bg-brand" : "bg-line")}
                          style={{ animationDelay: `${delay + 120}ms` }}
                        />
                      )}
                    </span>
                    <div className="animate-[rise_0.5s_var(--ease-out-soft)_both] pb-5" style={{ animationDelay: `${delay}ms` }}>
                      <p className={cx("text-[15px]", i <= cur ? "font-medium" : "text-muted")}>{t.stages[st][0]}</p>
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
              <h2 className="text-sm font-medium text-muted">{P.messages}</h2>
              <span className="rounded-full bg-low-soft px-2 py-0.5 text-[12px] text-low">{P.testMode}</span>
            </div>
            {p.notifications.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{P.noMessages}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {p.notifications.map((n, i) => (
                  <li
                    key={n.id}
                    className="max-w-md animate-[toast_0.5s_var(--ease-out-soft)_both] rounded-2xl rounded-tl-sm bg-high-soft px-4 py-3 text-sm"
                    style={{ animationDelay: `${300 + Math.min(i, 6) * 120}ms` }}
                  >
                    <p>{n.body}</p>
                    <p className="num mt-1 text-right text-[11px] text-muted">
                      {P.to} {n.to} · {when(n.createdAt)} ✓✓
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.15s_both] p-5">
            <h2 className="font-semibold">{next ? P.nextStep : P.complete}</h2>
            {next ? (
              <div className="mt-4">
                <AdvanceForm
                  projectId={p.id}
                  to={next}
                  text={{ note: P.note, noteHint: P.noteHint, notePlaceholder: P.notePlaceholder, mark: fill(P.mark, { stage: t.stages[next][0] }), updating: P.updating }}
                />
                <p className="mt-3 text-[12px] text-muted">{P.notify}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">{P.completeBody}</p>
            )}
          </Card>
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.2s_both] p-5">
            <h2 className="text-sm font-medium text-muted">{P.link}</h2>
            <a href={statusUrl} target="_blank" rel="noopener" className="mt-2 block break-all text-sm font-medium text-brand underline-offset-4 hover:underline">
              {statusUrl}
            </a>
            <p className="mt-2 text-[12px] text-muted">{P.linkNote}</p>
          </Card>
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.25s_both] p-5">
            <h2 className="font-semibold">{P.docs}</h2>
            <ProjectDocuments
              projectId={p.id}
              initial={p.documents.map((d) => toDocItem(d, dateLocale(lang)))}
              text={{ docsNone: P.docsNone, docTitle: P.docTitle, docTitlePlaceholder: P.docTitlePlaceholder, docFile: P.docFile, docFileHint: P.docFileHint, upload: P.upload, uploading: P.uploading }}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
